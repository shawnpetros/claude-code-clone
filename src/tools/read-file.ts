import { readFile } from "node:fs/promises";
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
  execute: async (input: Record<string, unknown>): Promise<string> => {
    const filePath = input.file_path as string;
    try {
      const content = await readFile(filePath, "utf-8");
      return content;
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e.code === "ENOENT") {
        return `Error: File not found: ${filePath}`;
      }
      if (e.code === "EACCES") {
        return `Error: Permission denied: ${filePath}`;
      }
      return `Error reading file: ${e.message}`;
    }
  },
};
