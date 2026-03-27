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