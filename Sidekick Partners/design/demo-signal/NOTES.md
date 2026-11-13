# Demo signal: how Scout says "this is a demo"

Sidekick's pick: **A1, Outlined Tag** (round 2).

## What shipped (in the Engine)
- `DemoTag` in `Engine/src/components/Shell.tsx`, beside the logo's word in `BrandMark` (the header and the Building
  page). Only a site with a builder (`brand/builder.json`) draws it, so the public copy shows none. Tooltip: the
  footer's disclaimer line.
- `Engine/src/app/globals.css`: the tag's shape and its narrow rules (below 1320px it stays beside the logo, smaller; on
  a phone it sits under the logo and takes no width). Sidekick's look is in `brand/theme.css`: light brass `#e2c27d`,
  Source Sans 3 small capitals (marked `!important`: a stronger rule reset them). Guard: `Engine/tests/unit/demo-tag.test.ts`.
- No dot: the ticker's Live label is the only thing in the header with one.

## Files and regenerate
- `build.py` writes both rounds from `assets/today-live.html` (the live Today page as drawn, scripts stripped) and
  `assets/site-*.css` (the live stylesheets, saved beside it). `python3 build.py` rebuilds the pages;
  `python3 build.py --recut` re-captures the live page with `render.mjs` (Playwright from Engine, in dark mode).

## Traps met
- Vercel's bot checkpoint answers a headless browser after a few captures in a row: the recut refuses to save it.
- A page drawn from `file://` lost the live stylesheet mid-session: the CSS is saved beside the pages.
