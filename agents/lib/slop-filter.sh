#!/usr/bin/env bash
# slop-filter.sh — Scan text for AI-sounding words/phrases and report them
# Source this in other scripts: source "$SCRIPT_DIR/../lib/slop-filter.sh"
# Or run standalone: bash slop-filter.sh "text to check"
#
# Returns: 0 if clean, 1 if slop detected
# Outputs: list of detected slop words/phrases to stderr

# Tier 1: Strongest AI signals — almost never used by humans in casual writing
SLOP_TIER1=(
  "delve" "tapestry" "testament" "landscape" "paradigm"
  "multifaceted" "unparalleled" "seamless" "seamlessly"
  "pivotal" "groundbreaking" "revolutionary" "game-changing"
  "paramount" "meticulous" "meticulously" "holistic"
  "vibrant" "robust" "nuanced" "intricate"
  "comprehensive" "fundamental" "moreover" "furthermore"
  "consequently" "nevertheless" "notably" "specifically"
  "essentially" "basically" "arguably" "interestingly"
  "embark" "foster" "harness" "unleash" "unlock"
  "orchestrate" "streamline" "elevate" "transcend"
  "galvanize" "spearhead" "underpin" "underscore"
  "epitome" "pinnacle" "nexus" "odyssey" "trajectory"
  "spectrum" "symphony" "realm" "beacon" "cornerstone"
  "linchpin" "bedrock" "crucible"
)

# Tier 2: AI filler phrases — dead giveaways
SLOP_PHRASES=(
  "it's worth noting"
  "it's important to note"
  "I'd be happy to"
  "Great question"
  "That's a great point"
  "as an AI"
  "as a language model"
  "I don't have personal"
  "serves as a"
  "stands as a"
  "acts as a"
  "at the end of the day"
  "in today's world"
  "in this day and age"
  "the fact that"
  "it goes without saying"
  "at its core"
  "when it comes to"
  "having said that"
  "it should be noted"
  "let me know if you"
  "I hope that helps"
  "I hope this helps"
  "feel free to"
  "don't hesitate to"
  "happy to help"
  "certainly"
  "absolutely"
  "indeed"
  "in conclusion"
  "to summarize"
  "in summary"
  "overall"
  "ultimately"
  "rest assured"
  "here's the thing"
  "the beauty of"
  "the power of"
  "game changer"
  "deep dive"
  "level up"
  "double down"
  "circle back"
  "move the needle"
  "low-hanging fruit"
  "worth considering"
  "worth noting"
  "worth mentioning"
  "worth highlighting"
  "that said"
  "to be fair"
  "interestingly enough"
  "on the flip side"
  "it's fascinating"
  "what's exciting"
  "what's interesting"
  "the key takeaway"
  "the takeaway here"
  "from a .* perspective"
  "in terms of"
)

# Tier 3: Words from SOUL.md anti-patterns (Goose-specific)
SLOP_GOOSE=(
  "honestly"
  "actually"
  "basically"
  "essentially"
  "really"
  "literally"
  "clearly"
  "obviously"
  "just"
)

check_slop() {
  local text="$1"
  local lower_text
  lower_text=$(echo "$text" | tr '[:upper:]' '[:lower:]')

  local found=()
  local score=0

  # Check tier 1 words (3 points each)
  for word in "${SLOP_TIER1[@]}"; do
    if echo "$lower_text" | grep -qiw "$word"; then
      found+=("T1:$word")
      score=$((score + 3))
    fi
  done

  # Check tier 2 phrases (5 points each)
  for phrase in "${SLOP_PHRASES[@]}"; do
    if echo "$lower_text" | grep -qi "$phrase"; then
      found+=("T2:$phrase")
      score=$((score + 5))
    fi
  done

  # Check tier 3 Goose-specific words (1 point each)
  for word in "${SLOP_GOOSE[@]}"; do
    if echo "$lower_text" | grep -qiw "$word"; then
      found+=("T3:$word")
      score=$((score + 1))
    fi
  done

  # Check for em dashes (5 points — hard ban per SOUL.md)
  if echo "$text" | grep -q "—"; then
    found+=("T1:em-dash")
    score=$((score + 5))
  fi

  if [ ${#found[@]} -gt 0 ]; then
    echo "SLOP_SCORE=$score" >&2
    echo "SLOP_FOUND=${found[*]}" >&2
    return 1
  fi

  return 0
}

# Standalone mode
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  if [ -z "${1:-}" ]; then
    echo "Usage: slop-filter.sh \"text to check\"" >&2
    exit 2
  fi

  if check_slop "$1"; then
    echo "Clean. No slop detected."
  else
    echo "Slop detected. See stderr for details."
    exit 1
  fi
fi
