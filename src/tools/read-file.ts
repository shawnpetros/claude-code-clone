// TODO: read_file tool definition and executor
// - Define the tool schema (file_path parameter)
// - Implement executor that reads file contents and returns them
// - Handle file not found and permission errors

import type { ToolRegistryEntry } from "../types.js";

export const readFileTool: ToolRegistryEntry = {
  definition: {
    name: "read_file",
    description: "Read the contents of a file at the given path.",
    input_schema: {
      type: "object" as const,
      properties: {
        file_path: {
          type: "string",
          description: "The path to the file to read",
        },
      },
      required: ["file_path"],
    },
  },
  execute: async (_input: Record<string, unknown>): Promise<string> => {
    // TODO: Read and return file contents
    throw new Error("Not implemented");
  },
};
