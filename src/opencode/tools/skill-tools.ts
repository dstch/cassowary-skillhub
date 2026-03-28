// src/opencode/tools/skill-tools.ts
import { tool } from '@opencode-ai/plugin';
import { SkillManager } from '../../core/SkillManager';
import { Logger } from '../../core/logger';

export class SkillTools {
  constructor(
    private skillManager: SkillManager,
    private logger: Logger
  ) {}

  getTools() {
    return {
      skill_list: tool({
        description: 'List all installed skills in ~/.config/opencode/skills',
        args: {},
        async execute() {
          const skills = await this.skillManager.list();
          if (skills.length === 0) {
            return 'No skills found';
          }
          return skills.map(s => 
            `• ${s.name} (${s.version}) - ${s.status}${s.description ? `: ${s.description}` : ''}`
          ).join('\n');
        },
      }),

      skill_create: tool({
        description: 'Create a new skill from template',
        args: {
          name: tool.schema.string({ description: 'Skill name (lowercase, hyphenated)' }),
          template: tool.schema.string().optional({ description: 'Template name to use' }),
        },
        async execute(args) {
          const skill = await this.skillManager.create(args.name, args.template);
          return `Created skill: ${skill.name} at ${skill.path}`;
        },
      }),

      skill_delete: tool({
        description: 'Delete a skill',
        args: {
          name: tool.schema.string({ description: 'Skill name to delete' }),
        },
        async execute(args) {
          await this.skillManager.remove(args.name);
          return `Deleted skill: ${args.name}`;
        },
      }),

      skill_package: tool({
        description: 'Package a skill for distribution',
        args: {
          name: tool.schema.string({ description: 'Skill name to package' }),
        },
        async execute(args) {
          const zipPath = await this.skillManager.package(args.name);
          return `Packaged to: ${zipPath}`;
        },
      }),

      skill_info: tool({
        description: 'Get detailed info about a skill',
        args: {
          name: tool.schema.string({ description: 'Skill name' }),
        },
        async execute(args) {
          const skill = await this.skillManager.getSkill(args.name);
          if (!skill) {
            return `Skill not found: ${args.name}`;
          }
          return JSON.stringify(skill, null, 2);
        },
      }),
    };
  }
}
