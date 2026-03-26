# Skillshub VSCode 插件技术方案

## 一、概述

Skillshub 是一个 VSCode 插件，提供可视化的 skill 管理界面，支持本地 skill 的完整开发周期（生成、编辑、测试、打包、发布）以及远程市场的浏览、下载和上传。

## 二、整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Skillshub VSCode Plugin                  │
├─────────────────────────────────────────────────────────────┤
│  UI Layer                                                   │
│  ├─ Skill Explorer (sidebar)                               │
│  ├─ Marketplace Browser (webview)                          │
│  ├─ Skill Editor (integrated)                              │
│  └─ Commands (command palette)                              │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                      │
│  ├─ SkillManager (本地生命周期管理)                          │
│  ├─ VersionManager (版本管理/回滚)                           │
│  ├─ MarketplaceService (远程API交互)                         │
│  └─ CacheManager (离线缓存)                                  │
├─────────────────────────────────────────────────────────────┤
│  Integration Layer                                         │
│  ├─ OpenCode CLI Adapter                                   │
│  └─ REST API Client                                         │
└─────────────────────────────────────────────────────────────┘
```

## 三、核心功能模块

### 3.1 本地 Skill 管理

| 功能 | 描述 |
|------|------|
| 生成 | 从模板创建新 skill |
| 编辑 | 编辑 SKILL.md、脚本、配置文件 |
| 测试 | 本地运行 skill 验证功能 |
| 打包 | 生成 .zip 格式的 skill 包 |
| 版本管理 | 基于 Git 的版本控制，支持历史回滚 |

### 3.2 远程市场

| 功能 | 描述 |
|------|------|
| 浏览 | 分页展示远程 skills 列表 |
| 搜索 | 按名称/标签搜索 skills |
| 下载 | 下载并安装到本地 |
| 上传 | 发布本地 skill 到市场 |
| 详情 | 查看 skill 描述、评分、作者信息 |

### 3.3 离线支持

- 本地缓存已下载的 skills
- 网络状态指示器
- 离线时提示用户切换到缓存模式

## 四、UI 设计

### 4.1 Skill Explorer（侧边栏）

- 树形结构展示本地 skills
- 右键菜单：打开、测试、打包、版本管理、删除
- 状态指示：已安装、已修改、待发布

### 4.2 Marketplace Browser（Webview）

- 类似书籍商城的卡片式布局
- 筛选器：分类、排序、评分
- 详情弹窗：完整描述、版本历史、用户评价

### 4.3 Command Palette

| 命令 | 说明 |
|------|------|
| `Skillshub: Create New Skill` | 创建新 skill |
| `Skillshub: Test Skill` | 测试当前 skill |
| `Skillshub: Package Skill` | 打包 skill |
| `Skillshub: Publish Skill` | 上传到市场 |
| `Skillshub: Open Marketplace` | 打开市场视图 |
| `Skillshub: Sync` | 同步远程变更 |

### 4.4 状态栏

- 连接状态（在线/离线）
- 当前操作进度
- 认证状态

## 五、数据流设计

```
用户操作 → Command/UI → Business Logic → Integration Layer
                                                      ↓
                                              ┌───────────────┐
                                              │  OpenCode CLI │ (本地操作)
                                              └───────────────┘
                                                      ↓
                                              ┌───────────────┐
                                              │  REST API     │ (远程市场)
                                              └───────────────┘
```

## 六、关键接口设计

### SkillManager

```typescript
interface SkillManager {
  create(name: string, template?: string): Promise<Skill>;
  edit(skillPath: string): void;
  test(skillPath: string): Promise<TestResult>;
  package(skillPath: string): Promise<string>; // 返回 zip 路径
  install(skillPath: string): Promise<void>;
  remove(skillPath: string): Promise<void>;
}
```

### VersionManager

```typescript
interface VersionManager {
  getVersions(skillPath: string): Promise<Version[]>;
  rollback(skillPath: string, versionId: string): Promise<void>;
  getCurrentVersion(skillPath: string): Promise<Version>;
}
```

### MarketplaceService

```typescript
interface MarketplaceService {
  authenticate(token: string): void;
  list(query: SearchQuery, page: number): Promise<ListResult>;
  download(skillId: string): Promise<SkillPackage>;
  upload(package: SkillPackage, metadata: SkillMetadata): Promise<void>;
  getDetail(skillId: string): Promise<SkillDetail>;
}
```

### CacheManager

```typescript
interface CacheManager {
  getCached(skillId: string): Promise<SkillPackage | null>;
  setCached(skillId: string, data: SkillPackage): Promise<void>;
  clearCache(): Promise<void>;
  getSyncStatus(): Promise<SyncStatus>;
}
```

## 七、错误处理

| 场景 | 处理策略 |
|------|----------|
| 网络错误 | 降级到离线模式，提示用户 |
| 打包失败 | 展示详细错误日志，提供调试建议 |
| 认证失效 | 弹出登录窗口，引导重新认证 |
| 版本冲突 | 提供三选一：保留本地/保留远程/合并 |
| 远程服务不可用 | 缓存降级，显示警告 |

## 八、技术选型

- **框架**: VSCode Extension SDK (TypeScript)
- **UI**: Webview + React/Vue
- **HTTP Client**: axios
- **存储**: VSCode Workspace API + 本地文件系统
- **认证**: Token 存储在 VSCode Secret Storage

## 九、非功能性需求

- **性能**: 列表加载 < 1s，界面响应 < 100ms
- **兼容性**: 支持 VSCode 1.80+
- **安全**: Token 不写入配置文件，使用 Secret Storage
- **可扩展**: 模块化设计，便于添加新的市场源

## 十、里程碑

1. **MVP**: 本地 skill 创建、编辑、打包
2. **V1.0**: 远程市场浏览、下载、安装
3. **V1.1**: 版本管理、回滚
4. **V1.2**: 上传发布、离线支持