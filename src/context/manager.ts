import type { TokenUsage } from "../types.js";
import { CONTEXT_WINDOW_SIZE, COMPACTION_THRESHOLD } from "../constants.js";

export class ContextManager {
  private totalInputTokens = 0;
  private totalOutputTokens = 0;

  updateUsage(usage: { input_tokens: number; output_tokens: number }): void {
    this.totalInputTokens += usage.input_tokens;
    this.totalOutputTokens += usage.output_tokens;
  }

  getUsage(): TokenUsage {
    return {
      inputTokens: this.totalInputTokens,
      outputTokens: this.totalOutputTokens,
      totalTokens: this.totalInputTokens + this.totalOutputTokens,
    };
  }

  needsCompaction(): boolean {
    return this.totalInputTokens > CONTEXT_WINDOW_SIZE * COMPACTION_THRESHOLD;
  }

  reset(): void {
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
  }
}
