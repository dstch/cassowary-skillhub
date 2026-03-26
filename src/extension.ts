import * as vscode from 'vscode';
import { SkillManager } from './services/SkillManager';
import { MarketplaceService } from './services/MarketplaceService';
import { Logger } from './services/logger';
import { registerCommands } from './commands';

let skillManager: SkillManager;
let marketplaceService: MarketplaceService;

export function activate(context: vscode.ExtensionContext) {
  Logger.info('Skillshub activated');
  skillManager = new SkillManager();
  marketplaceService = new MarketplaceService();
  const commands = registerCommands(skillManager, marketplaceService);
  commands.forEach(cmd => context.subscriptions.push(cmd));
}

export function deactivate() {}
