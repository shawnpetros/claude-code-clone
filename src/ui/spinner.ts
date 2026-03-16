// TODO: Simple spinner/loading indicator
// - Show animated spinner while waiting for API response
// - Use ANSI escape codes for animation
// - Start/stop methods
// - Don't interfere with streamed output

export class Spinner {
  private interval: ReturnType<typeof setInterval> | null = null;

  start(message = "Thinking..."): void {
    // TODO: Show spinning animation with message
  }

  stop(): void {
    // TODO: Clear spinner and restore cursor
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
