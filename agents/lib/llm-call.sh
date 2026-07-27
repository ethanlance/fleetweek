#!/usr/bin/env bash
# llm-call.sh — Shared LLM calling function with retry logic
# Source this in other scripts: source "$SCRIPT_DIR/../lib/llm-call.sh"
#
# Usage: call_claude "your prompt" [model] [max_retries]

OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"

# call_ollama "prompt" [model]
# Calls a local Ollama model. No auth, no retries needed (local).
call_ollama() {
  local prompt="$1"
  local model="${2:-qwen3:8b}"

  # Check if Ollama is reachable
  if ! curl -sf "${OLLAMA_URL}/" &>/dev/null; then
    echo "[llm-call] ERROR: Ollama not available at ${OLLAMA_URL}" >&2
    return 1
  fi

  local response
  response=$(curl -sf "${OLLAMA_URL}/api/generate" \
    --max-time 120 \
    -d "$(jq -n \
      --arg model "$model" \
      --arg prompt "$prompt" \
      '{
        model: $model,
        prompt: $prompt,
        stream: false,
        options: { temperature: 0.3 }
      }')" 2>/dev/null)

  local text
  text=$(echo "$response" | jq -r '.response // empty' 2>/dev/null)

  if [ -z "$text" ]; then
    echo "[llm-call] ERROR: Empty response from Ollama ${model}" >&2
    return 1
  fi

  echo "$text"
}

call_claude() {
  local prompt="$1"
  local model="${2:-claude-sonnet-4-20250514}"
  local max_retries="${3:-3}"

  # Ensure claude is in PATH (launchd strips ~/.local/bin via path_helper)
  if ! command -v claude &>/dev/null; then
    export PATH="$HOME/.local/bin:$PATH"
  fi

  # Write prompt to temp file to avoid stdin size limits.
  # Use `mktemp -t` so we get truly unique names on both BSD (macOS) and
  # GNU mktemp — BSD treats `XXXXXX` in a path arg as literal, which led
  # to a real outage when a killed run left /tmp/goose-llm-XXXXXX.txt
  # behind and every subsequent attempt failed with "File exists".
  local prompt_file
  prompt_file=$(mktemp -t goose-llm) || prompt_file=$(mktemp /tmp/goose-llm.$$.XXXXXX)
  echo "$prompt" > "$prompt_file"

  local prompt_size
  prompt_size=$(wc -c < "$prompt_file" | tr -d ' ')

  # Truncate if over 100KB
  if [ "$prompt_size" -gt 102400 ]; then
    head -c 100000 "$prompt_file" > "${prompt_file}.tmp"
    mv "${prompt_file}.tmp" "$prompt_file"
    echo "[llm-call] WARN: Prompt truncated from ${prompt_size}B to 100KB" >&2
  fi

  # Retry loop
  local response=""
  local attempt=0
  while [ $attempt -lt $max_retries ] && [ -z "$response" ]; do
    attempt=$((attempt + 1))
    local stderr_file
    stderr_file=$(mktemp -t goose-llm-err) || stderr_file=$(mktemp /tmp/goose-llm-err.$$.XXXXXX)

    # Hard timeout: claude has been observed to hang silently on large
    # prompts, leaving dream.sh stuck for days. 600s (10 min) is well
    # above any healthy completion time. Prefer GNU `timeout`/`gtimeout`
    # (coreutils on macOS); fall back to no-timeout if neither exists.
    local timeout_bin=""
    if command -v timeout >/dev/null 2>&1; then timeout_bin="timeout 600";
    elif command -v gtimeout >/dev/null 2>&1; then timeout_bin="gtimeout 600";
    fi
    response=$($timeout_bin claude --print --model "$model" < "$prompt_file" 2>"$stderr_file" || true)
    local rc=$?

    if [ -z "$response" ]; then
      local err_msg
      err_msg=$(head -5 "$stderr_file" 2>/dev/null)
      if [ $rc -eq 124 ]; then
        echo "[llm-call] WARN: claude timed out after 600s on attempt ${attempt}/${max_retries}" >&2
      else
        echo "[llm-call] WARN: Empty response attempt ${attempt}/${max_retries}. stderr: ${err_msg}" >&2
      fi
      rm -f "$stderr_file"
      if [ $attempt -lt $max_retries ]; then
        sleep $((attempt * 5))
      fi
    else
      rm -f "$stderr_file"
    fi
  done

  rm -f "$prompt_file"
  echo "$response"
}
