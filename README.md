# dsh-superpowers

English | [中文](README.zh.md)

A [DSH](https://github.com/deepseek-ai/deepseek-harness) (DeepSeek Harness) port of [obra/superpowers](https://github.com/obra/superpowers) — the full multi-agent software-development methodology, available out of the box as native DSH skills.

> Ported from upstream [obra/superpowers](https://github.com/obra/superpowers) (v6.3.0, by Jesse Vincent / Prime Radiant). Skill content is taken directly from upstream and mapped onto the DSH toolset.

## What it is

A **mandatory methodology**, not optional advice: brainstorm → write sliced plans → TDD → systematic debugging → review and integrate. The 14 skills are injected into the global `ctx.skills` layer through a single `SkillProvider`, installed and uninstalled with the `dsh.bundle`, and never pollute the user directory.

## Install

Using the `web` profile as the example (change `--profile` for other profiles). Requires `Node >= 20`, `pnpm >= 9`, and `dsh`.

```sh
# Local path install (dev / offline)
git clone <this-repo> && cd dsh-superpowers
pnpm install && pnpm build
dsh plugin --profile web add ./

# After publishing to npm
dsh plugin --profile web add dsh-superpowers

# Verify: you should see id: superpowers and the package name
dsh --profile web --dump-config | grep -A2 dsh-superpowers

# Uninstall
dsh plugin --profile web remove dsh-superpowers
```

```sh
# Update
dsh plugin --profile web add dsh-superpowers
```

## Included skills (14)

| Skill | When it triggers |
| --- | --- |
| `superpower-using-superpowers` | Use when starting any conversation — establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions |
| `superpower-brainstorming` | Use before any creative work — creating features, building components, adding functionality, or modifying behavior |
| `superpower-writing-plans` | Use when you have a spec or requirements for a multi-step task, before touching code |
| `superpower-using-git-worktrees` | Use when starting feature work that needs isolation from the current workspace, or before executing implementation plans |
| `superpower-executing-plans` | Use when you have a written implementation plan to execute in a separate session with review checkpoints |
| `superpower-subagent-driven-development` | Use when executing implementation plans with independent tasks in the current session |
| `superpower-dispatching-parallel-agents` | Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies |
| `superpower-test-driven-development` | Use when implementing any feature or bugfix, before writing implementation code |
| `superpower-systematic-debugging` | Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes |
| `superpower-verification-before-completion` | Use before claiming work is complete, fixed, or passing — run verification commands and confirm output before any success claim |
| `superpower-requesting-code-review` | Use when completing tasks, implementing major features, or before merging |
| `superpower-receiving-code-review` | Use when receiving code review feedback, before implementing suggestions |
| `superpower-finishing-a-development-branch` | Use when implementation is complete, all tests pass, and you need to decide how to integrate the work |
| `superpower-writing-skills` | Use when creating new skills, editing existing skills, or verifying skills work before deployment |

Typical flows:

```
Build me X    → superpower-brainstorming → superpower-writing-plans
              → superpower-subagent-driven-development
Fix this bug  → superpower-systematic-debugging
Review this   → superpower-requesting-code-review
```

Verify: inside a session `await ctx.skills.list({cwd})` should return 14 entries with `provider: superpowers`; or run `node scripts/verify.mjs` for `14/14 PASS`.

## Usage in the DSH web UI

1. Start the web UI and open the printed URL: `dsh web` (alias of `dsh --profile web`).
2. Start a new session. The 14 skills are registered automatically in `ctx.skills` and appear in the model's `<available_skills>` catalog — no extra setup.
3. The model loads the matching skill by itself via the `skill` tool: "build me X" → `superpower-brainstorming`, "fix this bug" → `superpower-systematic-debugging`.
4. You can also invoke a skill explicitly by typing its name with a leading slash in the chat, e.g. `/superpower-brainstorming` (this injects the skill's full instructions into the conversation).

## Tool mapping

Upstream references Claude Code tools; this package maps them onto DSH tools (see `skills/superpower-using-superpowers/references/dsh-tools.md`):

| Claude Code | DSH |
| --- | --- |
| Bash | `bash` |
| Read / Write / Edit | `read` / `write` / `edit` |
| Glob / Grep | `glob` / `grep` |
| TodoWrite | `todo_write` |
| Task (subagent) | `subagent` / `subagent_fork` |
| ExitPlanMode | `exit_plan_mode` |
| AskUserQuestion | `ask_user_question` |
| WebFetch / WebSearch | `read_page` / `web_search` |
| Load a skill | `skill` tool / `/name` gesture |

## Layout

```
src/superpowers.ts   # SkillProvider (rank 550), lazily loads SKILL.md bodies
skills/              # 14 skills (English, with references/)
lib/                 # build output (committed for zero-build GitHub installs)
scripts/verify.mjs   # structural check + runtime smoke (14/14 PASS)
cordis.patch.yml     # bundle patch: inserts the superpowers plugin row
```

## Development

```sh
pnpm install && pnpm build && pnpm typecheck && node scripts/verify.mjs
```

## License

MIT, matching upstream [obra/superpowers](https://github.com/obra/superpowers) (Jesse Vincent / Prime Radiant). See [LICENSE](./LICENSE).
