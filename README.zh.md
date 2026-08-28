# dsh-superpowers

[English](README.md) | 中文

[obra/superpowers](https://github.com/obra/superpowers) 的 [DSH](https://github.com/deepseek-ai/deepseek-harness)（DeepSeek Harness）移植版 —— 把完整的多智能体软件开发方法论以**原生 DSH 技能**形式开箱即用。

> 移植自上游 [obra/superpowers](https://github.com/obra/superpowers)（v6.3.0，作者 Jesse Vincent / Prime Radiant）。技能内容直接取自上游，并做了面向 DSH 工具集的映射。

## 是什么

一套**强制性方法论**而非可选建议：先头脑风暴 → 写计划切片 → TDD → 系统化调试 → 评审集成。14 个技能通过一个 `SkillProvider` 注入 `ctx.skills` 全局层，随 `dsh.bundle` 安装/卸载，不污染用户目录。

## 安装

以主工作台 `web` 为例，其它 profile 改 `--profile` 后名字即可。前置：`Node >= 20`、`pnpm >= 9`、`dsh`。

```sh
# 本地路径安装（开发/离线）
git clone <this-repo> && cd dsh-superpowers
pnpm install && pnpm build
dsh plugin --profile web add ./

# 发布到 npm 后
dsh plugin --profile web add dsh-superpowers

# 验证：应能看到 id: superpowers 与包名
dsh --profile web --dump-config | grep -A2 dsh-superpowers

# 卸载
dsh plugin --profile web remove dsh-superpowers
```

```sh
# 更新
dsh plugin --profile web add dsh-superpowers
```

## 包含技能（14 个）

| 技能 | 触发时机 |
| --- | --- |
| `superpower-using-superpowers` | 任意会话起点，先加载技能再回应 |
| `superpower-brainstorming` | 任何创造性工作之前（新功能/组件/改行为） |
| `superpower-writing-plans` | 有了规格/需求、动手写代码之前 |
| `superpower-using-git-worktrees` | 需要隔离工作区或执行计划之前 |
| `superpower-executing-plans` | 有书面实现计划要执行（带评审检查点） |
| `superpower-subagent-driven-development` | 按计划逐任务派子代理执行 |
| `superpower-dispatching-parallel-agents` | 面对 2+ 个互不依赖的独立任务 |
| `superpower-test-driven-development` | 实现任何功能/修复之前（RED-GREEN-REFACTOR） |
| `superpower-systematic-debugging` | 遇到任何 bug/测试失败/异常行为，提出修复之前 |
| `superpower-verification-before-completion` | 宣称完成/已修复/通过之前，先跑验证拿证据 |
| `superpower-requesting-code-review` | 完成任务/大功能/合并前请求评审 |
| `superpower-receiving-code-review` | 收到评审反馈、动手实现建议之前 |
| `superpower-finishing-a-development-branch` | 实现完成、测试通过，决定如何集成 |
| `superpower-writing-skills` | 新建/编辑/验证技能之前 |

典型流程：

```
帮我做 XXX   → superpower-brainstorming → superpower-writing-plans
              → superpower-subagent-driven-development
修这个缺陷   → superpower-systematic-debugging
帮我评审     → superpower-requesting-code-review
```

校验：进入会话后 `await ctx.skills.list({cwd})` 应有 14 条 `provider: superpowers`；或运行 `node scripts/verify.mjs` 得到 `14/14 PASS`。

## 在 DSH web 界面中使用

1. 启动 web 界面并打开打印出的地址：`dsh web`（即 `dsh --profile web`）。
2. 新建会话。14 个技能会自动注册到 `ctx.skills`，并出现在模型的 `<available_skills>` 目录里——无需额外配置。
3. 模型会通过 `skill` 工具自行加载匹配的技能：「帮我做 XXX」→ `superpower-brainstorming`，「修这个缺陷」→ `superpower-systematic-debugging`。
4. 你也可以在聊天框输入技能名前加 `/` 来显式调用，例如 `/superpower-brainstorming`（会把该技能的完整指令注入对话）。

## 工具映射

obra 原文引用的是 Claude Code 工具，本包已映射到 DSH 工具（详见 `skills/superpower-using-superpowers/references/dsh-tools.md`）：

| Claude Code | DSH |
| --- | --- |
| Bash | `bash` |
| Read / Write / Edit | `read` / `write` / `edit` |
| Glob / Grep | `glob` / `grep` |
| TodoWrite | `todo_write` |
| Task（子代理） | `subagent` / `subagent_fork` |
| ExitPlanMode | `exit_plan_mode` |
| AskUserQuestion | `ask_user_question` |
| WebFetch / WebSearch | `read_page` / `web_search` |
| 加载技能 | `skill` 工具 / `/name` 手势 |

## 目录结构

```
src/superpowers.ts   # SkillProvider（rank 550），惰性加载 SKILL.md 正文
skills/              # 14 个技能（英文原文，含 references/ 附属文档）
lib/                 # 构建产物（提交后 GitHub 直装零构建）
scripts/verify.mjs   # 结构校验 + 运行时冒烟（14/14 PASS）
cordis.patch.yml     # bundle patch：insert superpowers 插件行
```

## 开发

```sh
pnpm install && pnpm build && pnpm typecheck && node scripts/verify.mjs
```

## 协议

MIT，与上游 [obra/superpowers](https://github.com/obra/superpowers) 保持一致（作者 Jesse Vincent / Prime Radiant）。详见 [LICENSE](./LICENSE)。
