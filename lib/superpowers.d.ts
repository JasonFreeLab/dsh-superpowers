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
import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const Config: Schema<Schemastery.ObjectS<{
    /** provider name registered on ctx.skills; defaults to superpowers; 'runtime' is reserved */
    providerName: Schema<string, string>;
    /** absolute skill directory; defaults to the package's skills/; useful for local debugging */
    skillDir: Schema<string, string>;
}>, Schemastery.ObjectT<{
    /** provider name registered on ctx.skills; defaults to superpowers; 'runtime' is reserved */
    providerName: Schema<string, string>;
    /** absolute skill directory; defaults to the package's skills/; useful for local debugging */
    skillDir: Schema<string, string>;
}>>;
export interface Config {
    providerName: string;
    skillDir?: string;
}
export declare const name = "superpowers";
export declare const inject: readonly ["skills"];
export declare function apply(ctx: Context, config: Config): void;
declare const _default: {
    name: string;
    inject: readonly ["skills"];
    Config: Schema<Schemastery.ObjectS<{
        /** provider name registered on ctx.skills; defaults to superpowers; 'runtime' is reserved */
        providerName: Schema<string, string>;
        /** absolute skill directory; defaults to the package's skills/; useful for local debugging */
        skillDir: Schema<string, string>;
    }>, Schemastery.ObjectT<{
        /** provider name registered on ctx.skills; defaults to superpowers; 'runtime' is reserved */
        providerName: Schema<string, string>;
        /** absolute skill directory; defaults to the package's skills/; useful for local debugging */
        skillDir: Schema<string, string>;
    }>>;
    apply: typeof apply;
};
export default _default;
