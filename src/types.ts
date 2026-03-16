// TODO: Define shared TypeScript types and interfaces for the application
// - Message types (user, assistant, tool_use, tool_result)
// - Tool definition and executor types
// - Agent loop state types
// - Configuration types

import type Anthropic from "@anthropic-ai/sdk";

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Anthropic.Tool["input_schema"];
}

export interface ToolExecutor {
  (input: Record<string, unknown>): Promise<string>;
}

export interface ToolRegistryEntry {
  definition: ToolDefinition;
  execute: ToolExecutor;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface AgentLoopResult {
  response: string;
  usage: TokenUsage;
}
