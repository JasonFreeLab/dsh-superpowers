# dsh-superpowers

[English](README.md) | 中文

[![npm version](https://img.shields.io/npm/v/@jasonfreelab/dsh-superpowers)](https://www.npmjs.com/package/@jasonfreelab/dsh-superpowers) [![GitHub release](https://img.shields.io/github/v/release/JasonFreeLab/dsh-superpowers)](https://github.com/JasonFreeLab/dsh-superpowers/releases) [![License](https://img.shields.io/npm/l/@jasonfreelab/dsh-superpowers)](./LICENSE)

[obra/superpowers](https://github.com/obra/superpowers) 的 [DSH](https://github.com/deepseek-ai/deepseek-harness)（DeepSeek Harness）移植版 —— 把完整的多智能体软件开发方法论以**原生 DSH 技能**形式开箱即用。

> 移植自上游 [obra/superpowers](https://github.com/obra/superpowers)（v6.3.0，作者 Jesse Vincent / Prime Radiant）。技能内容直接取自上游，并映射到 DSH 工具集。

## 目录

- [特性](#特性)
- [安装](#安装)
- [使用](#使用)
- [包含技能](#包含技能)
- [工具映射](#工具映射)
- [目录结构](#目录结构)
- [开发](#开发)
- [贡献](#贡献)
- [协议](#协议)

## 特性

- **14 个方法论技能** —— 头脑风暴 → 计划 → TDD → 系统化调试 → 代码评审 → 集成。
- **原生 DSH 技能** —— 通过 `SkillProvider` 注入 `ctx.skills`（rank 550，可被项目/用户技能覆盖）。
- **英文国际化** —— 技能内容保持英文原文；中文文档见 `README.zh.md`。
- **零构建安装** —— `lib/` 已提交，GitHub 直装无需构建。
- **自动化发布** —— `release-please`（版本 + CHANGELOG + Release 说明）+ npm 与 GitHub Packages 可信发布。

## 安装

以主工作台 `web` 为例（其它 profile 改 `--profile`）。前置：`Node >= 20`、`pnpm >= 9`、`dsh`。

```sh
# 从 npm 安装（推荐）
dsh plugin --profile web add @jasonfreelab/dsh-superpowers

# 本地路径安装（开发/离线）
git clone https://github.com/JasonFreeLab/dsh-superpowers.git && cd dsh-superpowers
pnpm install && pnpm build
dsh plugin --profile web add ./

# 验证：应能看到 id: superpowers
dsh --profile web --dump-config | grep -A2 '@jasonfreelab/dsh-superpowers'

# 更新 / 卸载
dsh plugin --profile web add @jasonfreelab/dsh-superpowers
dsh plugin --profile web remove @jasonfreelab/dsh-superpowers
```

> 同时发布到 GitHub Packages（需鉴权）：`npm.pkg.github.com/@jasonfreelab/dsh-superpowers`。

## 使用

### 在 DSH web 界面

1. 启动 web 界面并打开打印出的地址：`dsh web`（即 `dsh --profile web`）。
2. 新建会话。14 个技能会自动注册到 `ctx.skills`，并出现在模型的 `<available_skills>` 目录里——无需额外配置。
3. 模型会通过 `skill` 工具自行加载匹配的技能。
4. 你也可以显式调用：输入 `/技能名`，例如 `/superpower-brainstorming`。

### 典型流程

```
帮我做 XXX   → superpower-brainstorming → superpower-writing-plans → superpower-subagent-driven-development
修这个缺陷   → superpower-systematic-debugging
帮我评审     → superpower-requesting-code-review
```

校验：进入会话后 `await ctx.skills.list({cwd})` 应有 14 条 `provider: superpowers`。

## 包含技能

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
src/superpowers.ts       # SkillProvider（rank 550），惰性加载 SKILL.md 正文
skills/                  # 14 个技能（英文，含 references/）
lib/                     # 构建产物（已提交，GitHub 直装零构建）
scripts/                 # test.mjs + verify.mjs
cordis.patch.yml         # bundle patch
.github/workflows/       # ci.yml + release.yml + release-please.yml
```

## 开发

```sh
pnpm install
npm run build        # 或 pnpm build
npm run typecheck
npm test             # 全面测试（内容卫生 + 真实 SkillRegistry）
npm run verify       # 结构校验 + 运行时冒烟
```

## 贡献

欢迎提交 Issue / PR。上游方法论见 [obra/superpowers](https://github.com/obra/superpowers)。

## 协议

[MIT](./LICENSE)，与上游 [obra/superpowers](https://github.com/obra/superpowers) 保持一致（Jesse Vincent / Prime Radiant）。
