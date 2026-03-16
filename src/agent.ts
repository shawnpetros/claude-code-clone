import type Anthropic from "@anthropic-ai/sdk";
import type { AgentLoopResult } from "./types.js";
import { streamMessage } from "./api.js";
import { getToolDefinitions, executeTool } from "./tools/index.js";

export async function runAgentLoop(
  client: Anthropic,
  messages: Anthropic.MessageParam[],
  onText?: (text: string) => void,
  onToolUse?: (toolName: string, input: Record<string, unknown>) => void,
  onToolResult?: (toolName: string, result: string) => void,
  signal?: AbortSignal
): Promise<AgentLoopResult> {
  const tools = getToolDefinitions();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  while (true) {
    const response = await streamMessage(client, messages, tools, onText, signal);
    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

    messages.push({ role: "assistant", content: response.content });

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ContentBlockParam & { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } =>
        block.type === "tool_use"
    );

    if (toolUseBlocks.length === 0) {
      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === "text"
      );
      const responseText = textBlocks.map((b) => b.text).join("\n");

      return {
        response: responseText,
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          totalTokens: totalInputTokens + totalOutputTokens,
        },
      };
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUseBlocks) {
      onToolUse?.(toolUse.name, toolUse.input);
      let result: string;
      let isError = false;
      try {
        result = await executeTool(toolUse.name, toolUse.input);
      } catch (err) {
        result = `Error: ${(err as Error).message}`;
        isError = true;
      }
      onToolResult?.(toolUse.name, result);
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result,
        is_error: isError,
      });
    }

    messages.push({ role: "user", content: toolResults });
    onText?.("\n");
  }
}
