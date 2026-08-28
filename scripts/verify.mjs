import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const skillsDir = join(root, 'skills')
const EXPECTED = 14
const NL = String.fromCharCode(10)
const CR = String.fromCharCode(13)
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function stripCr(s) {
  return s.endsWith(CR) ? s.slice(0, -1) : s
}

function stripQuotes(s) {
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1)
  return s
}

function extractFrontmatter(raw) {
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1)
  const first = raw.indexOf(NL)
  if (first < 0 || stripCr(raw.slice(0, first)) !== '---') return undefined

  let end = -1
  let idx = first + 1
  while (idx < raw.length) {
    const nl = raw.indexOf(NL, idx)
    const lineEnd = nl < 0 ? raw.length : nl
    if (stripCr(raw.slice(idx, lineEnd)) === '---') {
      end = idx
      break
    }
    if (nl < 0) break
    idx = nl + 1
  }
  if (end < 0) return undefined

  let name
  let description
  for (const line of raw.slice(first + 1, end).split(NL)) {
    if (line.startsWith('name:')) name = stripQuotes(line.slice(5).trim())
    else if (line.startsWith('description:')) description = stripQuotes(line.slice(12).trim())
  }
  return { name, description }
}

async function structuralCheck() {
  let dirs
  try {
    dirs = (await readdir(skillsDir, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    console.error('FAIL: skills/ directory missing at ' + skillsDir)
    process.exit(1)
  }

  const failures = []
  const rows = []
  for (const dir of dirs) {
    const skillPath = join(skillsDir, dir.name, 'SKILL.md')
    let raw
    try {
      raw = await readFile(skillPath, 'utf8')
    } catch {
      failures.push(dir.name + ': missing SKILL.md')
      continue
    }
    const fm = extractFrontmatter(raw)
    if (!fm) {
      failures.push(dir.name + ': missing or invalid frontmatter')
      continue
    }
    if (!fm.name || !NAME_RE.test(fm.name)) {
      failures.push(dir.name + ': invalid name ' + JSON.stringify(fm.name))
    }
    if (fm.name !== dir.name) {
      failures.push(dir.name + ': name ' + JSON.stringify(fm.name) + ' != directory ' + JSON.stringify(dir.name))
    }
    if (!fm.description || fm.description.length === 0) {
      failures.push(dir.name + ': empty description')
    }
    rows.push([dir.name, fm.description || '(missing)'])
  }

  console.log('=== structural check ===')
  for (const [name, desc] of rows) {
    console.log('- ' + name + ': ' + desc.slice(0, 60))
  }
  console.log('skills found: ' + rows.length + ' / expected ' + EXPECTED)

  if (failures.length > 0) {
    console.error('')
    console.error('FAIL:')
    for (const f of failures) console.error('  ' + f)
    process.exit(1)
  }
  if (rows.length !== EXPECTED) {
    console.error('FAIL: expected ' + EXPECTED + ' skills, found ' + rows.length)
    process.exit(1)
  }
  console.log('structural check: PASS')
}

async function runtimeCheck() {
  let plugin
  try {
    plugin = await import(join(root, 'lib', 'superpowers.js'))
  } catch (err) {
    console.error('')
    console.error('FAIL: could not load lib/superpowers.js (' + err.message + ')')
    process.exit(1)
  }

  let provider = null
  const fakeSkills = {
    registerProvider(create) {
      provider = create({ signal: new AbortController().signal, invalidate() {} })
      return () => {}
    },
  }
  const fakeCtx = {
    logger: { info() {}, warn() {}, debug() {} },
    effect(fn) { fn(); return () => {} },
    on() { return () => {} },
    skills: fakeSkills,
  }

  plugin.apply(fakeCtx, { providerName: 'superpowers' })
  if (!provider) {
    console.error('')
    console.error('FAIL: provider was not registered')
    process.exit(1)
  }

  const candidates = await provider.list({})
  const names = candidates.map((c) => c.name)
  console.log('')
  console.log('=== runtime check ===')
  console.log('provider.list() -> ' + names.length + ' skills')
  if (names.length !== EXPECTED) {
    console.error('FAIL: expected ' + EXPECTED + ' skills, found ' + names.length)
    console.error('  got: ' + names.join(', '))
    process.exit(1)
  }

  const target = candidates.find((c) => c.name === 'superpower-brainstorming')
  if (!target) {
    console.error('FAIL: superpower-brainstorming missing from candidates')
    process.exit(1)
  }
  const one = await provider.get(target, {})
  if (!one || typeof one.content !== 'string' || one.content.length < 50) {
    console.error('FAIL: superpower-brainstorming did not load a body')
    process.exit(1)
  }
  console.log('loaded superpower-brainstorming: ' + one.content.length + ' chars')
  console.log('runtime check: PASS')
}

await structuralCheck()
await runtimeCheck()
console.log('')
console.log(EXPECTED + '/' + EXPECTED + ' PASS')
