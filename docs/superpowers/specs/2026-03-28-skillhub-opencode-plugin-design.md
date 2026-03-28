# SkillHub OpenCode 插件化设计方案

## 一、概述

### 目标

将 SkillHub VSCode 插件项目编译为 OpenCode 插件，使 SkillHub 的核心功能（skill 的创建、编辑、打包、发布）也能在 OpenCode 终端环境中使用。

### 核心挑战

VSCode 插件和 OpenCode 插件的 API 完全不同：

| 维度 | VSCode 插件 | OpenCode 插件 |
|------|------------|---------------|
| UI 层 | Webview、TreeView、命令面板 | Terminal 输出、Toast 通知 |
| API | VSCode Extension API | Plugin Events + Custom Tools |
| 扩展方式 | `commands.registerCommand` | `tool` 导出 + 事件 hook |

### 设计原则

1. **核心逻辑下沉**：将业务逻辑提取到平台无关的 core 层
2. **UI 层分离**：VSCode UI 和 OpenCode CLI 分别调用 core 层
3. **渐进式迁移**：保持现有 VSCode 插件功能，逐步添加 OpenCode 支持

---

## 二、架构设计

### 整体架构

```
skillshub/
├── src/
│   ├── core/                      # 共享业务逻辑（新增）
│   │   ├── SkillManager.ts       # 从 services/ 提取
│   │   ├── MarketplaceService.ts # 从 services/ 提取
│   │   ├── VersionManager.ts     # 从 services/ 提取
│   │   ├── CacheManager.ts       # 从 services/ 提取
│   │   ├── TemplateEngine.ts     # 从 services/ 提取
│   │   ├── types.ts              # 共享类型定义
│   │   └── logger.ts             # 抽象日志接口
│   │
│   ├── vscode/                   # VSCode 插件入口（重构）
│   │   ├── extension.ts          # 入口
│   │   ├── ui/                   # VSCode 特定 UI
│   │   └── commands/            # VSCode 命令注册
│   │
│   └── opencode/                 # OpenCode 插件入口（新增）
│       ├── plugin.ts             # 插件主文件
│       └── tools/                # OpenCode Custom Tools
│           ├── skill-tools.ts    # Skill 管理工具
│           └── market-tools.ts   # 市场工具
│
├── opencode-plugin/              # OpenCode 插件独立构建（可选）
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
│
└── package.json                  # VSCode 插件配置
```

### OpenCode 插件结构

OpenCode 插件是一个导出插件函数的 JS/TS 模块：

```typescript
// opencode-plugin/src/plugin.ts
import type { Plugin } from "@opencode-ai/plugin";

export const SkillHubPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      // Custom Tools 定义
    },
    // 事件 hook
  };
};
```

---

## 三、核心模块重构

### 3.1 日志抽象

**目标**：将 `Logger` 从 VSCode 特定实现改为抽象接口

```typescript
// src/core/logger.ts
export interface Logger {
  info(message: string): void;
  error(message: string, error?: Error): void;
  debug?(message: string): void;
}

// VSCode 实现
export class VSCodeLogger implements Logger {
  private output = vscode.window.createOutputChannel('Skillshub');
  info(msg: string) { this.output.appendLine(`[INFO] ${msg}`); }
  error(msg: string, err?: Error) { 
    this.output.appendLine(`[ERROR] ${msg}${err ? `: ${err.message}` : ''}`); 
  }
}

// OpenCode 实现
export class OpenCodeLogger implements Logger {
  constructor(private client: Client) {}
  info(msg: string) { this.client.app.log({ body: { level: 'info', message: msg }}); }
  error(msg: string, err?: Error) { 
    this.client.app.log({ body: { level: 'error', message: `${msg}: ${err?.message}` }}); 
  }
}
```

### 3.2 路径配置抽象

```typescript
// src/core/config.ts
export interface PlatformConfig {
  skillsPath: string;
  configDir: string;
  cacheDir: string;
}

export function getPlatformConfig(): PlatformConfig {
  const home = os.homedir();
  return {
    skillsPath: path.join(home, '.config', 'opencode', 'skills'),
    configDir: path.join(home, '.config', 'skillshub'),
    cacheDir: path.join(home, '.cache', 'skillshub'),
  };
}
```

### 3.3 SkillManager 重构

移除 VSCode 依赖，保留纯文件操作：

```typescript
// src/core/SkillManager.ts
export class SkillManager {
  private config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  async list(): Promise<Skill[]> { /* 保持现有逻辑 */ }
  async create(name: string, template?: string): Promise<Skill> { /* 保持现有逻辑 */ }
  async remove(name: string): Promise<void> { /* 保持现有逻辑 */ }
  async package(name: string): Promise<string> { /* 保持现有逻辑 */ }
}
```

---

## 四、OpenCode 插件实现

### 4.1 插件入口

```typescript
// src/opencode/plugin.ts
import type { Plugin } from "@opencode-ai/plugin";
import { SkillTools } from "./tools/skill-tools";
import { MarketTools } from "./tools/market-tools";
import { OpenCodeLogger } from "../core/logger";
import { PlatformConfig, getPlatformConfig } from "../core/config";
import { SkillManager } from "../core/SkillManager";

export const SkillHubPlugin: Plugin = async (ctx) => {
  const config = getPlatformConfig();
  const logger = new OpenCodeLogger(ctx.client);
  const skillManager = new SkillManager(config);

  const skillTools = new SkillTools(skillManager, logger);
  const marketTools = new MarketTools(skillManager, logger);

  return {
    tool: {
      ...skillTools.getTools(),
      ...marketTools.getTools(),
    },
  };
};
```

### 4.2 Custom Tools 定义

OpenCode 插件通过 `tool` 导出定义自定义工具：

```typescript
// src/opencode/tools/skill-tools.ts
import { tool } from "@opencode-ai/plugin";

export class SkillTools {
  constructor(
    private skillManager: SkillManager,
    private logger: OpenCodeLogger
  ) {}

  getTools() {
    return {
      skill_list: tool({
        description: "List all installed skills",
        args: {},
        async execute(args, context) {
          const skills = await this.skillManager.list();
          return skills.map(s => `${s.name} (${s.version}) - ${s.status}`).join('\n');
        },
      }),

      skill_create: tool({
        description: "Create a new skill from template",
        args: {
          name: tool.schema.string(),
          template: tool.schema.string().optional(),
        },
        async execute(args, context) {
          const skill = await this.skillManager.create(args.name, args.template);
          return `Created skill: ${skill.name}`;
        },
      }),

      skill_package: tool({
        description: "Package a skill for distribution",
        args: {
          name: tool.schema.string(),
        },
        async execute(args, context) {
          const zipPath = await this.skillManager.package(args.name);
          return `Packaged to: ${zipPath}`;
        },
      }),
    };
  }
}
```

### 4.3 可用工具列表

| 工具名 | 描述 | 参数 |
|--------|------|------|
| `skill_list` | 列出所有已安装的 skills | 无 |
| `skill_create` | 创建新 skill | `name`, `template?` |
| `skill_delete` | 删除 skill | `name` |
| `skill_package` | 打包 skill | `name` |
| `skill_install` | 从市场安装 skill | `skillId` |
| `skill_publish` | 发布 skill 到市场 | `name` |
| `market_browse` | 浏览远程市场 | `query?`, `page?` |
| `market_search` | 搜索市场 | `query` |

---

## 五、构建配置

### 5.1 目录结构变更

```
skillshub/
├── src/
│   ├── core/                    # 新增：共享逻辑
│   ├── vscode/                  # 重构：VSCode 入口
│   └── opencode/                # 新增：OpenCode 入口
│
├── opencode-plugin/             # 新增：独立构建
│   ├── package.json            # OpenCode 插件配置
│   ├── tsconfig.json
│   └── build/                  # 编译输出
│
├── package.json                 # VSCode 插件配置
└── tsconfig.json               # 保留 VSCode 构建
```

### 5.2 OpenCode 插件 package.json

```json
{
  "name": "skillhub-opencode",
  "version": "0.0.1",
  "type": "module",
  "main": "build/plugin.js",
  "dependencies": {
    "@opencode-ai/plugin": "^0.1.0"
  },
  "devDependencies": {
    "esbuild": "^0.20.0",
    "typescript": "^5.3.0"
  }
}
```

### 5.3 OpenCode 插件配置

用户需要在 `opencode.json` 中添加：

```json
{
  "plugin": ["skillhub-opencode"]
}
```

或者使用本地开发路径：

```json
{
  "plugin": ["./opencode-plugin/build/plugin.js"]
}
```

---

## 六、数据流

### OpenCode 中的调用流程

```
用户/Agent → OpenCode → SkillHub Plugin Tool
                           ↓
                      SkillManager
                           ↓
                    ┌──────┴──────┐
                    ↓              ↓
              本地文件系统      远程市场 API
                    ↓              ↓
              ~/.config/      marketplace
              /opencode/       Service
              /skills/
```

---

## 七、错误处理

| 场景 | OpenCode 处理方式 |
|------|------------------|
| Skill 不存在 | 抛出错误，tool 返回错误信息 |
| 打包失败 | 返回详细错误日志 |
| 网络错误 | 降级到离线模式，返回缓存数据 |
| 编译错误 | 返回 TypeScript 编译错误信息 |

---

## 八、非功能性考虑

### 性能

- Tool 执行应在 5 秒内完成
- 列表操作应< 100ms
- 使用 Bun 的 `$.` shell API 而非 Node.js

### 兼容性

- OpenCode 插件 API 版本稳定性
- TypeScript 类型支持

### 安全

- 不在日志中输出敏感信息
- Token 存储使用 OpenCode Secret Storage

---

## 九、构建流程

### 编译命令

```bash
# 编译 VSCode 插件（现有）
npm run compile

# 编译 OpenCode 插件（新增）
npm run compile:opencode

# 同时编译两者
npm run compile:all
```

### OpenCode 插件编译配置

```javascript
// scripts/build-opencode.js
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/opencode/plugin.ts'],
  bundle: true,
  outfile: 'opencode-plugin/build/plugin.js',
  platform: 'node',
  target: 'node20',
  format: 'esm',
  external: ['@opencode-ai/plugin'],
});
```

---

## 十、后续扩展

### 阶段一（MVP）

- [ ] 重构 core 层提取共享逻辑
- [ ] 实现基础 Skill Tools
- [ ] OpenCode 插件编译配置

### 阶段二

- [ ] Marketplace Tools
- [ ] 版本管理 Tools
- [ ] 离线缓存支持

### 阶段三

- [ ] 交互式创建流程（通过 TUI）
- [ ] AI Agent 辅助创建
- [ ] 市场发布集成
