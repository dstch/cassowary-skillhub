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
