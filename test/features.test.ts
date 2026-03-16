#!/usr/bin/env npx tsx
/**
 * Feature verification tests for ccclone.
 * Uses mocks for API-dependent features to verify code logic.
 */

import { ContextManager } from "../src/context/manager.js";
import { getToolDefinitions, executeTool } from "../src/tools/index.js";
import { renderError, renderToolCall, renderToolResult, renderTokenUsage } from "../src/ui/display.js";
import { writeFile, readFile, unlink, mkdir, rmdir } from "node:fs/promises";
import { join } from "node:path";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ ${message}`);
  }
}

async function testFeature5(): Promise<void> {
  console.log("\n--- Feature 5: api.ts sendMessage ---");

  // Verify the function exists and has correct signature
  const { sendMessage } = await import("../src/api.js");
  assert(typeof sendMessage === "function", "sendMessage is a function");

  // Create a mock client that returns a valid response
  const mockResponse = {
    id: "msg_mock",
    type: "message" as const,
    role: "assistant" as const,
    content: [{ type: "text" as const, text: "Hello! How can I help?" }],
    model: "claude-sonnet-4-20250514",
    stop_reason: "end_turn" as const,
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 8 },
  };

  const mockClient = {
    messages: {
      create: async () => mockResponse,
      stream: () => {
        throw new Error("should not be called");
      },
    },
  } as any;

  const result = await sendMessage(mockClient, [{ role: "user", content: "hello" }]);
  assert(result.content.length > 0, "Response has content");
  assert(result.content[0].type === "text", "Response content is text");
  assert(result.usage.input_tokens > 0, "Response has input_tokens");
  assert(result.usage.output_tokens > 0, "Response has output_tokens");
}

async function testFeature7(): Promise<void> {
  console.log("\n--- Feature 7: agent.ts agent loop ---");

  const { runAgentLoop } = await import("../src/agent.js");
  assert(typeof runAgentLoop === "function", "runAgentLoop is a function");

  // Mock client that returns a text-only response (no tools)
  const mockResponse = {
    id: "msg_mock",
    type: "message" as const,
    role: "assistant" as const,
    content: [{ type: "text" as const, text: "The answer is 42." }],
    model: "claude-sonnet-4-20250514",
    stop_reason: "end_turn" as const,
    stop_sequence: null,
    usage: { input_tokens: 15, output_tokens: 10 },
  };

  // Mock streamMessage via mock client that works with the stream API
  const mockStream = {
    on: (event: string, cb: (text: string) => void) => {
      if (event === "text") cb("The answer is 42.");
    },
    finalMessage: async () => mockResponse,
  };

  const mockClient = {
    messages: {
      create: async () => mockResponse,
      stream: () => mockStream,
    },
  } as any;

  const messages: any[] = [{ role: "user", content: "What is the meaning of life?" }];
  const collectedText: string[] = [];

  const result = await runAgentLoop(
    mockClient,
    messages,
    (text) => collectedText.push(text),
  );

  assert(result.response === "The answer is 42.", "Agent loop returns text response");
  assert(result.usage.inputTokens === 15, "Agent loop returns input token count");
  assert(result.usage.outputTokens === 10, "Agent loop returns output token count");
  assert(result.usage.totalTokens === 25, "Agent loop returns total token count");
}

async function testFeature7WithTools(): Promise<void> {
  console.log("\n--- Feature 7 (with tools): agent loop executes tools ---");

  const { runAgentLoop } = await import("../src/agent.js");

  let callCount = 0;

  // First call returns tool_use, second call returns text
  const toolUseResponse = {
    id: "msg_mock1",
    type: "message" as const,
    role: "assistant" as const,
    content: [
      {
        type: "tool_use" as const,
        id: "toolu_123",
        name: "read_file",
        input: { file_path: "package.json" },
      },
    ],
    model: "claude-sonnet-4-20250514",
    stop_reason: "tool_use" as const,
    stop_sequence: null,
    usage: { input_tokens: 20, output_tokens: 15 },
  };

  const textResponse = {
    id: "msg_mock2",
    type: "message" as const,
    role: "assistant" as const,
    content: [{ type: "text" as const, text: "The package name is ccclone." }],
    model: "claude-sonnet-4-20250514",
    stop_reason: "end_turn" as const,
    stop_sequence: null,
    usage: { input_tokens: 50, output_tokens: 12 },
  };

  const mockClient = {
    messages: {
      create: async () => {
        callCount++;
        return callCount === 1 ? toolUseResponse : textResponse;
      },
      stream: () => {
        callCount++;
        const response = callCount === 1 ? toolUseResponse : textResponse;
        return {
          on: (_event: string, _cb: (text: string) => void) => {
            // For text response, emit text
            if (response.content[0].type === "text" && _event === "text") {
              _cb((response.content[0] as any).text);
            }
          },
          finalMessage: async () => response,
        };
      },
    },
  } as any;

  const messages: any[] = [{ role: "user", content: "Read package.json" }];
  const toolCalls: string[] = [];
  const toolResults: string[] = [];

  const result = await runAgentLoop(
    mockClient,
    messages,
    undefined,
    (toolName) => toolCalls.push(toolName),
    (toolName, result) => toolResults.push(`${toolName}: ${result.slice(0, 50)}`),
  );

  assert(toolCalls.length === 1, "One tool was called");
  assert(toolCalls[0] === "read_file", "read_file tool was called");
  assert(toolResults.length === 1, "One tool result was returned");
  assert(result.response === "The package name is ccclone.", "Final text response is correct");
  assert(result.usage.inputTokens === 70, "Cumulative input tokens are correct");
  assert(result.usage.outputTokens === 27, "Cumulative output tokens are correct");
}

async function testFeature14(): Promise<void> {
  console.log("\n--- Feature 14: Tool definitions format ---");

  const tools = getToolDefinitions();
  assert(tools.length === 4, "4 tool definitions returned");

  for (const tool of tools) {
    assert(typeof tool.name === "string" && tool.name.length > 0, `Tool ${tool.name} has a name`);
    assert(typeof tool.description === "string" && tool.description.length > 0, `Tool ${tool.name} has description`);
    assert(tool.input_schema !== undefined, `Tool ${tool.name} has input_schema`);
    assert((tool.input_schema as any).type === "object", `Tool ${tool.name} schema type is object`);
  }

  const toolNames = tools.map((t) => t.name);
  assert(toolNames.includes("read_file"), "read_file tool exists");
  assert(toolNames.includes("write_file"), "write_file tool exists");
  assert(toolNames.includes("edit_file"), "edit_file tool exists");
  assert(toolNames.includes("bash"), "bash tool exists");
}

async function testFeature27(): Promise<void> {
  console.log("\n--- Feature 27: ContextManager tracks tokens ---");

  const cm = new ContextManager();

  const initial = cm.getUsage();
  assert(initial.inputTokens === 0, "Initial input tokens is 0");
  assert(initial.outputTokens === 0, "Initial output tokens is 0");
  assert(initial.totalTokens === 0, "Initial total tokens is 0");

  cm.updateUsage({ input_tokens: 100, output_tokens: 50 });
  const after1 = cm.getUsage();
  assert(after1.inputTokens === 100, "Input tokens updated to 100");
  assert(after1.outputTokens === 50, "Output tokens updated to 50");
  assert(after1.totalTokens === 150, "Total tokens is 150");

  cm.updateUsage({ input_tokens: 200, output_tokens: 100 });
  const after2 = cm.getUsage();
  assert(after2.inputTokens === 300, "Input tokens accumulated to 300");
  assert(after2.outputTokens === 150, "Output tokens accumulated to 150");
  assert(after2.totalTokens === 450, "Total tokens accumulated to 450");

  assert(!cm.needsCompaction(), "Does not need compaction at 300 tokens");
}

async function testFeature27Compaction(): Promise<void> {
  console.log("\n--- Feature 27 (compaction threshold): needsCompaction ---");

  const cm = new ContextManager();
  // 80% of 200000 = 160000
  cm.updateUsage({ input_tokens: 159999, output_tokens: 0 });
  assert(!cm.needsCompaction(), "Below threshold (159999) - no compaction");

  cm.updateUsage({ input_tokens: 2, output_tokens: 0 });
  assert(cm.needsCompaction(), "Above threshold (160001) - needs compaction");

  cm.reset();
  const afterReset = cm.getUsage();
  assert(afterReset.inputTokens === 0, "Reset clears input tokens");
  assert(afterReset.outputTokens === 0, "Reset clears output tokens");
  assert(!cm.needsCompaction(), "After reset - no compaction needed");
}

async function testFeature29(): Promise<void> {
  console.log("\n--- Feature 29: compactMessages ---");

  const { compactMessages } = await import("../src/context/compaction.js");
  assert(typeof compactMessages === "function", "compactMessages is a function");

  // Test with <= 4 messages (should return as-is)
  const shortMessages: any[] = [
    { role: "user", content: "hello" },
    { role: "assistant", content: "hi" },
  ];

  const mockClient = {
    messages: {
      create: async () => ({
        content: [{ type: "text", text: "Summary: user said hello, assistant said hi" }],
        usage: { input_tokens: 10, output_tokens: 10 },
      }),
    },
  } as any;

  const shortResult = await compactMessages(mockClient, shortMessages);
  assert(shortResult.length === 2, "Short conversation returned unchanged");

  // Test with > 4 messages (should compact)
  const longMessages: any[] = [
    { role: "user", content: "message 1" },
    { role: "assistant", content: "response 1" },
    { role: "user", content: "message 2" },
    { role: "assistant", content: "response 2" },
    { role: "user", content: "message 3" },
    { role: "assistant", content: "response 3" },
    { role: "user", content: "message 4" },
    { role: "assistant", content: "response 4" },
    { role: "user", content: "message 5" },
    { role: "assistant", content: "response 5" },
  ];

  const longResult = await compactMessages(mockClient, longMessages);
  assert(longResult.length < longMessages.length, "Compacted messages are fewer (10 -> 6)");
  assert(longResult[0].role === "user", "First compacted message is user (summary)");
  assert(
    typeof longResult[0].content === "string" && longResult[0].content.includes("[Previous conversation summary"),
    "Summary message has correct format"
  );
  assert(longResult[1].role === "assistant", "Second message is assistant acknowledgment");
  // Summary pair (2) + last 4 messages = 6
  assert(longResult.length === 6, "Compacted result has summary pair + last 4 messages");
}

async function testFeature33(): Promise<void> {
  console.log("\n--- Feature 33: /help command ---");

  // Read the CLI source and trace the logic
  // handleSlashCommand("/help") should log help text
  const originalLog = console.log;
  const logged: string[] = [];
  console.log = (...args: any[]) => logged.push(args.join(" "));

  // Import and call handleSlashCommand indirectly by checking the code
  // Since handleSlashCommand is not exported, we verify by reading the code
  console.log = originalLog;

  // Verify by checking the source has the right structure
  const { readFile } = await import("node:fs/promises");
  const cliSource = await readFile("src/cli.ts", "utf-8");

  assert(cliSource.includes('/help'), "/help command exists in CLI");
  assert(cliSource.includes('/clear'), "/clear command exists in CLI");
  assert(cliSource.includes("Available commands"), "Help text includes 'Available commands'");
  assert(cliSource.includes("Clear conversation history"), "Help mentions /clear function");
}

async function testFeature37(): Promise<void> {
  console.log("\n--- Feature 37: User-friendly API error messages ---");

  const originalError = console.error;
  const errors: string[] = [];
  console.error = (...args: any[]) => errors.push(args.join(" "));

  renderError("authentication_error: invalid api key");
  assert(errors[errors.length - 1].includes("Invalid API key"), "Auth error is user-friendly");

  renderError("rate_limit_error: too many requests");
  assert(errors[errors.length - 1].includes("Rate limited"), "Rate limit error is user-friendly");

  renderError("overloaded_error: server overloaded");
  assert(errors[errors.length - 1].includes("overloaded"), "Overloaded error is user-friendly");

  renderError("ENOTFOUND: dns lookup failed");
  assert(errors[errors.length - 1].includes("Network error"), "Network error is user-friendly");

  renderError("ECONNREFUSED: connection refused");
  assert(errors[errors.length - 1].includes("Network error"), "Connection refused is user-friendly");

  renderError("Some unknown error happened");
  assert(errors[errors.length - 1].includes("Some unknown error happened"), "Unknown errors pass through");

  console.error = originalError;
}

async function testFeature38and39(): Promise<void> {
  console.log("\n--- Feature 38 & 39: Tool errors sent as error tool_results ---");

  const { runAgentLoop } = await import("../src/agent.js");

  let callCount = 0;

  // Response that requests a tool call for a nonexistent file
  const toolUseResponse = {
    id: "msg_mock1",
    type: "message" as const,
    role: "assistant" as const,
    content: [
      {
        type: "tool_use" as const,
        id: "toolu_456",
        name: "read_file",
        input: { file_path: "/nonexistent/path/that/doesnt/exist.txt" },
      },
    ],
    model: "claude-sonnet-4-20250514",
    stop_reason: "tool_use" as const,
    stop_sequence: null,
    usage: { input_tokens: 20, output_tokens: 15 },
  };

  const textResponse = {
    id: "msg_mock2",
    type: "message" as const,
    role: "assistant" as const,
    content: [{ type: "text" as const, text: "Sorry, that file was not found." }],
    model: "claude-sonnet-4-20250514",
    stop_reason: "end_turn" as const,
    stop_sequence: null,
    usage: { input_tokens: 50, output_tokens: 10 },
  };

  const mockClient = {
    messages: {
      stream: () => {
        callCount++;
        const response = callCount === 1 ? toolUseResponse : textResponse;
        return {
          on: (_event: string, _cb: (text: string) => void) => {
            if (response.content[0].type === "text" && _event === "text") {
              _cb((response.content[0] as any).text);
            }
          },
          finalMessage: async () => response,
        };
      },
    },
  } as any;

  const messages: any[] = [{ role: "user", content: "Read a nonexistent file" }];
  const toolResults: string[] = [];

  const result = await runAgentLoop(
    mockClient,
    messages,
    undefined,
    undefined,
    (_toolName, result) => toolResults.push(result),
  );

  assert(toolResults.length === 1, "Tool result was captured");
  assert(toolResults[0].includes("Error") || toolResults[0].includes("not found"), "Tool result contains error message");
  assert(result.response === "Sorry, that file was not found.", "Agent continues after tool error");

  // Check that the tool_result message was added to conversation with error info
  const toolResultMsg = messages.find(
    (m: any) => m.role === "user" && Array.isArray(m.content) && m.content.some((c: any) => c.type === "tool_result")
  );
  assert(toolResultMsg !== undefined, "Tool result message added to conversation");
}

async function testFeature40(): Promise<void> {
  console.log("\n--- Feature 40: edit_file returns error when old_string not found ---");

  const testDir = join(process.cwd(), "test-output");
  const testFile = join(testDir, "test-edit-error.txt");

  try {
    await mkdir(testDir, { recursive: true });
    await writeFile(testFile, "Hello World\nThis is a test file\n", "utf-8");

    // Try to edit with old_string that doesn't exist
    const result = await executeTool("edit_file", {
      file_path: testFile,
      old_string: "This string does not exist in the file",
      new_string: "replacement",
    });

    assert(result.includes("Error"), "Returns error message");
    assert(result.includes("not found"), "Error mentions string not found");

    // Verify file is unchanged
    const content = await readFile(testFile, "utf-8");
    assert(content === "Hello World\nThis is a test file\n", "Original file is unchanged");

    // Verify successful edit works
    const successResult = await executeTool("edit_file", {
      file_path: testFile,
      old_string: "Hello World",
      new_string: "Hello Universe",
    });
    assert(successResult.includes("Successfully"), "Successful edit returns success message");

    const updatedContent = await readFile(testFile, "utf-8");
    assert(updatedContent.includes("Hello Universe"), "File was updated correctly");
  } finally {
    try {
      await unlink(testFile);
      await rmdir(testDir);
    } catch {
      // cleanup
    }
  }
}

async function testFeature20(): Promise<void> {
  console.log("\n--- Feature 20: Input prompt indicator ---");

  const inputSource = await readFile("src/ui/input.ts", "utf-8");
  assert(inputSource.includes('"> "') || inputSource.includes("'> '"), "Prompt uses '> ' indicator");
}

async function testFeature24(): Promise<void> {
  console.log("\n--- Feature 24: Spinner ---");

  const { Spinner } = await import("../src/ui/spinner.js");
  const spinner = new Spinner();
  assert(typeof spinner.start === "function", "Spinner has start method");
  assert(typeof spinner.stop === "function", "Spinner has stop method");

  // Quick start/stop to verify no crashes
  spinner.start("Testing...");
  await new Promise((r) => setTimeout(r, 200));
  spinner.stop();
  assert(true, "Spinner starts and stops without crashing");
}

async function testFeature25and26(): Promise<void> {
  console.log("\n--- Feature 25 & 26: Tool call/result display ---");

  const originalLog = console.log;
  const logged: string[] = [];
  const capture = (...args: any[]) => logged.push(args.join(" "));

  console.log = capture;
  renderToolCall("read_file", { file_path: "package.json" });
  console.log = originalLog;
  assert(logged.some((l) => l.includes("read_file") && l.includes("package.json")), "Tool call shows name and file path");

  console.log = capture;
  renderToolCall("bash", { command: "echo hello" });
  console.log = originalLog;
  assert(logged.some((l) => l.includes("bash") && l.includes("echo hello")), "Bash tool call shows command");

  console.log = capture;
  renderToolResult("read_file", '{"name": "ccclone", "version": "0.1.0"}');
  console.log = originalLog;
  assert(logged.some((l) => l.includes("ccclone")), "Tool result is displayed");

  // Test truncation of long results
  const longResult = "x".repeat(300);
  logged.length = 0;
  console.log = capture;
  renderToolResult("read_file", longResult);
  console.log = originalLog;
  assert(logged.some((l) => l.includes("...")), "Long tool results are truncated");
}

async function testTokenUsageDisplay(): Promise<void> {
  console.log("\n--- Feature 28: Token usage display ---");

  const originalLog = console.log;
  const logged: string[] = [];

  console.log = (...args: any[]) => logged.push(args.join(" "));
  renderTokenUsage(1500, 500);
  console.log = originalLog;

  assert(logged.some((l) => l.includes("1500") && l.includes("500")), "Token usage displays both counts");
}

// Run all tests
async function main(): Promise<void> {
  console.log("=== ccclone Feature Tests ===");

  await testFeature5();
  await testFeature7();
  await testFeature7WithTools();
  await testFeature14();
  await testFeature27();
  await testFeature27Compaction();
  await testFeature29();
  await testFeature33();
  await testFeature37();
  await testFeature38and39();
  await testFeature40();
  await testFeature20();
  await testFeature24();
  await testFeature25and26();
  await testTokenUsageDisplay();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
