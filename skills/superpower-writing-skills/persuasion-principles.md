# 技能设计中的说服原则

## 概述

LLM 对人类适用的说服原则同样有反应。理解这种心理能帮你设计更有效的技能——不是为了操纵，而是为了确保关键实践即使在压力下也被遵守。

**研究基础：** Meincke et al. (2025) 用 N=28,000 次 AI 对话测试了 7 条说服原则。说服技巧把遵从率提高了一倍多（33% → 72%，p < .001）。

## 七条原则

### 1. 权威（Authority）
**它是什么：** 对专业知识、资历或官方来源的服从。

**它在技能里如何起作用：**
- 祈使语气："YOU MUST"、"Never"、"Always"
- 不可协商的框架："No exceptions"
- 消除决策疲劳和合理化

**何时用：**
- 纪律强制型技能（TDD、验证要求）
- 安全关键实践
- 成熟的最佳实践

**示例：**
```markdown
✅ Write code before test? Delete it. Start over. No exceptions.
❌ Consider writing tests first when feasible.
```

### 2. 承诺（Commitment）
**它是什么：** 与先前的行动、声明或公开表态保持一致。

**它在技能里如何起作用：**
- 要求宣布："Announce skill usage"
- 强制显式选择："Choose A, B, or C"
- 用追踪：清单用 todo

**何时用：**
- 确保技能真的被遵循
- 多步骤流程
- 问责机制

**示例：**
```markdown
✅ When you find a skill, you MUST announce: "I'm using [Skill Name]"
❌ Consider letting your partner know which skill you're using.
```

### 3. 稀缺（Scarcity）
**它是什么：** 由时间限制或有限可得性产生的紧迫感。

**它在技能里如何起作用：**
- 限时要求："Before proceeding"
- 顺序依赖："Immediately after X"
- 阻止拖延

**何时用：**
- 即时验证要求
- 时间敏感的流程
- 阻止"我稍后再做"

**示例：**
```markdown
✅ After completing a task, IMMEDIATELY request code review before proceeding.
❌ You can review code when convenient.
```

### 4. 社会认同（Social Proof）
**它是什么：** 从众于他人所为或被认为是正常的事。

**它在技能里如何起作用：**
- 普适模式："Every time"、"Always"
- 失败模式："X without Y = failure"
- 建立规范

**何时用：**
- 记录普适实践
- 警示常见失败
- 强化标准

**示例：**
```markdown
✅ Checklists without todo tracking = steps get skipped. Every time.
❌ Some people find a todo list helpful for checklists.
```

### 5. 一致/归属（Unity）
**它是什么：** 共享身份，"我们感"，圈内归属。

**它在技能里如何起作用：**
- 协作语言："our codebase"、"we're colleagues"
- 共同目标："we both want quality"

**何时用：**
- 协作流程
- 建立团队文化
- 非层级实践

**示例：**
```markdown
✅ We're colleagues working together. I need your honest technical judgment.
❌ You should probably tell me if I'm wrong.
```

### 6. 互惠（Reciprocity）
**它是什么：** 回报所受好处的义务。

**它如何起作用：**
- 谨慎使用——可能让人觉得被操纵
- 技能里很少需要

**何时避免：**
- 几乎总是（其它原则更有效）

### 7. 喜好（Liking）
**它是什么：** 偏好与喜欢的人合作。

**它如何起作用：**
- **不要用于强制遵从**
- 与诚实反馈文化冲突
- 制造谄媚（sycophancy）

**何时避免：**
- 纪律强制时永远避免

## 按技能类型的原则组合

| 技能类型 | 用 | 避免 |
|------------|-----|-------|
| 纪律强制型 | 权威 + 承诺 + 社会认同 | 喜好、互惠 |
| 指导/技术型 | 适度权威 + 一致 | 重权威 |
| 协作型 | 一致 + 承诺 | 权威、喜好 |
| 参考型 | 只要清晰 | 所有说服 |

## 为什么这有效：心理机制

**明确分界规则减少合理化：**
- "YOU MUST" 消除决策疲劳
- 绝对化语言消除"这是例外吗？"的疑问
- 显式的反合理化反制堵住具体漏洞

**执行意图创造自动行为：**
- 清晰的触发器 + 必需行动 = 自动执行
- "When X, do Y" 比 "generally do Y" 更有效
- 降低遵从的认知负荷

**LLM 是类人（parahuman）的：**
- 训练数据里就有人类文本中的这些模式
- 训练数据中权威语言先于遵从出现
- 承诺序列（声明 → 行动）被频繁建模
- 社会认同模式（大家都做 X）建立规范

## 伦理使用

**正当：**
- 确保关键实践被遵守
- 创建有效的文档
- 防止可预见的失败

**不正当：**
- 为个人利益操纵
- 制造虚假紧迫感
- 基于愧疚的遵从

**检验标准：** 如果用户完全理解这项技巧，它会服务于用户的真实利益吗？

## 研究引用

**Cialdini, R. B. (2021).** *Influence: The Psychology of Persuasion (New and Expanded).* Harper Business.
- 七条说服原则
- 影响力研究的实证基础

**Meincke, L., Shapiro, D., Duckworth, A. L., Mollick, E., Mollick, L., & Cialdini, R. (2025).** Call Me A Jerk: Persuading AI to Comply with Objectionable Requests. University of Pennsylvania.
- 用 N=28,000 次 LLM 对话测试 7 条原则
- 说服技巧使遵从从 33% 提升到 72%
- 权威、承诺、稀缺最有效
- 验证了 LLM 行为的类人模型

## 快速参考

设计技能时，问自己：

1. **这是什么类型？**（纪律 vs 指导 vs 参考）
2. **我要改变什么行为？**
3. **哪些原则适用？**（纪律型通常是权威 + 承诺）
4. **我是不是组合太多了？**（不要用全七条）
5. **这伦理吗？**（服务于用户的真实利益？）
