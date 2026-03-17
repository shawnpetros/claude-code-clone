#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RAW_DIR="$SCRIPT_DIR/raw"
OUT_DIR="$SCRIPT_DIR/output"

mkdir -p "$RAW_DIR" "$OUT_DIR"

# ── Helpers ──────────────────────────────────────────────────────────────────
confirm() {
  read -rp "$1 [Enter to continue, Ctrl+C to abort] "
}

check_tool() {
  if ! command -v "$1" &>/dev/null; then
    echo "❌ $1 not found. Install it first:"
    echo "   $2"
    exit 1
  fi
}

# ── Prereqs ──────────────────────────────────────────────────────────────────
check_tool asciinema "brew install asciinema"
check_tool agg       "cargo install --git https://github.com/asciinema/agg"
check_tool ffmpeg    "brew install ffmpeg"

# ── Demo A: CLI in Action (→ GIF for README) ────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "  Demo A: CLI in Action → GitHub README GIF"
echo "═══════════════════════════════════════════════════"
echo ""
echo "What to do inside the recording:"
echo "  1. npm run dev"
echo "  2. Ask: 'What files are in this directory and what does this project do?'"
echo "  3. Watch tool calls + markdown-rendered response"
echo "  4. Type 'exit'"
echo ""
confirm "Ready to record Demo A?"

asciinema rec "$RAW_DIR/cli-demo.cast" --cols 100 --rows 30 --idle-time-limit 3

echo ""
echo "Rendering CLI demo GIF..."
agg "$RAW_DIR/cli-demo.cast" "$OUT_DIR/cli-demo.gif" --theme monokai --font-size 16 --speed 1.5

# Optimize if over 2MB
FILE_SIZE=$(stat -f%z "$OUT_DIR/cli-demo.gif" 2>/dev/null || stat --printf="%s" "$OUT_DIR/cli-demo.gif" 2>/dev/null)
if [ "$FILE_SIZE" -gt 2097152 ]; then
  echo "GIF is $(( FILE_SIZE / 1024 ))KB — optimizing..."
  ffmpeg -y -i "$OUT_DIR/cli-demo.gif" \
    -vf "fps=10,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" \
    -loop 0 "$OUT_DIR/cli-demo-opt.gif"
  echo "Optimized: $(( $(stat -f%z "$OUT_DIR/cli-demo-opt.gif" 2>/dev/null || stat --printf="%s" "$OUT_DIR/cli-demo-opt.gif" 2>/dev/null) / 1024 ))KB"
fi
echo "✅ CLI demo: $OUT_DIR/cli-demo.gif"

# ── Demo B: Harness Building Features (→ MP4 for LinkedIn) ──────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "  Demo B: Harness Demo → LinkedIn MP4"
echo "═══════════════════════════════════════════════════"
echo ""
echo "What to do inside the recording:"
echo "  1. ./harness.sh --skip-init"
echo "  2. Let it build features"
echo "  3. Ctrl+D to stop recording when done"
echo ""
confirm "Ready to record Demo B?"

asciinema rec "$RAW_DIR/harness-demo.cast" --cols 120 --rows 35 --idle-time-limit 5

echo ""
echo "Rendering harness demo MP4..."
agg "$RAW_DIR/harness-demo.cast" /tmp/harness.gif --theme monokai --font-size 18 --speed 6
ffmpeg -y -i /tmp/harness.gif \
  -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black" \
  "$OUT_DIR/harness-demo.mp4"
rm -f /tmp/harness.gif
echo "✅ Harness demo: $OUT_DIR/harness-demo.mp4"

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "  All done!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Outputs:"
ls -lh "$OUT_DIR/"
echo ""
echo "Next steps:"
echo "  - Embed cli-demo.gif in README.md"
echo "  - Upload harness-demo.mp4 to LinkedIn"
