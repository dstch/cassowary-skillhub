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
