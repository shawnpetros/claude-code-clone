// TODO: Readline-based user input handling
// - Create readline interface
// - Prompt user with visible indicator (e.g., "> ")
// - Handle multi-line input if needed
// - Handle Ctrl+C gracefully

import * as readline from "node:readline";

export function createInputInterface(): readline.Interface {
  // TODO: Create and configure readline interface
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

export function promptUser(rl: readline.Interface): Promise<string> {
  // TODO: Show prompt and wait for user input
  return new Promise((resolve) => {
    rl.question("> ", (answer) => {
      resolve(answer);
    });
  });
}
