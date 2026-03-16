// TODO: Token counting and context window tracking
// - Track input and output token counts from API responses
// - Calculate total token usage
// - Determine when compaction is needed (>80% of context window)
// - Display token count to user

import type { TokenUsage } from "../types.js";
import { CONTEXT_WINDOW_SIZE, COMPACTION_THRESHOLD } from "../constants.js";

export class ContextManager {
  private totalInputTokens = 0;
  private totalOutputTokens = 0;

  updateUsage(usage: { input_tokens: number; output_tokens: number }): void {
    // TODO: Update running token counts
    this.totalInputTokens += usage.input_tokens;
    this.totalOutputTokens += usage.output_tokens;
  }

  getUsage(): TokenUsage {
    // TODO: Return current token usage
    return {
      inputTokens: this.totalInputTokens,
      outputTokens: this.totalOutputTokens,
      totalTokens: this.totalInputTokens + this.totalOutputTokens,
    };
  }

  needsCompaction(): boolean {
    // TODO: Check if we've exceeded the compaction threshold
    return this.totalInputTokens > CONTEXT_WINDOW_SIZE * COMPACTION_THRESHOLD;
  }
}
