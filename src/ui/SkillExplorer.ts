import * as vscode from 'vscode';
import { Skill } from '../services/types';

export class SkillExplorerProvider implements vscode.TreeDataProvider<SkillTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SkillTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private skills: Skill[]) {}

  refresh(skills: Skill[]) {
    this.skills = skills;
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: SkillTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<SkillTreeItem[]> {
    return this.skills.map(skill => new SkillTreeItem(skill));
  }
}

export class SkillTreeItem extends vscode.TreeItem {
  constructor(public readonly skill: Skill) {
    super(skill.name, vscode.TreeItemCollapsibleState.None);
    this.description = skill.version;
    this.contextValue = 'skill';
    this.iconPath = new vscode.ThemeIcon('symbol-property');
    this.command = {
      command: 'cassowary-skillhub.openSkill',
      title: 'Open',
      arguments: [this.skill]
    };
  }
}
