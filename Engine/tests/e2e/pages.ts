// The firm these browser tests run on: NEXT_PUBLIC_SCOUT_FIRM (Sidekick by default), the profile the server was built
// with (npm run e2e:sidekick builds its made-up Scout, then runs these and its own). Courtside's lessons hold for every
// firm (Plan step 12, 11-03-26); where a firm's signed-off look replaced a part (its own colors, the Fit Table, a
// feature it turned off), a test reads that here instead of assuming Courtside.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FIRMS, REPO_ROOT, firmId, profilePath } from "../../firm.config.mjs";
import { DEFAULT_NAMES, DEFAULT_PATHS } from "../../src/firm/defaults";
import type { FeatureKey } from "../../src/firm/features";
import type { FirmProfile } from "../../src/firm/types";
import type { EffectKey } from "../../src/firm/effects";

// the profile is an ES module; Playwright's loader can hand it over wrapped once more
const mod = (await import(pathToFileURL(profilePath()).href)) as { default: FirmProfile | { default: FirmProfile } };
export const FIRM: FirmProfile = "default" in mod.default ? mod.default.default : mod.default;
/** Who built the site, from the firm's brand/builder.json (empty in the public copy, which credits no one, 11-05-26). */
const BF = path.join(REPO_ROOT, FIRMS[firmId()], "brand", "builder.json");
export const BUILDER: { name: string; url: string } = existsSync(BF) ? JSON.parse(readFileSync(BF, "utf8")) : { name: "", url: "" };
export const on = (key: FeatureKey) => FIRM.features[key] === true;
export const NAMES = { ...DEFAULT_NAMES, ...FIRM.names };
export const PATHS = { ...DEFAULT_PATHS, ...FIRM.paths };
/** Co-Investors is one timeline of deals, newest first, in place of the deals table and fund cards (brand.coInvestors, Sidekick 11-03-26). */
export const TIMELINE = FIRM.brand?.coInvestors === "timeline";
/** The Pipeline is the Fit Table, one table line per startup with no buttons (brand.pipeline, Sidekick 11-02-26). */
export const TABLE = FIRM.brand?.pipeline === "table";
/** Trends in two columns with labeled buttons (Sidekick, 11-04-26), or the card with its one action bar. */
export const TREND_COLUMNS = FIRM.brand?.trends === "columns";
/** A company page opens on a cover: the picture across the card, its mark hidden, Funds Raised under it (brand.dealSheet,
 *  Sidekick 11-02-26). */
export const COVER = FIRM.brand?.dealSheet === "cover";
/** The Pipeline's lines, whichever form the firm's Pipeline takes. */
export const ROWS = TABLE ? "#prows tbody tr" : "#prows .x-row";
/** How the firm's look answers a moving part: engine, own, off or unseen (src/firm/effects.ts). */
export const look = (k: EffectKey) => FIRM.effects?.[k]?.look ?? "engine";
/** The score's parts a company page shows: every weight above zero. */
export const SCORE_PARTS = Object.values(FIRM.thesis.weights).filter((v) => v > 0).length;
/** The firm's industry names: its own words, which may hold a word Scout never says of itself ("Premium Consumer Brands"). */
export const AREA_LABELS = FIRM.thesis.areas.map((a) => a.label);

/** Links the firm's own theme underlines at rest (Sidekick: anything Scout states from a source looks like a link,
 *  user 11-02-26). Read from the firm's brand/theme.css, so a link underlined anywhere else is still caught. */
const theme = path.join(REPO_ROOT, FIRMS[firmId() as keyof typeof FIRMS], "brand", "theme.css");
export const THEME_UNDERLINED = existsSync(theme)
  ? [...readFileSync(theme, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{[^}]*text-decoration:\s*underline[^}]*\}/g)].map((m) => m[1].trim()).join(", ")
  : "";

export const HOME = process.env.LIVE_URL ? "/" : "/preview";
export const PAGES = [
  HOME,
  "/pipeline",
  "/company/3",
  "/trends",
  ...(on("sponsorRadar") ? ["/sponsors"] : []),
  ...(on("culture") ? ["/culture"] : []),
  "/tracking",
  "/brief",
  "/backtest",
  PATHS.filings,
  PATHS.coInvestors,
  PATHS.peerFunds,
  "/settings",
  "/about",
];
export const LIVE = !!process.env.LIVE_URL;
export const IGNORE_CONSOLE = /favicon|Failed to load resource|s2\/favicons|status of 404|ERR_BLOCKED|net::ERR|Download the React DevTools|unavatar/i;

/** The page's buttons work once React has hydrated it (Shell sets html[data-hydrated]). */
export async function ready(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1", null, { timeout: 15_000 });
}

/** The firm's one call to action as the page paints it (--red: Courtside's red, Sidekick's brass). */
export const accent = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const i = document.createElement("i");
    i.style.color = "var(--red)";
    document.body.append(i);
    const c = getComputedStyle(i).color;
    i.remove();
    return c;
  });
