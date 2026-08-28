# 纵深防御校验（Defense-in-Depth Validation）

## 概述

修复由无效数据导致的 bug 时，在一个地方加校验感觉就够了。但那一处检查可能被不同的代码路径、重构或 mock 绕过。

**核心原则：** 在数据经过的每一层都做校验。让 bug 在结构上不可能。

## 为什么需要多层

单一校验："我们修好了 bug"
多层校验："我们让 bug 不可能发生"

不同层抓住不同情况：
- 入口校验抓住大多数 bug
- 业务逻辑抓住边界情况
- 环境守卫防止特定上下文中的危险
- 调试日志在其它层失效时提供帮助

## 四层

### 第 1 层：入口校验
**目的：** 在 API 边界拒绝明显无效的输入

```typescript
function createProject(name: string, workingDirectory: string) {
  if (!workingDirectory || workingDirectory.trim() === '') {
    throw new Error('workingDirectory cannot be empty');
  }
  if (!existsSync(workingDirectory)) {
    throw new Error(`workingDirectory does not exist: ${workingDirectory}`);
  }
  if (!statSync(workingDirectory).isDirectory()) {
    throw new Error(`workingDirectory is not a directory: ${workingDirectory}`);
  }
  // ... proceed
}
```

### 第 2 层：业务逻辑校验
**目的：** 确保数据对这个操作有意义

```typescript
function initializeWorkspace(projectDir: string, sessionId: string) {
  if (!projectDir) {
    throw new Error('projectDir required for workspace initialization');
  }
  // ... proceed
}
```

### 第 3 层：环境守卫
**目的：** 防止特定上下文中的危险操作

```typescript
async function gitInit(directory: string) {
  // In tests, refuse git init outside temp directories
  if (process.env.NODE_ENV === 'test') {
    const normalized = normalize(resolve(directory));
    const tmpDir = normalize(resolve(tmpdir()));

    if (!normalized.startsWith(tmpDir)) {
      throw new Error(
        `Refusing git init outside temp dir during tests: ${directory}`
      );
    }
  }
  // ... proceed
}
```

### 第 4 层：调试插桩
**目的：** 为事后分析捕获上下文

```typescript
async function gitInit(directory: string) {
  const stack = new Error().stack;
  logger.debug('About to git init', {
    directory,
    cwd: process.cwd(),
    stack,
  });
  // ... proceed
}
```

## 应用该模式

发现 bug 时：

1. **追踪数据流** - 坏值从哪来？在哪被使用？
2. **列出所有检查点** - 列出数据经过的每个点
3. **在每层添加校验** - 入口、业务、环境、调试
4. **测试每一层** - 尝试绕过第 1 层，验证第 2 层能接住

## 会话实例

Bug：空的 `projectDir` 导致在源码里 `git init`

**数据流：**
1. 测试设置 → 空字符串
2. `Project.create(name, '')`
3. `WorkspaceManager.createWorkspace('')`
4. `git init` 在 `process.cwd()` 中运行

**添加的四层：**
- 第 1 层：`Project.create()` 校验非空/存在/可写
- 第 2 层：`WorkspaceManager` 校验 projectDir 非空
- 第 3 层：`WorktreeManager` 在测试中拒绝在 tmpdir 之外 git init
- 第 4 层：git init 前记录堆栈跟踪

**结果：** 全部 1847 个测试通过，bug 无法复现

## 关键洞察

四层都是必要的。测试期间，每一层都抓住了其它层漏掉的 bug：
- 不同的代码路径绕过了入口校验
- mock 绕过了业务逻辑检查
- 不同平台上的边界情况需要环境守卫
- 调试日志识别出结构性误用

**不要只在一个校验点停手。** 在每一层都加检查。
