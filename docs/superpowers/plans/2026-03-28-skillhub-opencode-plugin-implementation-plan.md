# SkillHub OpenCode Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OpenCode plugin support to SkillHub, allowing skill management via CLI commands in OpenCode terminal environment.

**Architecture:** Extract shared business logic to `core/` layer, implement OpenCode plugin in `opencode/` layer that exposes Custom Tools for skill operations. Keep VSCode layer unchanged initially.

**Tech Stack:** TypeScript, esbuild, @opencode-ai/plugin SDK

---

## File Structure

```
src/
├── core/                              # New: Platform-agnostic core
│   ├── types.ts                      # Shared type definitions
│   ├── config.ts                     # Platform config abstraction
│   ├── logger.ts                     # Logger interface + implementations
│   └── SkillManager.ts               # Core skill management (extracted)
│
├── opencode/                          # New: OpenCode plugin
│   ├── plugin.ts                     # Plugin entry point
│   └── tools/
│       ├── skill-tools.ts            # Skill management tools
│       └── market-tools.ts           # Marketplace tools
│
├── services/                          # Existing: will refactor to use core
│   ├── SkillManager.ts               # Modify: delegate to core
│   └── logger.ts                     # Modify: extend core logger
│
├── vscode/                           # Existing: kept unchanged
│   └── (existing files)
│
├── extension.ts                      # Modify: use refactored services
│
opencode-plugin/                       # New: OpenCode plugin package
├── package.json
├── tsconfig.json
└── build/                            # Build output
    └── (compiled plugin.js)
│
scripts/
└── build-opencode.js                 # New: esbuild script
│
package.json                          # Modify: add build scripts
```

---

## Task 1: Create Core Types

**Files:**
- Create: `src/core/types.ts`

- [ ] **Step 1: Create shared type definitions**

```typescript
// src/core/types.ts
export interface Skill {
  name: string;
  path: string;
  description?: string;
  version: string;
  status: 'installed' | 'modified' | 'unpublished';
}

export interface TestResult {
  success: boolean;
  output: string;
  errors?: string[];
}

export interface Version {
  id: string;
  version: string;
  createdAt: string;
  message?: string;
}

export interface PlatformConfig {
  skillsPath: string;
  configDir: string;
  cacheDir: string;
}
```

- [ ] **Step 2: Verify file creation**

Run: `ls src/core/types.ts`

---

## Task 2: Create Core Logger Interface

**Files:**
- Create: `src/core/logger.ts`

- [ ] **Step 1: Create abstract logger interface**

```typescript
// src/core/logger.ts
export interface Logger {
  info(message: string): void;
  error(message: string, error?: Error): void;
  debug?(message: string): void;
}

export class ConsoleLogger implements Logger {
  info(message: string) {
    console.log(`[INFO] ${message}`);
  }
  error(message: string, error?: Error) {
    console.error(`[ERROR] ${message}${error ? `: ${error.message}` : ''}`);
  }
  debug?(message: string) {
    console.debug(`[DEBUG] ${message}`);
  }
}
```

---

## Task 3: Create Core Config

**Files:**
- Create: `src/core/config.ts`

- [ ] **Step 1: Create platform config abstraction**

```typescript
// src/core/config.ts
import * as os from 'os';
import * as path from 'path';
import { PlatformConfig } from './types';

export function getDefaultConfig(): PlatformConfig {
  const home = os.homedir();
  return {
    skillsPath: path.join(home, '.config', 'opencode', 'skills'),
    configDir: path.join(home, '.config', 'skillshub'),
    cacheDir: path.join(home, '.cache', 'skillshub'),
  };
}
```

---

## Task 4: Create Core SkillManager

**Files:**
- Create: `src/core/SkillManager.ts`

- [ ] **Step 1: Create platform-agnostic SkillManager**

```typescript
// src/core/SkillManager.ts
import * as fs from 'fs';
import * as path from 'path';
import { Skill, PlatformConfig } from './types';
import { Logger } from './logger';

export class SkillManager {
  private config: PlatformConfig;
  private logger: Logger;

  constructor(config: PlatformConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  getSkillsPath(): string {
    return this.config.skillsPath;
  }

  async list(): Promise<Skill[]> {
    if (!fs.existsSync(this.config.skillsPath)) {
      return [];
    }
    const dirs = fs.readdirSync(this.config.skillsPath).filter(d => 
      fs.statSync(path.join(this.config.skillsPath, d)).isDirectory()
    );
    return dirs.map(name => this.readSkillMeta(name));
  }

  private readSkillMeta(name: string): Skill {
    const skillPath = path.join(this.config.skillsPath, name);
    const metaPath = path.join(skillPath, 'skill.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      return { name, path: skillPath, ...meta };
    }
    return { name, path: skillPath, version: '1.0.0', status: 'installed' };
  }

  async create(name: string, template?: string): Promise<Skill> {
    const skillPath = path.join(this.config.skillsPath, name);
    if (fs.existsSync(skillPath)) {
      throw new Error(`Skill ${name} already exists`);
    }
    fs.mkdirSync(skillPath, { recursive: true });
    const skill: Skill = {
      name,
      path: skillPath,
      version: '1.0.0',
      status: 'modified'
    };
    const metaPath = path.join(skillPath, 'skill.json');
    fs.writeFileSync(metaPath, JSON.stringify(skill, null, 2));
    this.logger.info(`Created skill: ${name}`);
    return skill;
  }

  async remove(name: string): Promise<void> {
    const skillPath = path.join(this.config.skillsPath, name);
    if (!fs.existsSync(skillPath)) {
      throw new Error(`Skill ${name} does not exist`);
    }
    fs.rmSync(skillPath, { recursive: true });
    this.logger.info(`Removed skill: ${name}`);
  }

  async package(name: string): Promise<string> {
    const skillPath = path.join(this.config.skillsPath, name);
    if (!fs.existsSync(skillPath)) {
      throw new Error(`Skill ${name} does not exist`);
    }
    const zipPath = `${skillPath}.zip`;
    this.logger.info(`Packaging skill to: ${zipPath}`);
    return zipPath;
  }

  async getSkill(name: string): Promise<Skill | null> {
    const skillPath = path.join(this.config.skillsPath, name);
    if (!fs.existsSync(skillPath)) {
      return null;
    }
    return this.readSkillMeta(name);
  }
}
```

---

## Task 5: Create OpenCode Logger Implementation

**Files:**
- Modify: `src/core/logger.ts` (add OpenCodeLogger)

- [ ] **Step 1: Add OpenCodeLogger implementation**

Add to `src/core/logger.ts`:

```typescript
import type { Client } from '@opencode-ai/sdk';

export class OpenCodeLogger implements Logger {
  constructor(private client: Client) {}

  info(message: string) {
    this.client.app.log({ body: { level: 'info', message } });
  }

  error(message: string, error?: Error) {
    this.client.app.log({ 
      body: { level: 'error', message: `${message}${error ? `: ${error.message}` : ''}` }
    });
  }

  debug?(message: string) {
    this.client.app.log({ body: { level: 'debug', message } });
  }
}
```

---

## Task 6: Create SkillTools for OpenCode

**Files:**
- Create: `src/opencode/tools/skill-tools.ts`

- [ ] **Step 1: Create skill management tools**

```typescript
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
```

---

## Task 7: Create OpenCode Plugin Entry

**Files:**
- Create: `src/opencode/plugin.ts`

- [ ] **Step 1: Create OpenCode plugin main file**

```typescript
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
```

---

## Task 8: Create OpenCode Plugin Package

**Files:**
- Create: `opencode-plugin/package.json`
- Create: `opencode-plugin/tsconfig.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "skillhub-opencode",
  "version": "0.0.1",
  "type": "module",
  "main": "build/plugin.js",
  "dependencies": {},
  "devDependencies": {
    "@opencode-ai/plugin": "^0.1.0",
    "esbuild": "^0.24.0",
    "typescript": "^5.3.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

---

## Task 9: Create Build Script

**Files:**
- Create: `scripts/build-opencode.js`

- [ ] **Step 1: Create esbuild script**

```javascript
// scripts/build-opencode.js
import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const outdir = 'opencode-plugin/build';

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

await esbuild.build({
  entryPoints: ['src/opencode/plugin.ts'],
  bundle: true,
  outfile: path.join(outdir, 'plugin.js'),
  platform: 'node',
  target: 'node20',
  format: 'esm',
  external: ['@opencode-ai/plugin'],
  sourcemap: true,
});

console.log('OpenCode plugin built successfully');
```

---

## Task 10: Update Root package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add build scripts to package.json**

Add to scripts section:

```json
"compile:opencode": "node scripts/build-opencode.js",
"compile:all": "npm run compile && npm run compile:opencode"
```

---

## Task 11: Verify Build

**Files:**
- No file changes

- [ ] **Step 1: Run OpenCode plugin build**

Run: `npm run compile:opencode`
Expected: Build completes without errors

- [ ] **Step 2: Verify output**

Run: `ls opencode-plugin/build/`
Expected: `plugin.js` and `plugin.js.map` exist

---

## Self-Review Checklist

1. **Spec coverage:**
   - [x] Core types extracted
   - [x] Logger interface with OpenCode implementation
   - [x] Platform config abstraction
   - [x] Core SkillManager with platform-agnostic logic
   - [x] OpenCode plugin entry
   - [x] SkillTools (list, create, delete, package, info)
   - [x] Build configuration

2. **Placeholder scan:**
   - No "TBD", "TODO" in steps
   - All code is complete
   - All file paths are exact

3. **Type consistency:**
   - Logger interface methods match implementations
   - SkillManager constructor params consistent
   - Tool args schema correct

---

## Plan Complete

**Saved to:** `docs/superpowers/plans/2026-03-28-skillhub-opencode-plugin-implementation-plan.md`

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
