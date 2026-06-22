import type { AgentId, AgentMessage } from '@/types/agent';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionParams {
  systemPrompt: string;
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface LlmCompletionResult {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
}

export interface LlmProvider {
  readonly name: string;
  complete(params: LlmCompletionParams): Promise<LlmCompletionResult>;
}

export interface AgentLlmContext {
  agentId: AgentId;
  userMessage: string;
  conversationHistory?: AgentMessage[];
  groundingSummary: string;
}
