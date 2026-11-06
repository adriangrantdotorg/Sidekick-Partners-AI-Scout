import { test, expect } from "@playwright/test";
import { HOME, LIVE, PATHS, ROWS, TABLE, TREND_COLUMNS, accent, on, TIMELINE } from "./pages";

/** A token's color as the page paints it inside `sel` (a firm's cards can redefine a token, as Sidekick's cream ones do). */
const tokenIn = (page: import("@playwright/test").Page, sel: string, token: string) =>
  page.locator(sel).first().evaluate((el, t) => {
    const i = document.createElement("i");
    i.style.color = `var(${t})`;
    el.append(i);
    const c = getComputedStyle(i).color;
    i.remove();
    return c;
  }, token);

// Round 3 (10-14-26): user's picks from the six variations pages, each pressed or measured.

// a firm with Trends in two columns (brand.trends): the stories open in their own row, Track sits in the right column
test("Trends in columns: See the N Stories opens under the buttons, which never move; Track turns green", async ({ page }) => {
  test.skip(LIVE, "writes run locally only");
  test.skip(!TREND_COLUMNS, "this firm draws Trends as cards");
  await page.goto("/trends");
  await page.waitForSelector("html[data-hydrated='1']");
  const card = page.locator("article.tcol").first();
  const see = card.getByRole("button", { name: /^See the \d+ Stor(y|ies)$/ });
  const find = card.getByRole("link", { name: "Find Startups in This Trend" });
  const before = [await see.boundingBox(), await find.boundingBox()];
  await see.click();
  await expect(card.getByTestId("trend-stories")).toBeVisible();
  const after = [await see.boundingBox(), await find.boundingBox()];
  for (const k of [0, 1]) expect(Math.abs(before[k]!.y - after[k]!.y) + Math.abs(before[k]!.x - after[k]!.x), "the buttons stay where they were").toBeLessThan(1);
  await see.click();
  await expect(card.getByTestId("trend-stories")).toHaveCount(0);
  const track = card.locator("button.track");
  const was = await track.getAttribute("aria-pressed");
  await track.click();
  await expect(track).toHaveAttribute("aria-pressed", was === "true" ? "false" : "true");
  const pressed = (await track.getAttribute("aria-pressed")) === "true";
  expect(await track.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(pressed ? "rgb(15, 107, 51)" : await accent(page));
  await track.click();
  await expect(track).toHaveAttribute("aria-pressed", was!);
  // gone with the columns: the outlets named again in the sentence, the "News" chips, Real-time and votes
  await expect(card.locator(".src2, .lock-chip, [data-vote]")).toHaveCount(0);
});

test("Trends: one action bar, Track turns green and says Tracking", async ({ page }) => {
  test.skip(LIVE, "writes run locally only");
  test.skip(TREND_COLUMNS, "this firm draws Trends in columns (the test above)");
  await page.goto("/trends");
  const bar = page.locator(".tbar").first();
  const mids = await bar.locator("> *:not(.tlist)").evaluateAll((els) => els.map((e) => Math.round((e.getBoundingClientRect().top + e.getBoundingClientRect().bottom) / 2)));
  expect(Math.max(...mids) - Math.min(...mids), "bar controls share one line (centers within 4px)").toBeLessThanOrEqual(4);
  await bar.locator("button", { hasText: /^Timeline/ }).click();
  await expect(bar.locator(".tlist")).toBeVisible();
  const track = bar.locator("button.track");
  const was = await track.getAttribute("aria-pressed");
  await track.click();
  await expect(track).toHaveAttribute("aria-pressed", was === "true" ? "false" : "true");
  const pressed = (await track.getAttribute("aria-pressed")) === "true";
  const bg = await track.evaluate((el) => getComputedStyle(el).backgroundColor);
  // Track is the firm's one call to action (--red: Courtside's red, Sidekick's brass); Tracking is green
  expect(bg).toBe(pressed ? "rgb(15, 107, 51)" : await accent(page));
  await expect(track).toHaveText(pressed ? /Tracking/ : /Track$/);
  await track.click(); // put it back
  await expect(track).toHaveAttribute("aria-pressed", was!);
});

test("Pipeline rows (V2): Visit or Find Website, Track, More and votes, none clipped; More holds the five actions", async ({ page }) => {
  await page.goto("/pipeline");
  // the Fit Table has no buttons on its lines (Sidekick, 11-02-26): the same actions live on the startup's page
  if (TABLE) await page.goto((await page.locator(`${ROWS} a[data-act=open]`).first().getAttribute("href"))!);
  const side = page.locator(TABLE ? ".x-deal" : ".x-row .x-side").first();
  await expect(side.locator(".x-btn.site")).toHaveText(/^(Visit Website|Find Website)$/);
  await expect(side.locator('[data-act="track"]')).toBeVisible();
  await expect(side.locator(".x-votes")).toBeVisible();
  await page.waitForSelector("html[data-hydrated='1']");
  const clipped = await side.locator(".x-btn").evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).length);
  expect(clipped).toBe(0);
  await side.locator(".x-more").click();
  expect((await side.locator(".x-menu button").allInnerTexts()).map((t) => t.trim())).toEqual(["Draft Investment Memo", "Connection Email", "Add Note", "Copy for CRM", "Download CSV", "Not a Fit"]);
  await page.keyboard.press("Escape");
  await expect(side.locator(".x-menu")).toBeHidden();
});

test("Filings and deals are tables with the picked columns", async ({ page }) => {
  await page.goto(HOME);
  const f = page.locator('table[data-table="filings"]').first();
  const heads = async (t: typeof f) => (await t.locator("th").allInnerTexts()).map((x) => x.trim().toLowerCase());
  if (await f.count()) expect(await heads(f)).toEqual(expect.arrayContaining(["company", "sold", "industry · fit"]));
  await page.goto(PATHS.filings);
  expect(await heads(page.locator('table[data-table="filings"]'))).toEqual(expect.arrayContaining(["company", "sold", "industry · fit", "notes", "source"]));
  await page.goto(HOME);
  const d = page.locator('table[data-table="deals"]').first();
  if (await d.count()) expect(await heads(d)).toEqual(expect.arrayContaining(["fund", "backed", "amount", "source"]));
  await page.goto(PATHS.coInvestors);
  if (TIMELINE) {
    // a firm whose Co-Investors is the timeline (brand.coInvestors) has no deals table: tests/firms/<id>/e2e test it
    await expect(page.locator('table[data-table="deals"]')).toHaveCount(0);
    await expect(page.locator("#fund-feed .tl .te").first()).toBeVisible();
  } else {
    expect(await heads(page.locator('table[data-table="deals"]'))).toEqual(expect.arrayContaining(["fund", "backed", "round", "amount", "industry", "source"]));
    // text in the link color (--red-ink) in a deal row is always a link
    const ink = await tokenIn(page, 'table[data-table="deals"] td', "--red-ink");
    const inkNonLinks = await page.locator('table[data-table="deals"] td *').evaluateAll((els, c) => els.filter((e) => getComputedStyle(e).color === c && !e.closest("a")).length, ink);
    expect(inkNonLinks).toBe(0);
  }
  await expect(page.locator("body")).not.toContainText("Clear Filters");
  await page.goto(PATHS.peerFunds);
  await expect(page.locator("body")).not.toContainText("Clear Filters");
});

test("Culture: tabs with counts switch the panels and keep the hash", async ({ page }) => {
  test.skip(!on("culture"), "Culture is off for this firm");
  await page.goto("/culture");
  const tabs = page.locator('.tabs [role="tab"]');
  expect(await tabs.count()).toBe(3);
  await expect(page.locator("#panel-taste")).toBeVisible();
  await expect(page.locator("#panel-named")).toBeHidden();
  await expect(async () => {
    await tabs.nth(1).click(); // the click lands once the page has hydrated
    await expect(page.locator("#panel-named")).toBeVisible({ timeout: 800 });
  }).toPass({ timeout: 10000 });
  await expect(page.locator("#panel-taste")).toBeHidden();
  expect(page.url()).toContain("#named");
  await page.goto("/pipeline"); // a link from another page lands on the tab in the hash
  await page.goto("/culture#shows");
  await expect(page.locator("#panel-shows")).toBeVisible();
});
