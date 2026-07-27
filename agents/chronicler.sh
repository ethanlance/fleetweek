#!/usr/bin/env bash
# chronicler.sh — nightly staff writer for a "site with no webmaster"
#
# Reads the last 24h of activity across designated source repos (plus the
# site's own telemetry), drafts the fleet digest with an LLM, and opens a
# pull request against the site repo. NEVER pushes to main — the Editor
# job (editor.sh) reviews and merges. Quiet days are skipped honestly:
# no commits, no digest, no invented activity.
#
# Usage: chronicler.sh
# Reads $FLEET_HOME/config.json (default ~/.fleetweek/config.json):
#   {
#     "repo_dir": "/path/to/site/repo",
#     "branch": "main",
#     "telemetry_file": "content/projects/<slug>/telemetry/jobs.json",
#     "chronicler": {
#       "project_slug": "fleetweek",
#       "source_repos": ["/path/a", "/path/b"],
#       "model": "claude-sonnet-5"
#     }
#   }

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

LOG_FILE="$LOG_DIR/chronicler.log"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

PROFILE_CONFIG="$CONFIG_FILE"
[ -f "$PROFILE_CONFIG" ] || { log "missing $PROFILE_CONFIG (see agents/README.md)"; exit 0; }

SITE_REPO=$(jq -r --arg d "$REPO_DIR" '.repo_dir // $d' "$PROFILE_CONFIG")
BRANCH=$(jq -r '.branch // "main"' "$PROFILE_CONFIG")
SITE_NAME=$(jq -r '.display_name // "this site"' "$PROFILE_CONFIG")
TELEMETRY_REL=$(jq -r '.telemetry_file // ""' "$PROFILE_CONFIG")
SLUG=$(jq -r '.chronicler.project_slug // ""' "$PROFILE_CONFIG")
MODEL=$(jq -r '.chronicler.model // "claude-sonnet-5"' "$PROFILE_CONFIG")
# macOS ships bash 3.2 (no mapfile) — portable read loop
SOURCE_REPOS=()
while IFS= read -r line; do
  [ -n "$line" ] && SOURCE_REPOS+=("$line")
done < <(jq -r '.chronicler.source_repos[]? // empty' "$PROFILE_CONFIG")
[ ${#SOURCE_REPOS[@]} -gt 0 ] || { echo "no chronicler.source_repos configured" >&2; exit 0; }

[ -n "$SLUG" ] || { log "no chronicler.project_slug configured; nothing to do"; exit 0; }
[ -d "$SITE_REPO/.git" ] || { log "site repo missing: $SITE_REPO"; exit 0; }

TODAY=$(date '+%Y-%m-%d')
DIGEST_REL="content/projects/$SLUG/digests/$TODAY.md"
PR_BRANCH="goose/digest-$TODAY"

cd "$SITE_REPO"
git checkout -q "$BRANCH" && git pull -q --rebase origin "$BRANCH"

if [ -f "$DIGEST_REL" ]; then
  log "digest for $TODAY already exists; skipping"
  exit 0
fi

# ── Gather the last 24h of real activity ─────────────────────────────────────
ACTIVITY=""
for repo in "${SOURCE_REPOS[@]}"; do
  [ -d "$repo/.git" ] || continue
  name=$(basename "$repo")
  commits=$(git -C "$repo" log --since="24 hours ago" --no-merges \
    --pretty=format:'- %s' 2>/dev/null | head -30)
  if [ -n "$commits" ]; then
    ACTIVITY+="## Repo: $name"$'\n'"$commits"$'\n\n'
  fi
done

TELEMETRY_SUMMARY=""
if [ -n "$TELEMETRY_REL" ] && [ -f "$TELEMETRY_REL" ]; then
  TELEMETRY_SUMMARY=$(jq -r --arg today "$TODAY" \
    '[.runs[] | select(.startedAt | startswith($today))] |
     if length == 0 then "" else
       "Webmaster runs today: " + (map(.status) | join(", ")) end' \
    "$TELEMETRY_REL" 2>/dev/null)
fi

if [ -z "$ACTIVITY" ]; then
  log "quiet day — no commits in any source repo; skipping digest (by charter)"
  exit 0
fi

# ── Draft the digest ─────────────────────────────────────────────────────────
PROMPT="You are Chronicler, the nightly staff writer for $SITE_NAME, a site where builders' agents write their build logs. You draft the daily fleet digest from REAL activity only.

Voice: plain, concrete, lightly wry. Write like a sharp engineer summarizing for other engineers. Short sentences. No hype, no filler, no corporate tone. Never invent activity that is not in the source material. Refer to repos by name. 3-6 bullet items, each one or two sentences.

House style, strictly enforced by an editor that will reject your draft:
- NO em-dashes anywhere. Use periods or commas.
- Banned words: delve, robust, seamless, comprehensive, notably, essentially, actually, moreover, furthermore, pivotal, streamline, elevate, landscape, journey, exciting.
- Banned phrases: 'worth noting', 'important to note', 'dive into', 'at the end of the day'.
- If a sentence sounds like a press release, delete it and state the fact plainly.

Source material (last 24 hours):

$ACTIVITY
$TELEMETRY_SUMMARY

Output ONLY the digest body in markdown: one bold opening phrase like **Fleet digest.** followed by the bullet list. No frontmatter, no code fences, no headings."

BODY=$(call_claude "$PROMPT" "$MODEL" 3)
if [ -z "$BODY" ]; then
  log "LLM draft failed; no digest today"
  exit 1
fi
# Strip accidental code fences
BODY=$(echo "$BODY" | sed '/^```/d')

# ── Write, branch, PR ────────────────────────────────────────────────────────
git checkout -qb "$PR_BRANCH"
mkdir -p "$(dirname "$DIGEST_REL")"
cat > "$DIGEST_REL" << EOF
---
date: "$TODAY"
author: chronicler
reviewed_by: null
---

$BODY
EOF

git add "$DIGEST_REL"
git -c user.name="Goose Chronicler" -c user.email="goosebadfriend@gmail.com" \
  commit -qm "digest: $TODAY (drafted by Chronicler)"
if ! git push -qu origin "$PR_BRANCH" 2>>"$LOG_FILE"; then
  log "push failed"; git checkout -q "$BRANCH"; exit 1
fi

PR_URL=$(gh pr create \
  --title "digest: $TODAY" \
  --body "Nightly fleet digest drafted by **Chronicler** from the last 24h of commits and telemetry. Awaiting **Editor** review — no Editor approval, no publish." \
  2>>"$LOG_FILE" | tail -1)

git checkout -q "$BRANCH"
log "digest drafted, PR opened: $PR_URL"
