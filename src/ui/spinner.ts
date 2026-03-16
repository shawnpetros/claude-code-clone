const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export class Spinner {
  private interval: ReturnType<typeof setInterval> | null = null;
  private frameIndex = 0;

  start(message = "Thinking..."): void {
    this.frameIndex = 0;
    process.stdout.write(`\x1b[?25l`); // hide cursor
    this.interval = setInterval(() => {
      const frame = SPINNER_FRAMES[this.frameIndex % SPINNER_FRAMES.length];
      process.stdout.write(`\r${frame} ${message}`);
      this.frameIndex++;
    }, 80);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stdout.write(`\r\x1b[K`); // clear line
      process.stdout.write(`\x1b[?25h`); // show cursor
    }
  }
}
