// TODO: write_file tool definition and executor
// - Define the tool schema (file_path, content parameters)
// - Implement executor that writes content to the given path
// - Create parent directories if they don't exist
// - Handle permission errors

import type { ToolRegistryEntry } from "../types.js";

export const writeFileTool: ToolRegistryEntry = {
  definition: {
    name: "write_file",
    description: "Write content to a file at the given path. Creates parent directories if needed.",
    input_schema: {
      type: "object" as const,
      properties: {
        file_path: {
          type: "string",
          description: "The path to the file to write",
        },
        content: {
          type: "string",
          description: "The content to write to the file",
        },
      },
      required: ["file_path", "content"],
    },
  },
  execute: async (_input: Record<string, unknown>): Promise<string> => {
    // TODO: Write content to file, creating parent dirs as needed
    throw new Error("Not implemented");
  },
};
