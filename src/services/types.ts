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