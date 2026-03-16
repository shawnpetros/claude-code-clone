// TODO: Anthropic SDK client setup and message sending
// - Create and export Anthropic client instance using ANTHROPIC_API_KEY
// - Function to send messages (non-streaming)
// - Function to send messages (streaming)
// - Pass tool definitions to API calls
// - Handle API errors gracefully

import Anthropic from "@anthropic-ai/sdk";

export function createClient(): Anthropic {
  // TODO: Create Anthropic client using env var ANTHROPIC_API_KEY
  throw new Error("Not implemented");
}

export async function sendMessage(
  client: Anthropic,
  messages: Anthropic.MessageParam[],
  tools?: Anthropic.Tool[]
): Promise<Anthropic.Message> {
  // TODO: Send a message to Claude and return the response
  throw new Error("Not implemented");
}

export async function streamMessage(
  client: Anthropic,
  messages: Anthropic.MessageParam[],
  tools?: Anthropic.Tool[],
  onText?: (text: string) => void
): Promise<Anthropic.Message> {
  // TODO: Stream a message to Claude, calling onText for each token
  throw new Error("Not implemented");
}
