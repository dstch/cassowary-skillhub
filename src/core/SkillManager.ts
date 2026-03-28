// src/core/SkillManager.ts
import * as fs from 'fs';
import * as path from 'path';
import { Skill, PlatformConfig } from './types';
import { Logger } from './logger';

export class SkillManager {
  private config: PlatformConfig;
  private logger: Logger;

  constructor(config: PlatformConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  getSkillsPath(): string {
    return this.config.skillsPath;
  }

  async list(): Promise<Skill[]> {
    if (!fs.existsSync(this.config.skillsPath)) {
      return [];
    }
    const dirs = fs.readdirSync(this.config.skillsPath).filter(d => 
      fs.statSync(path.join(this.config.skillsPath, d)).isDirectory()
    );
    return dirs.map(name => this.readSkillMeta(name));
  }

  private readSkillMeta(name: string): Skill {
    const skillPath = path.join(this.config.skillsPath, name);
    const metaPath = path.join(skillPath, 'skill.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      return { name, path: skillPath, ...meta };
    }
    return { name, path: skillPath, version: '1.0.0', status: 'installed' };
  }

  async create(name: string, template?: string): Promise<Skill> {
    const skillPath = path.join(this.config.skillsPath, name);
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
    this.logger.info(`Created skill: ${name}`);
    return skill;
  }

  async remove(name: string): Promise<void> {
    const skillPath = path.join(this.config.skillsPath, name);
    if (!fs.existsSync(skillPath)) {
      throw new Error(`Skill ${name} does not exist`);
    }
    fs.rmSync(skillPath, { recursive: true });
    this.logger.info(`Removed skill: ${name}`);
  }

  async package(name: string): Promise<string> {
    const skillPath = path.join(this.config.skillsPath, name);
    if (!fs.existsSync(skillPath)) {
      throw new Error(`Skill ${name} does not exist`);
    }
    const zipPath = `${skillPath}.zip`;
    this.logger.info(`Packaging skill to: ${zipPath}`);
    return zipPath;
  }

  async getSkill(name: string): Promise<Skill | null> {
    const skillPath = path.join(this.config.skillsPath, name);
    if (!fs.existsSync(skillPath)) {
      return null;
    }
    return this.readSkillMeta(name);
  }
}
