# dsh-superpowers

English | [中文](README.zh.md)

[![npm version](https://img.shields.io/npm/v/@jasonfreelab/dsh-superpowers)](https://www.npmjs.com/package/@jasonfreelab/dsh-superpowers) [![GitHub release](https://img.shields.io/github/v/release/JasonFreeLab/dsh-superpowers)](https://github.com/JasonFreeLab/dsh-superpowers/releases) [![License](https://img.shields.io/npm/l/@jasonfreelab/dsh-superpowers)](./LICENSE)

A [DSH](https://github.com/deepseek-ai/deepseek-harness) (DeepSeek Harness) port of [obra/superpowers](https://github.com/obra/superpowers) — the full multi-agent software-development methodology, available out of the box as native DSH skills.

> Ported from upstream [obra/superpowers](https://github.com/obra/superpowers) (v6.3.0, by Jesse Vincent / Prime Radiant). Skill content is taken directly from upstream and mapped onto the DSH toolset.

## Table of Contents

- [Features](#features)
- [Install](#install)
- [Usage](#usage)
- [Included skills](#included-skills)
- [Tool mapping](#tool-mapping)
- [Layout](#layout)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

- **14 methodology skills** — brainstorm → plan → TDD → systematic debugging → code review → integrate.
- **Native DSH skills** — injected into `ctx.skills` via a `SkillProvider` (rank 550; overridable by project/user skills).
- **English (i18n)** — skill content kept in original English; Chinese docs in `README.zh.md`.
- **Zero-build install** — `lib/` is committed, so GitHub installs need no build step.
- **Automated releases** — `release-please` (versioning + CHANGELOG + release notes) plus trusted publishing to npm and GitHub Packages.

## Install

Using the `web` profile as the example (change `--profile` for others). Requires `Node >= 20`, `pnpm >= 9`, and `dsh`.

```sh
# From npm (recommended)
dsh plugin --profile web add @jasonfreelab/dsh-superpowers

# Local path install (dev / offline)
git clone https://github.com/JasonFreeLab/dsh-superpowers.git && cd dsh-superpowers
pnpm install && pnpm build
dsh plugin --profile web add ./

# Verify: you should see id: superpowers
dsh --profile web --dump-config | grep -A2 '@jasonfreelab/dsh-superpowers'

# Update / uninstall
dsh plugin --profile web add @jasonfreelab/dsh-superpowers
dsh plugin --profile web remove @jasonfreelab/dsh-superpowers
```

> Also published to GitHub Packages (requires auth): `npm.pkg.github.com/@jasonfreelab/dsh-superpowers`.

## Usage

### In the DSH web UI

1. Start the web UI and open the printed URL: `dsh web` (alias of `dsh --profile web`).
2. Start a new session. The 14 skills are registered automatically in `ctx.skills` and appear in the model's `<available_skills>` catalog — no extra setup.
3. The model loads the matching skill by itself via the `skill` tool.
4. You can also invoke a skill explicitly with `/skill-name`, e.g. `/superpower-brainstorming`.

### Typical flows

```
Build me X    → superpower-brainstorming → superpower-writing-plans → superpower-subagent-driven-development
Fix this bug  → superpower-systematic-debugging
Review this   → superpower-requesting-code-review
```

Verify: inside a session `await ctx.skills.list({cwd})` should return 14 entries with `provider: superpowers`.

## Included skills

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
src/superpowers.ts       # SkillProvider (rank 550), lazily loads SKILL.md bodies
skills/                  # 14 skills (English, with references/)
lib/                     # build output (committed for zero-build installs)
scripts/                 # test.mjs + verify.mjs
cordis.patch.yml         # bundle patch
.github/workflows/       # ci.yml + release.yml + release-please.yml
```

## Development

```sh
pnpm install
npm run build        # or: pnpm build
npm run typecheck
npm test             # comprehensive (content hygiene + real SkillRegistry)
npm run verify       # structural + runtime smoke
```

## Contributing

Issues and pull requests are welcome. The upstream methodology lives in [obra/superpowers](https://github.com/obra/superpowers).

## License

[MIT](./LICENSE), matching upstream [obra/superpowers](https://github.com/obra/superpowers) (Jesse Vincent / Prime Radiant).
