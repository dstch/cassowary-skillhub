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

  async getCurrentVersion(skillPath: string): Promise<Version> {
    const version = this.readVersion(skillPath);
    return {
      id: 'current',
      version,
      createdAt: new Date().toISOString()
    };
  }
}