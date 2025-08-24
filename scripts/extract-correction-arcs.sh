#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------
# Extract user "correction arcs" (multi-turn failure/fix loops)
# from a ChatGPT export (old `mapping` shape).
#
# Usage:
#   ./extract-correction-arcs.sh [conversations.json] [outdir]
# Defaults:
#   conversations.json  ./scenario_arcs
# ---------------------------------------------

INPUT="${1:-conversations.json}"
OUTDIR="${2:-scenario_arcs}"
mkdir -p "$OUTDIR"

ALL_TSV="$OUTDIR/all_text.tsv"        # convo_id  title  ts  role  text
HITS_TSV="$OUTDIR/hits_user.tsv"      # subset: user's correction-style messages
ARCS_MD="$OUTDIR/arcs.md"             # contextual windows around each hit

# --- deps ---
need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1" >&2; exit 1; }; }
need jq
need rg
need gawk

echo ">> Input:  $INPUT"
echo ">> Output dir: $OUTDIR"

# --- 1) Extract all messages to TSV ---
# Columns: convo_id \t title \t timestamp \t role \t text
echo ">> Extracting messages..."
jq -r '
  .[] as $c
  | ($c.id // ($c.conversation_id // "unknown")) as $cid
  | ($c.title // "untitled") as $title
  | ($c.create_time // 0) as $ts
  | ($c.mapping | to_entries[]? | .value.message?) as $m
  | ($m.author?.role // "unknown") as $role
  | ($m | .. | strings) as $s
  | [$cid, $title, ($ts|tostring), $role, $s] | @tsv
' "$INPUT" > "$ALL_TSV"

LINES=$(wc -l < "$ALL_TSV" | tr -d ' ')
echo ">> Extracted $LINES rows to $ALL_TSV"

# --- 2) Find YOUR correction-style messages (role=user + regex) ---
echo ">> Finding user correction points..."
# Role delimiter is the 4th field; use rg to match only user rows plus useful phrases.
rg -n --no-line-number -i \
  -e '^\S+\t.*\t\d+\tuser\t.*(didn.?t work|still fail|not working|same error|throws|crash|build (failed|error)|didn.?t compile|undefined|cannot find|module not found|TS[0-9]{4}|TypeError|ReferenceError|that fixed it|that did it|works now|i had to|i changed|i tweaked)' \
  "$ALL_TSV" > "$HITS_TSV" || true

HITS=$(wc -l < "$HITS_TSV" | tr -d ' ')
echo ">> Found $HITS user correction lines -> $HITS_TSV"

# --- 3) Build contextual arcs around each hit (±6 messages) ---
# We do this in one gawk pass by:
#  - buffering all rows per conversation id
#  - recording indices where a row matches the "user correction" regex
#  - emitting windows around each index
echo ">> Building arcs with context windows..."
gawk -F '\t' -v W=6 '
BEGIN {
  IGNORECASE=1
  print "# Correction Arcs\n"
  # regex for user correction-style messages (same as in ripgrep above)
  re = "(didn.?t work|still fail|not working|same error|throws|crash|build (failed|error)|didn.?t compile|undefined|cannot find|module not found|TS[0-9]{4}|TypeError|ReferenceError|that fixed it|that did it|works now|i had to|i changed|i tweaked)"
}
# Capture all rows; store per-conversation arrays.
{
  cid=$1; title=$2; ts=$3; role=$4;
  text=$5; for (i=6;i<=NF;i++) text = text "\t" $i;

  # Normalize store index per conversation
  idx[++count[cid]]
  titles[cid]=title
  ts_conv[cid]=ts  # convo creation ts for header

  roles[cid, count[cid]] = role
  texts[cid, count[cid]] = text

  # Record hit positions (role=user + matches regex)
  if (role=="user" && text ~ re) {
    hitpos[cid, ++hitcount[cid]] = count[cid]
  }
}

END {
  for (cid in hitcount) {
    # Header per conversation (only those with hits)
    conv_title = (cid in titles) ? titles[cid] : "untitled"
    conv_ts = (cid in ts_conv) ? ts_conv[cid] : 0
    printf "## %s — %s (conversation: %s)\n\n", conv_title, strftime("%Y-%m-%d %H:%M:%S", conv_ts), cid

    for (h=1; h<=hitcount[cid]; h++) {
      pos = hitpos[cid, h]
      start = (pos-W > 1) ? pos-W : 1
      end   = (pos+W < count[cid]) ? pos+W : count[cid]

      printf "### Hit %d @ message %d (window %d..%d)\n\n", h, pos, start, end

      for (j=start; j<=end; j++) {
        r = roles[cid, j]
        t = texts[cid, j]
        # Pretty print each message with role label, real newlines, and escaped inner fences
        printf "**%s** — %s\n\n", r, (strftime("%Y-%m-%d %H:%M:%S", conv_ts))
        print "```"
        gsub(/\\n/, "\n", t)
        gsub(/```/, "``\\`", t)
        print t
        print "```\n"
      }
      print "---\n"
    }
  }
}
' "$ALL_TSV" > "$ARCS_MD"

echo ">> Done!"
echo "   - $ALL_TSV"
echo "   - $HITS_TSV"
echo "   - $ARCS_MD"
