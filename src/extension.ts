import * as vscode from 'vscode';
import { SkillManager } from './services/SkillManager';
import { MarketplaceService } from './services/MarketplaceService';
import { Logger } from './services/logger';
import { registerCommands } from './commands';
import { SkillExplorerProvider, SkillTreeItem } from './ui/SkillExplorer';
import { Skill } from './services/types';
import { CacheManager } from './services/CacheManager';

let skillManager: SkillManager;
let marketplaceService: MarketplaceService;
let cacheManager: CacheManager;

export async function activate(context: vscode.ExtensionContext) {
  Logger.info('Skillshub activated');
  skillManager = new SkillManager();
  marketplaceService = new MarketplaceService();
  cacheManager = new CacheManager();
  
  const commands = registerCommands(skillManager, marketplaceService, cacheManager);
  commands.forEach(cmd => context.subscriptions.push(cmd));

  const skills = await skillManager.list();
  const provider = new SkillExplorerProvider(skills);
  vscode.window.registerTreeDataProvider('skillExplorer', provider);

  vscode.commands.registerCommand('skillshub.refreshExplorer', async () => {
    const updatedSkills = await skillManager.list();
    provider.refresh(updatedSkills);
  });

  vscode.commands.registerCommand('skillshub.openSkill', async (skill: Skill) => {
    vscode.window.showTextDocument(vscode.Uri.file(skill.path));
  });
}

export function deactivate() {}
