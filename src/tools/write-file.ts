import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
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
  execute: async (input: Record<string, unknown>): Promise<string> => {
    const filePath = input.file_path as string;
    const content = input.content as string;
    try {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, content, "utf-8");
      return `Successfully wrote to ${filePath}`;
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e.code === "EACCES") {
        return `Error: Permission denied: ${filePath}`;
      }
      return `Error writing file: ${e.message}`;
    }
  },
};
