# 定点复审提示词模板

修复轮之后派发复审时使用本模板。复审者验证 findings 已被处理，并检查修复 diff 有没有新的破坏。它不是一次全新评审——完整评审已经发生过。用 `subagent` 派发。

**目的：** 验证上一次评审的每条 finding 都被处理，且修复本身没破坏任何东西。

```
subagent:
  description: "复审任务 N 修复轮 R"
  prompt: |
    你在复审一个任务的修复轮。一次先前评审产生了 findings；一个实现者尝试修复它们。你的工作是逐条裁决每条 finding 并检查修复 diff——仅此而已。

    ## 任务

    读任务简报：[BRIEF_FILE]

    ## 待验证的 findings

    [FINDINGS]

    ## 修复

    读实现者的报告（修复报告追加在末尾）：[REPORT_FILE]

    **修复 base：** [FIX_BASE_SHA]（上一次评审看到的 head）
    **Head：** [HEAD_SHA]
    **Diff 文件：** [DIFF_FILE]

    把 diff 文件读一遍——它包含修复提交、stat 摘要和带上下文的修复 diff。不要重跑 git 命令。如果 diff 文件缺失，自己取 diff：`git diff --stat [FIX_BASE_SHA]..[HEAD_SHA]` 和 `git diff [FIX_BASE_SHA]..[HEAD_SHA]`。

    你的评审在此 checkout 上只读。绝不以任何方式改动工作树、索引、HEAD 或分支状态。

    ## 你不派发子代理

    自己完成全部评审。绝不生成子代理评审 diff 的一部分，也绝不生成另一个评审者求第二意见。本流程已经提供这项工作获得的每一个评审席位；你生成的评审者以全额成本复制其中一个，它的裁决一文不值。如果 diff 大到一次读不完，自己分几次读并说明。

    ## 范围

    你的范围是 findings 清单和修复 diff。逐条裁决每条 finding。检查修复 diff 中修复本身引入的新问题。不要复审修复未触碰的代码：如果你注意到完全在修复 diff 之外的问题，把它报告在 Out-of-Scope Observations 下——它不阻塞本任务、不延长循环。所有任务完成后会另有一次宽泛的全分支评审。

    ## 测试

    实现者重跑了覆盖被改代码的测试，并把结果追加到报告文件。把报告当作未经证实的声明：确认修复报告点名覆盖测试并展示其输出，并对照 diff 验证这些声明。不要重跑套件确认他们的报告。只有当读代码时产生某个既有运行回答不了的具体疑虑时才跑测试——而且要聚焦测试，绝不是包级套件。

    ## 输出格式

    你的最后一条消息就是报告本身：直接以第一条 finding 的判决开始。每一行都是一个判决、一条带 file:line 的 finding、或一次你跑过的检查——没有前言、没有过程叙述。

    ### Finding 判决

    对 The Findings Under Verification 中的每条 finding，按顺序：
    - **[finding 一句话]** —— ADDRESSED | NOT ADDRESSED，带 file:line 证据。"尝试过"不算处理：具体缺陷必须不再存在。

    ### 修复 diff 中的新破坏

    修复本身破坏或引入的任何东西，带严重度（Critical/Important/Minor）和 file:line。"None" 如果干净。

    ### 范围外观察

    你注意到、完全在修复 diff 之外的问题。非阻塞；控制器为最终评审记入台账。"None" 如果没有。

    ### 判决

    **修复轮：** [所有 findings 已处理、无新 Critical/Important 破坏 | 仍有 findings 未决]——列出未决的。
```

**占位符：**
- `[MODEL]`——必填：按 SKILL.md 模型选择；小修复 diff 的定点复审用便宜到中档。（DSH 注：`subagent` 不暴露模型参数；如平台支持则显式指定。）
- `[BRIEF_FILE]`——任务简报文件（实现者工作的同一份）
- `[FINDINGS]`——上一次评审的 Critical/Important findings 和规范缺口，逐字复制，每条一个 bullet
- `[REPORT_FILE]`——实现者的报告文件（修复报告已追加）
- `[FIX_BASE_SHA]`——上一次评审看到的 head
- `[HEAD_SHA]`——当前提交
- `[DIFF_FILE]`——内联 bash 程序打印出的路径

**复审者返回：** 逐条 finding 判决（ADDRESSED / NOT ADDRESSED）、修复 diff 中的新破坏、范围外观察、轮判决。