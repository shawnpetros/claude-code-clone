#!/usr/bin/env node

// TODO: Entry point — argument parsing, starts REPL or runs -p mode
// - Parse CLI arguments with commander (-p for prompt, --help, etc.)
// - If -p flag provided, run single prompt through agent loop and exit
// - Otherwise, start interactive REPL
// - Handle /help, /clear commands in REPL
// - Handle Ctrl+C gracefully

import { Command } from "commander";

const program = new Command();

program
  .name("ccclone")
  .description("A minimal clone of Claude Code — terminal-based coding assistant")
  .version("0.1.0")
  .option("-p, --prompt <text>", "Run a single prompt and exit (non-interactive mode)");

program.parse();

const options = program.opts();

if (options.prompt) {
  // TODO: Run single prompt through agent loop and exit
  console.log(`[Non-interactive mode] Prompt: ${options.prompt}`);
  console.log("Not yet implemented.");
} else {
  // TODO: Start interactive REPL
  console.log("ccclone — interactive mode (not yet implemented)");
  console.log("Type /help for commands, Ctrl+C to exit.");
}
