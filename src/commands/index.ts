import * as vscode from 'vscode';
import { SkillManager } from '../services/SkillManager';

export function registerCommands(skillManager: SkillManager) {
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

  return commands;
}
