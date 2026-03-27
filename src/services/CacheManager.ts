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
    this.cachePath = path.join(os.homedir(), '.config', 'cassowary-skillhub', 'cache');
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
    try {
      const https = require('https');
      return new Promise((resolve) => {
        const req = https.request('https://api.skillshub.example.com/health', { 
          method: 'HEAD',
          timeout: 5000
        }, (res: any) => {
          resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.end();
      });
    } catch {
      return false;
    }
  }

  async getSyncStatus(): Promise<{ online: boolean; lastSync?: string }> {
    const online = await this.isOnline();
    const statusFile = path.join(this.cachePath, 'status.json');
    let lastSync: string | undefined;
    if (fs.existsSync(statusFile)) {
      const status = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
      lastSync = status.lastSync;
    }
    return { online, lastSync };
  }
}
