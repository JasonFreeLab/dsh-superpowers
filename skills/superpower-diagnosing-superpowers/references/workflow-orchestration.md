# DSH workflow orchestration

DSH's `workflow` tool runs a JavaScript body in the Host and fans work out
across `agent()` calls. Use it for this skill's three fan-outs: the analyst
dimensions, the similar-session matchers, and the scrub/audit loop.

Why it beats hand-dispatched `subagent` calls here:

- **Schema-validated results.** `agent(prompt, { schema })` resolves to a
  validated object instead of free prose, so the dispatcher never parses a
  report and a citation-less finding cannot pass: `path` and `line` are
  required fields of the schema.
- **Deterministic shape.** `parallel`/`pipeline` fix the ordering and the
  fan-out width, and `phase()`/`log()` narrate progress without the
  controller spending turns.
- **Small controller context.** Only the returned object lands in your
  context. Keep it to findings, verdicts, and paths — never transcripts.

The script has no filesystem, network, or timer access. Each `agent()` is a
real subagent with the full toolset, so it reads the case file and the
prompt files itself; the script only routes paths and markers.

## Calling it

Pass the values the script reads through the tool's `args`, and the script
body through `script`:

```
workflow(
  meta: { name: "diagnose-triage", description: "Seven schema-validated analysts" },
  args: {
    skillBase: "<absolute base directory of this skill>",
    caseFile: "<absolute path to the case file>",
    range: "<optional turn or line range>"
  },
  script: "<the script below>"
)
```

The script's `return` value is a JSON-serializable object delivered back to
you. A failed `agent()` resolves to `null` (and a throwing `parallel` thunk
also becomes `null`): treat `null` as **a failed analyst to re-run**, never
as "no findings".

## Schema keywords

The workflow tool accepts object-rooted JSON Schema built only from `type`,
`properties`, `required`, `additionalProperties`, `items`, `enum`, `const`,
and `oneOf`. There is no `pattern`, `format`, `minLength`, or `minimum`, so
require the citation fields (`path`, `line`, `quote`) rather than trying to
regex-match them.

## Script 1 — analyst fan-out (step 3)

```js
const DIMENSIONS = [
  "skill-timeline", "plan-adherence", "repeated-work", "stumbles",
  "quality-evidence", "request-conflicts", "cost-and-time",
]
const FINDINGS = {
  type: "object",
  additionalProperties: false,
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          finding: { type: "string" },
          path: { type: "string" },
          line: { type: "string" },
          quote: { type: "string" },
          turns: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["finding", "path", "line", "quote", "confidence"],
      },
    },
    checked: { type: "string" },
  },
  required: ["findings", "checked"],
}

const base = args.skillBase
const range = args.range ? `\nAnalyze only this range: ${args.range}.` : ""
phase("triage")
log(`dispatching ${DIMENSIONS.length} analyst dimensions`)

const results = await parallel(DIMENSIONS.map((dimension) => async () => {
  const result = await agent(
    `You are the "${dimension}" analyst for a superpowers session diagnosis.\n` +
    `Read ${base}/prompts/analyst-common.md first, then ${base}/prompts/${dimension}.md.\n` +
    `Your CASE file is ${args.caseFile}; read it before the transcript.${range}\n` +
    `Return the structured findings result. Every finding needs path and line.`,
    { schema: FINDINGS, label: dimension, phase: "triage" },
  )
  return { dimension, result }
}))

return results.filter(Boolean)
```

## Script 2 — similar-session matchers (step 7)

```js
const MATCH = {
  type: "object",
  additionalProperties: false,
  properties: {
    sessionId: { type: "string" },
    path: { type: "string" },
    identity: { type: "string" },
    match: { type: "string", enum: ["yes", "partial", "no"] },
    markers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          marker: { type: "string" },
          verdict: { type: "string", enum: ["hit", "miss", "unknown"] },
          evidence: { type: "string" },
        },
        required: ["marker", "verdict", "evidence"],
      },
    },
  },
  required: ["sessionId", "path", "match", "markers"],
}

phase("similar sessions")
const results = await parallel(args.candidates.map((candidate) => async () => {
  const result = await agent(
    `You are the similar-session matcher.\n` +
    `Read ${args.skillBase}/prompts/similar-session.md, then the case file ${args.caseFile}.\n` +
    `CANDIDATE: ${candidate}\n` +
    `SIGNATURE: ${JSON.stringify(args.signature)}\n` +
    `Return the structured match result.`,
    { schema: MATCH, label: `match ${candidate}`, phase: "similar" },
  )
  return result
}))

return results.filter(Boolean)
```

## Script 3 — scrub then audit, until CLEAN (step 6)

```js
const SCRUB = {
  type: "object",
  additionalProperties: false,
  properties: {
    filesRewritten: { type: "array", items: { type: "string" } },
    logPath: { type: "string" },
  },
  required: ["filesRewritten", "logPath"],
}
const AUDIT = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: { type: "string", enum: ["CLEAN", "MISSED"] },
    misses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          file: { type: "string" },
          line: { type: "string" },
          category: { type: "string" },
          note: { type: "string" },
        },
        required: ["file", "line", "category", "note"],
      },
    },
  },
  required: ["verdict", "misses"],
}

const lists = `PUBLIC_REPOS: ${JSON.stringify(args.publicRepos ?? [])}\n` +
  `PROPRIETARY: ${JSON.stringify(args.proprietary ?? [])}`
const caps = args.maxRounds ?? 4
phase("scrub and audit")
const rounds = []
let audit = { verdict: "MISSED", misses: [] }

for (let round = 1; round <= caps; round++) {
  const scrub = await agent(
    `You are the scrubber. Read ${args.skillBase}/references/redaction-policy.md, ` +
    `then ${args.skillBase}/prompts/scrub.md.\nBUNDLE: ${args.bundle}\n${lists}\n` +
    `Return the structured scrub result.`,
    { schema: SCRUB, label: `scrub r${round}`, phase: "export" },
  )
  const audited = await agent(
    `You are the scrub auditor. Read ${args.skillBase}/references/redaction-policy.md, ` +
    `then ${args.skillBase}/prompts/scrub-audit.md.\nBUNDLE: ${args.bundle}\n${lists}\n` +
    `Return the structured audit result.`,
    { schema: AUDIT, label: `audit r${round}`, phase: "export" },
  )
  audit = audited ?? { verdict: "MISSED", misses: [] }
  rounds.push({ round, scrub, audit })
  log(`round ${round}: audit ${audit.verdict}`)
  if (audit.verdict === "CLEAN") break
}

return { rounds, audit }
```

## Notes

- Pass the **absolute** skill base directory. The skill's `<skill_resources>`
  hint gives it; without it each agent cannot read the prompt files.
- The audit result and the scrub log are what your human partner approves
  before archiving; an unfinished round cap is reported as "audit did not
  reach CLEAN in N rounds", never as clean.
- The scripts return only summaries. Persist the full per-dimension findings
  to `findings/<dimension>.md` yourself, from the returned objects, when you
  build the bundle.
