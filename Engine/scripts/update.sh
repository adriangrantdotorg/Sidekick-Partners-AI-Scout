#!/bin/bash
# npm run update: pull the newest version of Scout, migrate, build, deploy the tested build, check it.
set -u
cd "$(dirname "$0")/.." || exit 1
LOG=.logs; mkdir -p "$LOG"
fail() { printf '\n❌ %s\n   The way past it: %s\n' "$1" "$2"; exit 1; }
V() { npx --yes vercel@latest "$@"; }
source scripts/vercel-root.sh   # VR: pull, build and deploy at the repo root (11-03-26)
source scripts/keys.sh          # a folder with no Vercel link takes the main VC Scout folder's (11-04-26)
main_link || fail "this folder is not linked to a Vercel project yet, and neither is the main VC Scout folder" "run npm run launch first"
printf '▶ Pulling the newest version\n'
# a worktree branch with no GitHub copy (11-03-26: Sidekick deploys from its launch worktree) has nothing to pull
if git rev-parse --abbrev-ref --symbolic-full-name @{u} > /dev/null 2>&1; then
  git pull --ff-only > "$LOG/pull-git.log" 2>&1 || fail "git pull did not fast-forward (see .logs/pull-git.log)" "git stash, then npm run update"
else
  printf '  this branch has no GitHub copy: nothing to pull, deploying this checkout as it is\n'
fi
npm ci --no-audit --no-fund > "$LOG/npm.log" 2>&1 || fail "npm install failed (see .logs/npm.log)" "rm -rf node_modules && npm run update"
V env pull .env.local --yes > "$LOG/env.log" 2>&1
printf '▶ Migrating\n'
npm run -s db:migrate > "$LOG/migrate.log" 2>&1 || fail "the migration failed (see .logs/migrate.log)" "npm run update"
# The startups the team added with checked details (the firm's library.ts) go in now, with their pictures and scores,
# so the build below already shows them (user, 11-11-26: "i want these companies live asap"). Nothing new: two
# lookups a pick. A failure never stops the deploy: the next morning's jobs add them.
printf '▶ Adding the startups the team added\n'
if npx tsx scripts/team-picks.ts > "$LOG/team-picks.log" 2>&1; then sed 's/^/  /' "$LOG/team-picks.log" | tail -4
else printf '  ⚠️ not added now (see .logs/team-picks.log): the next morning'"'"'s jobs add them\n'; fi
printf '▶ Building\n'
root_link || fail "Vercel's Root Directory could not be set to Engine (see .logs/root-dir.log)" "on vercel.com, the project's Settings, Build and Deployment, Root Directory: Engine; then npm run update"
VR pull --yes --environment=production > "$LOG/pull.log" 2>&1
# Pages are prerendered from the database; one dropped connection (Neon "fetch failed") failed a whole build (10-31-26), so build once more
build() { VR build --prod > "$LOG/build.log" 2>&1; }
build || { grep -q "Error connecting to database" "$LOG/build.log" && { printf '▶ The database dropped a connection mid-build; building again\n'; sleep 5; build; }; } || fail "the build failed (see .logs/build.log)" "fix what the log names, then npm run update"
# The share image needs the public address; a Mac build once baked in localhost (10-31-26, siteUrl in src/lib/share.ts)
grep -rqs 'property="og:image" content="http://localhost' "$ROOT/.vercel/output/static" && fail "the build points the share image at localhost" "check .vercel/project.json names the Vercel project, then npm run update"
printf '▶ Deploying the build\n'
VR deploy --prebuilt --prod --yes > "$LOG/deploy.log" 2>&1 || fail "the deploy failed (see .logs/deploy.log)" "npm run update"
URL=$(grep '^SITE_URL=' .env.local | cut -d= -f2 | tr -d '"')
# Right after the deploy the address can still serve the old build for a few seconds; the check once read it (10-31-26)
B=$(cat .next/BUILD_ID 2>/dev/null)
if [ -n "$B" ]; then
  printf '▶ Waiting for the live site to serve the new build\n'
  i=0; until curl -fsS "$URL/" 2>/dev/null | grep -q "$B"; do i=$((i+1)); [ "$i" -ge 30 ] && fail "the live site still serves the old build after 90 s" "npm run verify:live -- $URL"; sleep 3; done
fi
printf '▶ Checking %s\n' "$URL"
npx tsx scripts/verify-live.ts "$URL" --light > "$LOG/verify.log" 2>&1 || { tail -12 "$LOG/verify.log"; fail "a live check failed (see .logs/verify.log)" "fix what it names, then npm run update"; }
printf '\n✅ Scout is up to date: %s\n' "$URL"
