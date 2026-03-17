## Purpose
A minimal clone of Claude Code built from scratch to understand how agentic coding loops work. Educational project — 40 features, all passing, built across 3 agent sessions using The Harness framework.

## Brain Sync
Search terms: `claude-code-clone`, `agentic loop`, `spec-driven development`, `ccclone`

## Tech Stack
- TypeScript (strict, ESM), Node.js 20+
- @anthropic-ai/sdk, commander, chalk, marked + marked-terminal
- Build: tsup, Dev: tsx

## Conventions
- ESM imports with `.js` extensions on relative paths
- Tools follow the pattern in `src/tools/` — definition object + executor function
- Agent loop lives in `src/agent.ts` — the core of the project
- Config constants in `src/constants.ts`

## Feature Tracker
See `features.json` for structured tracking. See `feature_list.json` for the original 40-feature build spec with verification steps.
