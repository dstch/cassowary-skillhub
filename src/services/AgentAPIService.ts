import axios, { AxiosInstance } from 'axios';
import { SkillPreview, SkillFile } from '../agent/types';
import { Logger } from './logger';

interface OpenCodeMessageResponse {
  info: {
    id: string;
    sessionID: string;
    role: string;
    finish: string;
  };
  parts: Array<{
    type: string;
    text?: string;
  }>;
}

export class AgentAPIService {
  private client: AxiosInstance;
  private baseUrl: string;
  private sessionId: string | null = null;
  private password: string | undefined;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.password = process.env.OPENCODE_SERVER_PASSWORD;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private getAuthHeaders(): Record<string, string> {
    if (this.password) {
      return { 'Authorization': `Bearer ${this.password}` };
    }
    return {};
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get('/global/health', {
        timeout: 5000,
        headers: this.getAuthHeaders()
      });
      return response.status === 200 && response.data?.healthy === true;
    } catch {
      return false;
    }
  }

  async createSession(title?: string): Promise<string> {
    const response = await this.client.post('/session',
      { title },
      { headers: this.getAuthHeaders() }
    );
    return response.data.id;
  }

  async sendMessage(sessionId: string, content: string): Promise<OpenCodeMessageResponse> {
    const response = await this.client.post(
      `/session/${sessionId}/message`,
      {
        parts: [{ type: 'text', text: content }]
      },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async generateSkill(prompt: string, _context: object): Promise<SkillPreview> {
    const sessionId = await this.createSession('Skill Creation');
    this.sessionId = sessionId;

    const skillPrompt = `Create a new skill based on the following request. After creating the skill files, respond with a JSON structure in this exact format (no other text):
{
  "name": "Skill Name",
  "description": "What the skill does",
  "files": [
    {"path": "relative/path/file.ext", "content": "file content here"}
  ]
}

User request: ${prompt}`;

    const response = await this.sendMessage(sessionId, skillPrompt);

    const textPart = response.parts.find(p => p.type === 'text');
    const responseText = textPart?.text || '';

    return this.parseSkillPreview(responseText);
  }

  private parseSkillPreview(text: string): SkillPreview {
    try {
      const jsonMatch = text.match(/\{[\s\S]*"name"[\s\S]*"files"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.name && parsed.description && Array.isArray(parsed.files)) {
          return {
            name: parsed.name,
            description: parsed.description,
            files: parsed.files.filter((f: { path?: string; content?: string }) => 
              typeof f.path === 'string' && typeof f.content === 'string'
            )
          };
        }
      }
    } catch (e) {
      Logger.error('Failed to parse JSON from response', e as Error);
    }

    const nameMatch = text.match(/\*\*Skill Name:\*\*\s*(.+)/i) 
      || text.match(/Skill Name:\s*(.+)/i)
      || text.match(/^#\s*(.+)/m);
    const name = nameMatch ? nameMatch[1].trim() : 'Generated Skill';

    const descMatch = text.match(/\*\*Description:\*\*\s*(.+)/i)
      || text.match(/Description:\s*(.+)/i);
    const description = descMatch ? descMatch[1].trim() : 'A custom skill';

    const files: SkillFile[] = [];
    
    const createdPathMatch = text.match(/Created skill at `([^`]+)`/);
    if (createdPathMatch) {
      const basePath = createdPathMatch[1];
      files.push({
        path: 'SKILL.md',
        content: `---
name: ${name}
description: ${description}
---

${text.split('\n').filter(l => !l.startsWith('Created skill')).join('\n').substring(0, 1000)}
`
      });
    }

    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    let match;
    let blockIndex = 0;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const content = match[1].trim();
      if (content.length > 20) {
        const path = `file${blockIndex}.md`;
        files.push({ path, content });
        blockIndex++;
      }
    }

    if (files.length === 0) {
      files.push({
        path: 'SKILL.md',
        content: text
      });
    }

    return { name, description, files };
  }

  async dispose(): Promise<void> {
    if (this.sessionId) {
      try {
        await this.client.delete(`/session/${this.sessionId}`, {
          headers: this.getAuthHeaders()
        });
      } catch (error) {
        Logger.error('Failed to dispose session', error as Error);
      }
      this.sessionId = null;
    }
  }
}