#!/bin/bash
set -euo pipefail

###############################################################################
# ccclone build harness
#
# A deterministic loop that spawns Claude Code agent sessions to build the
# project incrementally. Each session gets a fresh context window, reads
# progress files to orient itself, implements the next feature, and exits.
#
# Usage:
#   ./harness.sh              # Run full build (init + coding loop)
#   ./harness.sh --skip-init  # Skip initializer, go straight to coding loop
#   ./harness.sh --dry-run    # Show what would happen without spawning agents
###############################################################################

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPTS_DIR="$PROJECT_DIR/prompts"
FEATURE_LIST="$PROJECT_DIR/feature_list.json"
PROGRESS_FILE="$PROJECT_DIR/claude-progress.txt"
LOG_DIR="$PROJECT_DIR/.harness-logs"

MAX_SESSIONS=50          # Safety limit: stop after this many coding sessions
MAX_STUCK_SESSIONS=3     # If no progress for this many sessions, stop
SKIP_INIT=false
DRY_RUN=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --skip-init) SKIP_INIT=true ;;
        --dry-run)   DRY_RUN=true ;;
        *)           echo "Unknown argument: $arg"; exit 1 ;;
    esac
done

# Create log directory
mkdir -p "$LOG_DIR"

###############################################################################
# Helper functions
###############################################################################

timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

log() {
    echo "[$(timestamp)] $1"
}

count_remaining_features() {
    if [ ! -f "$FEATURE_LIST" ]; then
        echo "-1"
        return
    fi
    jq '[.[] | select(.passes == false)] | length' "$FEATURE_LIST"
}

count_passing_features() {
    if [ ! -f "$FEATURE_LIST" ]; then
        echo "0"
        return
    fi
    jq '[.[] | select(.passes == true)] | length' "$FEATURE_LIST"
}

count_total_features() {
    if [ ! -f "$FEATURE_LIST" ]; then
        echo "0"
        return
    fi
    jq 'length' "$FEATURE_LIST"
}

get_last_commit_hash() {
    git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null || echo "none"
}

run_agent() {
    local prompt_file="$1"
    local session_label="$2"
    local log_file="$LOG_DIR/${session_label}.log"

    if [ "$DRY_RUN" = true ]; then
        log "[DRY RUN] Would spawn agent with prompt: $prompt_file"
        return 0
    fi

    log "Spawning agent session: $session_label"
    log "Log file: $log_file"

    # Spawn claude in non-interactive mode with the prompt
    # --dangerously-skip-permissions: required for autonomous operation
    #   since there's no human to approve tool calls in -p mode
    claude -p "$(cat "$prompt_file")" \
        --dangerously-skip-permissions \
        2>&1 | tee "$log_file"

    local exit_code=${PIPESTATUS[0]}

    if [ $exit_code -ne 0 ]; then
        log "WARNING: Agent session $session_label exited with code $exit_code"
    fi

    return $exit_code
}

###############################################################################
# Phase 1: Initializer
###############################################################################

run_initializer() {
    if [ -f "$FEATURE_LIST" ]; then
        log "feature_list.json already exists. Skipping initializer."
        return 0
    fi

    log "=========================================="
    log "PHASE 1: INITIALIZER"
    log "=========================================="

    run_agent "$PROMPTS_DIR/initializer.md" "session-000-init"

    # Validate initializer output
    if [ ! -f "$FEATURE_LIST" ]; then
        log "ERROR: Initializer did not create feature_list.json"
        exit 1
    fi

    if ! jq empty "$FEATURE_LIST" 2>/dev/null; then
        log "ERROR: feature_list.json is not valid JSON"
        exit 1
    fi

    local total
    total=$(count_total_features)
    log "Initializer created $total features"
    log "Initializer complete."
}

###############################################################################
# Phase 2: Coding Loop
###############################################################################

run_coding_loop() {
    log "=========================================="
    log "PHASE 2: CODING LOOP"
    log "=========================================="

    local session=0
    local stuck_count=0
    local last_remaining
    last_remaining=$(count_remaining_features)

    while [ $session -lt $MAX_SESSIONS ]; do
        session=$((session + 1))

        local remaining
        remaining=$(count_remaining_features)
        local passing
        passing=$(count_passing_features)
        local total
        total=$(count_total_features)

        log "------------------------------------------"
        log "SESSION $session / $MAX_SESSIONS"
        log "Features: $passing/$total passing, $remaining remaining"
        log "------------------------------------------"

        # Check if done
        if [ "$remaining" -eq 0 ]; then
            log "ALL FEATURES COMPLETE!"
            log "Total sessions used: $session"
            return 0
        fi

        # Check for stuck state
        if [ "$remaining" -eq "$last_remaining" ] && [ $session -gt 1 ]; then
            stuck_count=$((stuck_count + 1))
            log "WARNING: No progress made. Stuck count: $stuck_count/$MAX_STUCK_SESSIONS"

            if [ $stuck_count -ge $MAX_STUCK_SESSIONS ]; then
                log "ERROR: No progress for $MAX_STUCK_SESSIONS sessions. Stopping."
                log "Last $MAX_STUCK_SESSIONS session logs are in $LOG_DIR/"
                log "Manual intervention needed."
                return 1
            fi
        else
            stuck_count=0
        fi

        last_remaining=$remaining

        # Record pre-session state
        local pre_commit
        pre_commit=$(get_last_commit_hash)

        # Run the coding agent
        local session_label
        session_label=$(printf "session-%03d-coding" "$session")
        run_agent "$PROMPTS_DIR/coding-agent.md" "$session_label" || true

        # Post-session checks
        local post_commit
        post_commit=$(get_last_commit_hash)

        if [ "$pre_commit" = "$post_commit" ]; then
            log "NOTE: No new commits in session $session"
        else
            local new_commits
            new_commits=$(git -C "$PROJECT_DIR" log --oneline "$pre_commit".."$post_commit" 2>/dev/null | wc -l | tr -d ' ')
            log "Session produced $new_commits new commit(s)"
        fi

        log "Session $session complete."
    done

    log "Hit max sessions ($MAX_SESSIONS). Manual review needed."
    local remaining
    remaining=$(count_remaining_features)
    log "Features remaining: $remaining"
    return 1
}

###############################################################################
# Main
###############################################################################

main() {
    log "=========================================="
    log "ccclone Build Harness"
    log "Project: $PROJECT_DIR"
    log "=========================================="

    cd "$PROJECT_DIR"

    # Phase 1
    if [ "$SKIP_INIT" = false ]; then
        run_initializer
    else
        log "Skipping initializer (--skip-init)"
    fi

    # Phase 2
    run_coding_loop
    local result=$?

    log "=========================================="
    log "HARNESS COMPLETE"
    log "Final state: $(count_passing_features)/$(count_total_features) features passing"
    log "Session logs: $LOG_DIR/"
    log "=========================================="

    return $result
}

main "$@"
