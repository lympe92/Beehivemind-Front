export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
export type ConversationStatus = 'active' | 'archived' | 'deleted';

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface AiMessageMetadata {
  model?: string;
  iterations?: number;
  eval_count?: number;
  total_duration?: number;
}

export interface AiMessage {
  id: number;
  conversation_id: number;
  role: MessageRole;
  content: string;
  tool_calls: ToolCall[] | null;
  tool_name: string | null;
  metadata: AiMessageMetadata | null;
  created_at: string;
}

export interface Conversation {
  id: number;
  beehive_id: number | null;
  title: string;
  status: ConversationStatus;
  last_message_at: string;
  created_at: string;
  messages?: AiMessage[];
}

export interface SendMessageRequest {
  message: string;
  conversation_id?: number;
  beehive_id?: number;
}

export interface SendMessageResponseData {
  conversation_id: number;
  message: AiMessage;
}

export interface AiApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
