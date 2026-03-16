// TODO: Tool registry — exports all tool definitions and executors
// - Import all tool modules
// - Export array of tool definitions for the API
// - Export executeTool(name, input) dispatch function

import type Anthropic from "@anthropic-ai/sdk";
import type { ToolRegistryEntry } from "../types.js";
import { readFileTool } from "./read-file.js";
import { writeFileTool } from "./write-file.js";
import { editFileTool } from "./edit-file.js";
import { bashTool } from "./bash.js";

const toolRegistry: ToolRegistryEntry[] = [
  readFileTool,
  writeFileTool,
  editFileTool,
  bashTool,
];

export function getToolDefinitions(): Anthropic.Tool[] {
  // TODO: Return tool definitions formatted for the Anthropic API
  return toolRegistry.map((t) => ({
    name: t.definition.name,
    description: t.definition.description,
    input_schema: t.definition.input_schema,
  }));
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  // TODO: Find the tool by name and execute it
  const tool = toolRegistry.find((t) => t.definition.name === name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return tool.execute(input);
}
