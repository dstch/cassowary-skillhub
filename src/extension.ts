import * as vscode from 'vscode';
import { SkillManager } from './services/SkillManager';
import { Logger } from './services/logger';
import { registerCommands } from './commands';

let skillManager: SkillManager;

export function activate(context: vscode.ExtensionContext) {
  Logger.info('Skillshub activated');
  skillManager = new SkillManager();
  const commands = registerCommands(skillManager);
  commands.forEach(cmd => context.subscriptions.push(cmd));
}

export function deactivate() {}
