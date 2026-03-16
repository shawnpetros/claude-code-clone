import chalk from "chalk";
import { Marked } from "marked";
import { markedTerminal } from "marked-terminal";

const marked = new Marked(markedTerminal() as Parameters<Marked["use"]>[0]);

export function renderAssistantMessage(text: string): void {
  const rendered = marked.parse(text);
  if (typeof rendered === "string") {
    process.stdout.write(rendered);
  }
}

export function renderToolCall(toolName: string, input: Record<string, unknown>): void {
  let detail = "";
  if (toolName === "read_file" && input.file_path) {
    detail = ` ${input.file_path}`;
  } else if (toolName === "write_file" && input.file_path) {
    detail = ` ${input.file_path}`;
  } else if (toolName === "edit_file" && input.file_path) {
    detail = ` ${input.file_path}`;
  } else if (toolName === "bash" && input.command) {
    detail = ` \`${input.command}\``;
  }
  console.log(chalk.cyan(`  ⚡ ${toolName}${detail}`));
}

export function renderToolResult(toolName: string, result: string): void {
  const maxLen = 200;
  const truncated = result.length > maxLen ? result.slice(0, maxLen) + "..." : result;
  console.log(chalk.dim(`  ↳ ${truncated.split("\n")[0]}`));
}

export function renderError(message: string): void {
  let friendly = message;
  if (message.includes("authentication_error")) {
    friendly = "Invalid API key. Please check your ANTHROPIC_API_KEY.";
  } else if (message.includes("rate_limit")) {
    friendly = "Rate limited by the API. Please wait a moment and try again.";
  } else if (message.includes("overloaded")) {
    friendly = "The API is currently overloaded. Please try again shortly.";
  } else if (message.includes("ENOTFOUND") || message.includes("ECONNREFUSED")) {
    friendly = "Network error. Please check your internet connection.";
  }
  console.error(chalk.red(`Error: ${friendly}`));
}

export function renderTokenUsage(inputTokens: number, outputTokens: number): void {
  console.log(chalk.dim(`  [tokens: ${inputTokens} in / ${outputTokens} out]`));
}
