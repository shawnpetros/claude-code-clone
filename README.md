# ccclone

A minimal clone of [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — built from scratch to understand how agentic coding loops actually work under the hood.

## Why Does This Exist?

Because you can't claim to understand agentic AI by reading blog posts about it.

This project exists because I wanted to **reverse-engineer the core loop that powers tools like Claude Code, Cursor, and Codex** — not by reading their source, but by building a working version from zero. The hypothesis: if you can rebuild the engine, you actually understand the engine. If you can only describe it, you understand the blog post.

This came out of a broader study of agentic engineering — [OpenClaw's architecture](https://github.com/openclaw), Dark Factory workflows, and a growing conviction that **the agentic loop is the atomic unit of AI-assisted software engineering**. Not the model. Not the prompt. The loop: `send message → detect tool use → execute tool → feed result back → repeat until done`. Everything else is UI.

So I built one. From scratch. In TypeScript. With streaming, tool execution, context compaction, and a real REPL. Not a wrapper around an API — a working agent loop with its own tool registry, context management, and streaming architecture.

### The Meta Layer

This project is also a test case for **The Harness** — a framework for spec-driven AI development (`Spec > Split > Execute > Verify > Iterate`). The entire build was orchestrated through:

- An **initializer agent** that scaffolded the project, generated 40 features with dependency chains, and committed the skeleton — without implementing a single line of logic
- A **coding agent** that picked up features sequentially, implemented them one at a time, verified each one, and committed after every feature
- A **feature list** (`feature_list.json`) that served as the contract between agent sessions — no agent needed to know what the previous one did beyond "which features pass"

Three agent sessions. 40 features. Zero human-written implementation code. The prompts are in `/prompts/` if you want to see exactly how the sausage was made.

The point wasn't to prove "AI can code" (we know). The point was to prove that **the spec is the product** — if your feature list, dependency graph, and verification steps are precise enough, execution becomes mechanical. The human's job is the spec. The agent's job is the code.

## What It Actually Does

It's a terminal-based coding assistant. You talk to Claude. Claude talks back. When Claude needs to read a file, write a file, edit a file, or run a shell command — it does, and then keeps going until it has an answer for you.

![ccclone demo](demo/output/cli-demo.gif)

```
$ ccclone
> Read package.json and tell me what dependencies I have

⠋ Thinking...
  ▸ read_file: package.json
  ✓ Result: { "name": "ccclone", ... }

You have 5 dependencies:
- @anthropic-ai/sdk (^0.39.0) — the Anthropic API client
- chalk (^5.4.1) — terminal colors
- ...

Tokens: ↑1,247 ↓892
>
```

### Feature Inventory (40/40 passing)

| Category | Count | What |
|----------|-------|------|
| **Setup** | 3 | TypeScript compilation, CLI args, prompt mode |
| **Core** | 5 | API client, message sending, agent loop, REPL, conversation persistence |
| **Tools** | 7 | `read_file`, `write_file`, `edit_file`, `bash`, tool registry, API integration, tool execution loop |
| **Streaming** | 4 | Token-by-token output, tool_use block accumulation, post-tool streaming |
| **UI** | 7 | Input prompts, colored output, markdown rendering, syntax highlighting, spinner, tool call display |
| **Context** | 5 | Token tracking, usage display, conversation compaction, auto-trigger at 80% window, post-compaction continuity |
| **CLI** | 4 | One-shot prompt mode, `/help`, `/clear`, Ctrl+C stream cancellation |
| **Error Handling** | 5 | Missing API key, API errors, tool errors, malformed args, edit-file edge cases |

## Architecture

```
src/
├── cli.ts                 # Entry point — REPL or one-shot mode
├── api.ts                 # Anthropic SDK wrapper (streaming + non-streaming)
├── agent.ts               # The Loop. The whole point of this project.
├── types.ts               # TypeScript interfaces
├── constants.ts           # Model config, system prompt, thresholds
│
├── tools/
│   ├── index.ts           # Tool registry + dispatcher
│   ├── read-file.ts       # Read file contents
│   ├── write-file.ts      # Write file (auto-creates parent dirs)
│   ├── edit-file.ts       # Find-and-replace editing
│   └── bash.ts            # Shell command execution (30s timeout)
│
├── ui/
│   ├── display.ts         # Markdown rendering, tool/error/token display
│   ├── spinner.ts         # Braille animation spinner
│   └── input.ts           # Readline-based input
│
└── context/
    ├── manager.ts         # Token counting + compaction threshold
    └── compaction.ts      # Conversation summarization via API
```

The interesting file is `agent.ts`. That's the agentic loop — the thing this whole project exists to demystify. Here's the core logic, stripped to its essence:

```
while true:
    response = stream_to_claude(conversation, tools)

    if response has tool_use blocks:
        for each tool_use:
            result = execute_tool(tool_use.name, tool_use.input)
            append tool_result to conversation
        continue  ← go around again, let Claude see what happened

    else:
        return response.text  ← done, no more tools needed
```

That's it. That's the whole agentic loop. Everything else — streaming, UI, context management, error handling — is plumbing. Important plumbing, but plumbing.

## Running It Locally

### Prerequisites

- **Node.js 20+** (ES2022 target, ESM modules)
- **An Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)
- **A terminal** (the fancier the better, but any will do)
- **A bash shell** (the `bash` tool shells out to it)

### Setup

```bash
# Clone it
git clone https://github.com/yourusername/claude-code-clone.git
cd claude-code-clone

# Install dependencies
npm install

# Set your API key
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

### Run

```bash
# Interactive REPL (the full experience)
npm run dev

# One-shot prompt (ask one thing, get one answer, exit)
npm run dev -- -p "What files are in this directory?"

# Build for production
npm run build

# Run the built version
node dist/cli.js
```

### REPL Commands

| Command | What it does |
|---------|-------------|
| `/help` | Show available commands |
| `/clear` | Nuke conversation history, start fresh |
| `/exit` | Exit the REPL (also: `exit`, `quit`, `/quit`) |
| `Ctrl+C` | Cancel the current streaming response |
| `Ctrl+D` | Exit |

### Configuration

All tunables live in `src/constants.ts`:

| Constant | Default | What |
|----------|---------|------|
| `MODEL_NAME` | `claude-sonnet-4-20250514` | Which Claude model to use |
| `MAX_OUTPUT_TOKENS` | `16384` | Max tokens per response |
| `CONTEXT_WINDOW_SIZE` | `200000` | Context window size (200k) |
| `COMPACTION_THRESHOLD` | `0.8` | Trigger compaction at 80% of window |

### What Will It Cost?

Each conversation turn costs API tokens. Sonnet is priced at $3/M input, $15/M output (as of early 2025). A typical interactive session might run $0.05–0.50 depending on how many tool calls and how long the conversation goes. Context compaction helps keep long sessions from blowing up your bill.

## The Build Process (For the Curious)

This project was built using a three-session agentic pipeline:

1. **Session 0 — Initializer**: A scaffolding agent created the project structure, generated all 40 feature specifications with verification steps and dependency graphs, and committed the skeleton. Zero implementation code.

2. **Session 1 — Coding Agent (run 1)**: Picked up the feature list, implemented features sequentially (respecting dependency order), verified each one, committed after every feature. Got through the bulk of the implementation.

3. **Session 2 — Coding Agent (run 2)**: Finished remaining features, ran the full test suite (87 assertions), polished UI, and verified all 40 features passing.

The agent prompts that drove each session are in the `/prompts/` directory. The session logs are in `/.harness-logs/`. The feature list with all verification steps is in `feature_list.json`.

**The whole thing is an exercise in spec-driven development**: write a precise enough spec, and execution becomes a solved problem. The spec *is* the hard part. Always was.

## What This Isn't

- **Not a replacement for Claude Code.** The real thing has permissions, MCP servers, git integration, multi-model routing, and about 10,000 other features. This is a teaching tool.
- **Not production software.** There's no authentication beyond the API key, no sandboxing of the bash tool (it will happily `rm -rf /` if Claude asks it to), and no persistence.
- **Not a prompt engineering demo.** The system prompt is 2 sentences. The architecture does the work, not the prompt.

## What This Is

A 700-line proof that the agentic loop is simple, that spec-driven development works, and that understanding the tools you use makes you better at using them.

If you're building with AI coding tools and you've never looked under the hood — clone this, read `agent.ts`, and run it. You'll never think about Claude Code the same way again.

## License

MIT. Do whatever you want with it. Learn from it. Break it. Make it better.
