---
name: superpower-requesting-code-review
description: "在完成任务、实现主要功能或合并之前，必须用代码评审来验证工作是否符合需求时使用"
---

# 请求代码评审

派遣一个代码评审子代理，在问题级联放大之前把它们抓出来。评审者拿到的是精心构造的评审上下文——绝不是你的会话历史。

**核心原则：** 早评审，勤评审（Review early, review often）。

## 何时请求评审

**必须：**
- 子代理驱动开发（subagent-driven development）中的每个任务之后
- 完成主要功能之后
- 合并到 main 之前

**可选但有价值：**
- 卡住时（换个视角）
- 重构之前（基线检查）
- 修完复杂 bug 之后

## 如何请求

**1. 获取 git SHA：**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # 或 origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. 派遣代码评审子代理：**

用 `subagent` 工具派遣一个通用目的子代理（默认后台运行；若你的下一步依赖评审结果，可设 `run_in_background: false` 等待其返回），把 [code-reviewer.md](code-reviewer.md) 中的模板填好作为其 prompt。模板参数：

- `{DESCRIPTION}` — 你构建内容的一句话摘要
- `{PLAN_OR_REQUIREMENTS}` — 它应当做什么
- `{BASE_SHA}` — 起始提交
- `{HEAD_SHA}` — 结束提交

**3. 对反馈采取行动：**
- 立即修复 Critical（严重）问题
- 继续之前修复 Important（重要）问题
- 把 Minor（次要）问题记下来稍后处理
- 评审者错了就顶回去（附上理由）

## 示例

```
[刚完成 Task 2: 添加验证函数]

你：让我在继续之前请求一次代码评审。

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[派遣代码评审子代理]
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types
  PLAN_OR_REQUIREMENTS: Task 2 from docs/superpowers/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661

[子代理返回]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

你：[修复进度指示器]
[继续 Task 3]
```

## 常见的自我合理化

| 借口 | 现实 |
|--------|---------|
| "我自己直接看 diff 就行了，不用派评审者" | 你是协调者——内联审阅 diff 会烧掉你用来继续推进工作所需的上下文窗口。派遣评审子代理：diff 和评估都在它的上下文里，回到你这里的只有结论。 |
| "评审者需要我的完整会话历史才能理解这次改动" | 交给它精心构造的上下文，绝不是你的会话历史。这能让评审者专注于工作产物本身，而不是你的思考过程。 |

## 危险信号

**绝不：**
- 因为"这很简单"就跳过评审
- 无视 Critical 问题
- 带着未修复的 Important 问题继续推进
- 与合理的技术反馈争论

**如果评审者错了：**
- 用技术推理顶回去
- 展示证明它确实能工作的代码/测试
- 要求澄清

模板见：[code-reviewer.md](code-reviewer.md)
