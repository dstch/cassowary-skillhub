import * as vscode from 'vscode';
import { SkillManager } from './services/SkillManager';
import { MarketplaceService } from './services/MarketplaceService';
import { Logger } from './services/logger';
import { registerCommands } from './commands';
import { SkillExplorerProvider, SkillTreeItem } from './ui/SkillExplorer';
import { Skill } from './services/types';
import { CacheManager } from './services/CacheManager';
import { SkillCreationPanel } from './ui/SkillCreationPanel';

let skillManager: SkillManager;
let marketplaceService: MarketplaceService;
let cacheManager: CacheManager;
let skillCreationPanel: SkillCreationPanel;

export async function activate(context: vscode.ExtensionContext) {
  const packageJson = require('../package.json');
  const currentVersion = packageJson.version;
  const lastVersion = context.globalState.get<string>('skillshub.version');

  if (lastVersion !== currentVersion) {
    if (lastVersion) {
      vscode.window.showInformationMessage(`Cassowary updated: ${lastVersion} → ${currentVersion}`);
    } else {
      vscode.window.showInformationMessage(`Cassowary ${currentVersion} installed!`);
    }
    context.globalState.update('cassowary-skillhub.version', currentVersion);
  }

  Logger.info(`Cassowary ${currentVersion} activated`);
  skillManager = new SkillManager();
  marketplaceService = new MarketplaceService();
  cacheManager = new CacheManager();
  skillCreationPanel = new SkillCreationPanel(context);
  
  const commands = registerCommands(skillManager, marketplaceService, cacheManager, skillCreationPanel);
  commands.forEach(cmd => context.subscriptions.push(cmd));

  const skills = await skillManager.list();
  const provider = new SkillExplorerProvider(skills);
  vscode.window.registerTreeDataProvider('cassowary-skillhub.explorer', provider);

  vscode.commands.registerCommand('cassowary-skillhub.refreshExplorer', async () => {
    const updatedSkills = await skillManager.list();
    provider.refresh(updatedSkills);
  });

  vscode.commands.registerCommand('cassowary-skillhub.openSkill', async (skill: Skill) => {
    vscode.window.showTextDocument(vscode.Uri.file(skill.path));
  });
}

export function deactivate() {}
