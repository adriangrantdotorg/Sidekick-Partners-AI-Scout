#!/bin/bash
# The live site's two long runs after Plan step 13b's deploy, which user starts himself from a new session (11-04-26:
# "I want to be able to trigger that at my own convenience in a future session"):
#   1. Backtest of the Firm's Deals: each portfolio company's first round with the firm, then Scout's earlier signals
#      (about 45 min for Sidekick's 86 companies, measured on a copy of the live data)
#   2. News Links, Every One Stored: every Google News link a page shows, opened once (about 26 min for 391 links)
# Progress: ~/.vc-scout/<firm>/runs.html (scripts/runs-page.ts), which the session opens in the browser; the log is
# .logs/live-runs-<date>.log. Runs from any VC Scout folder (the keys come from the main folder: scripts/keys.sh).
#
#   bash Engine/scripts/live-runs.sh          says which keys, database and code it would use; starts nothing
#   bash Engine/scripts/live-runs.sh --go     starts both runs (in the background: about 70 min)
#
# It starts ONLY with --go and refuses any other word (11-04-26: an older version ignored an unknown --where and
# started the run on the live site by mistake). SCOUT_PGLITE=<copy> runs it on a copy instead.
set -euo pipefail
cd "$(dirname "$0")/.."
case "${1:-}" in
  "") GO= ;;
  --go) GO=1 ;;
  *) echo "❌ Unknown word: $1. Use --go to start the runs, or nothing to see what they would use."; exit 2 ;;
esac
[ $# -le 1 ] || { echo "❌ One word at most: --go"; exit 2; }
source scripts/keys.sh
KEYS="$(keys_file)"
if [ -z "${SCOUT_PGLITE:-}" ] && [ -z "$KEYS" ]; then
  echo "❌ No live database address in $(pwd)/.env.local or $MAIN/.env.local. Put the keys in the main VC Scout folder (npx vercel env pull .env.local in its Engine folder), then run this again."
  exit 1
fi
if [ -n "${SCOUT_PGLITE:-}" ]; then echo "Database: the copy $SCOUT_PGLITE"; else echo "Database: the live site (keys: $KEYS)"; fi
echo "Code: $(pwd) ($(git rev-parse --abbrev-ref HEAD) at $(git rev-parse --short HEAD))"
if [ -z "$GO" ]; then
  echo "Nothing started. To start the backtest (about 45 min) and the news links (about 26 min): add --go"
  exit 0
fi
mkdir -p .logs
if [ ! -d node_modules ]; then
  echo "Installing packages first (about a minute)"
  npm ci --no-audit --no-fund > .logs/npm.log 2>&1 || { echo "❌ npm ci failed (see $(pwd)/.logs/npm.log)"; exit 1; }
fi
LOG="$(pwd)/.logs/live-runs-$(date +%m-%d-%y-%H%M).log"
echo "Log: $LOG"
SCOUT_ENV_FILE="$KEYS" npx tsx scripts/pipeline-all.ts portfolio-backtest:40 links-all:10 --page="Backtest and News Links" 2>&1 | tee "$LOG"
