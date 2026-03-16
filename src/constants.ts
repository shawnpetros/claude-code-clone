// TODO: Define constants used throughout the application
// - Model name
// - Max token limits
// - System prompt text
// - Context window size

export const MODEL_NAME = "claude-sonnet-4-20250514";

export const MAX_OUTPUT_TOKENS = 16384;

export const CONTEXT_WINDOW_SIZE = 200000;

export const COMPACTION_THRESHOLD = 0.8; // Trigger compaction at 80% of context window

export const SYSTEM_PROMPT = `You are an AI coding assistant running in a terminal. You help users with software engineering tasks by reading, writing, and editing files, and running bash commands. Be concise and helpful. When you need to perform actions, use the available tools.`;
