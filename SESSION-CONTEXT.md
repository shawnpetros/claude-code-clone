## Status
P2 "Polish & Demo" prepped — features 41-42 in spec, demo infra built, committed on main (355c764). Source files untouched, awaiting harness build.

## In-Flight
Nothing active — user running harness + recording demos independently.

## Key Details
- Model: claude-sonnet-4-20250514 (configurable in src/constants.ts)
- Requires ANTHROPIC_API_KEY env var
- Repo: github.com/shawnpetros/claude-code-clone

## Next Steps
1. Install asciinema + agg (brew, cargo)
2. Run `./harness.sh --skip-init` → builds features 41 (exit cmd) + 42 (markdown fix)
3. Verify features manually with `npm run dev`
4. Record demos (see `demo/INSTRUCTIONS.txt`)
5. Render GIF + MP4, commit demo assets, push
