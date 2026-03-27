import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SkillManager } from '../services/SkillManager';
import { MarketplaceService } from '../services/MarketplaceService';
import { VersionManager } from '../services/VersionManager';
import { CacheManager } from '../services/CacheManager';
import { MarketplaceView } from '../ui/MarketplaceView';
import { SkillCreationPanel } from '../ui/SkillCreationPanel';
import { Logger } from '../services/logger';

let marketplaceView: MarketplaceView;

export function registerCommands(
  skillManager: SkillManager,
  marketplaceService: MarketplaceService,
  cacheManager: CacheManager,
  skillCreationPanel: SkillCreationPanel
) {
  const commands: vscode.Disposable[] = [];

  marketplaceView = new MarketplaceView(marketplaceService, cacheManager);
  
  commands.push(
    vscode.commands.registerCommand('skillshub.newSkill', async () => {
      const editor = vscode.window.activeTextEditor;
      const context = editor ? {
        currentFile: editor.document.uri.fsPath,
        projectPath: vscode.workspace.rootPath,
        includeContext: false
      } : undefined;
      skillCreationPanel.show(context);
    })
  );

  commands.push(
    vscode.commands.registerCommand('skillshub.openMarketplace', () => {
      marketplaceView.show();
    })
  );

  commands.push(
    vscode.commands.registerCommand('skillshub.setToken', async () => {
      const token = await vscode.window.showInputBox({ 
        prompt: 'Enter marketplace token',
        password: true 
      });
      if (token) {
        marketplaceService.setToken(token);
        vscode.window.showInformationMessage('Token set successfully');
      }
    })
  );

  commands.push(
    vscode.commands.registerCommand('skillshub.showVersions', async () => {
      const skills = await skillManager.list();
      if (skills.length === 0) {
        vscode.window.showWarningMessage('No skills found');
        return;
      }
      const selected = await vscode.window.showQuickPick(skills.map(s => s.name));
      if (selected) {
        const skill = skills.find(s => s.name === selected)!;
        const versionManager = new VersionManager();
        const versions = await versionManager.getVersions(skill.path);
        const versionList = versions.map(v => `${v.version} - ${v.createdAt}`).join('\n');
        vscode.window.showInformationMessage(`Versions:\n${versionList || 'No history'}`);
      }
    })
  );

  commands.push(
    vscode.commands.registerCommand('skillshub.rollbackSkill', async () => {
      const skills = await skillManager.list();
      if (skills.length === 0) {
        vscode.window.showWarningMessage('No skills found');
        return;
      }
      const selected = await vscode.window.showQuickPick(skills.map(s => s.name));
      if (selected) {
        const skill = skills.find(s => s.name === selected)!;
        const versionManager = new VersionManager();
        const versions = await versionManager.getVersions(skill.path);
        if (versions.length === 0) {
          vscode.window.showWarningMessage('No versions to rollback to');
          return;
        }
        const versionSelected = await vscode.window.showQuickPick(versions.map(v => v.version));
        if (versionSelected) {
          const version = versions.find(v => v.version === versionSelected)!;
          await versionManager.rollback(skill.path, version.id);
          vscode.window.showInformationMessage(`Rolled back to ${versionSelected}`);
        }
      }
    })
  );

  commands.push(
    vscode.commands.registerCommand('skillshub.clearCache', async () => {
      await cacheManager.clearCache();
      vscode.window.showInformationMessage('Cache cleared');
    })
  );

  commands.push(
    vscode.commands.registerCommand('skillshub.showSyncStatus', async () => {
      const status = await cacheManager.getSyncStatus();
      const statusText = status.online ? 'Online' : 'Offline';
      const lastSync = status.lastSync ? `Last sync: ${status.lastSync}` : 'Never synced';
      vscode.window.showInformationMessage(`${statusText} - ${lastSync}`);
    })
  );

  return commands;
}
