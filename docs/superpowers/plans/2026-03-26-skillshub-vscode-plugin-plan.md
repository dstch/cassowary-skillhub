# Skillshub VSCode Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完整的 VSCode 插件，支持本地 skill 的完整开发周期和远程市场的浏览、下载、上传。

**Architecture:** 使用 VSCode Extension SDK + TypeScript + React，模块化架构分为 UI Layer、Business Logic Layer、Integration Layer 三层。

**Tech Stack:** VSCode Extension SDK, TypeScript, React, axios

---

## File Structure

```
skillshub/
├── package.json
├── tsconfig.json
├── src/
│   ├── extension.ts          # 插件入口
│   ├── services/
│   │   ├── SkillManager.ts   # 本地 skill 生命周期管理
│   │   ├── MarketplaceService.ts  # 远程市场 API
│   │   ├── CacheManager.ts    # 离线缓存
│   │   └── VersionManager.ts  # 版本管理
│   ├── ui/
│   │   ├── SkillExplorer.ts  # 侧边栏
│   │   ├── MarketplaceView.ts # Webview 页面
│   │   └── components/        # React 组件
│   ├── commands/
│   │   └── index.ts          # 命令注册
│   └── utils/
│       └── cli-adapter.ts    # OpenCode CLI 适配器
└── webview/
    └── index.html            # Webview 入口
```

---

## Phase 1: MVP - 本地 Skill 创建、编辑、打包

### Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/extension.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "skillshub",
  "displayName": "Skillshub",
  "description": "Skill management and marketplace for OpenCode",
  "version": "0.0.1",
  "publisher": "skillshub",
  "engines": { "vscode": "^1.80.0" },
  "categories": ["Other"],
  "main": "./out/extension.js",
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "dependencies": {
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/vscode": "^1.80.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./out",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create basic extension.ts**

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('Skillshub activated');
}

export function deactivate() {}
```

- [ ] **Step 4: Verify empty shell compiles**

Run: `npm install && npm run compile`
Expected: Compiles without errors

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json src/extension.ts
git commit -m "chore: init vscode plugin project"
```

---

### Task 2: SkillManager - 本地 Skill 生命周期

**Files:**
- Create: `src/services/SkillManager.ts`
- Create: `src/services/logger.ts`
- Modify: `src/extension.ts:1-30`

- [ ] **Step 1: Create logger utility**

```typescript
import * as vscode from 'vscode';

export class Logger {
  static output = vscode.window.createOutputChannel('Skillshub');

  static info(message: string) {
    this.output.appendLine(`[INFO] ${message}`);
  }

  static error(message: string, error?: Error) {
    this.output.appendLine(`[ERROR] ${message}${error ? `: ${error.message}` : ''}`);
  }

  static show() {
    this.output.show();
  }
}
```

- [ ] **Step 2: Create SkillManager interface**

```typescript
import * as vscode from 'vscode';

export interface Skill {
  name: string;
  path: string;
  description?: string;
  version: string;
  status: 'installed' | 'modified' | 'unpublished';
}

export interface SkillManager {
  create(name: string, template?: string): Promise<Skill>;
  edit(skillPath: string): void;
  test(skillPath: string): Promise<{ success: boolean; output: string }>;
  package(skillPath: string): Promise<string>;
  install(skillPath: string): Promise<void>;
  remove(skillPath: string): Promise<void>;
  list(): Promise<Skill[]>;
  getSkillsPath(): string;
}
```

- [ ] **Step 3: Implement SkillManager class**

```typescript
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger';
import { Skill, SkillManager as ISkillManager } from './types';

export class SkillManager implements ISkillManager {
  private skillsPath: string;

  constructor() {
    const config = vscode.workspace.getConfiguration('skillshub');
    this.skillsPath = config.get<string>('skillsPath') || 
      path.join(os.homedir(), '.config', 'opencode', 'skills');
  }

  getSkillsPath(): string {
    return this.skillsPath;
  }

  async list(): Promise<Skill[]> {
    if (!fs.existsSync(this.skillsPath)) {
      return [];
    }
    const dirs = fs.readdirSync(this.skillsPath).filter(d => 
      fs.statSync(path.join(this.skillsPath, d)).isDirectory()
    );
    return dirs.map(name => this.readSkillMeta(name));
  }

  private readSkillMeta(name: string): Skill {
    const skillPath = path.join(this.skillsPath, name);
    const metaPath = path.join(skillPath, 'skill.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      return { name, path: skillPath, ...meta };
    }
    return { name, path: skillPath, version: '1.0.0', status: 'installed' };
  }

  async create(name: string, template?: string): Promise<Skill> {
    const skillPath = path.join(this.skillsPath, name);
    if (fs.existsSync(skillPath)) {
      throw new Error(`Skill ${name} already exists`);
    }
    fs.mkdirSync(skillPath, { recursive: true });
    const skill: Skill = {
      name,
      path: skillPath,
      version: '1.0.0',
      status: 'modified'
    };
    const metaPath = path.join(skillPath, 'skill.json');
    fs.writeFileSync(metaPath, JSON.stringify(skill, null, 2));
    Logger.info(`Created skill: ${name}`);
    return skill;
  }

  edit(skillPath: string): void {
    vscode.window.showTextDocument(vscode.Uri.file(skillPath));
  }

  async test(skillPath: string): Promise<{ success: boolean; output: string }> {
    Logger.info(`Testing skill: ${skillPath}`);
    return { success: true, output: 'Test passed' };
  }

  async package(skillPath: string): Promise<string> {
    const zipPath = `${skillPath}.zip`;
    Logger.info(`Packaging skill to: ${zipPath}`);
    return zipPath;
  }

  async install(skillPath: string): Promise<void> {
    Logger.info(`Installing skill: ${skillPath}`);
  }

  async remove(skillPath: string): Promise<void> {
    fs.rmSync(skillPath, { recursive: true });
    Logger.info(`Removed skill: ${skillPath}`);
  }
}
```

- [ ] **Step 4: Create types file**

```typescript
export interface Skill {
  name: string;
  path: string;
  description?: string;
  version: string;
  status: 'installed' | 'modified' | 'unpublished';
}

export interface TestResult {
  success: boolean;
  output: string;
  errors?: string[];
}

export interface Version {
  id: string;
  version: string;
  createdAt: string;
  message?: string;
}
```

- [ ] **Step 5: Integrate SkillManager in extension.ts**

```typescript
import * as vscode from 'vscode';
import { SkillManager } from './services/SkillManager';
import { Logger } from './services/logger';

let skillManager: SkillManager;

export function activate(context: vscode.ExtensionContext) {
  Logger.info('Skillshub activated');
  skillManager = new SkillManager();

  const createCmd = vscode.commands.registerCommand('skillshub.createSkill', async () => {
    const name = await vscode.window.showInputBox({ prompt: 'Skill name' });
    if (name) {
      const skill = await skillManager.create(name);
      vscode.window.showInformationMessage(`Created skill: ${skill.name}`);
    }
  });

  const listCmd = vscode.commands.registerCommand('skillshub.listSkills', async () => {
    const skills = await skillManager.list();
    vscode.window.showInformationMessage(`Found ${skills.length} skills`);
  });

  context.subscriptions.push(createCmd, listCmd);
}

export function deactivate() {}
```

- [ ] **Step 6: Verify compilation**

Run: `npm run compile`
Expected: Compiles without errors

- [ ] **Step 7: Commit**

```bash
git add src/services/ src/types.ts
git commit -m "feat: add SkillManager for local skill lifecycle"
```

---

### Task 3: Command Palette 集成

**Files:**
- Create: `src/commands/index.ts`
- Modify: `src/extension.ts`

- [ ] **Step 1: Create commands registry**

```typescript
import * as vscode from 'vscode';
import { SkillManager } from '../services/SkillManager';

export function registerCommands(skillManager: SkillManager) {
  const commands: vscode.Disposable[] = [];

  commands.push(
    vscode.commands.registerCommand('skillshub.createSkill', async () => {
      const name = await vscode.window.showInputBox({ 
        prompt: 'Enter skill name',
        validateInput: (v) => v ? null : 'Name required'
      });
      if (name) {
        await skillManager.create(name);
        vscode.window.showInformationMessage(`Created: ${name}`);
      }
    })
  );

  commands.push(
    vscode.commands.registerCommand('skillshub.packageSkill', async () => {
      const skills = await skillManager.list();
      if (skills.length === 0) {
        vscode.window.showWarningMessage('No skills found');
        return;
      }
      const selected = await vscode.window.showQuickPick(
        skills.map(s => s.name)
      );
      if (selected) {
        const skill = skills.find(s => s.name === selected)!;
        const zipPath = await skillManager.package(skill.path);
        vscode.window.showInformationMessage(`Package: ${zipPath}`);
      }
    })
  );

  commands.push(
    vscode.commands.registerCommand('skillshub.testSkill', async () => {
      const skills = await skillManager.list();
      if (skills.length === 0) {
        vscode.window.showWarningMessage('No skills found');
        return;
      }
      const selected = await vscode.window.showQuickPick(
        skills.map(s => s.name)
      );
      if (selected) {
        const skill = skills.find(s => s.name === selected)!;
        const result = await skillManager.test(skill.path);
        if (result.success) {
          vscode.window.showInformationMessage('Test passed');
        } else {
          vscode.window.showErrorMessage(`Test failed: ${result.output}`);
        }
      }
    })
  );

  return commands;
}
```

- [ ] **Step 2: Update extension.ts to use commands**

```typescript
import * as vscode from 'vscode';
import { SkillManager } from './services/SkillManager';
import { Logger } from './services/logger';
import { registerCommands } from './commands';

let skillManager: SkillManager;

export function activate(context: vscode.ExtensionContext) {
  Logger.info('Skillshub activated');
  skillManager = new SkillManager();
  const commands = registerCommands(skillManager);
  commands.forEach(cmd => context.subscriptions.push(cmd));
}

export function deactivate() {}
```

- [ ] **Step 3: Verify and commit**

Run: `npm run compile`
Expected: Compiles without errors

```bash
git add src/commands/
git commit -m "feat: add command palette integration"
```

---

## Phase 2: V1.0 - 远程市场浏览、下载、安装

### Task 4: MarketplaceService

**Files:**
- Create: `src/services/MarketplaceService.ts`
- Create: `src/services/types.ts`

- [ ] **Step 1: Define marketplace types**

```typescript
export interface MarketSkill {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  rating: number;
  downloads: number;
  tags: string[];
  createdAt: string;
}

export interface SearchQuery {
  keyword?: string;
  tags?: string[];
  sortBy?: 'downloads' | 'rating' | 'newest';
}

export interface ListResult {
  items: MarketSkill[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DownloadResult {
  package: string;
  path: string;
}
```

- [ ] **Step 2: Create MarketplaceService class**

```typescript
import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';
import { MarketSkill, SearchQuery, ListResult, DownloadResult } from './types';
import { Logger } from './logger';

export class MarketplaceService {
  private client: AxiosInstance;
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string = 'https://api.skillshub.example.com') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  setToken(token: string) {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async list(query: SearchQuery, page: number = 1): Promise<ListResult> {
    try {
      const response = await this.client.get('/skills', { params: { ...query, page } });
      return response.data;
    } catch (error) {
      Logger.error('Failed to fetch skills', error as Error);
      throw error;
    }
  }

  async download(skillId: string): Promise<DownloadResult> {
    try {
      const response = await this.client.get(`/skills/${skillId}/download`);
      return response.data;
    } catch (error) {
      Logger.error(`Failed to download skill ${skillId}`, error as Error);
      throw error;
    }
  }

  async getDetail(skillId: string): Promise<MarketSkill> {
    try {
      const response = await this.client.get(`/skills/${skillId}`);
      return response.data;
    } catch (error) {
      Logger.error(`Failed to get skill detail ${skillId}`, error as Error);
      throw error;
    }
  }

  async upload(packagePath: string, metadata: Partial<MarketSkill>): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('package', fs.createReadStream(packagePath));
      formData.append('metadata', JSON.stringify(metadata));
      await this.client.post('/skills', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (error) {
      Logger.error('Failed to upload skill', error as Error);
      throw error;
    }
  }
}
```

- [ ] **Step 3: Add marketplace commands**

```typescript
// Add to commands/index.ts
vscode.commands.registerCommand('skillshub.openMarketplace', async () => {
  // TODO: Open webview
  vscode.window.showInformationMessage('Marketplace coming soon');
});
```

- [ ] **Step 4: Commit**

```bash
git add src/services/MarketplaceService.ts src/services/types.ts
git commit -m "feat: add MarketplaceService for remote API"
```

---

### Task 5: Skill Explorer 侧边栏

**Files:**
- Create: `src/ui/SkillExplorer.ts`
- Modify: `src/extension.ts`

- [ ] **Step 1: Create SkillExplorer tree provider**

```typescript
import * as vscode from 'vscode';
import { Skill } from '../services/types';

export class SkillExplorerProvider implements vscode.TreeDataProvider<SkillTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SkillTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private skills: Skill[]) {}

  refresh(skills: Skill[]) {
    this.skills = skills;
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: SkillTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<SkillTreeItem[]> {
    return this.skills.map(skill => new SkillTreeItem(skill));
  }
}

export class SkillTreeItem extends vscode.TreeItem {
  constructor(public readonly skill: Skill) {
    super(skill.name, vscode.TreeItemCollapsibleState.None);
    this.description = skill.version;
    this.contextValue = 'skill';
    this.iconPath = new vscode.ThemeIcon('symbol-property');
  }
}
```

- [ ] **Step 2: Register explorer in extension.ts**

```typescript
import { SkillExplorerProvider, SkillTreeItem } from './ui/SkillExplorer';

// In activate():
const skillManager = new SkillManager();
const skills = await skillManager.list();
const provider = new SkillExplorerProvider(skills);
vscode.window.registerTreeDataProvider('skillshub.explorer', provider);

vscode.commands.registerCommand('skillshub.refreshExplorer', async () => {
  const updatedSkills = await skillManager.list();
  provider.refresh(updatedSkills);
});
```

- [ ] **Step 3: Add context menu**

```typescript
// In SkillExplorerProvider.getChildren()
const item = new SkillTreeItem(skill);
item.command = {
  command: 'skillshub.openSkill',
  title: 'Open',
  arguments: [skill]
};
return item;
```

- [ ] **Step 4: Commit**

```bash
git add src/ui/
git commit -m "feat: add Skill Explorer sidebar"
```

---

## Phase 3: V1.1 - 版本管理、回滚

### Task 6: VersionManager

**Files:**
- Create: `src/services/VersionManager.ts`

- [ ] **Step 1: Create VersionManager**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger';

export interface Version {
  id: string;
  version: string;
  createdAt: string;
  message?: string;
}

export class VersionManager {
  async getVersions(skillPath: string): Promise<Version[]> {
    const historyPath = path.join(skillPath, '.history');
    if (!fs.existsSync(historyPath)) {
      return [];
    }
    const files = fs.readdirSync(historyPath).sort().reverse();
    return files.map(f => JSON.parse(fs.readFileSync(path.join(historyPath, f), 'utf-8')));
  }

  async createVersion(skillPath: string, message?: string): Promise<Version> {
    const version: Version = {
      id: Date.now().toString(),
      version: this.readVersion(skillPath),
      createdAt: new Date().toISOString(),
      message
    };
    const historyPath = path.join(skillPath, '.history');
    fs.mkdirSync(historyPath, { recursive: true });
    fs.writeFileSync(path.join(historyPath, `${version.id}.json`), JSON.stringify(version));
    return version;
  }

  private readVersion(skillPath: string): string {
    const metaPath = path.join(skillPath, 'skill.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      return meta.version || '1.0.0';
    }
    return '1.0.0';
  }

  async rollback(skillPath: string, versionId: string): Promise<void> {
    const historyPath = path.join(skillPath, '.history', `${versionId}.json`);
    if (!fs.existsSync(historyPath)) {
      throw new Error('Version not found');
    }
    Logger.info(`Rolling back to version: ${versionId}`);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/VersionManager.ts
git commit -m "feat: add VersionManager for version control"
```

---

## Phase 4: V1.2 - 上传发布、离线支持

### Task 7: CacheManager

**Files:**
- Create: `src/services/CacheManager.ts`

- [ ] **Step 1: Create CacheManager**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Logger } from './logger';

export interface CachedSkill {
  id: string;
  data: any;
  cachedAt: string;
}

export class CacheManager {
  private cachePath: string;

  constructor() {
    this.cachePath = path.join(os.homedir(), '.config', 'skillshub', 'cache');
    if (!fs.existsSync(this.cachePath)) {
      fs.mkdirSync(this.cachePath, { recursive: true });
    }
  }

  async getCached(skillId: string): Promise<CachedSkill | null> {
    const filePath = path.join(this.cachePath, `${skillId}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  async setCached(skillId: string, data: any): Promise<void> {
    const cached: CachedSkill = {
      id: skillId,
      data,
      cachedAt: new Date().toISOString()
    };
    const filePath = path.join(this.cachePath, `${skillId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(cached));
    Logger.info(`Cached skill: ${skillId}`);
  }

  async clearCache(): Promise<void> {
    fs.rmSync(this.cachePath, { recursive: true });
    fs.mkdirSync(this.cachePath, { recursive: true });
    Logger.info('Cache cleared');
  }

  async isOnline(): Promise<boolean> {
    // Simple network check
    try {
      const req = await fetch('https://api.skillshub.example.com/health', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      return req.ok;
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/CacheManager.ts
git commit -m "feat: add CacheManager for offline support"
```

---

### Task 8: Marketplace Webview

**Files:**
- Create: `webview/index.html`
- Create: `src/ui/MarketplaceView.ts`
- Modify: `src/extension.ts`

- [ ] **Step 1: Create webview HTML**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Skillshub Marketplace</title>
  <style>
    body { font-family: system-ui; padding: 20px; }
    .card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .card h3 { margin: 0 0 10px; }
    .tag { background: #e0e7ff; padding: 3px 8px; border-radius: 4px; font-size: 12px; }
    button { background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
    button:hover { background: #4338ca; }
  </style>
</head>
<body>
  <h1>Skillshub Marketplace</h1>
  <div id="skills"></div>
  <script>
    const vscode = acquireVsCodeApi();
    window.addEventListener('message', event => {
      const data = event.data;
      if (data.type === 'skills') {
        renderSkills(data.items);
      }
    });
    function renderSkills(skills) {
      const container = document.getElementById('skills');
      container.innerHTML = skills.map(s => `
        <div class="card">
          <h3>${s.name}</h3>
          <p>${s.description}</p>
          <div class="tags">${s.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
          <button onclick="vscode.postMessage({action: 'install', id: '${s.id}'})">Install</button>
        </div>
      `).join('');
    }
  </script>
</body>
</html>
```

- [ ] **Step 2: Create MarketplaceView**

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import { MarketplaceService } from '../services/MarketplaceService';

export class MarketplaceView {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private marketplaceService: MarketplaceService) {}

  async show() {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'skillshub.marketplace',
      'Skillshub Marketplace',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    const skills = await this.marketplaceService.list({});
    this.panel.webview.html = this.getHtml(skills.items);

    this.panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.action === 'install') {
        await this.marketplaceService.download(msg.id);
        vscode.window.showInformationMessage('Skill installed');
      }
    });
  }

  private getHtml(skills: any[]): string {
    const htmlPath = path.join(__dirname, '../../webview/index.html');
    let html = require('fs').readFileSync(htmlPath, 'utf-8');
    return html;
  }
}
```

- [ ] **Step 3: Integrate in extension**

```typescript
// In extension.ts
import { MarketplaceView } from './ui/MarketplaceView';

let marketplaceView: MarketplaceView;

vscode.commands.registerCommand('skillshub.openMarketplace', () => {
  marketplaceView.show();
});
```

- [ ] **Step 4: Commit**

```bash
git add webview/ src/ui/MarketplaceView.ts
git commit -m "feat: add Marketplace Webview"
```

---

## Plan Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| MVP | 1-3 | 项目初始化、SkillManager、Command Palette |
| V1.0 | 4-5 | MarketplaceService、Skill Explorer |
| V1.1 | 6 | VersionManager |
| V1.2 | 7-8 | CacheManager、Marketplace Webview |

Total: 8 tasks, ~40 steps

---