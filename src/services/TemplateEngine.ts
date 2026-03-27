import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import { Template, SkillPreview, SkillFile } from '../agent/types';
import { Logger } from './logger';

export class TemplateEngine {
  private templatesPath: string | undefined;

  private getTemplatesPath(): string {
    if (!this.templatesPath) {
      try {
        const config = vscode.workspace.getConfiguration('skillshub');
        this.templatesPath = config.get<string>('templatesPath') || 
          path.join(os.homedir(), '.config', 'skillshub', 'templates');
      } catch {
        this.templatesPath = path.join(os.homedir(), '.config', 'skillshub', 'templates');
      }
    }
    return this.templatesPath;
  }

  listTemplates(): Template[] {
    const templatesPath = this.getTemplatesPath();
    if (!fs.existsSync(templatesPath)) {
      return this.getBuiltInTemplates();
    }
    
    const dirs = fs.readdirSync(templatesPath).filter(d => 
      fs.statSync(path.join(templatesPath, d)).isDirectory()
    );
    
    return dirs.map(dir => {
      const metaPath = path.join(templatesPath, dir, 'skill.json');
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        return { id: dir, name: meta.name, description: meta.description, files: [] };
      }
      return { id: dir, name: dir, description: '', files: [] };
    });
  }

  generateFromTemplate(templateId: string, overrides?: Partial<SkillPreview>): SkillPreview {
    const templateDir = path.join(this.getTemplatesPath(), templateId);
    if (!fs.existsSync(templateDir)) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const files: SkillFile[] = [];
    this.readDirRecursive(templateDir, templateDir, files);

    return {
      name: overrides?.name || templateId,
      description: overrides?.description || '',
      files,
      ...overrides
    };
  }

  private readDirRecursive(baseDir: string, currentDir: string, files: SkillFile[]): void {
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