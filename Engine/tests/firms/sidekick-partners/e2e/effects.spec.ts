// Sidekick's moving parts (Engine/src/firm/effects.ts) on its pages: only the parts its profile answers as Engine's
// move as Engine draws them, its own parts move in their place, and everything that moves visibly changes the screen.
import { test, expect } from "@playwright/test";
import type { FirmProfile } from "../../../../src/firm/types";
import * as mod from "../../../../../Sidekick Partners/profile";
import { checkMovingParts } from "../../../e2e-lib/effects";

// the profile is an ES module; Playwright's loader can hand it over wrapped once more
const profile = ((mod as { default: unknown }).default as { default?: FirmProfile }).default ?? ((mod as { default: FirmProfile }).default);

test("every moving part is the one Sidekick's look answered for, and each visibly moves (11-02-26: the Live glow)", async ({ page }) => {
  test.setTimeout(120_000);
  // with the Mac's Reduce Motion on, as user's is: Scout ignores it (Courtside's rule, 10-14-26), so every part still moves
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForSelector("html[data-hydrated='1']");
  const company = (await page.locator("a[title^='Open '][title$=' in Scout']").first().getAttribute("href"))!;
  const moved = await checkMovingParts(page, profile, ["/", "/pipeline", company, "/tracking", "/settings?s=scoring", "/about", "/trends", "/filings"]);
  // what the look of record moves: Engine's ticker, lead-count glow and sky; Sidekick's own Live dot and background
  for (const name of ["tick", "breatheG", "x-skydrift", "sk-live", "sk-streak", "sk-aurora", "sk-grid"]) expect(moved.has(name), `${name} never moved`).toBe(true);
  expect(moved.get("own:liveDot")).toBe("sk-live");
  // and what it leaves out never moves: the light along the line under page headings (no line on the signed-off pages)
  expect(moved.has("sweep")).toBe(false);
});
