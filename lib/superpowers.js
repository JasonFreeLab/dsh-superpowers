/**
 * dsh-superpowers — a DSH port of obra/superpowers.
 *
 * Exposes the 14 obra/superpowers skills as native DSH skills through a
 * `SkillProvider` registered via `ctx.skills.registerProvider` into the
 * global layer. Rank 550 lets same-named skills from the filesystem providers
 * (project 100-300 / user 400-500) override the bundled ones, while this
 * package overrides other bundled providers (BUNDLED_SKILL_RANK = 600).
 *
 * Content source: each <name>/SKILL.md under skills/; frontmatter supplies
 * name, description and invocation policy, and the body is loaded lazily.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { isSkillName } from '@deepseek-ai/dsh-skill';
import Schema from '@deepseek-ai/schemastery';
// ---------------------------------------------------------------------------
// Config schema and interface
// ---------------------------------------------------------------------------
export const Config = Schema.object({
    /** provider name registered on ctx.skills; defaults to superpowers; 'runtime' is reserved */
    providerName: Schema.string().default('superpowers'),
    /** absolute skill directory; defaults to the package's skills/; useful for local debugging */
    skillDir: Schema.string(),
}).description('dsh-superpowers plugin configuration');
// ---------------------------------------------------------------------------
// plugin metadata
// ---------------------------------------------------------------------------
export const name = 'superpowers';
export const inject = ['skills'];
const SUPERPOWERS_RANK = 550;
const RUNTIME_PROVIDER = 'runtime';
// ---------------------------------------------------------------------------
// frontmatter parsing
// ---------------------------------------------------------------------------
function stringField(data, key) {
    const v = data[key];
    return typeof v === 'string' && v.length > 0 ? v : undefined;
}
function optionalString(data, key) {
    const v = data[key];
    return typeof v === 'string' && v.length > 0 ? { [key]: v } : {};
}
function frontmatterBoolean(data, key) {
    if (!Object.hasOwn(data, key))
        return undefined;
    const v = data[key];
    if (typeof v === 'boolean')
        return v;
    if (v === 1 || v === '1')
        return true;
    if (v === 0 || v === '0')
        return false;
    if (typeof v === 'string') {
        switch (v.toLowerCase()) {
            case 'true':
            case 'yes':
            case 'on':
                return true;
            case 'false':
            case 'no':
            case 'off':
                return false;
        }
    }
    throw new TypeError(`frontmatter field "${key}" must be a boolean`);
}
function rejectLegacyKey(data, legacy, canonical) {
    if (Object.hasOwn(data, legacy)) {
        throw new Error(`frontmatter field "${legacy}" is unsupported; use "${canonical}"`);
    }
}
function parseInvocationPolicy(data) {
    rejectLegacyKey(data, 'disableModelInvocation', 'disable-model-invocation');
    rejectLegacyKey(data, 'modelInvocable', 'disable-model-invocation');
    rejectLegacyKey(data, 'userInvocable', 'user-invocable');
    const disableModelInvocation = frontmatterBoolean(data, 'disable-model-invocation');
    const userInvocable = frontmatterBoolean(data, 'user-invocable');
    return {
        modelInvocable: disableModelInvocation !== true,
        userInvocable: userInvocable !== false,
    };
}
function optionalMetadata(data) {
    const v = data['metadata'];
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        return { metadata: v };
    }
    return {};
}
function findClosingFrontmatter(raw, start) {
    let lineStart = start;
    while (lineStart <= raw.length) {
        const nl = raw.indexOf('\n', lineStart);
        const lineEnd = nl < 0 ? raw.length : nl;
        if (raw.slice(lineStart, lineEnd).replace(/\r$/, '') === '---') {
            return { start: lineStart, bodyStart: nl < 0 ? raw.length : nl + 1 };
        }
        if (nl < 0)
            return undefined;
        lineStart = nl + 1;
    }
    return undefined;
}
function parseFrontmatter(raw) {
    // strip a leading BOM (U+FEFF) so the first line still matches ---
    if (raw.charCodeAt(0) === 0xfeff)
        raw = raw.slice(1);
    const firstNl = raw.indexOf('\n');
    if (firstNl < 0)
        return undefined;
    if (raw.slice(0, firstNl).replace(/\r$/, '') !== '---')
        return undefined;
    const start = firstNl + 1;
    const closing = findClosingFrontmatter(raw, start);
    if (!closing)
        return undefined;
    const parsed = parse(raw.slice(start, closing.start));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
        return undefined;
    return { data: parsed, body: raw.slice(closing.bodyStart) };
}
function resolveDefaultSkillDir(configSkillDir) {
    if (configSkillDir)
        return resolve(configSkillDir);
    const here = fileURLToPath(import.meta.url);
    return resolve(dirname(here), '..', 'skills');
}
// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
class SuperpowersProvider {
    name;
    skillDir;
    ctx;
    constructor(ctx, _control, config) {
        if (config.providerName === RUNTIME_PROVIDER) {
            throw new Error(`[superpowers] providerName "${RUNTIME_PROVIDER}" is reserved`);
        }
        this.ctx = ctx;
        this.name = config.providerName;
        this.skillDir = resolveDefaultSkillDir(config.skillDir);
    }
    async list(options) {
        options.signal?.throwIfAborted();
        let entries;
        try {
            entries = await readdir(this.skillDir, { withFileTypes: true });
        }
        catch (err) {
            const code = err?.code;
            if (code === 'ENOENT' || code === 'ENOTDIR') {
                this.ctx.logger.warn(`[superpowers] skillDir not found: ${this.skillDir}`);
                return [];
            }
            throw err;
        }
        const candidates = [];
        const seen = new Set();
        for (const entry of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
            options.signal?.throwIfAborted();
            if (!entry.isDirectory() || entry.name.startsWith('.'))
                continue;
            const skillPath = join(this.skillDir, entry.name, 'SKILL.md');
            try {
                await stat(skillPath);
            }
            catch (err) {
                const code = err?.code;
                this.ctx.logger.debug(`[superpowers] skip ${entry.name}: no SKILL.md (${code ?? String(err)})`);
                continue;
            }
            let parsed;
            try {
                parsed = await parseSkillFile(skillPath);
            }
            catch (err) {
                this.ctx.logger.warn(`[superpowers] skip ${skillPath}: YAML parse failed - ${String(err)}`);
                continue;
            }
            if (!parsed) {
                this.ctx.logger.warn(`[superpowers] skip ${entry.name}: missing or invalid frontmatter`);
                continue;
            }
            const skillName = stringField(parsed.data, 'name');
            const description = stringField(parsed.data, 'description');
            if (!skillName || !description) {
                this.ctx.logger.warn(`[superpowers] skip ${skillPath}: frontmatter requires name and description`);
                continue;
            }
            if (!isSkillName(skillName)) {
                this.ctx.logger.warn(`[superpowers] skip ${skillPath}: invalid skill name "${skillName}"`);
                continue;
            }
            if (seen.has(skillName)) {
                this.ctx.logger.warn(`[superpowers] skip ${skillPath}: duplicate skill name "${skillName}"`);
                continue;
            }
            if (skillName !== entry.name) {
                this.ctx.logger.warn(`[superpowers] skill name "${skillName}" != directory "${entry.name}" (using frontmatter)`);
            }
            let invocation;
            try {
                invocation = parseInvocationPolicy(parsed.data);
            }
            catch (err) {
                this.ctx.logger.warn(`[superpowers] skip ${skillPath}: ${String(err)}`);
                continue;
            }
            seen.add(skillName);
            candidates.push({
                name: skillName,
                description,
                ...optionalString(parsed.data, 'whenToUse'),
                invocation,
                source: 'bundled',
                provider: this.name,
                rank: SUPERPOWERS_RANK,
                locator: { path: skillPath, directory: dirname(skillPath) },
                resourceBase: { kind: 'directory', path: dirname(skillPath) },
                path: skillPath,
                ...optionalMetadata(parsed.data),
            });
        }
        return candidates;
    }
    async get(candidate, options) {
        options.signal?.throwIfAborted();
        const locator = candidate.locator;
        if (!locator?.path || !locator?.directory)
            return undefined;
        let raw;
        try {
            raw = await readFile(locator.path, 'utf8');
        }
        catch (err) {
            if (err?.name === 'AbortError')
                throw err;
            const code = err?.code;
            if (code === 'ENOENT')
                return undefined;
            this.ctx.logger.warn(`[superpowers] get ${candidate.name}: read failed (${code ?? String(err)})`);
            return undefined;
        }
        if (raw === undefined)
            return undefined;
        options.signal?.throwIfAborted();
        let parsed;
        try {
            parsed = parseFrontmatter(raw);
        }
        catch (err) {
            this.ctx.logger.warn(`[superpowers] get ${candidate.name}: frontmatter parse failed (${String(err)})`);
            return undefined;
        }
        if (!parsed) {
            this.ctx.logger.warn(`[superpowers] get ${candidate.name}: missing or invalid frontmatter`);
            return undefined;
        }
        const skillName = stringField(parsed.data, 'name');
        const description = stringField(parsed.data, 'description');
        if (!skillName || !description) {
            this.ctx.logger.warn(`[superpowers] get ${candidate.name}: frontmatter requires name and description`);
            return undefined;
        }
        if (skillName !== candidate.name) {
            // name drift between discovery and load
            this.ctx.logger.warn(`[superpowers] get ${candidate.name}: name drift "${skillName}" != "${candidate.name}"`);
            return undefined;
        }
        let invocation;
        try {
            invocation = parseInvocationPolicy(parsed.data);
        }
        catch (err) {
            this.ctx.logger.warn(`[superpowers] get ${candidate.name}: ${String(err)}`);
            return undefined;
        }
        return {
            name: skillName,
            description,
            ...optionalString(parsed.data, 'whenToUse'),
            invocation,
            source: 'bundled',
            provider: this.name,
            resourceBase: { kind: 'directory', path: locator.directory },
            path: locator.path,
            ...optionalMetadata(parsed.data),
            content: parsed.body.trim(),
        };
    }
}
async function parseSkillFile(path) {
    const raw = await readFile(path, 'utf8');
    return parseFrontmatter(raw);
}
// ---------------------------------------------------------------------------
// plugin entrypoint - all side effects go through ctx and are cleaned up on fiber teardown
// ---------------------------------------------------------------------------
export function apply(ctx, config) {
    if (config.providerName === RUNTIME_PROVIDER) {
        throw new Error(`[superpowers] providerName "${RUNTIME_PROVIDER}" is reserved`);
    }
    ctx.logger.info(`[superpowers] registering provider "${config.providerName}"`);
    ctx.effect(() => {
        const disposeProvider = ctx.skills.registerProvider((control) => {
            return new SuperpowersProvider(ctx, control, config);
        });
        return () => {
            disposeProvider();
        };
    });
}
export default { name, inject, Config, apply };
