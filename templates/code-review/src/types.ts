export interface SkillContext {
  command: string;
  params: Record<string, any>;
}

export interface SkillResult {
  success: boolean;
  output: string;
  data?: any;
}