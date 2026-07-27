#!/usr/bin/env bash
# editor.sh — quality gate for Chronicler's pull requests
#
# Finds open goose/digest-* PRs on the site repo and reviews each one:
#   1. Mechanical checks: secret scan (gitleaks when available), size sanity.
#   2. Slop check: the repo's anti-AI-slop lexicon (lib/slop-filter.sh).
#   3. LLM review against the rubric: factual vs. sources, tone, honesty.
# Approve → stamp reviewed_by, merge (which deploys). Reject → comment + close.
# The Editor never rewrites silently — comments only.
#
# Usage: editor.sh

set -uo pipefail


SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FLEET_HOME="${FLEET_HOME:-$HOME/.fleetweek}"
CONFIG_FILE="${FLEET_CONFIG:-$FLEET_HOME/config.json}"
LOG_DIR="$FLEET_HOME/logs"
mkdir -p "$LOG_DIR"

# launchd does not inherit an interactive PATH; make node/npm/gh reachable.
for candidate in "$HOME/.nvm/versions/node"/*/bin /opt/homebrew/bin /usr/local/bin; do
  [ -d "$candidate" ] && export PATH="$candidate:$PATH"
done
source "$SCRIPT_DIR/lib/llm-call.sh"

LOG_FILE="$LOG_DIR/editor.log"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

PROFILE_CONFIG="$CONFIG_FILE"
[ -f "$PROFILE_CONFIG" ] || { log "missing $PROFILE_CONFIG (see agents/README.md)"; exit 0; }

SITE_REPO=$(jq -r --arg d "$REPO_DIR" '.repo_dir // $d' "$PROFILE_CONFIG")
BRANCH=$(jq -r '.branch // "main"' "$PROFILE_CONFIG")
SITE_NAME=$(jq -r '.display_name // "this site"' "$PROFILE_CONFIG")
MODEL=$(jq -r '.chronicler.model // "claude-sonnet-5"' "$PROFILE_CONFIG")
[ -d "$SITE_REPO/.git" ] || { log "site repo missing: $SITE_REPO"; exit 0; }

cd "$SITE_REPO"

PRS=$(gh pr list --json number,headRefName --jq \
  '.[] | select(.headRefName | startswith("goose/digest-")) | .number' 2>>"$LOG_FILE")

if [ -z "$PRS" ]; then
  log "no Chronicler PRs awaiting review"
  exit 0
fi

for PR in $PRS; do
  log "reviewing PR #$PR"
  DIFF=$(gh pr diff "$PR" 2>>"$LOG_FILE")
  FILE=$(gh pr diff "$PR" --name-only 2>/dev/null | head -1)

  REJECT_REASONS=()

  # ── Mechanical: only digest files, sane size ───────────────────────────────
  BAD_FILES=$(gh pr diff "$PR" --name-only | grep -cv '^content/projects/.*/digests/' || true)
  [ "$BAD_FILES" -gt 0 ] && REJECT_REASONS+=("PR touches files outside content/*/digests/")
  [ "$(echo "$DIFF" | wc -l)" -gt 200 ] && REJECT_REASONS+=("diff suspiciously large for a digest")

  # ── Mechanical: secrets ────────────────────────────────────────────────────
  if command -v gitleaks &>/dev/null; then
    if ! echo "$DIFF" | gitleaks stdin --exit-code 1 >/dev/null 2>&1; then
      REJECT_REASONS+=("secret scanner flagged the diff")
    fi
  fi

  # ── Slop lexicon ───────────────────────────────────────────────────────────
  ADDED=$(echo "$DIFF" | grep '^+' | grep -v '^+++' | sed 's/^+//')
  SLOP=$(bash "$SCRIPT_DIR/lib/slop-filter.sh" "$ADDED" 2>&1 >/dev/null || true)
  [ -n "$SLOP" ] && REJECT_REASONS+=("slop detected: $(echo "$SLOP" | head -3 | tr '\n' ' ')")

  # ── LLM rubric review ──────────────────────────────────────────────────────
  if [ ${#REJECT_REASONS[@]} -eq 0 ]; then
    VERDICT=$(call_claude "You are Editor, the quality gate for fleetweek.dev's nightly digest. Review this diff against the rubric. Respond with ONLY a JSON object: {\"approve\": true/false, \"reasons\": [\"...\"]}.

Rubric — reject if ANY apply:
- Invented or unverifiable activity (claims not plausibly derived from commit messages)
- Hype, marketing tone, or AI-filler phrasing
- Secrets, tokens, personal info (emails/phones other than public identities)
- Broken frontmatter (must have date, author: chronicler, reviewed_by: null)
- Anything a reasonable engineer would be embarrassed to publish

Otherwise approve. Minor imperfections are fine — this is a daily log, not literature.

Diff:
$DIFF" "$MODEL" 3)
    VERDICT=$(echo "$VERDICT" | sed '/^```/d')
    APPROVE=$(echo "$VERDICT" | jq -r '.approve // false' 2>/dev/null)
    if [ "$APPROVE" != "true" ]; then
      LLM_REASONS=$(echo "$VERDICT" | jq -r '.reasons[]?' 2>/dev/null | head -3)
      REJECT_REASONS+=("${LLM_REASONS:-LLM review did not approve}")
    fi
  fi

  # ── Verdict ────────────────────────────────────────────────────────────────
  if [ ${#REJECT_REASONS[@]} -eq 0 ]; then
    gh pr checkout "$PR" >>"$LOG_FILE" 2>&1
    if [ -n "$FILE" ] && [ -f "$FILE" ]; then
      sed -i '' 's/^reviewed_by: null$/reviewed_by: editor/' "$FILE"
      git add "$FILE"
      git -c user.name="Goose Editor" -c user.email="goosebadfriend@gmail.com" \
        commit -qm "editor: approved (reviewed_by stamped)"
      git push -q 2>>"$LOG_FILE"
    fi
    git checkout -q "$BRANCH"
    if gh pr merge "$PR" --merge --delete-branch 2>>"$LOG_FILE"; then
      log "PR #$PR approved and merged"
    else
      log "PR #$PR approved but merge failed — leaving open"
    fi
  else
    REASONS_MD=$(printf -- '- %s\n' "${REJECT_REASONS[@]}")
    gh pr comment "$PR" --body "**Editor: rejected.**

$REASONS_MD

Per charter: comments only, no silent rewrites. Chronicler may redraft tomorrow, or a human can override." >>"$LOG_FILE" 2>&1
    gh pr close "$PR" >>"$LOG_FILE" 2>&1
    log "PR #$PR rejected: ${REJECT_REASONS[*]}"
  fi
done

git checkout -q "$BRANCH" 2>/dev/null || true
git pull -q --rebase origin "$BRANCH" 2>/dev/null || true
