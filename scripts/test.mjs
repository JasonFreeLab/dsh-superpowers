import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import SkillRegistry, { isSkillName } from '@deepseek-ai/dsh-skill'
import { parse } from 'yaml'
import plugin from '../lib/superpowers.js'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const skillsDir = join(root, 'skills')
const EXPECTED = 14
const NL = String.fromCharCode(10)

let failures = 0
function check(ok, msg) {
  console.log((ok ? '  PASS  ' : '  FAIL  ') + msg)
  if (!ok) failures += 1
}

function isCJK(ch) {
  const c = ch.codePointAt(0)
  return c >= 0x4e00 && c <= 0x9fff
}

async function walk(dir) {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(p)))
    else out.push(p)
  }
  return out
}

console.log('== content hygiene ==')
const dirs = (await readdir(skillsDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
  .sort((a, b) => a.name.localeCompare(b.name))
check(dirs.length === EXPECTED, dirs.length + ' skill directories (expect ' + EXPECTED + ')')

const allFiles = await walk(skillsDir)
let cjkFiles = 0
let staleFiles = 0
const brokenLinks = []
for (const f of allFiles) {
  const raw = await readFile(f, 'utf8')
  for (const ch of raw) {
    if (isCJK(ch)) { cjkFiles += 1; console.log('    CJK in ' + f); break }
  }
  if (raw.includes('superpowers:')) { staleFiles += 1; console.log('    old superpowers: prefix in ' + f) }
  if (raw.includes('Subagent (general-purpose):')) { staleFiles += 1; console.log('    Claude subagent header in ' + f) }
  if (raw.includes('../requesting-code-review/')) { staleFiles += 1; console.log('    broken ../requesting-code-review/ link in ' + f) }

  let i = 0
  while ((i = raw.indexOf('](', i)) !== -1) {
    const close = raw.indexOf(')', i + 2)
    if (close === -1) break
    let target = raw.slice(i + 2, close).trim()
    i = close + 1
    const hash = target.indexOf('#')
    if (hash !== -1) target = target.slice(0, hash)
    if (!target || target.startsWith('http://') || target.startsWith('https://') || target.startsWith('<')) continue
    if (!target.endsWith('.md')) continue
    const abs = resolve(dirname(f), target)
    try { await stat(abs) } catch { brokenLinks.push(f + ' -> ' + target) }
  }
}
check(cjkFiles === 0, 'no CJK in skills (' + cjkFiles + ' files)')
check(staleFiles === 0, 'no stale refs (' + staleFiles + ' files)')
check(brokenLinks.length === 0, 'all .md links resolve (' + brokenLinks.length + ' broken)')
for (const b of brokenLinks) console.log('    broken: ' + b)

let fmBad = 0
for (const d of dirs) {
  const p = join(skillsDir, d.name, 'SKILL.md')
  const raw = await readFile(p, 'utf8')
  const first = raw.indexOf(NL)
  const end = raw.indexOf(NL + '---', first + 1)
  if (first < 0 || end < 0 || raw.slice(0, first).trim() !== '---') {
    fmBad += 1; console.log('    no frontmatter in ' + p); continue
  }
  const fm = parse(raw.slice(first + 1, end))
  const name = fm && fm.name
  const desc = fm && fm.description
  if (typeof name !== 'string' || !isSkillName(name) || name !== d.name || typeof desc !== 'string' || desc.length === 0) {
    fmBad += 1; console.log('    frontmatter bad in ' + p)
  }
}
check(fmBad === 0, 'all frontmatter valid (' + fmBad + ' bad)')

console.log('== runtime (real SkillRegistry) ==')
const ctx = new Context()
new SkillRegistry(ctx)
ctx.plugin(plugin)
const skills = await ctx.skills.list()
const ps = skills.filter((s) => s.provider === 'superpowers')
check(ps.length === EXPECTED, 'list() -> ' + ps.length + ' superpowers skills (expect ' + EXPECTED + ')')

let bodyBad = 0
for (const s of ps) {
  const def = await ctx.skills.get(s.name)
  if (!def || typeof def.content !== 'string' || def.content.length < 50 || def.provider !== 'superpowers') {
    bodyBad += 1; console.log('    body load failed for ' + s.name)
  }
}
check(bodyBad === 0, 'get() loads all ' + EXPECTED + ' bodies (' + bodyBad + ' failed)')

const unknown = await ctx.skills.get('superpower-does-not-exist')
check(unknown === undefined, 'get(unknown) -> undefined')

let dupThrew = false
try {
  ctx.skills.registerProvider(() => ({
    name: 'superpowers',
    list: async () => [],
    get: async () => undefined,
  }))
} catch { dupThrew = true }
check(dupThrew, 'duplicate provider name throws')

console.log('')
console.log(failures === 0 ? 'ALL TESTS PASSED' : failures + ' TEST(S) FAILED')
process.exit(failures === 0 ? 0 : 1)
