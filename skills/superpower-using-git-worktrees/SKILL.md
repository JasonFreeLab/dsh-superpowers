---
name: superpower-using-git-worktrees
description: "开始需要与当前工作区隔离的功能开发时，或在执行实施计划之前，必须使用本技能——确保存在隔离的工作区"
whenToUse: "任何开始新功能开发或执行实施计划之前，需要隔离工作区时；DSH 无原生 worktree 工具，直接走 git worktree 回退方案"
---

# 使用 Git Worktrees

## 概览

确保工作发生在隔离的工作区。DSH 没有原生 worktree 工具（没有 `EnterWorktree`/`/worktree` 之类的工具），因此直接使用手动 git worktree 回退方案（原文的 Step 1a 原生工具路径在 DSH 中不适用；若你所在环境确实提供了原生 worktree 工具，才优先使用它）。

**核心原则：** 先检测既有隔离。然后使用原生工具。然后回退到 git。绝不与 harness 对抗。

**开始时宣布：** "我在使用 using-git-worktrees 技能来建立隔离的工作区。"

## 第 0 步：检测既有隔离

**创建任何东西之前，先检查你是否已经在隔离的工作区里。**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

**子模块守卫：** `GIT_DIR != GIT_COMMON` 在 git 子模块内部也为真。在断定"已经在 worktree 里"之前，验证你不是在子模块里：

```bash
# 如果这返回一个路径，你在子模块里，而不是 worktree——当作普通仓库处理
git rev-parse --show-superproject-working-tree 2>/dev/null
```

**如果 `GIT_DIR != GIT_COMMON`（且不是子模块）：** 你已经在链接的 worktree 里。跳到第 2 步（项目设置）。不要创建另一个 worktree。

带分支状态报告：
- 在分支上："已经在 `<path>` 的隔离工作区里，分支 `<name>`。"
- 分离 HEAD："已经在 `<path>` 的隔离工作区里（分离 HEAD，外部管理）。收尾时需要创建分支。"

**如果 `GIT_DIR == GIT_COMMON`（或在子模块里）：** 你在普通仓库 checkout 里。

你的指令里是否已经表明用户的工作区偏好？如果没有，在创建 worktree 前征求同意（用 `ask_user_question`）：

> "你想让我建立一个隔离的 worktree 吗？它保护你当前分支不受改动影响。"

尊重任何已声明的偏好，不再询问。如果用户拒绝同意，就地工作，跳到第 2 步。

## 第 1 步：创建隔离工作区

DSH 没有原生 worktree 工具，因此直接使用下面的 git worktree 回退方案。（原文 Step 1a 的"原生工具优先"在 DSH 中不适用。）

### Git Worktree 回退方案

用 git 手动创建 worktree。

#### 目录选择

按这个优先级。用户显式偏好永远压过观察到的文件系统状态。

1. **检查你的指令中是否有声明的 worktree 目录偏好。** 如果用户已经指定，不问直接用。
2. **检查是否已有项目本地 worktree 目录：**
   ```bash
   ls -d .worktrees 2>/dev/null     # 首选（隐藏）
   ls -d worktrees 2>/dev/null      # 替代
   ```
   如果找到，用它。如果两个都有，`.worktrees` 胜出。
3. **如果没有其它指导可用**，默认项目根下的 `.worktrees/`。

#### 安全检查（仅项目本地目录）

**创建 worktree 前 MUST 验证目录已被忽略：**

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**如果未被忽略：** 加入 .gitignore，提交这个改动，然后继续。

**为什么关键：** 防止不小心把 worktree 内容提交进仓库。

#### 创建 Worktree

```bash
# 根据所选位置确定路径
path="$LOCATION/$BRANCH_NAME"

git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

**沙箱回退：** 如果 `git worktree add` 因权限错误（沙箱拒绝）失败，告诉用户沙箱阻止了 worktree 创建，你改在当前目录工作。然后就地运行设置和基线测试。

## 第 2 步：项目设置

自动检测并运行适当的设置：

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

## 第 3 步：验证干净基线

运行测试，确保工作区干净起步：

```bash
# 使用项目合适的命令
npm test / cargo test / pytest / go test ./...
```

**如果测试失败：** 报告失败，询问是继续还是调查。
**如果测试通过：** 报告就绪。

### 报告

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## 快速参考

| 情况 | 动作 |
|-----------|--------|
| 已在链接的 worktree 里 | 跳过创建（第 0 步） |
| 在子模块里 | 当作普通仓库（第 0 步守卫） |
| 有原生 worktree 工具 | 使用它（第 1a 步；DSH 通常无此工具） |
| 没有原生工具 | git worktree 回退（第 1b 步） |
| `.worktrees/` 存在 | 使用它（验证已忽略） |
| `worktrees/` 存在 | 使用它（验证已忽略） |
| 两个都存在 | 使用 `.worktrees/` |
| 都没有 | 检查指令文件，然后默认 `.worktrees/` |
| 目录未被忽略 | 加入 .gitignore + 提交 |
| 创建时权限错误 | 沙箱回退，就地工作 |
| 基线测试失败 | 报告失败 + 询问 |
| 没有 package.json/Cargo.toml | 跳过依赖安装 |

## 常见合理化借口

| 借口 | 现实 |
|--------|--------|
| "我显然不在 worktree 里——不用检查" | 运行第 0 步。Harness 创建的隔离和子模块都会骗过肉眼；检测命令才能定论。 |
| "git worktree add 比找原生工具快" | 原生工具拥有放置、分支和清理。绕过它是头号错误——它会创建你的 harness 看不见也管不了的幻影状态。（DSH 无原生工具，此条不适用。） |
| "worktree 目录肯定已经被忽略了" | 运行 `git check-ignore`。未忽略的 worktree 目录会把整棵树提交进仓库。 |
| "任何目录名都行" | 显式指令胜过既有的项目本地目录，后者胜过 `.worktrees/` 默认值。 |
| "工作区是全新的——基线测试可以等" | 脏基线让之后的每个失败都变得模糊。现在就跑测试；越过失败继续是你的伙伴的决定。 |