# Cassowary-SkillHub

VSCode 插件，提供可视化的 skill 管理界面。同时支持将 SkillHub 编译为 OpenCode 插件，在终端环境中使用。

## 功能

### VSCode 插件
- **本地 Skill 管理**：创建、编辑、测试、打包
- **版本控制**：版本历史与回滚
- **远程市场**：浏览、下载、安装、上传 skills
- **离线支持**：本地缓存已下载的 skills

### OpenCode 插件
- **Skill 管理**：通过 CLI 命令管理本地 skills
- **可用工具**：
  - `skill_list` - 列出所有已安装的 skills
  - `skill_create` - 创建新 skill
  - `skill_delete` - 删除 skill
  - `skill_package` - 打包 skill
  - `skill_info` - 获取 skill 详情

## 快速开始

### VSCode 插件

#### 安装

```bash
code --install-extension cassowary-skillhub-0.0.29.vsix
```

#### 开发环境配置

1. 安装 Node.js 18+
2. 安装依赖：
   ```bash
   npm install
   ```
3. 编译：
   ```bash
   npm run compile
   ```
4. 打包：
   ```bash
   npm run package
   ```

#### 调试

在 VSCode 中按 `F5` 启动调试模式。

### OpenCode 插件

#### 安装

1. 编译 OpenCode 插件：
   ```bash
   npm run compile:opencode
   ```

2. 在 `opencode.json` 中添加插件路径：
   ```json
   {
     "plugin": ["./opencode-plugin/build/plugin.js"]
   }
   ```

   或使用 npm 包（待发布）：
   ```json
   {
     "plugin": ["skillhub-opencode"]
   }
   ```

#### 使用

在 OpenCode 中，Agent 可以直接调用 skill 管理工具：

```
skill_list                          # 列出所有 skills
skill_create({ name: "my-skill" }) # 创建新 skill
skill_info({ name: "my-skill" })    # 查看 skill 详情
skill_delete({ name: "my-skill" })  # 删除 skill
skill_package({ name: "my-skill" }) # 打包 skill
```

## 构建命令

| 命令 | 功能 |
|------|------|
| `npm run compile` | 编译 VSCode 插件 |
| `npm run compile:opencode` | 编译 OpenCode 插件 |
| `npm run compile:all` | 同时编译两者 |
| `npm run package` | 打包 VSCode 插件 |

## VSCode 命令

| 命令 | 功能 |
|------|------|
| cassowary-skillhub.newSkill | 创建新 skill |
| cassowary-skillhub.openMarketplace | 打开市场 |
| cassowary-skillhub.showVersions | 查看版本 |
| cassowary-skillhub.rollbackSkill | 回滚版本 |
| cassowary-skillhub.clearCache | 清除缓存 |
| cassowary-skillhub.showSyncStatus | 查看同步状态 |

## 配置

- 市场 API：`https://api.cassowary-skillhub.example.com`（需配置实际地址）
- 本地路径：`~/.config/opencode/skills/`

## 项目结构

```
src/
├── core/                      # 共享核心逻辑（平台无关）
│   ├── types.ts              # 类型定义
│   ├── logger.ts             # 日志接口
│   ├── config.ts             # 配置抽象
│   └── SkillManager.ts       # Skill 管理
│
├── opencode/                 # OpenCode 插件
│   ├── plugin.ts             # 插件入口
│   └── tools/
│       └── skill-tools.ts     # Custom Tools
│
opencode-plugin/              # OpenCode 插件包
├── package.json
└── build/                    # 编译输出
```
