# Skill Creation Agent 设计方案

> 日期: 2026-03-27
> 状态: 已批准

## 一、概述

Skill 创建功能采用**全 Agent 代理架构**，通过对话式交互帮助用户创建完整的 skill。利用 OpenCode Agent API 理解用户意图并生成 skill 文件结构，同时配备预设模板库作为兜底方案。

## 二、整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Skillshub VSCode Plugin                    │
├─────────────────────────────────────────────────────────────┤
│  UI Layer                                                     │
│  ┌─────────────────┐  ┌─────────────────────────────────┐    │
│  │ SkillExplorer   │  │ SkillCreationPanel (Webview)   │    │
│  │ (TreeView)      │  │ - 对话式交互界面                 │    │
│  │                 │  │ - 实时预览区域                   │    │
│  └─────────────────┘  └─────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                         │
│  ┌─────────────────┐  ┌─────────────────────────────────┐    │
│  │ SkillManager    │  │ SkillCreationAgent              │    │
│  │ - 生命周期管理   │  │ - 对话状态机                    │    │
│  │ - 文件操作      │  │ - OpenCode Agent API 调用       │    │
│  └─────────────────┘  │ - 降级兜底逻辑                  │    │
│                      └─────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Integration Layer                                            │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ OpenCodeAgentAPI / LocalTemplateEngine (降级)        │     │
│  └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 三、UI 设计

### 3.1 SkillCreationPanel Webview

通过 VSCode Webview 实现对话式交互界面。

**布局结构：**
```
┌────────────────────────────────────────┐
│  🤖 Skill Creator            [关闭]     │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Agent: 你好！我来帮你创建一个      │  │
│  │ skill。请告诉我你想解决什么问题    │  │
│  │ 或实现什么功能？                   │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ User: 我想创建一个代码审查助手    │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Agent: 好的，代码审查助手。我      │  │
│  │ 了解了...                          │  │
│  │                                    │  │
│  │ 📁 预览:                           │  │
│  │ ├── SKILL.md (审查规则)            │  │
│  │ ├── src/index.ts (核心逻辑)       │  │
│  │ └── test/ (测试)                  │  │
│  │                                    │  │
│  │ [编辑] [重新生成] [确认创建]       │  │
│  └──────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│  [输入你的描述...]                [发送]│
└────────────────────────────────────────┘
```

### 3.2 状态指示

| 状态 | 表现 |
|------|------|
| `idle` | 等待用户输入，显示欢迎语 |
| `thinking` | Agent 处理中，显示加载动画 |
| `generating` | 生成/预览 skill 结构 |
| `editing` | 用户请求修改 |
| `confirmed` | 用户确认创建 |
| `error` | Agent API 不可用，显示降级选项 |
| `fallback` | 使用模板模式 |

## 四、交互流程

```
用户                    Agent                        系统
 │                        │                            │
 │──── 开始创建 ─────────▶│                            │
 │                        │──── 欢迎语 + 引导问题 ─────▶│
 │◀───────────────────────│                            │
 │                        │                            │
 │──── 描述需求 ─────────▶│                            │
 │                        │──── 调用 Agent API ─────────▶│
 │◀───────────────────────│◀───────────────────────────│
 │                        │                            │
 │──── 修改反馈 ─────────▶│                            │
 │                        │──── 重新生成 ──────────────▶│
 │◀───────────────────────│◀───────────────────────────│
 │                        │                            │
 │──── 确认创建 ─────────▶│                            │
 │                        │──── 保存文件 ──────────────▶│
 │◀───────────────────────│◀───────────────────────────│
```

### 4.1 可选上下文

创建时可选择提供以下上下文：
- 当前打开的文件内容
- 当前项目路径
- 用户剪贴板内容
- 最近的 git commit

## 五、生成文件结构

Agent 根据用户描述生成以下文件：

| 文件 | 用途 | 必填 |
|------|------|------|
| `SKILL.md` | Skill 定义、命令、用法说明 | 是 |
| `src/index.ts` | 核心业务逻辑 | 是 |
| `src/types.ts` | 类型定义 | 否 |
| `test/index.test.ts` | 测试用例 | 否 |
| `config.json` | Skill 配置 | 否 |
| `README.md` | 使用文档 | 否 |

**SKILL.md 结构：**
```markdown
# {Skill Name}

## Description
{Agent 根据用户描述生成}

## Commands
- `command1`: description
- `command2`: description

## Usage
{使用说明}

## Configuration
{配置项说明}
```

## 六、兜底机制

### 6.1 触发条件

1. OpenCode Agent API 不可达（超时/网络错误）
2. API 返回错误响应
3. 用户主动选择离线模式

### 6.2 降级流程

```
检测到 Agent API 不可用
        │
        ▼
┌───────────────────┐
│ 显示警告: Agent   │
│ 暂不可用          │
│ [继续] [使用模板]  │
└───────────────────┘
        │
        ├──── [继续] ────▶ 纯本地规则处理（简化版）
        │
        └──── [使用模板] ──▶ 展示模板选择列表
                              │
                              ├── 代码审查 (code-review)
                              ├── 调试助手 (debugging)
                              ├── 文档生成 (documentation)
                              ├── 测试辅助 (testing)
                              └── 自定义 (custom)
```

### 6.3 预设模板库

```
templates/
├── code-review/
│   ├── SKILL.md
│   ├── src/index.ts
│   ├── src/types.ts
│   └── test/
├── debugging/
├── documentation/
├── testing/
└── custom/
```

## 七、关键组件

### 7.1 SkillCreationAgent

```typescript
interface SkillCreationState {
  status: 'idle' | 'thinking' | 'generating' | 'editing' | 'confirmed' | 'error' | 'fallback';
  conversation: ConversationMessage[];
  preview: SkillPreview | null;
  context: CreationContext | null;
}

interface SkillCreationAgent {
  start(context?: CreationContext): void;
  sendMessage(content: string): Promise<AgentResponse>;
  getPreview(): SkillPreview | null;
  confirm(): Promise<Skill>;
  fallbackToTemplate(templateId: string): Promise<Skill>;
  cancel(): void;
}
```

### 7.2 OpenCodeAgentAPI

```typescript
interface OpenCodeAgentAPI {
  // 调用 Agent 生成 skill 内容
  generateSkill(prompt: string, context?: object): Promise<GeneratedSkill>;
  
  // 检查 API 可用性
  isAvailable(): Promise<boolean>;
}
```

### 7.3 LocalTemplateEngine

```typescript
interface LocalTemplateEngine {
  // 获取可用模板列表
  listTemplates(): Template[];
  
  // 根据模板生成 skill
  generateFromTemplate(templateId: string, overrides?: object): Skill;
}
```

## 八、错误处理

| 场景 | 处理策略 |
|------|----------|
| Agent API 超时 | 降级到模板模式，显示提示 |
| Agent API 错误 | 降级到模板模式，记录日志 |
| 文件写入失败 | 显示错误，保留预览内容供重试 |
| 用户中断 | 保存对话状态，允许恢复 |

## 九、里程碑

1. **Phase 1**: SkillCreationPanel Webview UI
2. **Phase 2**: SkillCreationAgent 状态机和对话逻辑
3. **Phase 3**: OpenCode Agent API 集成
4. **Phase 4**: 模板引擎和兜底机制
5. **Phase 5**: 与 SkillExplorer 集成

## 十、文件结构

```
skillshub/
├── src/
│   ├── services/
│   │   ├── SkillManager.ts
│   │   ├── AgentAPIService.ts      # OpenCode Agent API 调用
│   │   └── TemplateEngine.ts       # 本地模板引擎
│   ├── ui/
│   │   ├── SkillExplorer.ts
│   │   └── SkillCreationPanel.ts   # Webview 面板
│   ├── agent/
│   │   ├── SkillCreationAgent.ts   # 核心 Agent 逻辑
│   │   └── types.ts
│   └── commands/
│       └── index.ts
├── webview/
│   └── skill-creation/
│       ├── index.html
│       └── styles.css
└── templates/
    ├── code-review/
    ├── debugging/
    ├── documentation/
    └── testing/
```
