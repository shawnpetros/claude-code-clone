// TODO: Context compaction — summarize old messages when context is nearly full
// - Take conversation messages array
// - Send to Claude with "summarize this conversation so far" prompt
// - Replace old messages with a single summary message
// - Return compacted messages array

import type Anthropic from "@anthropic-ai/sdk";

export async function compactMessages(
  client: Anthropic,
  messages: Anthropic.MessageParam[]
): Promise<Anthropic.MessageParam[]> {
  // TODO: Summarize old messages and return compacted array
  throw new Error("Not implemented");
}
