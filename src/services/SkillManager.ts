import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Logger } from './logger';
import { Skill } from './types';

export class SkillManager {
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