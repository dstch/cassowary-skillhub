import * as vscode from 'vscode';
import { SkillManager } from '../services/SkillManager';
import { MarketplaceService } from '../services/MarketplaceService';
import { VersionManager } from '../services/VersionManager';

export function registerCommands(skillManager: SkillManager, marketplaceService: MarketplaceService) {
  const commands: vscode.Disposable[] = [];

  commands.push(
    vscode.commands.registerCommand('skillshub.createSkill', async () => {
      const name = await vscode.window.showInputBox({ 
        prompt: 'Enter skill name',
        validateInput: (v) => v ? null : 'Name required'
      });
      if (name) {
        await skillManager.create(name);
        vscode.window.showInformationMessage(`Created: ${name}`);
      }
    })
  );

  commands.push(
    vscode.commands.registerCommand('skillshub.packageSkill', async () => {
      const skills = await skillManager.list();
      if (skills.length === 0) {
        vscode.window.showWarningMessage('No skills found');
        return;
      }
      const selected = await vscode.window.showQuickPick(
        skills.map(s => s.name)
      );
      if (selected) {
        const skill = skills.find(s => s.name === selected)!;
        const zipPath = await skillManager.package(skill.path);
        vscode.window.showInformationMessage(`Package: ${zipPath}`);
      }
    })
  );

  commands.push(
    vscode.commands.registerCommand('skillshub.testSkill', async () => {
      const skills = await skillManager.list();
      if (skills.length === 0) {
        vscode.window.showWarningMessage('No skills found');
        return;
      }
      const selected = await vscode.window.showQuickPick(
        skills.map(s => s.name)
      );
      if (selected) {
        const skill = skills.find(s => s.name === selected)!;
        const result = await skillManager.test(skill.path);
        if (result.success) {
          vscode.window.showInformationMessage('Test passed');
        } else {
          vscode.window.showErrorMessage(`Test failed: ${result.output}`);
        }
      }
    })
  );

  commands.push(
    vscode.commands.registerCommand('skillshub.openMarketplace', async () => {
      vscode.window.showInformationMessage('Marketplace coming soon');
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

  return commands;
}
