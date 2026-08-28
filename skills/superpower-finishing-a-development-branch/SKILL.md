---
name: superpower-finishing-a-development-branch
description: "在实现完成、所有测试通过，需要决定如何整合工作时使用"
---

# 完成一个开发分支

## 概述

**核心原则：** 验证测试 → 检测环境 → 呈现选项 → 执行选择 → 清理。

**开始时宣布：** "我正在使用 finishing-a-development-branch 技能来完成这项工作。"

## 第 1 步：验证测试

运行项目完整的测试套件（`npm test` / `cargo test` / `pytest` / `go test ./...`）。

**如果测试失败**，报告失败并停下——选项菜单要等套件变绿之后才出现：

```
测试失败（<N> 个失败）。完成之前必须先修复：

[展示失败]
```

**如果测试通过：** 继续第 2 步。

## 第 2 步：检测环境

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
# 趁还在工作区内现在就捕获——第 5 步会切换目录，
# 而清理（第 6 步）需要这个值
WORKTREE_PATH=$(git rev-parse --show-toplevel)
```

这决定显示哪个菜单以及如何清理：

| 状态 | 菜单 | 清理 |
|-------|------|---------|
| `GIT_DIR == GIT_COMMON`（普通仓库） | 标准 3 个选项 | 没有 worktree 需要清理 |
| `GIT_DIR != GIT_COMMON`，命名分支 | 标准 3 个选项 | 基于来源（见第 6 步） |
| `GIT_DIR != GIT_COMMON`，游离 HEAD | 精简 2 个选项（无合并） | 外部管理——原地保留 |

## 第 3 步：确定基础分支

基础分支就是这项工作从哪分叉出来的——通常在计划、对话或分支的上游里能看出来。如果还不知道，就问："这个分支是从 <你的最佳猜测> 分出来的——对吗？" 合并前确认：合错基础分支代价很高，难以撤销。

## 第 4 步：呈现选项

**普通仓库和命名分支 worktree——呈现且只呈现这 3 个选项：**

```
实现已完成。你想怎么做？

1. 本地合并回 <base-branch>
2. 推送并创建 Pull Request
3. 保持分支原样（我稍后处理）

选哪个？
```

**游离 HEAD——呈现且只呈现这 2 个选项：**

```
实现已完成。你处于游离 HEAD（外部管理工作区）。

1. 作为新分支推送并创建 Pull Request
2. 保持原样（我稍后处理）

选哪个？
```

菜单要按原文呈现——简洁，每个选项都来自上面的列表。丢弃工作只在你的人类搭档明确要求时才发生（见下方"如果你的人类搭档要求丢弃工作"）。等他们回答；整合的决定权在他们。

## 第 5 步：执行选择

### 选项 1：本地合并

```bash
# 为 CWD 安全获取主仓库根目录
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"

# 先合并——在删除任何东西之前确认成功
git checkout <base-branch>
git pull
git merge <feature-branch>

# 在合并结果上验证测试
<test command>
```

如果合并结果上测试失败：停下，让 worktree 和分支原地保留，去调查——什么都没推送，所以合并是局部的、可恢复的。

一旦合并结果变绿：先清理 worktree（第 6 步），再删除分支：

```bash
git branch -d <feature-branch>
```

### 选项 2：推送并创建 PR

```bash
git push -u origin <feature-branch>
# 从游离 HEAD 出发时，在远端命名新分支：
# git push origin HEAD:refs/heads/<new-branch>
```

然后针对 <base-branch> 用平台的工具创建 pull/merge request——有 CLI 就用 CLI，否则用大多数平台推送时打印的创建 URL——遵循仓库的 PR 模板和约定（如有），并把 URL 报告给你的人类搭档。

保留 worktree——你的人类搭档会在那里根据 PR 反馈迭代。

### 选项 3：保持原样

报告："保留分支 <name>。worktree 保留在 <path>。"

### 如果你的人类搭档要求丢弃工作

这条路径只作为对明确扔掉工作的请求的回应。先确认：

```
这将永久删除：
- 分支 <name>
- 所有提交：<commit-list>
- <path> 处的 worktree

输入 'discard' 确认。
```

等那个精确的确认。收到后：

```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
```

然后清理 worktree（第 6 步）并强制删除分支：

```bash
git branch -D <feature-branch>
```

## 第 6 步：清理工作区

**选项 1 和已确认的丢弃会执行本步。** 选项 2 和 3 总是保留 worktree。两个调用方都已经把目录切换到了主仓库根目录——删除 worktree 必须从 worktree 外部运行——并使用第 2 步捕获的 `GIT_DIR`/`GIT_COMMON`/`WORKTREE_PATH` 值，即目录切换之前的值。

**如果 `GIT_DIR == GIT_COMMON`：** 普通仓库，没有 worktree 要清理。结束。

**如果 `WORKTREE_PATH` 在 `.worktrees/` 或 `worktrees/` 之下：** 这个 worktree 是 Superpowers 创建的——清理归我们：

```bash
git worktree remove "$WORKTREE_PATH"
git worktree prune  # 自愈：清理任何过期的注册
```

**如果删除被拒绝**（`contains modified or untracked files`）：这个 worktree 里存放着别处不存在的文件——未提交的计划、笔记或零碎工作。绝不要自作主张 `--force`。把利害关系展示给你的人类搭档并询问：

```bash
git -C "$WORKTREE_PATH" status --porcelain -uall
```

```
Worktree 删除被拒绝——这些文件从未提交过：

<文件列表>

1. 把它们提交到 <branch> 再清理
2. 把它们移到 <主仓库根目录>
3. 删除它们（不可恢复）

选哪个？
```

执行选择，然后删除 worktree。

**否则：** 宿主环境拥有这个工作区——原地保留。如果你的平台提供了退出工作区的工具，就使用它。

## 快速参考

| 选项 | 合并 | 推送 | 保留 worktree | 清理分支 |
|--------|-------|------|---------------|----------------|
| 1. 本地合并 | 是 | - | - | 是 |
| 2. 创建 PR | - | 是 | 是 | - |
| 3. 保持原样 | - | - | 是 | - |
| 丢弃（仅明确请求） | - | - | - | 是（强制） |

## 常见的自我合理化

| 借口 | 现实 |
|--------|---------|
| "这次会话早些时候测试通过过" | 在你要整合的那棵树本身上跑套件。一次通过的运行只能证明它跑过的那棵树。 |
| "他们显然想合并" | 整合是你的人类搭档的决定。呈现菜单并等待。 |
| "他们看起来做完这个功能了——我来提议丢弃它" | 菜单按原文写全。丢弃只在你的人类搭档明说时发生。 |
| "'是啊，删了吧' 算确认" | 只有打出来的 'discard' 一词才授权删除。 |
| "PR 已经建了，worktree 现在是杂物" | PR 反馈要在这个 worktree 里修。它要留到工作落地。 |
| "这个其它 worktree 看起来过期了——我顺手清理一下" | 只清理 `.worktrees/` 或 `worktrees/` 下的 worktree。其余都归宿主。 |
| "删除被拒——`--force` 只是把清理做完" | 被拒意味着文件只存在于那个 worktree。`--force` 会永久销毁它们。展示给你的人类搭档并询问。 |
| "合并结果的失败大概是 flaky" | 失败的合并结果会停下一切。分支和 worktree 原地不动，等你调查。 |
| "基础分支显然是 main" | 确认分叉点或询问。合错基础分支代价高昂、难以撤销。 |
| "推送被拒——force-push 能解决" | 被拒的推送意味着远端动了。去调查；只有在你的人类搭档明确要求时才 force-push。 |
