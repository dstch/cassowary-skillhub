import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';
import { MarketSkill, SearchQuery, ListResult, DownloadResult } from './marketplace-types';
import { Logger } from './logger';

export class MarketplaceService {
  private client: AxiosInstance;
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string = 'https://api.cassowary-skillhub.example.com') {
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
      const FormData = require('formdata-node');
      const formData = new FormData();
      const fs = require('fs');
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
