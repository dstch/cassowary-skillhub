# OpenCode 插件支持开发记录

## 当前进度

### 已完成

#### 1. 核心架构重构
- [x] `src/core/types.ts` - 共享类型定义（Skill, Version, PlatformConfig 等）
- [x] `src/core/logger.ts` - Logger 接口 + ConsoleLogger + OpenCodeLogger
- [x] `src/core/config.ts` - 平台配置抽象
- [x] `src/core/SkillManager.ts` - 平台无关的 Skill 管理核心逻辑

#### 2. OpenCode 插件实现
- [x] `src/opencode/plugin.ts` - 插件入口
- [x] `src/opencode/tools/skill-tools.ts` - 5 个 Custom Tools
- [x] `opencode-plugin/package.json` - 插件包配置
- [x] `opencode-plugin/tsconfig.json` - TypeScript 配置
- [x] `scripts/build-opencode.js` - esbuild 编译脚本

#### 3. Custom Tools
| 工具 | 状态 | 描述 |
|------|------|------|
| `skill_list` | ✅ | 列出所有已安装的 skills |
| `skill_create` | ✅ | 创建新 skill |
| `skill_delete` | ✅ | 删除 skill |
| `skill_package` | ✅ | 打包 skill |
| `skill_info` | ✅ | 获取 skill 详情 |

#### 4. 构建和文档
- [x] `package.json` - 添加 `compile:opencode` 和 `compile:all` 脚本
- [x] README 更新 - 包含 OpenCode 插件使用说明
- [x] 设计文档 `docs/superpowers/specs/2026-03-28-skillhub-opencode-plugin-design.md`
- [x] 实现计划 `docs/superpowers/plans/2026-03-28-skillhub-opencode-plugin-implementation-plan.md`

---

## 后续任务

### 阶段一：基础功能增强
- [ ] **Marketplace Tools** - 实现市场浏览、搜索、下载、上传工具
- [ ] **TemplateEngine 集成** - 支持从模板创建 skill
- [ ] **VersionManager 集成** - 支持版本管理和回滚

### 阶段二：用户体验优化
- [ ] **交互式创建流程** - 通过 TUI 交互式创建 skill
- [ ] **进度反馈** - 长时间操作的进度显示
- [ ] **错误处理增强** - 更友好的错误提示

### 阶段三：生态集成
- [ ] **发布到 npm** - 将 `skillhub-opencode` 发布到 npm registry
- [ ] **MarketplaceService 重构** - 适配 OpenCode 环境
- [ ] **离线缓存支持** - OpenCode 环境下的离线功能

---

## 使用方式

### 编译 OpenCode 插件
```bash
npm run compile:opencode
```

### 在 OpenCode 中使用
```bash
# 在 opencode.json 中配置
{
  "plugin": ["./opencode-plugin/build/plugin.js"]
}

# 或使用 npm 包（待发布）
{
  "plugin": ["skillhub-opencode"]
}
```

### 可用命令
```
skill_list                           # 列出 skills
skill_create({ name: "my-skill" })  # 创建 skill
skill_info({ name: "my-skill" })     # 查看详情
skill_delete({ name: "my-skill" })  # 删除 skill
skill_package({ name: "my-skill" })  # 打包 skill
```

---

## 技术笔记

### 架构分层
```
src/
├── core/           # 平台无关业务逻辑
├── opencode/       # OpenCode 插件入口
└── (existing)      # VSCode 插件保持独立

opencode-plugin/    # 独立构建的 OpenCode 插件包
```

### 构建产物
- `opencode-plugin/build/plugin.js` - OpenCode 插件主文件
- `@opencode-ai/plugin` 类型用于 TypeScript 开发
- esbuild 会将 `@opencode-ai/plugin` 标记为 external（由运行时提供）

---

## 相关文档

- 设计文档: `docs/superpowers/specs/2026-03-28-skillhub-opencode-plugin-design.md`
- 实现计划: `docs/superpowers/plans/2026-03-28-skillhub-opencode-plugin-implementation-plan.md`
- README: `README.md`
