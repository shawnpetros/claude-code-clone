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
  return new Promise((resolve, reject) => {
    const onClose = () => reject(new Error("readline closed"));
    rl.once("close", onClose);
    rl.question("> ", (answer) => {
      rl.removeListener("close", onClose);
      resolve(answer);
    });
  });
}
