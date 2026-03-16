import Anthropic from "@anthropic-ai/sdk";
import { MODEL_NAME, MAX_OUTPUT_TOKENS, SYSTEM_PROMPT } from "./constants.js";

export function createClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set.\n" +
      "Please set it with: export ANTHROPIC_API_KEY=your-api-key"
    );
  }
  return new Anthropic({ apiKey });
}

export async function sendMessage(
  client: Anthropic,
  messages: Anthropic.MessageParam[],
  tools?: Anthropic.Tool[]
): Promise<Anthropic.Message> {
  return client.messages.create({
    model: MODEL_NAME,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    messages,
    ...(tools && tools.length > 0 ? { tools } : {}),
  });
}

export async function streamMessage(
  client: Anthropic,
  messages: Anthropic.MessageParam[],
  tools?: Anthropic.Tool[],
  onText?: (text: string) => void
): Promise<Anthropic.Message> {
  const stream = client.messages.stream({
    model: MODEL_NAME,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    messages,
    ...(tools && tools.length > 0 ? { tools } : {}),
  });

  if (onText) {
    stream.on("text", (text) => onText(text));
  }

  return stream.finalMessage();
}
