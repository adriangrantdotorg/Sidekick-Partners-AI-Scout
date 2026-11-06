import { test, expect, type Page } from "@playwright/test";
import { PAGES, NAMES, ready } from "./pages";
import { titleCase } from "../../src/lib/titlecase";
import { RETIRED_NAMES } from "../../src/firm/defaults";

// Plan step 12, on every page as drawn: every label is Title Case (user's standard: headings, buttons, table headers,
// field names, tabs, status chips; prose, headlines and tooltips stay sentences), and no retired coined name shows
// unless the firm brands it as its own (Courtside's "The Combine"). The source half: tests/unit/names.test.ts.

const LABELS = "main h1, main h2, main h3, main th, main button, main a.btn, main a.x-btn, main [role=tab], main .x-tag, main .x-area, main .x-new, main .x-st, main .fsel, nav.nav a, nav.nav button, .tabbar a, footer.foot a";
/** Not a label though it sits where labels do: a startup's or a trend's own name, a key to press (Settings › Shortcuts). */
const NAME = "[data-company] .x-name, .x-dname, .ft-co, article.tcard h3, .rowcard h3, [data-keys]";
/** Inside a label, what is not part of it: a live time, a vote count, a keycap, an icon, a menu's choices. */
const STRIP = "[data-live], .x-votes, .kbd, svg, select";
const RETIRED = RETIRED_NAMES.filter((r) => !Object.values(NAMES).some((n) => r.re.test(n)));

/** The labels a page shows, each as its words with the parts that are not label taken out. */
const labels = (page: Page) =>
  page.evaluate(
    ([sel, name, strip]) =>
      [...document.querySelectorAll(sel)]
        .filter((el) => el.getClientRects().length && !el.closest(name) && getComputedStyle(el).visibility !== "hidden")
        .map((el) => {
          const c = el.cloneNode(true) as HTMLElement;
          c.querySelectorAll(strip).forEach((x) => x.remove());
          return (el.matches(".fsel") ? el.firstChild?.textContent || "" : c.textContent || "").replace(/\s+/g, " ").trim();
        })
        .filter((t) => /[a-z]/i.test(t) && !/[.?!]$/.test(t)), // a sentence (an alert rule as written) is prose, not a label
    [LABELS, NAME, STRIP] as const,
  );

async function everyPage(page: Page) {
  await page.goto("/settings");
  await ready(page);
  const sections = await page.locator(".snav a[href*='?s=']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
  return [...PAGES, ...new Set(sections), "/tracking#trends", "/tracking#people", "/tracking#alerts", "/tracking#configure"];
}

test("every label on every page is Title Case", async ({ page }) => {
  test.setTimeout(180_000);
  const bad: string[] = [];
  for (const path of await everyPage(page)) {
    await page.goto(path);
    await ready(page);
    for (const l of await labels(page)) if (titleCase(l) !== l) bad.push(`${path}: "${l}" → "${titleCase(l)}"`);
  }
  // the Phase II dialog a lock chip opens: its heading and its two labels
  await page.goto("/tracking");
  await ready(page);
  await page.locator(".lock-chip").first().click();
  for (const l of await page.getByTestId("door").locator("h2, .cols b").allInnerTexts()) if (titleCase(l.trim()) !== l.trim()) bad.push(`Phase II dialog: "${l.trim()}"`);
  expect([...new Set(bad)]).toEqual([]);
});

test("no retired coined name shows on any page, unless the firm brands it as its own", async ({ page }) => {
  test.setTimeout(180_000);
  const bad: string[] = [];
  for (const path of await everyPage(page)) {
    await page.goto(path);
    await ready(page);
    const text = await page.locator("body").innerText();
    for (const r of RETIRED) {
      const m = text.match(r.re);
      if (m) bad.push(`${path}: ${r.name} ("${text.slice(Math.max(0, m.index! - 30), m.index! + 40).replace(/\s+/g, " ")}")`);
    }
  }
  expect(bad).toEqual([]);
});
