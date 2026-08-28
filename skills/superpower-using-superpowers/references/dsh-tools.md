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
| WebFetch | `read_page` |
| WebSearch | `web_search` |
| NotebookEdit | n/a (use read/write/edit) |
| background Bash | `bash` with run_in_background:true, collect via job_output/job_list/job_kill |
| load a skill (/skill or Skills tool) | `skill` tool (model); `/name` gesture (user) |

## DSH-Only Capabilities Usable by the Methodology

- `subagent` / `subagent_fork` — spawn subagents (background by default)
- `workflow` — scripted multi-agent orchestration
- `todo_write` — task tracking (send the ENTIRE list every call)
- `create_goal` / `get_goal` / `update_goal` — long-running goals across turns
- `exit_plan_mode` — plan-mode approval
