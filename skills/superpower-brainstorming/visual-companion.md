# 可视化伴侣指南

基于浏览器的可视化头脑风暴伴侣，用于展示 mockup、图表和选项。

> **DSH 说明：** 原版技能附带一个浏览器可视化服务器（`scripts/`），DSH 未捆绑这些脚本。本指南保留原方法论与内容写法；在 DSH 下可视化是可选的——没有捆绑服务器时，可以用 `bash` 工具以 `run_in_background: true` 运行一个静态文件服务器（如 `python3 -m http.server`），或用 `write` 写自包含的 HTML 文件让用户用浏览器打开，并在终端交流反馈。

## 何时使用

按问题决策，而不是按会话决策。判据：**用户"看到"它比"读到"它理解得更好吗？**

**内容本身是视觉时用浏览器：**

- **UI mockup** —— 线框图、布局、导航结构、组件设计
- **架构图** —— 系统组件、数据流、关系图
- **并排视觉对比** —— 对比两种布局、两种配色、两个设计方向
- **设计打磨** —— 当问题是关于观感、间距、视觉层次时
- **空间关系** —— 状态机、流程图、以图形渲染的实体关系

**内容是文本或表格时用终端：**

- **需求与范围问题** —— "X 是什么意思？"、"哪些功能在范围内？"
- **概念性的 A/B/C 选择** —— 在用文字描述的方案之间做选择
- **权衡清单** —— 优缺点、对比表
- **技术决策** —— API 设计、数据建模、架构方案选择
- **澄清性问题** —— 任何答案是文字而非视觉偏好的东西

一个*关于* UI 主题的问题不自动是视觉问题。"你想要哪种向导？"是概念性的——用终端。"这些向导布局里哪种感觉对？"是视觉的——用浏览器。

## 工作原理（原实现，DSH 下可选）

服务器监听一个目录中的 HTML 文件，并把最新的文件提供给浏览器。你往 `screen_dir` 写 HTML 内容，用户在浏览器里看到它并可点击选择选项。选择被记录到 `state_dir/events`，你在下一轮读取它。

**内容片段 vs 完整文档：** 如果你的 HTML 文件以 `<!DOCTYPE` 或 `<html` 开头，服务器会原样提供它（只注入辅助脚本）。否则，服务器会自动把你的内容包进框架模板——加上页头、CSS 主题、连接状态和所有交互基础设施。**默认写内容片段。** 只有当你需要完全控制页面时才写完整文档。

## 启动会话（DSH 替代方案）

原版用 `scripts/start-server.sh` 启动服务器。DSH 未捆绑该脚本；如需可视化，可用以下方式之一：

- **静态文件服务器（推荐）：** 用 `bash` 工具在后台运行，例如：
  ```bash
  python3 -m http.server 8080 --directory /path/to/project/.superpowers/brainstorm
  ```
  设置 `run_in_background: true`，用 `job_output`/`job_list`/`job_kill` 管理；把 URL 分享给用户。后台任务必须跨回合存活，这正是 `run_in_background: true` 的用途。
- **自包含 HTML：** 用 `write` 写一个包含全部样式与脚本的 HTML 文件，让用户用浏览器直接打开。

（原服务器会返回含会话密钥的 URL 并拒绝无钥请求，以隔离访问；若你自建服务器，注意只在受信任环境中开放访问。）

## 循环

1. **确认服务器存活**，然后**写 HTML** 到 `screen_dir` 里的一个新文件：
   - **必需：在引用 URL 或推送画面之前确认服务器存活。** 检查 `$STATE_DIR/server-info` 存在且 `$STATE_DIR/server-stopped` 不存在。如果它已关闭，用**相同的** `--project-dir` 重启（DSH 下即重新启动后台 `bash` 任务）——它会复用同一个端口，用户已打开的标签页会自动重连（服务器宕机期间会显示"paused"遮罩），你也不需要发新 URL。服务器空闲 4 小时后自动退出（可用 `--idle-timeout-minutes` 配置）。
   - 使用语义化文件名：`platform.html`、`visual-style.html`、`layout.html`
   - **绝不复用文件名** —— 每个画面用一个全新文件
   - 用你的文件创建工具（`write`）——**绝不要用 cat/heredoc**（会把噪音倒进终端）
   - 服务器自动提供最新的文件

2. **告诉用户会看到什么并结束你的回合：**
   - 提醒他们 URL（每一步都提醒，不只是第一次）
   - 给一个屏幕内容的简短文字摘要（例如"展示主页的 3 种布局选项"）
   - 请他们在终端回应："看一下，告诉我你的想法。想选择的话点击某个选项。"

3. **下一轮**——在用户在终端回应之后：
   - 如果 `$STATE_DIR/events` 存在就用 `read` 读取它——里面是用户的浏览器交互（点击、选择），每行一个 JSON 对象
   - 与用户的终端文字合并，得到完整图景
   - 终端消息是主要反馈；`state_dir/events` 提供结构化交互数据

4. **迭代或推进** —— 如果反馈改变了当前画面，写一个新文件（例如 `layout-v2.html`）。只有当前步骤被验证后才进入下一个问题。

5. **回到终端时卸载** —— 当下一步不需要浏览器时（例如澄清性问题、权衡讨论），推一个等待画面来清掉过期内容：

   ```html
   <!-- filename: waiting.html (or waiting-2.html, etc.) -->
   <div style="display:flex;align-items:center;justify-content:center;min-height:60vh">
     <p class="subtitle">Continuing in terminal...</p>
   </div>
   ```

   这防止用户在对话已经推进后还盯着一个已解决的选择。下一个视觉问题出现时，照常推一个新的内容文件。

6. 重复直到完成。

## 写内容片段

只写放进页面里的内容。服务器会自动把它包进框架模板（页头、主题 CSS、连接状态和所有交互基础设施）。

**最小示例：**

```html
<h2>Which layout works better?</h2>
<p class="subtitle">Consider readability and visual hierarchy</p>

<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Single Column</h3>
      <p>Clean, focused reading experience</p>
    </div>
  </div>
  <div class="option" data-choice="b" onclick="toggleSelect(this)">
    <div class="letter">B</div>
    <div class="content">
      <h3>Two Column</h3>
      <p>Sidebar navigation with main content</p>
    </div>
  </div>
</div>
```

就这样。不需要 `<html>`、CSS 或 `<script>` 标签。服务器会提供所有这些。

## 可用的 CSS 类

框架模板为你的内容提供以下 CSS 类：

### 选项（A/B/C 选择）

```html
<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Title</h3>
      <p>Description</p>
    </div>
  </div>
</div>
```

**多选：** 在容器上加 `data-multiselect`，让用户可以多选。每次点击切换该项的选中样式。

```html
<div class="options" data-multiselect>
  <!-- same option markup — users can select/deselect multiple -->
</div>
```

### 卡片（视觉设计）

```html
<div class="cards">
  <div class="card" data-choice="design1" onclick="toggleSelect(this)">
    <div class="card-image"><!-- mockup content --></div>
    <div class="card-body">
      <h3>Name</h3>
      <p>Description</p>
    </div>
  </div>
</div>
```

### Mockup 容器

```html
<div class="mockup">
  <div class="mockup-header">Preview: Dashboard Layout</div>
  <div class="mockup-body"><!-- your mockup HTML --></div>
</div>
```

### 分屏视图（并排）

```html
<div class="split">
  <div class="mockup"><!-- left --></div>
  <div class="mockup"><!-- right --></div>
</div>
```

### 优缺点

```html
<div class="pros-cons">
  <div class="pros"><h4>Pros</h4><ul><li>Benefit</li></ul></div>
  <div class="cons"><h4>Cons</h4><ul><li>Drawback</li></ul></div>
</div>
```

### Mock 元素（线框图积木）

```html
<div class="mock-nav">Logo | Home | About | Contact</div>
<div style="display: flex;">
  <div class="mock-sidebar">Navigation</div>
  <div class="mock-content">Main content area</div>
</div>
<button class="mock-button">Action Button</button>
<input class="mock-input" placeholder="Input field">
<div class="placeholder">Placeholder area</div>
```

### 排版与区块

- `h2` —— 页面标题
- `h3` —— 章节标题
- `.subtitle` —— 标题下方的次要文字
- `.section` —— 带底部间距的内容块
- `.label` —— 小号大写标签文字

## 浏览器事件格式

用户在浏览器中点击选项时，交互被记录到 `$STATE_DIR/events`（每行一个 JSON 对象）。当你推送新画面时，文件会被自动清空。

```jsonl
{"type":"click","choice":"a","text":"Option A - Simple Layout","timestamp":1706000101}
{"type":"click","choice":"c","text":"Option C - Complex Grid","timestamp":1706000108}
{"type":"click","choice":"b","text":"Option B - Hybrid","timestamp":1706000115}
```

完整的事件流显示用户的探索路径——他们可能在确定之前点击多个选项。最后一个 `choice` 事件通常是最终选择，但点击模式可能揭示值得追问的犹豫或偏好。

如果 `$STATE_DIR/events` 不存在，说明用户没有与浏览器交互——只用他们的终端文字。

## 设计技巧

- **按问题缩放保真度** —— 布局问题用线框图，打磨问题用打磨级呈现
- **在每页上解释问题** —— 写"哪种布局更显专业？"而不是只写"选一个"
- **推进前先迭代** —— 如果反馈改变了当前画面，写一个新版本
- **每屏最多 2-4 个选项**
- **在要紧的地方用真实内容** —— 对于摄影作品集，用真实图片（如 Unsplash）。占位内容会掩盖设计问题。
- **保持 mockup 简单** —— 聚焦布局与结构，而不是像素级完美

## 文件命名

- 用语义化名字：`platform.html`、`visual-style.html`、`layout.html`
- 绝不复用文件名——每个画面必须是一个新文件
- 迭代时追加版本后缀：`layout-v2.html`、`layout-v3.html`
- 服务器按修改时间提供最新文件

## 清理

原版用 `scripts/stop-server.sh` 停止服务器。DSH 下用 `job_kill` 停止对应的后台 `bash` 任务即可。

如果会话用了 `--project-dir`（DSH 下即把文件放在项目目录下），mockup 文件会保留在 `.superpowers/brainstorm/` 供日后参考。只有放在 /tmp 的会话在停止时会被删除。

## 参考

- 框架模板（CSS 参考）：原版在 `scripts/frame-template.html`——DSH 未捆绑，可用上面"可用的 CSS 类"自行实现。
- 辅助脚本（客户端）：原版在 `scripts/helper.js`——DSH 未捆绑；自包含 HTML 中需自行编写交互脚本（如 `toggleSelect`）。
