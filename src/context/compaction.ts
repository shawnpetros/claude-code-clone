import type Anthropic from "@anthropic-ai/sdk";
import { sendMessage } from "../api.js";

export async function compactMessages(
  client: Anthropic,
  messages: Anthropic.MessageParam[]
): Promise<Anthropic.MessageParam[]> {
  if (messages.length <= 4) {
    return messages;
  }

  const oldMessages = messages.slice(0, -4);
  const recentMessages = messages.slice(-4);

  const summaryPrompt: Anthropic.MessageParam[] = [
    {
      role: "user",
      content:
        "Summarize the following conversation concisely, preserving: key decisions made, file paths discussed, current state of work, any errors encountered, and important context. Be thorough but brief.\n\n" +
        oldMessages
          .map((m) => {
            const content =
              typeof m.content === "string"
                ? m.content
                : JSON.stringify(m.content);
            return `${m.role}: ${content}`;
          })
          .join("\n\n"),
    },
  ];

  const response = await sendMessage(client, summaryPrompt);
  const summaryText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return [
    {
      role: "user",
      content: `[Previous conversation summary: ${summaryText}]`,
    },
    {
      role: "assistant",
      content: "Understood. I have the context from our previous conversation. How can I help?",
    },
    ...recentMessages,
  ];
}
