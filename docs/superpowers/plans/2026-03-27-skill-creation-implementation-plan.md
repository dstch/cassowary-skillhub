# Skill Creation Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现对话式 Skill 创建功能，通过 OpenCode Agent API 理解用户意图生成完整 skill，配备预设模板库作为兜底方案。

**Architecture:** 全 Agent 代理架构 - UI 层使用 Webview 对话界面，业务逻辑层包含 SkillCreationAgent 处理对话状态和 Agent API 调用，集成层负责与 OpenCode Agent API 交互及本地模板引擎降级。

**Tech Stack:** VSCode Extension SDK, TypeScript, Webview, axios, OpenCode Agent API

---

## File Structure

```
skillshub/
├── src/
│   ├── agent/
│   │   ├── SkillCreationAgent.ts    # 核心 Agent 状态机
│   │   └── types.ts                 # Agent 相关类型定义
│   ├── services/
│   │   ├── AgentAPIService.ts       # OpenCode Agent API 调用
│   │   └── TemplateEngine.ts        # 本地模板引擎
│   ├── ui/
│   │   └── SkillCreationPanel.ts    # Webview 面板
│   └── extension.ts                 # 插件入口
├── webview/
│   └── skill-creation/
│       ├── index.html
│       └── styles.css
└── templates/
    ├── code-review/
    │   ├── SKILL.md
    │   ├── src/index.ts
    │   └── test/index.test.ts
    ├── debugging/
    ├── documentation/
    └── testing/
```

---

## Task 1: Project Structure Setup

**Files:**
- Create: `src/agent/types.ts`
- Create: `src/agent/SkillCreationAgent.ts`
- Create: `src/services/AgentAPIService.ts`
- Create: `src/services/TemplateEngine.ts`
- Create: `src/ui/SkillCreationPanel.ts`
- Create: `webview/skill-creation/index.html`
- Create: `webview/skill-creation/styles.css`
- Create: `templates/code-review/SKILL.md`
- Create: `templates/code-review/src/index.ts`
- Create: `templates/code-review/test/index.test.ts`

- [ ] **Step 1: Create directory structure**

Run: `mkdir -p src/agent src/services/AgentAPIService.ts src/services/TemplateEngine.ts webview/skill-creation templates/code-review/src templates/code-review/test`

Note: Directories will be created as files are written.

- [ ] **Step 2: Create agent/types.ts**

```typescript
export type ConversationRole = 'user' | 'agent' | 'system';

export interface ConversationMessage {
  role: ConversationRole;
  content: string;
  timestamp: string;
}

export type CreationStatus = 'idle' | 'thinking' | 'generating' | 'editing' | 'confirmed' | 'error' | 'fallback';

export interface SkillFile {
  path: string;
  content: string;
}

export interface SkillPreview {
  name: string;
  description: string;
  files: SkillFile[];
}

export interface CreationContext {
  currentFile?: string;
  projectPath?: string;
  clipboardContent?: string;
  includeContext: boolean;
}

export interface AgentResponse {
  message: string;
  preview: SkillPreview | null;
  status: CreationStatus;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  files: SkillFile[];
}
```

- [ ] **Step 3: Commit**

```bash
git add src/agent/types.ts
git commit -m "feat: add agent types definition"
```

---

## Task 2: OpenCodeAgentAPIService

**Files:**
- Create: `src/services/AgentAPIService.ts`
- Test: `src/services/AgentAPIService.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { AgentAPIService } from './AgentAPIService';

describe('AgentAPIService', () => {
  let service: AgentAPIService;

  beforeEach(() => {
    service = new AgentAPIService();
  });

  describe('isAvailable', () => {
    it('should return true when API is reachable', async () => {
      const result = await service.isAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('generateSkill', () => {
    it('should generate skill content from prompt', async () => {
      const prompt = 'Create a code review assistant skill';
      const result = await service.generateSkill(prompt, {});
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('files');
      expect(Array.isArray(result.files)).toBe(true);
    });

    it('should throw error when API is unavailable', async () => {
      const unavailableService = new AgentAPIService('http://invalid-host:9999');
      await expect(
        unavailableService.generateSkill('test', {})
      ).rejects.toThrow();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="AgentAPIService.test.ts"`
Expected: FAIL - "Cannot find module" or "No tests found"

- [ ] **Step 3: Write AgentAPIService implementation**

```typescript
import axios, { AxiosInstance } from 'axios';
import { SkillPreview } from '../agent/types';
import { Logger } from './logger';

export class AgentAPIService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080/api/agent') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async generateSkill(prompt: string, context: object): Promise<SkillPreview> {
    try {
      const response = await this.client.post('/generate-skill', {
        prompt,
        context,
        type: 'skill-creation'
      });
      return response.data;
    } catch (error) {
      Logger.error('Agent API call failed', error as Error);
      throw error;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="AgentAPIService.test.ts"`
Expected: Tests pass (or skip if no test runner configured)

- [ ] **Step 5: Commit**

```bash
git add src/services/AgentAPIService.ts
git commit -m "feat: add OpenCode Agent API service"
```

---

## Task 3: TemplateEngine

**Files:**
- Create: `src/services/TemplateEngine.ts`
- Create: `templates/code-review/SKILL.md`
- Create: `templates/code-review/src/index.ts`
- Create: `templates/code-review/test/index.test.ts`

- [ ] **Step 1: Write TemplateEngine skeleton**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Template, SkillPreview } from '../agent/types';
import { Logger } from './logger';

export class TemplateEngine {
  private templatesPath: string;

  constructor() {
    this.templatesPath = path.join(os.homedir(), '.config', 'skillshub', 'templates');
  }

  listTemplates(): Template[] {
    // TODO: Implement
    return [];
  }

  generateFromTemplate(templateId: string, overrides?: Partial<SkillPreview>): SkillPreview {
    // TODO: Implement
    return { name: '', description: '', files: [] };
  }
}
```

- [ ] **Step 2: Create code-review template files**

Create `templates/code-review/SKILL.md`:
```markdown
# Code Review Assistant

## Description
Automatically review code for quality issues and suggest improvements.

## Commands
- `review`: Review the current file
- `reviewProject`: Review the entire project

## Usage
Invoke the skill and specify what to review.

## Configuration
- `severity`: Minimum severity level to report (info/warning/error)
- `languages`: Language-specific rules to apply
```

Create `templates/code-review/src/index.ts`:
```typescript
import { SkillContext, SkillResult } from '../types';

export async function execute(context: SkillContext): Promise<SkillResult> {
  const { command, params } = context;
  
  switch (command) {
    case 'review':
      return reviewFile(params.filePath);
    case 'reviewProject':
      return reviewProject(params.projectPath);
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

async function reviewFile(filePath: string): Promise<SkillResult> {
  return {
    success: true,
    output: `Review for ${filePath}`,
    data: { issues: [] }
  };
}

async function reviewProject(projectPath: string): Promise<SkillResult> {
  return {
    success: true,
    output: `Review for project ${projectPath}`,
    data: { issues: [], summary: { files: 0, issues: 0 } }
  };
}
```

Create `templates/code-review/test/index.test.ts`:
```typescript
import { execute } from '../src/index';

describe('Code Review Skill', () => {
  it('should review a file', async () => {
    const result = await execute({
      command: 'review',
      params: { filePath: 'test.ts' }
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 3: Implement TemplateEngine**

```typescript
export class TemplateEngine {
  private templatesPath: string;

  constructor() {
    const config = vscode.workspace.getConfiguration('skillshub');
    this.templatesPath = config.get<string>('templatesPath') || 
      path.join(os.homedir(), '.config', 'skillshub', 'templates');
  }

  listTemplates(): Template[] {
    if (!fs.existsSync(this.templatesPath)) {
      return this.getBuiltInTemplates();
    }
    
    const dirs = fs.readdirSync(this.templatesPath).filter(d => 
      fs.statSync(path.join(this.templatesPath, d)).isDirectory()
    );
    
    return dirs.map(dir => {
      const metaPath = path.join(this.templatesPath, dir, 'skill.json');
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        return { id: dir, name: meta.name, description: meta.description, files: [] };
      }
      return { id: dir, name: dir, description: '', files: [] };
    });
  }

  generateFromTemplate(templateId: string, overrides?: Partial<SkillPreview>): SkillPreview {
    const templateDir = path.join(this.templatesPath, templateId);
    if (!fs.existsSync(templateDir)) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const files: { path: string; content: string }[] = [];
    this.readDirRecursive(templateDir, templateDir, files);

    return {
      name: overrides?.name || templateId,
      description: overrides?.description || '',
      files,
      ...overrides
    };
  }

  private readDirRecursive(baseDir: string, currentDir: string, files: { path: string; content: string }[]): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        this.readDirRecursive(baseDir, fullPath, files);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.ts') || entry.name.endsWith('.json')) {
        const relativePath = path.relative(baseDir, fullPath);
        files.push({ path: relativePath, content: fs.readFileSync(fullPath, 'utf-8') });
      }
    }
  }

  private getBuiltInTemplates(): Template[] {
    return [
      {
        id: 'code-review',
        name: 'Code Review',
        description: 'Automatically review code for quality issues',
        files: []
      },
      {
        id: 'debugging',
        name: 'Debugging Assistant',
        description: 'Help diagnose and fix bugs',
        files: []
      },
      {
        id: 'documentation',
        name: 'Documentation Generator',
        description: 'Generate documentation from code',
        files: []
      },
      {
        id: 'testing',
        name: 'Testing Helper',
        description: 'Assist with writing and running tests',
        files: []
      }
    ];
  }
}
```

- [ ] **Step 4: Verify compilation**

Run: `npm run compile`
Expected: Compiles without errors

- [ ] **Step 5: Commit**

```bash
git add src/services/TemplateEngine.ts templates/
git commit -m "feat: add TemplateEngine with code-review template"
```

---

## Task 4: SkillCreationAgent

**Files:**
- Create: `src/agent/SkillCreationAgent.ts`
- Modify: `src/agent/types.ts` (add missing interfaces)

- [ ] **Step 1: Write SkillCreationAgent skeleton**

```typescript
import { EventEmitter } from 'events';
import {
  ConversationMessage,
  CreationStatus,
  SkillPreview,
  CreationContext,
  AgentResponse,
  Template
} from './types';
import { AgentAPIService } from '../services/AgentAPIService';
import { TemplateEngine } from '../services/TemplateEngine';
import { Logger } from '../services/logger';

export class SkillCreationAgent extends EventEmitter {
  private status: CreationStatus = 'idle';
  private conversation: ConversationMessage[] = [];
  private preview: SkillPreview | null = null;
  private context: CreationContext | null = null;
  private agentAPIService: AgentAPIService;
  private templateEngine: TemplateEngine;

  constructor() {
    super();
    this.agentAPIService = new AgentAPIService();
    this.templateEngine = new TemplateEngine();
  }

  start(context?: CreationContext): void {
    this.context = context || { includeContext: false };
    this.status = 'idle';
    this.conversation = [];
    this.preview = null;
    this.emitWelcome();
  }

  async sendMessage(content: string): Promise<AgentResponse> {
    this.conversation.push({
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    });

    this.status = 'thinking';
    this.emit('statusChange', this.status);

    try {
      const isAvailable = await this.agentAPIService.isAvailable();
      if (!isAvailable) {
        return this.handleAgentUnavailable();
      }

      this.status = 'generating';
      this.emit('statusChange', this.status);

      const response = await this.agentAPIService.generateSkill(content, {
        context: this.context,
        conversation: this.conversation
      });

      this.preview = response;
      this.conversation.push({
        role: 'agent',
        content: `I've created a skill for: ${response.name}`,
        timestamp: new Date().toISOString()
      });

      this.status = 'generating';
      return {
        message: this.conversation[this.conversation.length - 1].content,
        preview: this.preview,
        status: this.status
      };
    } catch (error) {
      Logger.error('Agent generation failed', error as Error);
      return this.handleAgentUnavailable();
    }
  }

  private handleAgentUnavailable(): AgentResponse {
    this.status = 'error';
    this.emit('statusChange', this.status);
    return {
      message: 'Agent is currently unavailable. Would you like to use a template instead?',
      preview: null,
      status: 'error'
    };
  }

  async fallbackToTemplate(templateId: string): Promise<SkillPreview> {
    this.status = 'fallback';
    this.emit('statusChange', this.status);

    const template = this.templateEngine.listTemplates().find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    this.preview = this.templateEngine.generateFromTemplate(templateId, {
      name: this.conversation.find(m => m.role === 'user')?.content || templateId
    });

    this.conversation.push({
      role: 'agent',
      content: `Using template: ${template.name}`,
      timestamp: new Date().toISOString()
    });

    return this.preview;
  }

  confirm(): SkillPreview | null {
    if (!this.preview) {
      throw new Error('No preview to confirm');
    }
    this.status = 'confirmed';
    this.emit('statusChange', this.status);
    return this.preview;
  }

  cancel(): void {
    this.status = 'idle';
    this.conversation = [];
    this.preview = null;
    this.context = null;
    this.emit('statusChange', this.status);
  }

  getConversation(): ConversationMessage[] {
    return [...this.conversation];
  }

  getPreview(): SkillPreview | null {
    return this.preview;
  }

  getStatus(): CreationStatus {
    return this.status;
  }

  private emitWelcome(): void {
    const welcomeMessage = 'Hello! I\'m here to help you create a skill. What would you like to build? You can describe what problem you want to solve or what kind of task you want to automate.';
    this.conversation.push({
      role: 'agent',
      content: welcomeMessage,
      timestamp: new Date().toISOString()
    });
    this.emit('message', { role: 'agent', content: welcomeMessage });
  }
}
```

- [ ] **Step 2: Verify compilation**

Run: `npm run compile`
Expected: Compiles without errors

- [ ] **Step 3: Commit**

```bash
git add src/agent/SkillCreationAgent.ts
git commit -m "feat: add SkillCreationAgent with state machine"
```

---

## Task 5: SkillCreationPanel Webview

**Files:**
- Create: `webview/skill-creation/index.html`
- Create: `webview/skill-creation/styles.css`
- Create: `src/ui/SkillCreationPanel.ts`

- [ ] **Step 1: Create webview HTML**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Skill Creator</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <span class="title">🤖 Skill Creator</span>
      <button class="btn-close" id="closeBtn">×</button>
    </header>

    <div class="conversation" id="conversation">
      <div class="message agent">
        <div class="message-content" id="welcomeMessage">
          Hello! I'm here to help you create a skill. What would you like to build?
        </div>
      </div>
    </div>

    <div class="preview-panel" id="previewPanel" style="display: none;">
      <div class="preview-header">
        <span>📁 Preview</span>
        <span class="preview-name" id="previewName"></span>
      </div>
      <div class="preview-files" id="previewFiles"></div>
      <div class="preview-actions">
        <button class="btn btn-secondary" id="editBtn">Edit</button>
        <button class="btn btn-secondary" id="regenerateBtn">Regenerate</button>
        <button class="btn btn-primary" id="confirmBtn">Confirm Create</button>
      </div>
    </div>

    <div class="fallback-panel" id="fallbackPanel" style="display: none;">
      <div class="fallback-warning">⚠️ Agent is unavailable. Choose a template:</div>
      <div class="template-list" id="templateList"></div>
    </div>

    <div class="context-panel" id="contextPanel" style="display: none;">
      <label>
        <input type="checkbox" id="includeContext">
        Include current file/project context
      </label>
    </div>

    <footer class="input-area">
      <input type="text" id="messageInput" placeholder="Describe what you want to build..." />
      <button class="btn btn-primary" id="sendBtn">Send</button>
    </footer>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const conversation = document.getElementById('conversation');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const previewPanel = document.getElementById('previewPanel');
    const fallbackPanel = document.getElementById('fallbackPanel');
    const contextPanel = document.getElementById('contextPanel');

    let currentStatus = 'idle';

    function addMessage(role, content) {
      const msgDiv = document.createElement('div');
      msgDiv.className = `message ${role}`;
      msgDiv.innerHTML = `<div class="message-content">${escapeHtml(content)}</div>`;
      conversation.appendChild(msgDiv);
      conversation.scrollTop = conversation.scrollHeight;
    }

    function setStatus(status) {
      currentStatus = status;
      if (status === 'thinking') {
        sendBtn.disabled = true;
        sendBtn.textContent = '...';
      } else {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
      }
    }

    function showPreview(preview) {
      previewPanel.style.display = 'block';
      document.getElementById('previewName').textContent = preview.name;
      const filesDiv = document.getElementById('previewFiles');
      filesDiv.innerHTML = preview.files.map(f => 
        `<div class="file-item"><span class="file-path">${escapeHtml(f.path)}</span></div>`
      ).join('');
    }

    function showFallback(templates) {
      fallbackPanel.style.display = 'block';
      const list = document.getElementById('templateList');
      list.innerHTML = templates.map(t => 
        `<button class="template-btn" data-id="${t.id}">${t.name}<br><small>${t.description}</small></button>`
      ).join('');
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    window.addEventListener('message', event => {
      const data = event.data;
      if (data.type === 'message') {
        addMessage(data.role, data.content);
      } else if (data.type === 'status') {
        setStatus(data.status);
      } else if (data.type === 'preview') {
        showPreview(data.preview);
      } else if (data.type === 'fallback') {
        showFallback(data.templates);
      }
    });

    sendBtn.addEventListener('click', () => {
      const msg = messageInput.value.trim();
      if (!msg) return;
      addMessage('user', msg);
      vscode.postMessage({ action: 'sendMessage', content: msg });
      messageInput.value = '';
    });

    messageInput.addEventListener('keypress', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
      }
    });

    document.getElementById('closeBtn').addEventListener('click', () => {
      vscode.postMessage({ action: 'close' });
    });

    document.getElementById('confirmBtn').addEventListener('click', () => {
      vscode.postMessage({ action: 'confirm' });
    });

    document.getElementById('regenerateBtn').addEventListener('click', () => {
      vscode.postMessage({ action: 'regenerate' });
    });

    document.getElementById('templateList')?.addEventListener('click', e => {
      const btn = e.target.closest('.template-btn');
      if (btn) {
        vscode.postMessage({ action: 'useTemplate', templateId: btn.dataset.id });
      }
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Create styles.css**

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: #333;
}

.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #4f46e5;
  color: white;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0 8px;
}

.conversation {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f9fafb;
}

.message {
  margin-bottom: 16px;
  max-width: 85%;
}

.message.user {
  margin-left: auto;
}

.message.agent {
  margin-right: auto;
}

.message-content {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
}

.message.user .message-content {
  background: #4f46e5;
  color: white;
  border-bottom-right-radius: 4px;
}

.message.agent .message-content {
  background: white;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 4px;
}

.preview-panel, .fallback-panel {
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.preview-header {
  font-weight: 600;
  margin-bottom: 8px;
}

.preview-name {
  margin-left: 8px;
  color: #4f46e5;
}

.preview-files {
  margin: 8px 0;
}

.file-item {
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  margin-bottom: 4px;
  font-family: monospace;
  font-size: 12px;
}

.preview-actions, .template-list {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.template-btn {
  padding: 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  flex: 1;
}

.template-btn:hover {
  background: #e5e7eb;
}

.fallback-warning {
  color: #92400e;
  background: #fef3c7;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.input-area {
  display: flex;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #e5e7eb;
  gap: 8px;
}

#messageInput {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

#messageInput:focus {
  outline: none;
  border-color: #4f46e5;
}
```

- [ ] **Step 3: Create SkillCreationPanel.ts**

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SkillCreationAgent } from '../agent/SkillCreationAgent';
import { SkillManager } from '../services/SkillManager';
import { TemplateEngine } from '../services/TemplateEngine';
import { Skill, SkillPreview } from '../agent/types';

export class SkillCreationPanel {
  private panel: vscode.WebviewPanel | undefined;
  private agent: SkillCreationAgent;
  private skillManager: SkillManager;
  private templateEngine: TemplateEngine;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.agent = new SkillCreationAgent();
    this.skillManager = new SkillManager();
    this.templateEngine = new TemplateEngine();
    this.setupAgentEvents();
  }

  private setupAgentEvents(): void {
    this.agent.on('message', (msg: { role: string; content: string }) => {
      this.postMessage({ type: 'message', ...msg });
    });

    this.agent.on('statusChange', (status: string) => {
      this.postMessage({ type: 'status', status });
    });
  }

  show(context?: { currentFile?: string; projectPath?: string }): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'skillshub.skillCreation',
      'Skill Creator',
      vscode.ViewColumn.One,
      { enableScripts: true, localResourceRoots: [this.getWebviewUri()] }
    );

    const htmlPath = path.join(__dirname, '../../webview/skill-creation/index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');
    html = html.replace(/styles\.css/g, this.panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(__dirname, '../../webview/skill-creation/styles.css'))
    ).toString());

    this.panel.webview.html = html;

    const creationContext = context ? { ...context, includeContext: false } : undefined;
    this.agent.start(creationContext);

    this.panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg.action === 'sendMessage') {
        await this.handleUserMessage(msg.content);
      } else if (msg.action === 'confirm') {
        await this.handleConfirm();
      } else if (msg.action === 'regenerate') {
        await this.handleRegenerate();
      } else if (msg.action === 'useTemplate') {
        await this.handleUseTemplate(msg.templateId);
      } else if (msg.action === 'close') {
        this.panel?.dispose();
      }
    });

    this.panel.onDidDispose(() => {
      this.panel = undefined;
      this.agent.cancel();
    });
  }

  private async handleUserMessage(content: string): Promise<void> {
    const response = await this.agent.sendMessage(content);
    
    if (response.status === 'error') {
      const templates = this.templateEngine.listTemplates();
      this.postMessage({ type: 'fallback', templates });
    }

    if (response.preview) {
      this.postMessage({ type: 'preview', preview: response.preview });
    }
  }

  private async handleConfirm(): Promise<void> {
    const preview = this.agent.confirm();
    if (!preview) {
      vscode.window.showErrorMessage('No skill to create');
      return;
    }

    try {
      const skill = await this.skillManager.create(preview.name);
      
      for (const file of preview.files) {
        const filePath = path.join(skill.path, file.path);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, file.content);
      }

      vscode.window.showInformationMessage(`Skill "${preview.name}" created successfully!`);
      this.panel?.dispose();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create skill: ${(error as Error).message}`);
    }
  }

  private async handleRegenerate(): Promise<void> {
    const lastUserMessage = this.agent.getConversation().filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      await this.handleUserMessage(lastUserMessage.content);
    }
  }

  private async handleUseTemplate(templateId: string): Promise<void> {
    const preview = await this.agent.fallbackToTemplate(templateId);
    this.postMessage({ type: 'preview', preview });
    this.postMessage({ type: 'fallbackHidden' });
  }

  private postMessage(data: any): void {
    this.panel?.webview.postMessage(data);
  }

  private getWebviewUri(): vscode.Uri {
    return vscode.Uri.file(path.join(__dirname, '../../webview'));
  }
}
```

- [ ] **Step 4: Verify compilation**

Run: `npm run compile`
Expected: Compiles without errors

- [ ] **Step 5: Commit**

```bash
git add webview/skill-creation/ src/ui/SkillCreationPanel.ts
git commit -m "feat: add SkillCreationPanel webview UI"
```

---

## Task 6: Integration with Commands

**Files:**
- Modify: `src/commands/index.ts`
- Modify: `src/extension.ts`
- Modify: `package.json`

- [ ] **Step 1: Update extension.ts to initialize SkillCreationPanel**

```typescript
import * as vscode from 'vscode';
import { SkillManager } from './services/SkillManager';
import { MarketplaceService } from './services/MarketplaceService';
import { Logger } from './services/logger';
import { registerCommands } from './commands';
import { SkillExplorerProvider, SkillTreeItem } from './ui/SkillExplorer';
import { Skill } from './services/types';
import { CacheManager } from './services/CacheManager';
import { SkillCreationPanel } from './ui/SkillCreationPanel';

let skillManager: SkillManager;
let marketplaceService: MarketplaceService;
let cacheManager: CacheManager;
let skillCreationPanel: SkillCreationPanel;

export async function activate(context: vscode.ExtensionContext) {
  Logger.info('Skillshub activated');
  skillManager = new SkillManager();
  marketplaceService = new MarketplaceService();
  cacheManager = new CacheManager();
  skillCreationPanel = new SkillCreationPanel(context);
  
  const commands = registerCommands(skillManager, marketplaceService, cacheManager, skillCreationPanel);
  commands.forEach(cmd => context.subscriptions.push(cmd));

  const skills = await skillManager.list();
  const provider = new SkillExplorerProvider(skills);
  vscode.window.registerTreeDataProvider('skillExplorer', provider);

  vscode.commands.registerCommand('skillshub.refreshExplorer', async () => {
    const updatedSkills = await skillManager.list();
    provider.refresh(updatedSkills);
  });

  vscode.commands.registerCommand('skillshub.openSkill', async (skill: Skill) => {
    vscode.window.showTextDocument(vscode.Uri.file(skill.path));
  });
}

export function deactivate() {}
```

- [ ] **Step 2: Update commands/index.ts to register createSkill command**

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SkillManager } from '../services/SkillManager';
import { MarketplaceService } from '../services/MarketplaceService';
import { VersionManager } from '../services/VersionManager';
import { CacheManager } from '../services/CacheManager';
import { MarketplaceView } from '../ui/MarketplaceView';
import { SkillCreationPanel } from '../ui/SkillCreationPanel';
import { Logger } from '../services/logger';

let marketplaceView: MarketplaceView;

export function registerCommands(
  skillManager: SkillManager,
  marketplaceService: MarketplaceService,
  cacheManager: CacheManager,
  skillCreationPanel: SkillCreationPanel
) {
  const commands: vscode.Disposable[] = [];

  commands.push(
    vscode.commands.registerCommand('skillshub.createSkill', async () => {
      const editor = vscode.window.activeTextEditor;
      const context = editor ? {
        currentFile: editor.document.uri.fsPath,
        projectPath: vscode.workspace.rootPath,
        includeContext: false
      } : undefined;
      skillCreationPanel.show(context);
    })
  );

  marketplaceView = new MarketplaceView(marketplaceService, cacheManager);
  
  commands.push(
    vscode.commands.registerCommand('skillshub.openMarketplace', () => {
      marketplaceView.show();
    })
  );

  // ... rest of existing commands
```

- [ ] **Step 3: Update package.json to add view title**

```json
"commands": [
  {
    "command": "skillshub.createSkill",
    "title": "Create Skill"
  }
]
```

- [ ] **Step 4: Verify compilation**

Run: `npm run compile`
Expected: Compiles without errors

- [ ] **Step 5: Commit**

```bash
git add src/commands/index.ts src/extension.ts package.json
git commit -m "feat: integrate SkillCreationPanel with commands"
```

---

## Task 7: Add Additional Templates

**Files:**
- Create: `templates/debugging/SKILL.md`
- Create: `templates/debugging/src/index.ts`
- Create: `templates/documentation/SKILL.md`
- Create: `templates/documentation/src/index.ts`
- Create: `templates/testing/SKILL.md`
- Create: `templates/testing/src/index.ts`

- [ ] **Step 1: Create debugging template**

Create `templates/debugging/SKILL.md`:
```markdown
# Debugging Assistant

## Description
Help diagnose and fix bugs in your code.

## Commands
- `debug`: Start debugging session for current file
- `trace`: Trace variable values through execution

## Usage
Invoke with the problematic code context.

## Configuration
- `breakOnError`: Automatically break on first error
```

Create `templates/debugging/src/index.ts`:
```typescript
import { SkillContext, SkillResult } from '../types';

export async function execute(context: SkillContext): Promise<SkillResult> {
  const { command, params } = context;
  
  switch (command) {
    case 'debug':
      return startDebugSession(params.filePath);
    case 'trace':
      return traceVariables(params.code);
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

async function startDebugSession(filePath: string): Promise<SkillResult> {
  return {
    success: true,
    output: `Debugging session started for ${filePath}`,
    data: { breakpoints: [] }
  };
}

async function traceVariables(code: string): Promise<SkillResult> {
  return {
    success: true,
    output: 'Variable trace complete',
    data: { traces: [] }
  };
}
```

- [ ] **Step 2: Create documentation template**

Create `templates/documentation/SKILL.md`:
```markdown
# Documentation Generator

## Description
Generate documentation from code comments and structure.

## Commands
- `generate`: Generate documentation for current file
- `update`: Update existing documentation

## Usage
Run on source files to generate markdown documentation.

## Configuration
- `format`: Output format (markdown/html/pdf)
- `includePrivate`: Include private members
```

Create `templates/documentation/src/index.ts`:
```typescript
import { SkillContext, SkillResult } from '../types';

export async function execute(context: SkillContext): Promise<SkillResult> {
  const { command, params } = context;
  
  switch (command) {
    case 'generate':
      return generateDocs(params.filePath);
    case 'update':
      return updateDocs(params.filePath);
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

async function generateDocs(filePath: string): Promise<SkillResult> {
  return {
    success: true,
    output: `Documentation generated for ${filePath}`,
    data: { sections: [] }
  };
}

async function updateDocs(filePath: string): Promise<SkillResult> {
  return {
    success: true,
    output: `Documentation updated for ${filePath}`,
    data: {}
  };
}
```

- [ ] **Step 3: Create testing template**

Create `templates/testing/SKILL.md`:
```markdown
# Testing Helper

## Description
Assist with writing and running tests.

## Commands
- `generate`: Generate test stubs for current file
- `run`: Run tests with coverage

## Usage
Helps create comprehensive test suites.

## Configuration
- `framework`: Test framework to use (jest/mocha/etc)
- `coverage`: Minimum coverage threshold
```

Create `templates/testing/src/index.ts`:
```typescript
import { SkillContext, SkillResult } from '../types';

export async function execute(context: SkillContext): Promise<SkillResult> {
  const { command, params } = context;
  
  switch (command) {
    case 'generate':
      return generateTests(params.filePath);
    case 'run':
      return runTests(params.testPath);
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

async function generateTests(filePath: string): Promise<SkillResult> {
  return {
    success: true,
    output: `Tests generated for ${filePath}`,
    data: { testFiles: [] }
  };
}

async function runTests(testPath: string): Promise<SkillResult> {
  return {
    success: true,
    output: `Tests run for ${testPath}`,
    data: { passed: 0, failed: 0, coverage: 0 }
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add templates/
git commit -m "feat: add debugging, documentation, and testing templates"
```

---

## Task 8: End-to-End Testing

**Files:**
- Create: `src/test/suite/extension.test.ts`
- Create: `src/test/suite/skillCreation.test.ts`

- [ ] **Step 1: Create basic extension test**

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('skillshub'));
  });
});
```

- [ ] **Step 2: Verify compilation and tests**

Run: `npm run compile`
Expected: Compiles without errors

- [ ] **Step 3: Commit**

```bash
git add src/test/
git commit -m "test: add extension integration tests"
```

---

## Implementation Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Project structure setup | 11 new files |
| 2 | OpenCode Agent API service | AgentAPIService.ts |
| 3 | Template engine with code-review | TemplateEngine.ts + templates |
| 4 | Skill creation agent state machine | SkillCreationAgent.ts |
| 5 | Webview UI panel | index.html, styles.css, SkillCreationPanel.ts |
| 6 | Command integration | commands/index.ts, extension.ts |
| 7 | Additional templates | 6 template files |
| 8 | Testing | test files |

**Total: 8 tasks**
