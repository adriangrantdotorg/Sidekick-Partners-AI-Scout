# Sourced by launch.sh and update.sh, in Engine/. Vercel's build runs at the repo root (11-03-26).
# Engine reads the firm's folder from the repo root (next.config.ts: turbopack.root and outputFileTracingRoot), so
# `vercel build` run in Engine/ traced files from the root but packed them from Engine/: it looked for
# Engine/Engine/.next/package.json and stopped. Vercel's own setup for an app inside a bigger repo is the project's
# Root Directory set to Engine, with pull, build and deploy run at the root. Linking, env and the database stay in Engine/.
ROOT=$(cd .. && pwd)
VR() { (cd "$ROOT" && npx --yes vercel@latest "$@"); }
# The root's link is a copy of Engine's (.vercel is gitignored in both); the project's Root Directory is set once.
root_link() {
  [ -f .vercel/project.json ] || return 1
  mkdir -p "$ROOT/.vercel" && cp .vercel/project.json "$ROOT/.vercel/project.json"
  local pid; pid=$(node -p 'require("./.vercel/project.json").projectId')
  if [ "$(node -p 'require("./.vercel/project.json").settings?.rootDirectory || ""')" != "Engine" ]; then
    npx --yes vercel@latest api "/v9/projects/$pid" -X PATCH -f rootDirectory=Engine > "$LOG/root-dir.log" 2>&1 || return 1
  fi
}
