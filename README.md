# Skillshub

VSCode 插件，提供可视化的 skill 管理界面。

## 功能

- **本地 Skill 管理**：创建、编辑、测试、打包
- **版本控制**：版本历史与回滚
- **远程市场**：浏览、下载、安装、上传 skills
- **离线支持**：本地缓存已下载的 skills

## 快速开始

### 安装

```bash
code --install-extension skillshub-0.0.1.vsix
```

### 开发环境配置

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
   npx vsce package
   ```

### 调试

在 VSCode 中按 `F5` 启动调试模式。

## 命令

| 命令 | 功能 |
|------|------|
| skillshub.createSkill | 创建新 skill |
| skillshub.packageSkill | 打包 skill |
| skillshub.testSkill | 测试 skill |
| skillshub.openMarketplace | 打开市场 |
| skillshub.showVersions | 查看版本 |
| skillshub.rollbackSkill | 回滚版本 |

## 配置

- 市场 API：`https://api.skillshub.example.com`（需配置实际地址）
- 本地路径：`~/.config/opencode/skills/`