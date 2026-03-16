// TODO: Core agent loop implementation
// - Send messages to Claude with tool definitions
// - If response contains tool_use blocks, execute tools and append results
// - Loop until model produces a final text-only response
// - Track token usage across iterations
// - Support both streaming and non-streaming modes

import type Anthropic from "@anthropic-ai/sdk";
import type { AgentLoopResult } from "./types.js";

export async function runAgentLoop(
  client: Anthropic,
  messages: Anthropic.MessageParam[],
  onText?: (text: string) => void,
  onToolUse?: (toolName: string, input: Record<string, unknown>) => void
): Promise<AgentLoopResult> {
  // TODO: Implement the agent loop
  // 1. Send messages with tool definitions
  // 2. If tool_use in response, execute tool, append tool_result, re-send
  // 3. If text only, return the response
  throw new Error("Not implemented");
}
