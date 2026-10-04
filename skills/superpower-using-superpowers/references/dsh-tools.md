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
| Glob | `glob` |
| Grep | `grep` |
| TodoWrite | `todo_write` (send the ENTIRE list every call) |
| Task (spawn subagent) | `subagent` (background by default; run_in_background:false waits) |
| Task (context-inheriting subagent) | `subagent_fork` |
| ExitPlanMode | `exit_plan_mode` |
| AskUserQuestion | `ask_user_question` |
| WebFetch | `web_fetch` |
| WebSearch | `web_search` |
| Present a file/deliverable to the user | `present` |
| Read an image file | `read_image` |
| NotebookEdit | n/a (use read/write/edit) |
| background Bash | `bash` with `run_in_background:true`, collect via `job_output` / `job_list` / `job_kill` |
| load a skill (/skill or Skills tool) | `skill` tool (model); `/name` gesture (user) |

> `read_page` (an older DSH mapping name) no longer exists; the page/URL
> fetch tool is `web_fetch`.

## DSH-Only Capabilities Usable by the Methodology

- `subagent` / `subagent_fork` — spawn subagents (background by default).
  Child model selection is **opt-in**: DSH's `modelSelectionSettings` defaults
  to `false`, so the tools expose no per-call model argument and the child
  inherits the session route. When the host enables it, the tools accept
  `provider` + `model` (and `reasoning_effort`), discovered with
  `list_subagent_models`.
- `list_agents` / `send_message` / `interrupt_agent` — reconcile live children,
  continue a settled child's conversation, or stop one
- `workflow` — scripted multi-agent orchestration: `agent(prompt, { schema })`
  for schema-validated results, plus `pipeline` and `parallel`. This is the DSH
  path for structured subagent findings and for deterministic fan-out.
- `todo_write` — task tracking (send the ENTIRE list every call)
- `create_goal` / `get_goal` / `update_goal` — persisted long-running goals
  that keep the session working across automatic continuation rounds
- `exit_plan_mode` — plan-mode approval
- `present` — declare existing files as deliverables with an open/preview card
- `read_image` — read PNG/JPEG/WebP/GIF images directly
- background jobs — `job_output` (with `wait: true`) / `job_list` / `job_kill`

## Skill resources

Loaded skill content arrives inside `<skill_content>` together with a
`<skill_resources>` base-directory hint. Resolve the relative paths a skill
mentions (`references/…`, `prompts/…`, `templates/…`, companion `*.md`) against
that base directory before reading them.
