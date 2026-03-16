// TODO: bash tool definition and executor
// - Define the tool schema (command parameter)
// - Implement executor that runs command via child_process
// - Return stdout and stderr combined
// - Handle execution errors and timeouts

import type { ToolRegistryEntry } from "../types.js";

export const bashTool: ToolRegistryEntry = {
  definition: {
    name: "bash",
    description: "Run a bash command and return the output (stdout and stderr).",
    input_schema: {
      type: "object" as const,
      properties: {
        command: {
          type: "string",
          description: "The bash command to execute",
        },
      },
      required: ["command"],
    },
  },
  execute: async (_input: Record<string, unknown>): Promise<string> => {
    // TODO: Execute command via child_process and return output
    throw new Error("Not implemented");
  },
};
