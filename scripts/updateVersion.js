const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

const commitCount = require('child_process')
  .execSync('git rev-list --count HEAD', { encoding: 'utf-8' })
  .trim();

const newVersion = `0.0.${commitCount}`;

if (packageJson.version !== newVersion) {
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`Version updated: ${packageJson.version}`);
} else {
  console.log(`Version unchanged: ${packageJson.version}`);
}
