import { exec } from "node:child_process";
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
  execute: async (input: Record<string, unknown>): Promise<string> => {
    const command = input.command as string;
    return new Promise((resolve) => {
      exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
        const output = [stdout, stderr].filter(Boolean).join("\n");
        if (error && !output) {
          resolve(`Error: ${error.message}`);
          return;
        }
        resolve(output || "(no output)");
      });
    });
  },
};
