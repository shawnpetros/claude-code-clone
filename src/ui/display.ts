// TODO: Render assistant messages with formatting
// - Render markdown in terminal (using marked + marked-terminal)
// - Apply syntax highlighting to code blocks
// - Color assistant output differently from user input
// - Display tool call names and results

export function renderAssistantMessage(text: string): void {
  // TODO: Render markdown-formatted text to terminal
  console.log(text);
}

export function renderToolCall(toolName: string, input: Record<string, unknown>): void {
  // TODO: Display tool call info (e.g., "Reading file: package.json...")
  console.log(`[Tool: ${toolName}]`);
}

export function renderToolResult(toolName: string, result: string): void {
  // TODO: Display or summarize tool result
  console.log(`[Result from ${toolName}]`);
}

export function renderError(message: string): void {
  // TODO: Display error message in red
  console.error(message);
}
