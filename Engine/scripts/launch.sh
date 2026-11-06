#!/bin/bash
# npm run launch [-- --from <step>]
# One command from a fresh clone to a live, filled, verified Scout for the firm in NEXT_PUBLIC_SCOUT_FIRM.
# Six steps, each reported to the progress page and printed as the chat block:
#   1 Setup      the person first (Vercel sign-in, database terms), then install and environment alone
#   2 Database   migrate, load the launch seed
#   3 Build      one production build, the unit tests, the browser suite against that build
#   4 Deploy     upload the build that was just tested (no second build on Vercel)
#   5 Fill       the jobs that fill the database, each listed on the page (a first launch: in the foreground)
#   6 Open       the live checks, then the site opens
# Every failure prints what went wrong and the way past it, then stops. Rerun with --from <step> to resume.
set -u
cd "$(dirname "$0")/.." || exit 1
LOG=.logs; mkdir -p "$LOG"
FROM=1
while [ $# -gt 0 ]; do case "$1" in --from) FROM="$2"; shift 2 ;; --help|-h) sed -n '2,10p' "$0"; exit 2 ;; *) echo "unknown option: $1" >&2; exit 2 ;; esac; done
say() { printf '\n▶ %s\n' "$1"; }
openurl() { case "$(uname -s)" in Darwin) open "$1" ;; Linux) xdg-open "$1" > /dev/null 2>&1 || true ;; *) true ;; esac; }
fail() { printf '\n❌ %s\n   The way past it: %s\n' "$1" "$2"; exit 1; }
step() { npx tsx scripts/step.ts "$@"; }
pre() { bash scripts/prestart.sh state "$@"; }   # the plain page's moments before the full page exists
V() { npx --yes vercel@latest "$@"; }
source scripts/vercel-root.sh   # VR: pull, build and deploy at the repo root (11-03-26)
# VC Scout's own folder, ports and project names, apart from the old Courtside repo (firm.config.mjs, 10-31-26)
FIRMCFG() { node firm.config.mjs "$@"; }
ELSEWHERE=$(FIRMCFG live-elsewhere 2>/dev/null)
[ -z "$ELSEWHERE" ] || fail "this firm's live site runs from $ELSEWHERE, not from VC Scout" "launch a firm whose site lives here (set NEXT_PUBLIC_SCOUT_FIRM), or work on this one in $ELSEWHERE"
PROGRESS=$(FIRMCFG progress-dir); PORT=$(FIRMCFG port); PRODUCT=$(FIRMCFG product)

# ---------- pre-flight (every run) ----------
command -v node >/dev/null 2>&1 || fail "Node.js is not installed" "install Node 20 or newer from nodejs.org, then run npm run launch again"
NODEV=$(node -p 'Number(process.versions.node.split(".")[0])')
[ "$NODEV" -ge 20 ] || fail "Node $NODEV is too old" "install Node 20 or newer from nodejs.org, then run npm run launch again"
command -v git >/dev/null 2>&1 || fail "git is not installed" "install git (on a Mac: xcode-select --install), then run npm run launch again"
for port in "$PORT" "$((PORT + 1))"; do
  for pid in $(lsof -ti tcp:$port 2>/dev/null); do kill "$pid" 2>/dev/null; done
done

# a resumed run (--from N) moves the progress page back to step N; without it the page kept an earlier run's later
# step ("Step 5 of 5" while step 3 built, 11-03-26)
[ "$FROM" -gt 1 ] && step "$FROM" --restart --note "resuming from step $FROM"

# ---------- 1 Setup: everything that needs a person comes FIRST, then the rest runs alone ----------
if [ "$FROM" -le 1 ]; then
  # Installing takes about a minute and needs nobody, so it runs in the background while the person signs in (10-14-26).
  npm ci --no-audit --no-fund > "$LOG/npm.log" 2>&1 &
  NPM_PID=$!
  bash scripts/prestart.sh open   # the progress page, from second zero: it says whose turn it is
  export SCOUT_STARTED_AT; SCOUT_STARTED_AT=$(cat "$PROGRESS/started-at" 2>/dev/null || echo "")
  say "Checking what needs you first: the progress page opens in your browser now"
  if V whoami > "$LOG/whoami.log" 2>&1; then
    # Say so: on the fourth dry run (10-14-26) the agent read the launch script to learn why no sign-in page came
    say "Already signed in to Vercel as $(tail -1 "$LOG/whoami.log"): no sign-in page"
  else
    # No sign-in on this machine. The CLI opens Vercel's device page and waits; that page signs in an existing account
    # or creates a free one (email code, or GitHub / GitLab / Bitbucket). Nothing else to do here (10-14-26).
    say "Vercel needs you once: sign in on the page that opens (no account yet? the same page lets you create a free one)"
    pre signin
    V login > "$LOG/login.log" 2>&1 &
    LOGIN_PID=$!
    # While the CLI waits for the person, pick the sign-in link and code out of its output for the progress page
    for _ in 1 2 3 4 5 6 7 8 9 10; do
      LURL=$(grep -oE 'https://vercel\.com/[^ ]+' "$LOG/login.log" 2>/dev/null | head -1)
      [ -n "$LURL" ] && break
      sleep 1
    done
    LCODE=$(printf '%s' "$LURL" | grep -oE 'code=[A-Za-z0-9-]+' | cut -d= -f2)
    [ -n "$LURL" ] && pre signin "$LURL" "$LCODE"
    wait "$LOGIN_PID" || fail "Vercel login did not complete (see .logs/login.log)" "run: npx vercel@latest login, sign in or create a free account on the page, then npm run launch again"
    pre start
    say "Signed in to Vercel"
  fi
  ACCOUNT=$(V whoami 2>/dev/null | tail -1)
  NAME=$(FIRMCFG project-name)
  if [ -f .vercel/project.json ]; then
    NAME=$(node -p 'require("./.vercel/project.json").projectName' 2>/dev/null || echo "$NAME")
  else
    # Ask Vercel about each name. CLI 64 prints `project ls` to stderr, so parsing it saw no projects and the
    # 10-14-26 dry run linked the live reference project. Free only on project_not_found; any other answer stops.
    taken() {
      V project inspect "$1" > "$LOG/name.log" 2>&1 && return 0
      # CLI 64 printed the code, CLI 65 a sentence ("There is no project for ...", 11-03-26): either means free
      grep -qiE 'project_not_found|there is no project for' "$LOG/name.log" && return 1
      fail "Vercel could not say whether the project name $1 is free (see .logs/name.log)" "check the network, then npm run launch again"
    }
    BASE=$NAME; i=2
    while taken "$NAME"; do NAME="$BASE-$i"; i=$((i + 1)); done
    V link --yes --project "$NAME" > "$LOG/link.log" 2>&1 || fail "Vercel could not create or link the project $NAME (see .logs/link.log)" "run: npx vercel link --yes --project $NAME, then npm run launch again"
  fi
  V env pull .env.local --yes > "$LOG/env.log" 2>&1
  if ! grep -q '^DATABASE_URL=' .env.local 2>/dev/null; then
    neon_add() { V integration add neon --plan free_v3 --name "$NAME-db" -m region=iad1 -m auth=false --no-claim < /dev/null > "$LOG/neon.log" 2>&1; }
    say "Creating the free Neon database $NAME-db"
    if neon_add; then
      say "Database created; the terms were already accepted on this account, so no terms page"
    else
      # An account that never used Neon must accept its terms once. Run by an agent, the CLI does not wait: it prints the
      # accept-terms page and exits. So the launch opens that page itself and retries until the terms are in (10-14-26).
      TERMS=$(grep -oE 'https://vercel\.com/[^" ]*accept-terms[^" ]*' "$LOG/neon.log" | head -1)
      [ -n "$TERMS" ] || fail "the free Neon database was not created (see .logs/neon.log)" "read .logs/neon.log; if Vercel asks for a payment card, add none and say so in the handoff; otherwise run: npx vercel@latest integration add neon --plan free_v3 --name $NAME-db -m region=iad1 -m auth=false --no-claim, then npm run launch again"
      say "Neon needs you once: accept its terms on the page that opens ($TERMS)"
      pre terms "$TERMS"
      openurl "$TERMS"
      tries=0
      while ! neon_add; do
        tries=$((tries + 1))
        [ "$tries" -lt 30 ] || fail "the database terms were not accepted within 5 minutes (see .logs/neon.log)" "open $TERMS, accept the terms, then npm run launch again"
        sleep 10
      done
      pre start
      say "Terms accepted"
    fi
    V env pull .env.local --yes > "$LOG/env.log" 2>&1
    grep -q '^DATABASE_URL=' .env.local || fail "DATABASE_URL did not arrive from Neon (see .logs/env.log)" "open the project on vercel.com, Storage, connect the Neon database to all environments, then npm run launch again"
  fi
  # The SEC asks every filing request for a contact email (its fair-access rules): the installer's own, typed here once
  # (or SEC_CONTACT_EMAIL=you@example.com npm run launch), never read from an account or the code (11-05-26).
  if ! V env ls 2>/dev/null | grep -q 'SEC_CONTACT_EMAIL'; then
    SEC="${SEC_CONTACT_EMAIL:-}"
    if [ -z "$SEC" ] && [ -t 0 ]; then
      printf '\n📧 The SEC asks every filing request for a contact email. Type yours, or press Return to skip the SEC filings: '
      read -r SEC
    fi
    if printf '%s' "$SEC" | grep -qE '^[^@ ]+@[^@ ]+\.[^@ ]+$'; then
      for e in production preview development; do printf %s "$SEC" | V env add SEC_CONTACT_EMAIL "$e" > /dev/null 2>&1; done
      say "SEC contact saved in the project's environment"
    else
      say "No SEC contact: Filings stays empty until SEC_CONTACT_EMAIL is added to the project's environment on vercel.com"
    fi
  fi
  pre walk
  printf '\n🚶 Nothing more is needed from you. You can walk away: the site opens in your browser by itself in a few minutes.\n'
  wait "$NPM_PID" || fail "npm install failed (see .logs/npm.log)" "rm -rf node_modules && npm run launch"
  (npx playwright install chromium > "$LOG/playwright.log" 2>&1 &)
  step 1 Setup --note "signed in, project $NAME linked, database created; setting the environment"
  ENVS=$(V env ls 2>/dev/null)
  SITE_URL="https://$NAME.vercel.app"
  if ! printf '%s' "$ENVS" | grep -q 'CRON_SECRET'; then CS=$(openssl rand -hex 24); for e in production preview development; do printf %s "$CS" | V env add CRON_SECRET "$e" > /dev/null 2>&1; done; fi
  if ! printf '%s' "$ENVS" | grep -q 'SITE_URL'; then for e in production preview development; do printf %s "$SITE_URL" | V env add SITE_URL "$e" > /dev/null 2>&1; done; fi
  V env pull .env.local --yes > "$LOG/env.log" 2>&1
  step 1 Setup --note "project, database and environment ready (account: $ACCOUNT)"
fi

# ---------- 2 Database ----------
if [ "$FROM" -le 2 ]; then
  step 2 Database --note "creating the tables"
  npm run -s db:migrate > "$LOG/migrate.log" 2>&1 || fail "the database migration failed (see .logs/migrate.log)" "check DATABASE_URL in .env.local answers (npx tsx scripts/q.ts 'select 1'), then npm run launch -- --from 2"
  step 2 Database --note "loading the launch seed"
  npm run -s seed > "$LOG/seed.log" 2>&1 || fail "the launch seed did not load (see .logs/seed.log)" "npm run launch -- --from 2"
  # a firm's first launch has no seed of its own: its portfolio page fills the portfolio (the weekly job's first stage)
  if grep -q 'first launch' "$LOG/seed.log"; then
    step 2 Database --note "loading the portfolio from the firm's own page"
    SCOUT_NO_PROGRESS=1 npx tsx scripts/pipeline-all.ts weekly --rounds=1 > "$LOG/portfolio.log" 2>&1 || fail "the portfolio did not load (see .logs/portfolio.log)" "npm run launch -- --from 2"
  fi
fi

# ---------- 3 Build and Tests ----------
if [ "$FROM" -le 3 ]; then
  # every moving part Engine draws must have been seen in this firm's look first (src/firm/effects.ts, 11-02-26)
  npx tsx scripts/effects.ts || fail "this firm's look has moving parts nobody has looked at yet (listed above)" "show each one to user on a design page, answer it in effects in the firm's profile.ts, then npm run launch -- --from 3"
  step 3 "Build and Tests" --note "one production build (about a minute)"
  # the share image and tab icons ship with the site (user, 10-30-26 and 10-31-26): none, no build
  MISSING=$(FIRMCFG brand-missing)
  [ -z "$MISSING" ] || fail "this firm's brand folder lacks $MISSING" "make it (the social-graphics skill's share image round: user picks), save it in the firm's brand/ folder, then npm run launch -- --from 3"
  root_link || fail "Vercel's Root Directory could not be set to Engine (see .logs/root-dir.log)" "on vercel.com, the project's Settings, Build and Deployment, Root Directory: Engine; then npm run launch -- --from 3"
  VR pull --yes --environment=production > "$LOG/pull.log" 2>&1
  VR build --prod > "$LOG/build.log" 2>&1 || fail "the production build failed (see .logs/build.log)" "fix the error the log names, then npm run launch -- --from 3"
  step 3 "Build and Tests" --note "unit tests"
  npx vitest run > "$LOG/unit.log" 2>&1 || fail "a unit test failed (see .logs/unit.log)" "fix the test the log names, then npm run launch -- --from 3"
  # a real read by every AI feature that is on, through its real schema (user, 11-03-26: the browser tests only see
  # stand-in answers; "ensure that we do this when it comes to this step")
  if [ "${LAUNCH_SKIP_AI:-}" = "1" ]; then
    step 3 "Build and Tests" --note "real AI reads skipped on request (LAUNCH_SKIP_AI=1)"
  else
    step 3 "Build and Tests" --note "a real read by each AI feature"
    npm run -s check:ai > "$LOG/ai.log" 2>&1 || { cat "$LOG/ai.log"; fail "an AI feature's real read failed (see .logs/ai.log)" "fix what it names, then npm run launch -- --from 3; to launch with the AI features off for now, LAUNCH_SKIP_AI=1 npm run launch -- --from 3"; }
  fi
  if [ "${LAUNCH_SKIP_E2E:-}" = "1" ]; then
    step 3 "Build and Tests" --note "browser suite skipped on request (LAUNCH_SKIP_E2E=1)"
  else
    # the firm's browser suites on its made-up local Scout (E2E_SCRIPTS in firm.config.mjs): never on the real
    # database, which is new and empty on a first launch and would keep the suites' clicks
    E2E=$(FIRMCFG e2e-script 2>/dev/null)
    [ -n "$E2E" ] || fail "this firm has no browser suite on a made-up local Scout" "add its npm script to E2E_SCRIPTS in firm.config.mjs, then npm run launch -- --from 3"
    step 3 "Build and Tests" --note "browser suites on a made-up local Scout (about five minutes)"
    for port in "$PORT" "$((PORT + 1))"; do for pid in $(lsof -ti tcp:"$port" 2>/dev/null); do kill "$pid" 2>/dev/null; done; done
    npm run -s "$E2E" > "$LOG/e2e.log" 2>&1 || fail "a browser test failed (see .logs/e2e.log)" "rerun once with npm run launch -- --from 3; if the same test fails again on this machine, LAUNCH_SKIP_E2E=1 npm run launch -- --from 3"
  fi
fi

# ---------- 4 Deploy ----------
if [ "$FROM" -le 4 ]; then
  step 4 Deploy --note "uploading the build that was just tested"
  root_link || fail "Vercel's Root Directory could not be set to Engine (see .logs/root-dir.log)" "on vercel.com, the project's Settings, Build and Deployment, Root Directory: Engine; then npm run launch -- --from 4"
  [ -d "$ROOT/.vercel/output" ] || { VR pull --yes --environment=production > "$LOG/pull.log" 2>&1; VR build --prod > "$LOG/build.log" 2>&1 || fail "the production build failed (see .logs/build.log)" "fix the error the log names, then npm run launch -- --from 3"; }
  VR deploy --prebuilt --prod --yes > "$LOG/deploy.log" 2>&1 || fail "the deploy failed (see .logs/deploy.log)" "npm run launch -- --from 4"
fi

# ---------- 5 Fill the Site ----------
NAME=$(node -p 'require("./.vercel/project.json").projectName' 2>/dev/null || FIRMCFG project-name)
# The PUBLIC address only (scripts/live-url.sh). The per-deploy address is behind Vercel's login wall: the third dry
# run (10-14-26) checked it, every page answered 302 to vercel.com, and the wall's address leaked into SITE_URL.
URL=$(bash scripts/live-url.sh "$LOG/deploy.log" .vercel/project.json)
if [ "$FROM" -le 5 ]; then
  step 5 "Fill the Site" --live "$URL" --note "waiting for the address to answer"
  for _ in $(seq 1 30); do [ "$(curl -s -o /dev/null -w '%{http_code}' "$URL/")" = "200" ] && break; sleep 3; done
  [ "$(curl -s -o /dev/null -w '%{http_code}' "$URL/")" = "200" ] || fail "the site at $URL is not answering yet (see .logs/deploy.log)" "wait a minute, then npm run launch -- --from 4"
  if ! grep -q "SITE_URL=\"\\?$URL" .env.local 2>/dev/null; then
    for e in production preview development; do V env rm SITE_URL "$e" --yes > /dev/null 2>&1; printf %s "$URL" | V env add SITE_URL "$e" > /dev/null 2>&1; done
  fi
  # A first launch (no 12-month backfill has ever finished) fills the database here, in the foreground, before the live
  # checks: the first pull, the 12-month funding news, the AI Thesis Check on every card, the Library, then the scores
  # again, then the trends, which read what the backfill found (11-03-26: they ran before it and found none) (Plan step
  # 13). The page lists each job with its own count and time (11-03-26). A later launch, or one whose
  # firm came with a seed, pulls behind the site instead. --skip-fresh: a resumed launch skips what already finished.
  FILLED=$(npx tsx scripts/q.ts "select count(*)::int as n from job_runs where job = 'backfill' and status = 'ok'" 2>/dev/null | grep -oE '"n": *[0-9]+' | grep -oE '[0-9]+$')
  if [ "${FILLED:-0}" = "0" ]; then
    FILL_JOBS="collect-media collect-signals culture sponsors funds-neighborhood funds-synergistic score enrich backfill:60 thesis-check-all:20 library:5 portfolio-backtest:40 score trends alerts monday-brief links-all:10"
    # shellcheck disable=SC2086
    npx tsx scripts/pipeline-all.ts $FILL_JOBS --skip-fresh=360 > "$LOG/pipeline.log" 2>&1 || fail "filling the site stopped (see .logs/pipeline.log)" "npm run launch -- --from 5"
    # the site's pages are kept for 5 minutes (revalidate = 300): the checks ran on the empty pages once (11-03-26)
    step 5 "Fill the Site" --live "$URL" --note "waiting 5 minutes for the site's pages to show the new data"
    sleep 310
  else
    step 5 "Fill the Site" --live "$URL" --note "the first pull of fresh sources runs behind the site"
    nohup npm run -s pipeline:all > "$LOG/pipeline.log" 2>&1 &
  fi
fi

# ---------- 6 Open ----------
step 6 Open --live "$URL" --note "checking the live site"
# Vercel keeps CRON_SECRET as a hidden production secret that never comes down to this Mac (11-03-26: the check sent
# an empty one and read 401). Vercel's own crons send it themselves; the check runs only when the secret is here.
CS=$(grep '^CRON_SECRET=' .env.local 2>/dev/null | cut -d= -f2 | tr -d '"')
CRON=200
[ -n "$CS" ] && CRON=$(curl -s -o /dev/null -w '%{http_code}' -H "authorization: Bearer $CS" "$URL/api/cron/alerts")
[ "$CRON" = "200" ] || printf '⚠️ the alerts job answered %s on the live site; the daily jobs may need a look (vercel.com, the project, Crons)\n' "$CRON"
npx tsx scripts/verify-live.ts "$URL" --light > "$LOG/verify.log" 2>&1 || { tail -12 "$LOG/verify.log"; fail "a live check failed (see .logs/verify.log)" "fix what it names, then npm run launch -- --from 6"; }
step 6 Open --live "$URL" --note "live and verified; opening it" --done
openurl "$URL"
ACCOUNT=$(V whoami 2>/dev/null | tail -1)
printf '\n✅ %s is live: %s\n   Vercel account: %s · project: %s\n   The daily jobs keep it fresh from tomorrow.\n   Later, to get the newest version: npm run update\n' "$PRODUCT" "$URL" "$ACCOUNT" "$NAME"
