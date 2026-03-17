#!/usr/bin/env node

import { Command } from "commander";
import type Anthropic from "@anthropic-ai/sdk";
import chalk from "chalk";
import { createClient } from "./api.js";
import { runAgentLoop } from "./agent.js";
import { ContextManager } from "./context/manager.js";
import { compactMessages } from "./context/compaction.js";
import { createInputInterface, promptUser } from "./ui/input.js";
import { renderAssistantMessage, renderToolCall, renderToolResult, renderError, renderTokenUsage } from "./ui/display.js";
import { Spinner } from "./ui/spinner.js";

const program = new Command();

program
  .name("ccclone")
  .description("A minimal clone of Claude Code — terminal-based coding assistant")
  .version("0.1.0")
  .option("-p, --prompt <text>", "Run a single prompt and exit (non-interactive mode)");

program.parse();

const options = program.opts();

let client: Anthropic;
try {
  client = createClient();
} catch (err) {
  renderError((err as Error).message);
  process.exit(1);
}

const contextManager = new ContextManager();

if (options.prompt) {
  runPromptMode(options.prompt as string);
} else {
  runInteractiveMode();
}

async function runPromptMode(prompt: string): Promise<void> {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];
  const spinner = new Spinner();
  let spinnerActive = true;
  spinner.start();

  try {
    const streamedChunks: string[] = [];
    const result = await runAgentLoop(
      client,
      messages,
      (text) => {
        if (spinnerActive) {
          spinner.stop();
          spinnerActive = false;
        }
        streamedChunks.push(text);
        process.stdout.write(chalk.white(text));
      },
      (toolName, input) => {
        if (spinnerActive) {
          spinner.stop();
          spinnerActive = false;
        }
        renderToolCall(toolName, input);
      },
      (toolName, result) => {
        renderToolResult(toolName, result);
      }
    );

    process.stdout.write("\n");
    contextManager.updateUsage({
      input_tokens: result.usage.inputTokens,
      output_tokens: result.usage.outputTokens,
    });
  } catch (err) {
    spinner.stop();
    renderError((err as Error).message);
    process.exit(1);
  }
}

async function runInteractiveMode(): Promise<void> {
  console.log(chalk.bold("ccclone") + chalk.dim(" — interactive mode"));
  console.log(chalk.dim("Type /help for commands, Ctrl+C to exit.\n"));

  const rl = createInputInterface();
  const messages: Anthropic.MessageParam[] = [];
  const spinner = new Spinner();
  let isProcessing = false;
  let currentAbortController: AbortController | null = null;

  process.on("SIGINT", () => {
    if (isProcessing) {
      spinner.stop();
      isProcessing = false;
      if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
      }
      console.log(chalk.dim("\n  (cancelled)"));
      rl.prompt();
    } else {
      console.log(chalk.dim("\nGoodbye!"));
      rl.close();
      process.exit(0);
    }
  });

  const promptLoop = async () => {
    while (true) {
      let input: string;
      try {
        input = await promptUser(rl);
      } catch {
        // readline closed (e.g., Ctrl+D)
        console.log(chalk.dim("\nGoodbye!"));
        break;
      }

      const trimmed = input.trim();
      if (!trimmed) continue;

      if (trimmed === "exit" || trimmed === "quit") {
        console.log(chalk.dim("\nGoodbye!"));
        rl.close();
        process.exit(0);
      }

      if (trimmed.startsWith("/")) {
        const handled = handleSlashCommand(trimmed, messages, rl);
        if (handled) continue;
      }

      messages.push({ role: "user", content: trimmed });
      isProcessing = true;
      let spinnerActive = true;
      spinner.start();
      currentAbortController = new AbortController();

      try {
        const streamedChunks: string[] = [];
        const result = await runAgentLoop(
          client,
          messages,
          (text) => {
            if (spinnerActive) {
              spinner.stop();
              spinnerActive = false;
            }
            streamedChunks.push(text);
            process.stdout.write(chalk.white(text));
          },
          (toolName, input) => {
            if (spinnerActive) {
              spinner.stop();
              spinnerActive = false;
            }
            renderToolCall(toolName, input);
          },
          (toolName, result) => {
            renderToolResult(toolName, result);
            // Reset so streamedChunks only tracks the final response after all tool calls
            streamedChunks.length = 0;
          },
          currentAbortController.signal
        );

        // Re-render final response with markdown
        if (result.response) {
          const cols = process.stdout.columns || 80;
          let displayedLines = 0;
          for (const line of streamedChunks.join("").split("\n")) {
            displayedLines += Math.max(1, Math.ceil((line.length || 1) / cols));
          }
          process.stdout.write(`\x1b[${displayedLines}A\x1b[J`);
          renderAssistantMessage(result.response);
        } else {
          process.stdout.write("\n");
        }
        contextManager.updateUsage({
          input_tokens: result.usage.inputTokens,
          output_tokens: result.usage.outputTokens,
        });
        const usage = contextManager.getUsage();
        renderTokenUsage(usage.inputTokens, usage.outputTokens);

        if (contextManager.needsCompaction()) {
          console.log(chalk.yellow("  [compacting context...]"));
          const compacted = await compactMessages(client, messages);
          messages.length = 0;
          messages.push(...compacted);
          contextManager.reset();
        }
      } catch (err) {
        spinner.stop();
        const message = (err as Error).message || "";
        if (!message.includes("abort") && !message.includes("cancel")) {
          renderError(message);
        }
      }

      currentAbortController = null;
      isProcessing = false;
      console.log();
    }
  };

  await promptLoop();
}

function handleSlashCommand(
  input: string,
  messages: Anthropic.MessageParam[],
  rl: ReturnType<typeof createInputInterface>
): boolean {
  const cmd = input.toLowerCase();

  if (cmd === "/help") {
    console.log(chalk.bold("\nAvailable commands:"));
    console.log("  /help   — Show this help message");
    console.log("  /clear  — Clear conversation history");
    console.log("  /exit   — Exit the program");
    console.log("  Ctrl+C  — Cancel current response or exit\n");
    return true;
  }

  if (cmd === "/clear") {
    messages.length = 0;
    contextManager.reset();
    console.log(chalk.green("  Conversation cleared.\n"));
    return true;
  }

  if (cmd === "/exit" || cmd === "/quit") {
    console.log(chalk.dim("\nGoodbye!"));
    rl.close();
    process.exit(0);
  }

  console.log(chalk.yellow(`  Unknown command: ${input}. Type /help for available commands.\n`));
  return true;
}
