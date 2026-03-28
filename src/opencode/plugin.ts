// src/opencode/plugin.ts
import type { Plugin } from '@opencode-ai/plugin';
import { SkillTools } from './tools/skill-tools';
import { OpenCodeLogger } from '../core/logger';
import { getDefaultConfig } from '../core/config';
import { SkillManager } from '../core/SkillManager';

export const SkillHubPlugin: Plugin = async (ctx) => {
  const config = getDefaultConfig();
  const logger = new OpenCodeLogger(ctx.client);
  const skillManager = new SkillManager(config, logger);

  const skillTools = new SkillTools(skillManager, logger);

  return {
    tool: {
      ...skillTools.getTools(),
    },
  };
};
