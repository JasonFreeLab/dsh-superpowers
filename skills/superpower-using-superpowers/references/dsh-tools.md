# DSH tool mapping

Tool mapping and platform notes for running the Superpowers skills in DSH (DeepSeek Harness).

## Loading skills in DSH

Skills are loaded via the `skill` tool: the model calls it with the exact skill name
(e.g. `superpower-brainstorming`). Users can load a skill with the `/name` gesture,
e.g. `/superpower-brainstorming`.

## Tool Map

| Claude Code | DSH |
| --- | --- |
| Bash | `bash` (supports `workdir`, `timeoutMs`, `run_in_background`) |
| Read | `read` |
| Write | `write` |
| Edit | `edit` (str_replace; old_string unique, or replace_all) |
| Multi-file patch | `apply_patch` (unified-diff style; available in `dsh-base` and the Web standard preset from DSH 0.2.2) |
| Glob | `glob` |
| Grep | `grep` |
| TodoWrite | `todo_write` (send the ENTIRE list every call) |
| Task (spawn subagent) | `subagent` (background by default; `run_in_background:false` waits); optional `name` |
| Task (context-inheriting subagent) | `subagent_fork` |
| Task control (list / message / interrupt) | `list_agents` / `send_message` / `interrupt_agent` |
| ExitPlanMode | `exit_plan_mode` |
| AskUserQuestion | `ask_user_question` |
| WebFetch | `web_fetch` |
| WebSearch | `web_search` |
| Present a file/deliverable to the user | `present` |
| Read an image file | `read_image` |
| Search session history | `session_search` / `session_trace` / `session_event_search` / `session_event_read` / `session_event_trace` |
| Run a task to completion in one context | `ralph` (DSH task-completion loop) |
| Working directory | `working_directory` |
| NotebookEdit | n/a (use read/write/edit) |
| background Bash | `bash` with `run_in_background:true`, collect via `job_output` / `job_list` / `job_kill` |
| load a skill (/skill or Skills tool) | `skill` tool (model); `/name` gesture (user) |

> `read_page` (an older DSH mapping name) no longer exists; the page/URL
> fetch tool is `web_fetch`.

## DSH 0.2.2-rc.4 notes

- **Subagents are addressed by name.** `subagent` / `subagent_fork` accept an
  optional `name` and return `started subagent <name>`; `list_agents` returns
  `{ name, status, description? }`. Continue with
  `send_message({ agent, message })` and stop with
  `interrupt_agent({ agent })` — `agent_id` no longer validates.
- **`interrupt_agent` is off in built-in presets.** The base bundle and the
  Web `standard` / `cordis` / `ptc` presets set `config.interrupt: false`;
  messaging, discovery, and runtime-context waiting still work.
- **Ordinary forks are independent.** They carry no `parentSession` and are
  not subagents; use `origin === "subagent"` to recognize delegated sessions.

## DSH-Only Capabilities Usable by the Methodology

- `subagent` / `subagent_fork` — spawn subagents (background by default).
  Child model selection is **opt-in**: DSH's `modelSelection` and
  `modelDiscovery` default to `false`, so the tools expose no per-call model
  argument and the child inherits the session route. When the host enables
  them, the tools accept `provider` + `model` (and `reasoning_effort`; an
  effort-only override is rejected), discovered with `list_subagent_models`.
- `list_agents` / `send_message` / `interrupt_agent` — reconcile live children,
  continue a settled child's conversation, or stop one
- `workflow` — scripted multi-agent orchestration: `agent(prompt, { schema })`
  for schema-validated results, plus `pipeline` and `parallel`. This is the DSH
  path for structured subagent findings and for deterministic fan-out.
- `apply_patch` — apply a multi-file unified-diff patch in one call
- `todo_write` — task tracking (send the ENTIRE list every call)
- `create_goal` / `get_goal` / `update_goal` — persisted long-running goals
  that keep the session working across automatic continuation rounds
- `ralph` — run a task to completion within one context, for work that would
  otherwise need repeated turns
- `session_search` and friends — query prior sessions and events as evidence
- `exit_plan_mode` — plan-mode approval
- `present` — declare existing files as deliverables with an open/preview card
- `read_image` — read PNG/JPEG/WebP/GIF images directly
- `schedule_create` / `schedule_list` / `schedule_view` / `schedule_edit` —
  scheduled tasks
- background jobs — `job_output` (with `wait: true`) / `job_list` / `job_kill`

## Skill resources

Loaded skill content arrives inside `<skill_content>` together with a
`<skill_resources>` base-directory hint. Resolve the relative paths a skill
mentions (`references/…`, `prompts/…`, `templates/…`, companion `*.md`) against
that base directory before reading them.
