# DSH 工具映射

本文档把 Superpowers 技能中引用的 Claude Code 工具映射为 DSH（DeepSeek Harness）的对应工具。在 DSH 中执行技能时，一律使用下表右侧的 DSH 工具。

| Claude Code | DSH 工具 |
| --- | --- |
| Bash | `bash`（支持 `workdir`、`timeoutMs`、`run_in_background`） |
| Read | `read` |
| Write | `write` |
| Edit | `edit`（str_replace：`old_string` 必须唯一，或设 `replace_all: true`） |
| Glob | `glob` |
| Grep | `grep` |
| TodoWrite | `todo_write`（每次调用发送**完整**列表，整体替换） |
| Task（派生子代理） | `subagent`（默认后台运行；`run_in_background: false` 则等待结果） |
| Task（继承上下文的子代理） | `subagent_fork` |
| ExitPlanMode | `exit_plan_mode` |
| AskUserQuestion | `ask_user_question` |
| WebFetch | `read_page` |
| WebSearch | `web_search` |
| NotebookEdit | 无（改用 `read`/`write`/`edit`） |
| 后台 Bash | `bash` 加 `run_in_background: true`，用 `job_output`/`job_list`/`job_kill` 收集与停止 |
| 加载技能（/skill 或 Skills 工具） | `skill` 工具（模型侧）；用户侧用 `/name` 手势 |

## 在 DSH 中加载技能

- **模型侧：** 当你判断某技能适用于当前任务时，用 `skill` 工具加载它——传入确切的技能名（例如 `superpower-brainstorming`），然后严格按技能内容执行。
- **用户侧：** 用户可以通过 `/技能名` 手势（如 `/superpower-brainstorming`）显式请求加载某个技能。

## DSH 独有能力（方法论中可用）

- `subagent` / `subagent_fork`：委派独立任务；用 `list_agents`、`send_message`、`interrupt_agent` 管理子代理。
- `workflow`：大规模扇出编排——写一段 JavaScript 脚本编排多个子代理分阶段执行。
- `todo_write`：任务清单。
- `create_goal` / `get_goal` / `update_goal`：长线目标追踪。
- `exit_plan_mode`：计划获批准后退出计划模式。
