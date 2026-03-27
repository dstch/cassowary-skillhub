import { EventEmitter } from 'events';
import {
  ConversationMessage,
  CreationStatus,
  SkillPreview,
  CreationContext,
  AgentResponse
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