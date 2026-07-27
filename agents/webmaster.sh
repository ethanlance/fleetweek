#!/usr/bin/env bash
# site-telemetry-publish.sh — webmaster job that publishes health telemetry
# INTO a site's repo (content/telemetry/jobs.json), committing to main.
#
# This is the "site with no webmaster" pattern: the monitored repo renders
# this file on its /fleet page, so the site's health reporting is public
# and self-updating. Telemetry is data, not prose — it skips the PR/editor
# pipeline by design (see the site repo's docs/GOOSE-INTEGRATION.md).
#
# Usage: webmaster.sh
# Reads $FLEET_HOME/config.json (default ~/.fleetweek/config.json):
#   {
#     "display_name": "powarz.com",
#     "repo_dir": "/path/to/site/repo",
#     "site_url": "https://example.com",   // optional; null = pending deploy
#     "branch": "main"
#   }
# Checks: git freshness, production build, site reachability (if deployed).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FLEET_HOME="${FLEET_HOME:-$HOME/.fleetweek}"
CONFIG_FILE="${FLEET_CONFIG:-$FLEET_HOME/config.json}"
# Fall back to the committed defaults when there is no personal config
# (this is the normal case on a CI runner).
[ -f "$CONFIG_FILE" ] || CONFIG_FILE="$SCRIPT_DIR/config.json"
LOG_DIR="$FLEET_HOME/logs"
mkdir -p "$LOG_DIR"

# launchd does not inherit an interactive PATH; make node/npm/gh reachable.
for candidate in "$HOME/.nvm/versions/node"/*/bin /opt/homebrew/bin /usr/local/bin; do
  [ -d "$candidate" ] && export PATH="$candidate:$PATH"
done

LOG_FILE="$LOG_DIR/webmaster.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

PROFILE_CONFIG="$CONFIG_FILE"
if [ ! -f "$PROFILE_CONFIG" ]; then
  log "missing $PROFILE_CONFIG; aborting"
  exit 0
fi

SITE_REPO=$(jq -r --arg d "$REPO_DIR" '.repo_dir // $d' "$PROFILE_CONFIG")
SITE_URL=$(jq -r '.site_url // ""' "$PROFILE_CONFIG")
BRANCH=$(jq -r '.branch // "main"' "$PROFILE_CONFIG")
SITE_NAME=$(jq -r '.display_name // "this site"' "$PROFILE_CONFIG")
TELEMETRY_REL=$(jq -r '.telemetry_file // "content/telemetry/jobs.json"' "$PROFILE_CONFIG")

if [ ! -d "$SITE_REPO/.git" ]; then
  log "repo_dir $SITE_REPO is not a git repo; aborting"
  exit 0
fi

TELEMETRY_FILE="$SITE_REPO/$TELEMETRY_REL"
STARTED_AT=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
STATUS="ok"
NOTES=()

cd "$SITE_REPO"

# ── Check 1: repo freshness ──────────────────────────────────────────────────
if git pull --rebase --quiet origin "$BRANCH" 2>>"$LOG_FILE"; then
  NOTES+=("repo synced")
else
  STATUS="error"
  NOTES+=("git pull failed")
fi

# ── Check 2: production build ────────────────────────────────────────────────
BUILD_START=$(date +%s)
if npm run build >>"$LOG_FILE" 2>&1; then
  BUILD_SECS=$(( $(date +%s) - BUILD_START ))
  NOTES+=("build ok (${BUILD_SECS}s)")
else
  STATUS="error"
  NOTES+=("BUILD FAILED")
fi

# ── Check 3: site reachability (only once deployed) ──────────────────────────
if [ -n "$SITE_URL" ] && [ "$SITE_URL" != "null" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$SITE_URL" || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    NOTES+=("site up (200)")
  else
    STATUS="error"
    NOTES+=("site returned $HTTP_CODE")
  fi
else
  NOTES+=("site check skipped: pending deploy")
fi

NOTE=$(IFS='; '; echo "${NOTES[*]}")
log "run complete: status=$STATUS note=$NOTE"

# ── Publish: prepend run, cap at 50, commit, push ────────────────────────────
if [ ! -f "$TELEMETRY_FILE" ]; then
  log "telemetry file missing at $TELEMETRY_FILE; aborting publish"
  exit 1
fi

UPDATED=$(jq \
  --arg job "webmaster" \
  --arg startedAt "$STARTED_AT" \
  --arg status "$STATUS" \
  --arg note "$NOTE" \
  '.updatedAt = $startedAt
   | .runs = ([{job: $job, startedAt: $startedAt, status: $status, note: $note}] + .runs)[:50]' \
  "$TELEMETRY_FILE") || { log "jq update failed"; exit 1; }

echo "$UPDATED" > "$TELEMETRY_FILE"

if git diff --quiet -- "$TELEMETRY_REL"; then
  log "no telemetry change; nothing to publish"
  exit 0
fi

git add "$TELEMETRY_REL"
git commit --quiet -m "webmaster: telemetry $(date '+%Y-%m-%d') [$STATUS]"
if git push --quiet origin "$BRANCH" 2>>"$LOG_FILE"; then
  log "telemetry published"
else
  log "push failed — telemetry committed locally only"
  exit 1
fi
