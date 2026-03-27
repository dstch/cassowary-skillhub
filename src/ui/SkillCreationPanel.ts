import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SkillCreationAgent } from '../agent/SkillCreationAgent';
import { SkillManager } from '../services/SkillManager';
import { TemplateEngine } from '../services/TemplateEngine';
import { SkillPreview } from '../agent/types';

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
      } else if (msg.action === 'editFeedback') {
        await this.handleEditFeedback(msg.feedback);
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

  private async handleEditFeedback(feedback: string): Promise<void> {
    const modifiedPrompt = `Please modify the previous skill with the following feedback: ${feedback}`;
    await this.handleUserMessage(modifiedPrompt);
  }

  private postMessage(data: unknown): void {
    this.panel?.webview.postMessage(data);
  }

  private getWebviewUri(): vscode.Uri {
    return vscode.Uri.file(path.join(__dirname, '../../webview'));
  }
}