---
name: superpower-writing-plans
description: "当你拥有一份多步骤任务的规范（spec）或需求、且尚未触碰代码时使用。"
---

# 编写计划（Writing Plans）

## 概述

编写全面的实现计划，并假定工程师对我们代码库零上下文、品味存疑。把每个任务需要知道的一切都写进去：每个任务要触碰哪些文件、代码、测试、他们可能需要查看的文档、如何测试。把整个计划拆成一口大小的任务给他们。DRY。YAGNI。TDD。频繁提交。

假定他们是熟练的开发者，但对我们的工具集或问题领域几乎一无所知。假定他们不太懂好的测试设计。

**开始时宣布：** "我正在使用 writing-plans 技能来创建实现计划。"

**上下文：** 如果在隔离的 worktree 中工作，它应该在执行时通过 `superpower-using-git-worktrees` 技能（用 `skill` 工具加载）创建。

**计划保存到：** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- （用户对计划位置的偏好覆盖此默认值）

## 范围检查

如果规范覆盖多个独立子系统，它应该在头脑风暴期间就被拆成子项目规范。如果没有，建议把它拆成多个独立计划——每个子系统一个。每个计划都应该能独立产出可工作、可测试的软件。

## 文件结构

在定义任务之前，先规划哪些文件会被创建或修改、每个文件负责什么。分解决策在这里被锁定。

- 设计边界清晰、接口定义良好的单元。每个文件应有一个清晰职责。
- 你能最好地推理能一次性放进上下文的代码，文件专注时你的编辑也更可靠。偏好更小、更专注的文件，而不是做太多事的大文件。
- 一起变化的文件应该放在一起。按职责拆分，而不是按技术层。
- 在既有代码库中，遵循既有模式。如果代码库使用大文件，不要单方面重构——但如果你正在修改的文件已经膨胀失控，在计划中包含一次拆分是合理的。

这个结构为任务分解提供依据。每个任务都应产出独立成章的、自成一体且有意义的变更。

## 任务大小恰到好处（Task Right-Sizing）

任务是携带自己测试循环的最小单元，并且值得一个全新的审查者关卡。划定任务边界时：把搭建、配置、脚手架和文档步骤折叠进需要它们产出的那个任务；只在审查者可能有意义地否决一个任务、同时批准其相邻任务的地方拆分。每个任务以一个可独立测试的产出结束。

## 一口大小（Bite-Sized）的任务粒度

**每一步是一个动作（2-5 分钟）：**
- "写失败的测试" - 一步
- "运行它，确认它失败" - 一步
- "写让测试通过的最小实现" - 一步
- "运行测试，确认它们通过" - 一步
- "提交（Commit）" - 一步

## 计划文档页头

**每个计划必须以这个页头开头：**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpower-subagent-driven-development (recommended) or superpower-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

**Spec:** [path to the spec/design doc this plan implements — the plan
argues from the spec, so the spec travels with it; executors read both]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every task's requirements implicitly
include this section.]

---
```

## 任务结构

```markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Interfaces:**
- Consumes: [what this task uses from earlier tasks — exact signatures]
- Produces: [what later tasks rely on — exact function names, parameter
  and return types. A task's implementer sees only their own task; this
  block is how they learn the names and types neighboring tasks use.]

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
```

## 没有占位符（No Placeholders）

每一步必须包含工程师需要的实际内容。这些是**计划失败**——永远不要写：
- "TBD"、"TODO"、"稍后实现"、"填写细节"
- "添加适当的错误处理" / "添加验证" / "处理边界情况"
- "为以上内容写测试"（没有实际测试代码）
- "与任务 N 类似"（重复代码——工程师可能不按顺序读任务）
- 只描述做什么而不展示怎么做的步骤（代码步骤必须有代码块）
- 引用任何任务中未定义的类型、函数或方法

## 自审（Self-Review）

写完完整计划后，用新的眼光看规范，并把计划与它对照。这是你自己运行的清单——不是派发子代理。

**1. 规范覆盖：** 略读规范中的每个部分/需求。你能指出实现它的任务吗？列出任何缺口。

**2. 占位符扫描：** 在计划中搜索红旗——上面"没有占位符"一节中的任何模式。修复它们。

**3. 类型一致性：** 你在后面任务中使用的类型、方法签名和属性名，与你在前面任务中定义的一致吗？任务 3 里叫 `clearLayers()` 的函数在任务 7 里叫 `clearFullLayers()` 就是一个 bug。

如果发现问题，内联修复。无需重新审阅——修复后继续。如果你发现一个规范需求没有对应任务，添加该任务。

## 执行交接（Execution Handoff）

保存计划后，提供执行方式选择：

**"计划已完成并保存到 `docs/superpowers/plans/<filename>.md`。两种执行方式：**

**1. 子代理驱动（推荐）** - 我为每个任务派发一个全新子代理，任务之间审查，快速迭代

**2. 内联执行** - 在本会话中用 executing-plans 执行，批量执行并带检查点

**你选哪种？"**

**如果选择子代理驱动：**
- **必需子技能（REQUIRED SUB-SKILL）：** 使用 `superpower-subagent-driven-development`（通过 `skill` 工具加载）
- 每个任务一个全新子代理 + 两阶段审查

**如果选择内联执行：**
- **必需子技能（REQUIRED SUB-SKILL）：** 使用 `superpower-executing-plans`（通过 `skill` 工具加载）
- 批量执行并带审查检查点
