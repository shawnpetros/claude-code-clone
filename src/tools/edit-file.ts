import { readFile, writeFile } from "node:fs/promises";
import type { ToolRegistryEntry } from "../types.js";

export const editFileTool: ToolRegistryEntry = {
  definition: {
    name: "edit_file",
    description: "Edit a file by replacing old_string with new_string.",
    input_schema: {
      type: "object" as const,
      properties: {
        file_path: {
          type: "string",
          description: "The path to the file to edit",
        },
        old_string: {
          type: "string",
          description: "The string to find and replace",
        },
        new_string: {
          type: "string",
          description: "The string to replace old_string with",
        },
      },
      required: ["file_path", "old_string", "new_string"],
    },
  },
  execute: async (input: Record<string, unknown>): Promise<string> => {
    const filePath = input.file_path as string;
    const oldString = input.old_string as string;
    const newString = input.new_string as string;
    try {
      const content = await readFile(filePath, "utf-8");
      if (!content.includes(oldString)) {
        return `Error: The string to replace was not found in ${filePath}`;
      }
      const updated = content.replace(oldString, newString);
      await writeFile(filePath, updated, "utf-8");
      return `Successfully edited ${filePath}`;
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e.code === "ENOENT") {
        return `Error: File not found: ${filePath}`;
      }
      if (e.code === "EACCES") {
        return `Error: Permission denied: ${filePath}`;
      }
      return `Error editing file: ${e.message}`;
    }
  },
};
