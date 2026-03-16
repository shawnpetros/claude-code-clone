# Initializer Agent Prompt

You are the initializer for a software project. Your job is to create the project scaffolding, a comprehensive feature list, and startup scripts. You will NOT implement any features — only set up the structure.

## Project Description

Build "ccclone" — a minimal clone of Claude Code (Anthropic's CLI coding agent). It is a terminal-based interactive coding assistant that:

- Is invoked as a CLI command (`npx tsx src/cli.ts` during dev, eventually a compiled binary)
- Opens an interactive REPL in the terminal
- Takes user input, sends it to the Claude API with tool definitions
- Streams back the response token-by-token
- When the model returns tool_use blocks, executes the tools and sends results back
- Loops (model calls tools → execute → send result → model responds) until the model produces a final text response
- Displays formatted output with markdown rendering and syntax highlighting
- Tracks token usage and compacts context when approaching the limit
- Supports a non-interactive mode (`-p "prompt"`) that runs a single prompt and exits

## Technology Stack (use exactly these)

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 20+
- **Build/Run**: tsx (for development), tsup (for building)
- **API**: @anthropic-ai/sdk (official Anthropic SDK)
- **Terminal Input**: Node.js built-in `readline` module
- **Terminal Colors**: chalk (v5, ESM)
- **Markdown Rendering**: marked + marked-terminal
- **CLI Argument Parsing**: commander
- **No TUI frameworks** — no ink, no blessed. Just readline + stdout writes + ANSI escape codes.

## What You Must Create

### 1. `package.json`

A valid package.json with:
- name: "ccclone"
- type: "module" (ESM)
- All dependencies listed above
- Scripts: "dev" (tsx src/cli.ts), "build" (tsup src/cli.ts --format esm)
- bin field pointing to dist/cli.js

### 2. `tsconfig.json`

TypeScript config with:
- target: ES2022
- module: NodeNext
- moduleResolution: NodeNext
- strict: true
- outDir: dist
- rootDir: src

### 3. Directory structure

```
src/
  cli.ts          — entry point, argument parsing, starts REPL or runs -p mode
  agent.ts        — the core agent loop (send messages, handle tool calls, loop)
  api.ts          — Anthropic SDK client setup, message sending, streaming
  tools/
    index.ts      — tool registry, exports all tool definitions and executors
    read-file.ts  — read_file tool definition and executor
    write-file.ts — write_file tool definition and executor
    edit-file.ts  — edit_file tool (string replacement)
    bash.ts       — bash tool definition and executor
  ui/
    display.ts    — render assistant messages, format markdown, syntax highlight
    input.ts      — readline-based user input handling
    spinner.ts    — simple spinner/loading indicator
  context/
    manager.ts    — token counting, context window tracking
    compaction.ts — summarize old messages when context is nearly full
  types.ts        — shared TypeScript types/interfaces
  constants.ts    — model name, max tokens, system prompt text
```

Create every file listed above with ONLY:
- The appropriate imports (can be empty/placeholder)
- A single TODO comment describing what the file should do
- Exported placeholder functions/classes with the right signatures where obvious (e.g., `export async function runAgentLoop() { /* TODO */ }`)

Do NOT implement any logic. Just stubs.

### 4. `init.sh`

A shell script that:
```bash
#!/bin/bash
set -e
npm install
echo "Dependencies installed. Run 'npx tsx src/cli.ts' to start."
```

### 5. `claude-progress.txt`

Create with this content:
```
# ccclone - Claude Code Clone
## Progress Log

### Session 0 (Initializer)
- Created project scaffolding
- Set up TypeScript configuration
- Created stub files for all modules
- Generated feature_list.json with all features
- Made initial git commit
```

### 6. `feature_list.json`

A JSON array of feature objects. Each feature has this shape:

```json
{
  "id": 1,
  "category": "setup | core | tools | ui | streaming | context | cli | polish",
  "description": "Human-readable description of the feature",
  "steps": [
    "Step 1 to verify this feature works",
    "Step 2...",
    "Step 3..."
  ],
  "passes": false,
  "depends_on": []
}
```

Generate features in implementation order. A feature should only depend on features with lower IDs. Here are ALL the features to include — generate one JSON object for each, with detailed verification steps:

**Setup (IDs 1-3)**
1. Project compiles with `npx tsx src/cli.ts` without errors (even if it does nothing)
2. Running `npx tsx src/cli.ts --help` shows usage information (using commander)
3. Running `npx tsx src/cli.ts -p "hello"` accepts input (can print placeholder response for now)

**Core Agent Loop (IDs 4-8)**
4. `api.ts` creates an Anthropic client using ANTHROPIC_API_KEY env var
5. `api.ts` can send a simple message to Claude and get a response (no streaming, no tools)
6. The REPL in `cli.ts` reads user input, calls the API, and prints the raw response text
7. `agent.ts` implements the agent loop: send message → if tool_use in response, execute tool, append result, re-send → if text only, return. (Start with empty tool list, so it just returns text.)
8. The REPL uses the agent loop instead of direct API calls. Conversation history (messages array) persists across turns within a session.

**Tools (IDs 9-15)**
9. `tools/read-file.ts` defines the read_file tool schema and implements its executor (reads file, returns contents)
10. `tools/write-file.ts` defines write_file tool schema and executor (writes content to path, creates parent dirs)
11. `tools/edit-file.ts` defines edit_file tool schema and executor (old_string → new_string replacement)
12. `tools/bash.ts` defines bash tool schema and executor (runs command via child_process, returns stdout+stderr)
13. `tools/index.ts` exports a registry: array of tool definitions, and a `executeTool(name, input)` dispatch function
14. Tool definitions are passed to the API call in `api.ts`
15. When the agent loop sees tool_use blocks, it calls `executeTool()` and appends tool_result messages correctly. Verify: ask "read the file package.json" and it should use the read_file tool and show the contents.

**Streaming (IDs 16-19)**
16. `api.ts` supports streaming responses using `client.messages.stream()`. Tokens are printed as they arrive.
17. Streaming works for text-only responses (tokens appear one by one in terminal)
18. Streaming correctly handles tool_use blocks — accumulates the full tool call, then executes it after the stream ends
19. After a tool result is sent back, the next response also streams

**UI / Display (IDs 20-26)**
20. User input is prompted with a visible indicator (e.g., "> " or "You: ")
21. Assistant responses are visually distinct from user input (different color)
22. Markdown in responses is rendered in the terminal (headers, bold, italic, lists)
23. Code blocks in responses have syntax highlighting
24. A spinner/loading indicator shows while waiting for API response
25. Tool calls are displayed to the user (e.g., "Reading file: package.json...")
26. Tool results are shown (or summarized) before the assistant's next response

**Context Management (IDs 27-31)**
27. `context/manager.ts` tracks the total token count of the conversation (using response.usage from API)
28. Token count is displayed somewhere visible (e.g., in the prompt line or a status line)
29. `context/compaction.ts` implements compaction: takes old messages, sends them to Claude with "summarize this conversation so far", replaces them with the summary
30. When token count exceeds 80% of the model's context window, compaction is triggered automatically
31. After compaction, the conversation continues normally — the user doesn't notice except the token count drops

**CLI Features (IDs 32-35)**
32. `-p "prompt"` mode: runs a single prompt through the agent loop, prints result, exits (non-interactive)
33. `/help` command in REPL shows available commands
34. `/clear` command starts a fresh conversation (resets messages array)
35. Ctrl+C during generation cancels the current response gracefully (doesn't crash the process)

**Error Handling (IDs 36-40)**
36. Missing ANTHROPIC_API_KEY shows a helpful error message and exits
37. API errors (rate limit, network failure) are caught and displayed as user-friendly messages, then the REPL continues
38. Tool execution errors (file not found, permission denied, command fails) are caught and sent back to Claude as error tool_results so it can adapt
39. Malformed tool call arguments are handled gracefully (send error tool_result back)
40. If the edit_file tool's old_string is not found in the file, return an error (don't silently fail)

Generate exactly 40 features with IDs 1-40. Order them exactly as listed above. Set all `passes` to `false`. Fill in `depends_on` logically (e.g., feature 6 depends on [4, 5], feature 15 depends on [9, 10, 11, 12, 13, 14], etc.).

### 7. After creating all files

Run:
```bash
npm install
git add -A
git commit -m "Initial project scaffolding with feature list"
```

## CRITICAL RULES

- Do NOT implement any feature logic. Only stubs and placeholders.
- Do NOT skip any file in the directory structure.
- Do NOT add dependencies beyond what's listed above.
- The project MUST compile with `npx tsx src/cli.ts` after you're done (even if it exits immediately or prints a placeholder).
- Make sure feature_list.json is valid JSON.
