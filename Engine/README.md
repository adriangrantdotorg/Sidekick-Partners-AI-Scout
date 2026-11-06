# ⚙️ Engine

The shared app behind every firm's Scout: pages, daily jobs, scoring, AI calls and tests. It names no firm; the firm
it builds comes from `NEXT_PUBLIC_SCOUT_FIRM` (default `sidekick-partners`) and that firm's folder at the repo root.
What VC Scout is and how to launch a firm: [the repo's README](../README.md).

## 🗺️ Where things are

| Folder | What it holds |
| --- | --- |
| `src/firm/` | The firm seam: `@/firm` (`firm`, `NAMES`, `PATHS`, `on()`), feature switches, moving parts |
| `src/lib/jobs/` | The daily jobs (`index.ts`), their runner and time box; routes in `src/app/api/cron/[job]` |
| `src/lib/sources/` | Fetching (`http.ts`), pure parsers, Google News links |
| `src/lib/` | Scoring, thesis rules, page reads (`queries.ts`), AI calls (`ai.ts`), the launch seed (`seed.ts`) |
| `src/components/` | The shell, cards, overlays |
| `scripts/` | Launch, update, live checks, the seed export and load, one-off reads |
| `tests/unit` · `tests/e2e` · `tests/firms/<id>` | Unit tests, Engine's browser tests (run on every firm), each firm's own |

## 🧪 Checks

```bash
npm ci
npx vitest run
npx tsc --noEmit
npm run e2e:sidekick
```

`npm run check` runs all of them. The browser tests build Sidekick on a made-up local Scout (ports 4701-4702), so
they never touch a live site. `npx tsc --noEmit` needs one build first in a fresh checkout (`next-env.d.ts`).

## 🌱 A firm's launch seed

`npm run seed:export` writes `<Firm Folder>/seed/launch-seed.json` from the database in `.env.local` (it only reads);
`npm run seed` (the launch's step 2) loads it into a fresh database and refuses another firm's seed. Re-export it
whenever the live site has gathered data worth starting from.
