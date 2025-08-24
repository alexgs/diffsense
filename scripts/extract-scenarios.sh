#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------
# Extract likely scenario candidates from a ChatGPT export
# Usage: ./extract-scenarios.sh [conversations.json] [outdir]
# Defaults: conversations.json ./scenario_hits
# ---------------------------------------------

INPUT="${1:-conversations.json}"
OUTDIR="${2:-scenario_hits}"
mkdir -p "$OUTDIR"

ALL_TSV="$OUTDIR/all_text.tsv"
HITS_TSV="$OUTDIR/hits.tsv"
HITS_MD="$OUTDIR/hits.md"
HITS_MD_PRETTY="$OUTDIR/hits_pretty.md"

# --- deps check ---
need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1" >&2; exit 1; }; }
need jq
need rg
need gawk

echo ">> Input:  $INPUT"
echo ">> Output: $OUTDIR"

# --- Step 1: Dump all strings (title, timestamp, role, text) ---
echo ">> Extracting all text to TSV..."
jq -r '
  .[] as $c
  | ($c.title // "untitled") as $title
  | ($c.create_time // 0) as $ts
  | ($c.mapping | to_entries[]? | .value.message?) as $m
  | ($m.author?.role // "unknown") as $role
  | ($m | .. | strings) as $s
  | select(($s | length) > 40)
  | [$title, ($ts|tostring), $role, $s]
  | @tsv
' "$INPUT" > "$ALL_TSV"

LINES=$(wc -l < "$ALL_TSV" | tr -d ' ')
echo ">> Extracted $LINES rows to $ALL_TSV"

# --- Step 2: Grep candidate patterns with rg ---
echo ">> Searching for candidate hits..."
rg -n --no-line-number -i \
  -e '"patch":\s*\{\s*"find"' \
  -e '```(ts|typescript|diff|json|bash|sh)' \
  -e '\b(tsconfig|NodeNext|moduleResolution|esModuleInterop|noEmit|paths|baseUrl)\b' \
  -e '\b(changeset|turborepo|vitest|vite|commander|enquirer)\b' \
  -e '\b(Error:|TS[0-9]{4}|TypeError|ReferenceError)\b' \
  "$ALL_TSV" > "$HITS_TSV" || true

HITS=$(wc -l < "$HITS_TSV" | tr -d ' ')
echo ">> Found $HITS candidate lines -> $HITS_TSV"

# --- Step 3: Skim-friendly Markdown with gawk (strftime) ---
echo ">> Building Markdown index..."
gawk -F '\t' '
BEGIN { print "# Candidate Hits\n" }
{
  title=$1; ts=$2; role=$3;
  text=$4; for (i=5;i<=NF;i++) text = text "\t" $i;
  printf "## %s — %s (%s)\n\n", title, strftime("%Y-%m-%d %H:%M:%S", ts), role;
  print "```";
  print text;
  print "```\n";
}
' "$HITS_TSV" > "$HITS_MD"

# --- Step 4: Pretty pass (newline expansion + inner ``` escaping) ---
echo ">> Prettyfying code fences..."
gawk '
  BEGIN { inblock=0 }
  /^```$/ {
    print
    inblock=!inblock
    next
  }
  {
    if (inblock) {
      gsub(/\\n/,"\n")        # literal backslash-n -> real newline
      gsub(/```/,"\\```")     # escape inner fences so they don’t close the outer block
    }
    print
  }
' "$HITS_MD" > "$HITS_MD_PRETTY"

echo ">> Done!"
echo "   - $ALL_TSV"
echo "   - $HITS_TSV"
echo "   - $HITS_MD"
echo "   - $HITS_MD_PRETTY"
