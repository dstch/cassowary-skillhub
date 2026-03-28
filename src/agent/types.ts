export type ConversationRole = 'user' | 'agent' | 'system';

export interface ConversationMessage {
  role: ConversationRole;
  content: string;
  timestamp: string;
}

export type CreationStatus = 'idle' | 'thinking' | 'generating' | 'editing' | 'confirmed' | 'error' | 'fallback';

export interface SkillFile {
  path: string;
  content: string;
}

export interface SkillPreview {
  name: string;
  description: string;
  files: SkillFile[];
}

export interface CreationContext {
  currentFile?: string;
  projectPath?: string;
  clipboardContent?: string;
  includeContext: boolean;
}

export interface AgentResponse {
  message: string;
  preview: SkillPreview | null;
  status: CreationStatus;
}

export type StreamEventType = 'step-start' | 'reasoning' | 'text' | 'step-finish' | 'error';

export interface StreamEvent {
  type: StreamEventType;
  content?: string;
  done?: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  files: SkillFile[];
}
