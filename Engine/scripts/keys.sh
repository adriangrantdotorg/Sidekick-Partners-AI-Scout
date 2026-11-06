# Sourced by live-runs.sh and update.sh, in Engine/. The live site's keys (.env.local: its database address) and its
# Vercel link (.vercel/project.json) are gitignored, so a push or a merge never carries them: they live in the main
# VC Scout folder (copied there 11-04-26; user: "do this", so a run or a deploy works from any VC Scout folder, a
# brand-new worktree included), and in any folder that ran a launch or a deploy.
# MAIN: the main checkout's Engine/ (git's shared folder sits in the main checkout, for every worktree).
MAIN="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)")/Engine"

# The keys file a run reads: this folder's, else the main folder's. Empty when neither has a database address.
keys_file() {
  local f
  for f in "$(pwd)/.env.local" "$MAIN/.env.local"; do
    grep -q '^DATABASE_URL=' "$f" 2>/dev/null && { echo "$f"; return; }
  done
  return 0 # none found is an answer, not a failure: under set -e a failed grep here ended the caller silently (11-05-26)
}

# A folder with no Vercel link takes the main folder's (the link only: the deploy downloads the keys itself).
main_link() {
  [ -f .vercel/project.json ] && return 0
  [ -f "$MAIN/.vercel/project.json" ] || return 1
  mkdir -p .vercel && cp "$MAIN/.vercel/project.json" .vercel/project.json && printf '  linked from the main folder: %s\n' "$MAIN"
}
