// Plan step 10 in the browser, on Sidekick: every new button is pressed, its effect checked, and the button is what a
// click at its center lands on. The Deck Screen's AI answer is a stand-in (no AI key before Plan step 13); the PDF is
// read for real by PDF.js in the page.
import { test, expect, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { FirmProfile } from "../../../../src/firm/types";
import * as mod from "../../../../../Sidekick Partners/profile";

// the profile is an ES module; Playwright's loader can hand it over wrapped once more
const profile = ((mod as { default: unknown }).default as { default?: FirmProfile }).default ?? ((mod as { default: FirmProfile }).default);
// The Deck Screen is off and marked incomplete (user, 11-03-26): its tests wait here, skipped, for the day it is
// finished and turned on (INCOMPLETE in src/firm/features.ts says what it still lacks)
const DECK = profile.features.deckScreen;
const DECK_OFF = "the Deck Screen is off for Sidekick and incomplete (INCOMPLETE in src/firm/features.ts)";

const ENGINE = fileURLToPath(new URL("../../../../", import.meta.url));
const PDF = `${ENGINE}.local-db/test-deck.pdf`;
const COPY_TIP = "Copy this section as Markdown";

// The stand-in answer, streamed the way /api/deck streams: each answer's start, then the result
const RESULT = {
  company: "Cartwise",
  oneLine: "AI upsell offers for Shopify brands",
  area: "ecommerce-software",
  stage: "Seed",
  raising: "$2.5M",
  screen: [
    { key: "stageRaise", status: "shown", figure: "$2.5M", text: "Seed, raising $2.5M; inside Sidekick's check range." },
    { key: "numbers", status: "partial", figure: "$1.2M ARR", text: "$1.2M ARR from 140 merchants." },
    { key: "pathToProfit", status: "claimed", figure: "$3M ARR", text: "Claims break-even at $3M ARR." },
    { key: "founderFit", status: "shown", figure: "2 Founders", text: "Two founders from Shopify partner agencies." },
    { key: "exitPath", status: "shown", figure: null, text: "Instacart bought Caper for about $350M." },
    { key: "missing", status: "absent", figure: "2 Gaps", text: "Churn and payback." },
  ],
  moat: { strength: "thin", text: "Thin today." },
  vaguestClaim: { quote: "\"Lifts average order value 18%.\"", status: "claimed", why: "Measured how?" },
  hardestQuestion: "How many of your merchants are Shopify Plus brands?",
  bottomLine: "Take the meeting only if they share a test against a control group.",
  unitEconomics: [{ key: "grossMargin", value: "71%", number: 71 }],
  redFlags: [{ flag: "Return on ad spend claimed with no test against a control group", seen: "found" }],
  file: "test-deck.pdf · 3 pages",
};
const STREAM = [...[0, 3, 6, 9, 12].map((at) => JSON.stringify({ at, of: 17, company: "Cartwise" })), JSON.stringify({ done: RESULT, fit: { score: 61, ue: 0, outOf: 100 }, match: null })].join("\n") + "\n";

/** Answers /api/deck with the stand-in after `wait` ms, and records what the page sent. */
async function standIn(page: Page, wait = 1500, body = STREAM) {
  const sent: { file: string; pages: { n: number; text: string }[]; images: { n: number; data: string }[] }[] = [];
  await page.route("**/api/deck", async (route) => {
    sent.push(route.request().postDataJSON());
    await new Promise((r) => setTimeout(r, wait));
    await route.fulfill({ status: 200, contentType: "application/x-ndjson", body });
  });
  return sent;
}

async function ready(page: Page, path: string) {
  await page.goto(path);
  await page.waitForSelector("html[data-hydrated='1']");
}

/** The control is what a click at its center lands on (scrolled into the middle of the window first). */
async function onTop(el: Locator) {
  await el.evaluate((b) => b.scrollIntoView({ block: "center", behavior: "instant" }));
  const hit = await el.evaluate((b) => {
    const r = b.getBoundingClientRect();
    const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return !h || b.contains(h) ? "the control" : `${h.tagName.toLowerCase()}.${h.className}`;
  });
  expect(hit).toBe("the control");
}

/** Hovers a section, presses its copy button, and returns what landed on the clipboard. */
async function pressCopy(page: Page, section: Locator, heading: string): Promise<string> {
  // the section's top 200px below the top of the window, clear of the sticky top bar
  await section.evaluate((el) => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 200, behavior: "instant" }));
  await section.hover({ position: { x: 30, y: 30 } });
  const btn = section.locator(":scope > .x-mdcopy");
  await expect(btn).toHaveAttribute("title", COPY_TIP);
  await expect.poll(() => btn.evaluate((b) => getComputedStyle(b).opacity)).toBe("1");
  const hit = await btn.evaluate((b) => {
    const r = b.getBoundingClientRect();
    const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return !h || b.contains(h) ? "the control" : `${h.tagName.toLowerCase()}.${h.className}`;
  });
  expect(hit).toBe("the control");
  await btn.click();
  await expect(page.getByTestId("toast").filter({ hasText: "Copied as Markdown" }).last()).toBeVisible();
  const md = (await page.evaluate(() => (window as { __lastCopied?: string }).__lastCopied)) || "";
  expect(md.split("\n")[0]).toBe(`## ${heading}`);
  return md;
}

let errors: string[] = [];
test.beforeEach(({ page }) => {
  errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
});
test.afterEach(() => expect(errors).toEqual([]));

test("Start Here: three picks, the IC brief, and Dismiss for good", async ({ page }) => {
  await ready(page, "/");
  const start = page.getByTestId("start-here");
  await expect(start).toBeVisible();
  await expect(start).toContainText("Today's three best picks: Chairside, Cartwise and Brightbench.");
  const brief = page.getByTestId("start-brief");
  await onTop(brief);
  await brief.click();
  await expect(page).toHaveURL(/\/brief$/);
  await ready(page, "/");
  const dismiss = page.getByTestId("start-dismiss");
  await onTop(dismiss);
  await dismiss.click();
  await expect(start).toBeHidden();
  await page.reload();
  await page.waitForSelector("html[data-hydrated='1']");
  await expect(page.getByTestId("start-here")).toBeHidden(); // hidden before it draws
  expect(await page.evaluate(() => document.documentElement.dataset.startHere)).toBe("off");
});

test("Copy as Markdown on Today: Shortlist and On the Radar", async ({ page }) => {
  await ready(page, "/");
  const short = await pressCopy(page, page.locator("section[aria-label='Shortlist']"), "Shortlist");
  expect(short).toContain("_Top 10 Startups by Thesis Fit · Updated Daily_");
  expect(short).toContain("- 1. **Chairside** · 84% Thesis Fit · Funds Raised $4.1M");
  const radar = await pressCopy(page, page.locator("section[aria-label='On the Radar']"), "On the Radar");
  expect(radar).toContain("- **Cartwise** · E-Commerce Software · 78% Thesis Fit");
  expect(radar).not.toContain("Clear Filters");
});

test("Crownwell's page: Buyer Already Invested, Likely Acquirers, the Deck Screen after the facts, and every copy button", async ({ page }) => {
  await ready(page, "/");
  const href = await page.locator("a[title='Open Crownwell in Scout']").first().getAttribute("href");
  await ready(page, href!);
  await expect(page.getByTestId("buyer-invested")).toContainText("Unilever Ventures backed Crownwell, so Unilever leads its likely buyers.");
  await expect(page.locator(".x-deal").getByTestId("buyer-chip")).toHaveText("Buyer Already Invested");
  // Scout presumes no deck (user, 11-02-26): no Unit Economics, and the Deck Screen is an add-on after the facts
  await expect(page.getByTestId("ue-panel")).toHaveCount(0);
  await expect(page.locator(".x-kpanel.fitp")).not.toContainText("Unit Economics");
  await expect(page.locator(".x-kpanel.fitp a[href='#deck-screen']")).toHaveCount(0);
  if (DECK) {
    const order = await page.evaluate(() => [...document.querySelectorAll("main section[aria-label]")].map((s) => s.getAttribute("aria-label")));
    expect(order.indexOf("Deck Screen")).toBeGreaterThan(order.indexOf("Funds Raised History"));
    await expect(page.locator("#deck-screen")).toContainText("Optional, If You Have Their Deck");
  } else await expect(page.locator("#deck-screen")).toHaveCount(0);
  const acq = page.getByTestId("acq-panel");
  await expect(acq.locator("tbody tr").first()).toContainText("Unilever");
  await expect(acq.locator("tbody tr").first()).toContainText("Already Invested");
  const why = await pressCopy(page, page.locator("section.x-kpanel.fitp"), "Why It Fits");
  expect(why).toContain("- Thesis Fit: 26 of 35");
  expect(why).not.toContain("Unit Economics");
  const acqMd = await pressCopy(page, acq, "Likely Acquirers");
  expect(acqMd).toContain("| Buyer | Venture Arm | What They Bought | Price | Multiple |");
  await pressCopy(page, page.locator("section[aria-label='Funds Raised History']"), "Funds Raised History");
  const sim = await pressCopy(page, page.locator("section[aria-label='Similar in the Pipeline']"), "Similar in the Pipeline");
  expect(sim).toContain("**Olea & Oak**");
  await pressCopy(page, page.locator("section[aria-label='Team Notes']"), "Team Notes");
});

test("Deck Screen from a company page: Choose a PDF, the read, the result and its buttons", async ({ page }) => {
  test.skip(!DECK, DECK_OFF);
  const sent = await standIn(page);
  await ready(page, "/");
  const href = await page.locator("a[title='Open Crownwell in Scout']").first().getAttribute("href");
  await ready(page, href!);
  const drop = page.getByTestId("deck-drop");
  await expect(drop).toContainText("Drop Crownwell's Pitch Deck");
  await expect(drop).toContainText("We'll crunch the numbers to see how they align.");
  await expect(drop).toContainText("No data is saved on our servers.");
  const choose = drop.getByTestId("deck-choose");
  await onTop(choose);
  const [chooser] = await Promise.all([page.waitForEvent("filechooser"), choose.click()]);
  await chooser.setFiles(PDF);
  await expect(page).toHaveURL(/\/deck$/);
  const reading = page.getByTestId("deck-reading");
  await expect(reading).toContainText("Reading Crownwell's Deck");
  await expect(reading.locator("li[data-step='read']")).toHaveClass(/done/);
  await expect(reading).toContainText("Not Saved");
  // the PDF was read in the page: its words and a picture of a page went to the server
  await expect.poll(() => sent.length).toBe(1);
  expect(sent[0].pages.map((p) => p.text).join(" ")).toContain("$1.2M ARR from 140 merchants");
  expect(sent[0].file).toBe("test-deck.pdf · 3 pages");
  expect(sent[0].images.length).toBeGreaterThan(0);
  const result = page.getByTestId("deck-result");
  await expect(result).toBeVisible();
  await expect(result).toContainText("Take the meeting only if they share a test against a control group.");
  // the deck's figures against their references ("yes do this", 11-02-26), with no note under the fit: they never score
  await expect(result.getByTestId("ue-panel")).toContainText("From the Deck · E-Commerce Software · Benchmarks From 2025-26 Industry Reports");
  await expect(result.locator(".x-uel", { hasText: "CAC Payback" })).toContainText("Not in the Deck");
  // a figure from the deck shows the benchmark it is set against, on the page, not only on hover
  await expect(result.locator(".x-uel", { hasText: "Gross Margin" })).toContainText("71%");
  await expect(result.locator(".x-uel", { hasText: "Gross Margin" }).locator(".x-ueref")).toContainText("Benchmark: AI-heavy tools about 60%");
  await expect(result.getByTestId("deck-fit-note")).toHaveCount(0);
  await expect(result).toContainText("The Numbers");
  const notes = result.getByTestId("deck-copy-notes");
  await onTop(notes);
  await notes.click();
  await expect(page.getByTestId("toast").filter({ hasText: "Memo Notes Copied" })).toBeVisible();
  const memo = (await page.evaluate(() => (window as { __lastCopied?: string }).__lastCopied)) || "";
  expect(memo.split("\n")[0]).toBe("## Deck Screen: Cartwise");
  for (const h of ["## Bottom Line", "## The Screen", "| Check | Status | Key Figure | In Brief |", "| Stage and Raise | Shown | $2.5M | Seed, raising $2.5M", "| Exit Path | Shown | None Given |", "- **Partly Shown:** Some of the facts are there, not all.", "- **Moat Strength:** Thin · Thin today.", "- **The Vaguest Claim:** \"Lifts average order value 18%.\" · Claimed, Not Shown · Measured how?", "## Moat and Open Questions", "## Unit Economics", "## Red Flags"]) expect(memo).toContain(h);
  expect(memo).not.toContain("Not Saved");
  for (const [label, heading] of [["Bottom Line", "Bottom Line"], ["The Screen", "The Screen"], ["Moat and Open Questions", "Moat and Open Questions"], ["Unit Economics", "Unit Economics"], ["Red Flags", "Red Flags"]])
    await pressCopy(page, result.locator(`section[aria-label='${label}']`), heading);
  const again = result.getByTestId("deck-again");
  await onTop(again);
  await again.click();
  await expect(page.getByTestId("deck-drop")).toContainText("Drop a Pitch Deck");
});

test("Deck Screen: a deck dropped on any page opens the Deck Screen and is read", async ({ page }) => {
  test.skip(!DECK, DECK_OFF);
  const sent = await standIn(page, 300);
  await ready(page, "/pipeline");
  const b64 = readFileSync(PDF).toString("base64");
  await page.evaluate((data) => {
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], "test-deck.pdf", { type: "application/pdf" }));
    window.dispatchEvent(new DragEvent("dragover", { dataTransfer: dt, bubbles: true, cancelable: true }));
    (window as { __dt?: DataTransfer }).__dt = dt;
  }, b64);
  await expect(page.getByTestId("deck-catch")).toContainText("Drop to Screen This Deck");
  await page.evaluate(() => document.body.dispatchEvent(new DragEvent("drop", { dataTransfer: (window as { __dt?: DataTransfer }).__dt, bubbles: true, cancelable: true })));
  await expect(page).toHaveURL(/\/deck$/);
  await expect(page.getByTestId("deck-result")).toContainText("Cartwise");
  expect(sent).toHaveLength(1);
});

test("Deck Screen page: the sample result, a refused read with Try Again, and the footer's way in", async ({ page }) => {
  test.skip(!DECK, DECK_OFF);
  await ready(page, "/");
  const link = page.locator("footer a", { hasText: "Deck Screen" });
  await link.click();
  await expect(page).toHaveURL(/\/deck$/);
  await page.waitForSelector("html[data-hydrated='1']");
  const sample = page.getByTestId("deck-sample");
  await onTop(sample);
  await sample.click();
  const result = page.getByTestId("deck-result");
  await expect(result).toContainText("Sample Result");
  await expect(result).toContainText("Cartwise is made up");
  await expect(result.getByTestId("fit")).toBeVisible();
  await result.getByTestId("deck-again").click();
  // the day's AI reads are used: the page says so, and Try Again reads the same deck once they're back
  let refuse = true;
  await page.route("**/api/deck", (route) =>
    refuse ? route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ error: "Today's AI reads are used up: deck screens and memo drafts share 4 a day. Try again tomorrow, or see the sample result." }) }) : route.fulfill({ status: 200, contentType: "application/x-ndjson", body: STREAM }),
  );
  await page.getByTestId("deck-file").setInputFiles(PDF);
  await expect(page.getByTestId("deck-error")).toContainText("Today's AI reads are used up");
  refuse = false;
  const retry = page.getByTestId("deck-error").getByRole("button", { name: "Try Again" });
  await onTop(retry);
  await retry.click();
  await expect(page.getByTestId("deck-result")).toContainText("Take the meeting only if");
});

test("Red Flags read as warnings, worst first, each with where this deck stands (user, 11-02-26)", async ({ page }) => {
  test.skip(!DECK, DECK_OFF);
  await ready(page, "/deck?sample");
  const flags = page.locator("section[aria-label='Red Flags'] .x-flag");
  await expect(flags).toHaveCount(3);
  // found in the deck first, then not addressed, then cleared; every one carries a warning sign
  await expect(flags.locator(".x-flag-st")).toHaveText(["Found in This Deck", "Not Addressed in the Deck", "Cleared by the Deck"]);
  await expect(flags.locator("svg")).toHaveCount(3);
  const [found, clear] = await Promise.all([flags.nth(0).evaluate((e) => getComputedStyle(e).backgroundColor), flags.nth(2).evaluate((e) => getComputedStyle(e).backgroundColor)]);
  expect(found).not.toBe(clear); // the flag the deck shows stands out
  // no "Industry 3" anywhere: the number meant nothing on screen
  expect(await page.locator("body").innerText()).not.toMatch(/Industry \d/);
});

test("the Live label glows: a mint dot breathing on the brass tab, Live in Source Sans 3 (user, 11-02-26: round 8's A)", async ({ page }) => {
  await ready(page, "/");
  const dot = page.locator(".ticker .lbl i");
  const s = await dot.evaluate((e) => ({ anim: getComputedStyle(e).animationName, bg: getComputedStyle(e).backgroundColor }));
  expect(s).toEqual({ anim: "sk-live", bg: "rgb(48, 225, 174)" });
  // the glow is mint at its peak, never Engine's white (white vanished on the brass and read as a dead dot)
  const glows = await dot.evaluate(async (e) => {
    const out: string[] = [];
    for (let i = 0; i < 6; i++) { out.push(getComputedStyle(e).boxShadow); await new Promise((r) => setTimeout(r, 500)); }
    return out;
  });
  expect(glows.some((g) => g.includes("rgba(48, 225, 174"))).toBe(true);
  expect(glows.every((g) => !g.includes("rgb(255, 255, 255)"))).toBe(true);
  expect(await page.locator(".ticker .lbl").evaluate((e) => getComputedStyle(e).fontFamily)).toContain("Source Sans 3");
});

test("/deck?sample opens straight on the sample result, the link that shows what a read looks like", async ({ page }) => {
  test.skip(!DECK, DECK_OFF);
  await ready(page, "/deck?sample");
  const result = page.getByTestId("deck-result");
  await expect(result).toContainText("Sample Result");
  await expect(result.locator("h1")).toHaveText("Cartwise");
  for (const h of ["Bottom Line", "The Screen", "Moat and Open Questions", "Red Flags"]) await expect(result.locator(`section[aria-label^='${h.split(" for")[0]}']`)).toBeVisible();
});

// The Status Table (user's pick, round 7's D, revised in round 9: R9-deck.html), built 11-02-26 after "i thought i
// already selected build the table": each word defined above the table, one row per check, the moat on a meter.
test("Deck Screen: the Status Table, with its four words defined above it, and the moat on a four-step meter", async ({ page }) => {
  test.skip(!DECK, DECK_OFF);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await ready(page, "/deck?sample");
    const result = page.getByTestId("deck-result");
    const key = result.getByTestId("deck-key");
    await expect(key.locator("dt")).toHaveText(["Shown", "Partly Shown", "Claimed, Not Shown", "Not in the Deck"]);
    await expect(key.locator("dd").nth(2)).toHaveText("The deck says it but shows nothing behind it.");
    const table = result.getByTestId("deck-table");
    if (width === 1440) await expect(table.locator("th")).toHaveText(["Check", "Status", "Key Figure", "In Brief"]);
    await expect(table.locator("tbody tr")).toHaveCount(6);
    await expect(table.locator("tbody tr").nth(1)).toContainText("The Numbers");
    await expect(table.locator("tbody tr").nth(1).locator(".x-dst")).toHaveText("Partly Shown");
    await expect(table.locator("tbody tr").nth(1).locator(".fig")).toHaveText("$1.2M ARR");
    // each status reads apart from the others: its own color, never a "!" (his note on round 7)
    const colors = await table.locator(".x-dst").evaluateAll((els) => [...new Set(els.map((e) => getComputedStyle(e).color))]);
    expect(colors.length).toBe(3); // forest for Shown, amber for Partly Shown and Claimed, rust for Not in the Deck
    await expect(result).not.toContainText("!");
    await expect(result.locator(".x-meter i.on")).toHaveCount(1);
    await expect(result.locator(".x-meter")).toHaveAttribute("aria-label", "Moat strength: 1 of 4");
    await expect(result.locator(".x-moatw")).toHaveText("Thin");
    await expect(result.locator(".x-mq")).toContainText("Claimed, Not Shown");
    // nothing runs off a phone: the rows stack
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test("only a Deck Screen result says Unit Economics: Scout presumes no deck, and the Deck Screen is an add-on (user, 11-02-26)", async ({ page }) => {
  await ready(page, "/");
  const pages = ["/", "/pipeline", "/settings?s=scoring", ...(DECK ? ["/deck"] : []), "/about", "/tracking"];
  for (const name of ["Crownwell", "Steadfast Health", "Cartwise"]) pages.push((await page.locator(`a[title='Open ${name} in Scout']`).first().getAttribute("href"))!);
  for (const path of pages) {
    await ready(page, path);
    expect(await page.locator("body").innerText(), path).not.toMatch(/unit economics/i);
  }
  if (!DECK) return;
  // a Consumer Health deck reads like any other: out of 100, with no note under the fit; its figures meet their references
  const ch = { ...RESULT, company: "Steadfast Health", oneLine: "Menopause care paid for by employers", area: "consumer-health", unitEconomics: [], redFlags: [{ flag: "No proof of employer medical-claims savings", seen: "missing" }] };
  await standIn(page, 200, JSON.stringify({ done: ch, fit: { score: 70, ue: 0, outOf: 100 }, match: null }) + "\n");
  await ready(page, "/deck");
  await page.getByTestId("deck-file").setInputFiles(PDF);
  await expect(page.getByTestId("deck-result")).toContainText("Steadfast Health");
  await expect(page.getByTestId("deck-fit-note")).toHaveCount(0);
  await expect(page.getByTestId("ue-panel")).toContainText("Consumer Health");
});

// user, 11-03-26: "remove the decking screen feature for the sidekick scout and mark the feature as incomplete"
test("the Deck Screen is gone for Sidekick: no page, no way in, and a dropped PDF does nothing", async ({ page, request }) => {
  test.skip(DECK, "the Deck Screen is on");
  expect((await request.get("/deck")).status()).toBe(404);
  expect((await request.get("/deck?sample")).status()).toBe(404);
  expect((await request.post("/api/deck", { data: {} })).status()).toBe(404);
  await ready(page, "/");
  const company = (await page.locator("a[title='Open Crownwell in Scout']").first().getAttribute("href"))!;
  for (const path of ["/", company, "/about"]) {
    await ready(page, path);
    expect(await page.locator("body").innerText(), path).not.toMatch(/deck screen/i);
    await expect(page.locator("a[href='/deck']")).toHaveCount(0);
  }
  // ⌘K finds no Deck Screen either
  await page.keyboard.press("Meta+k");
  await expect(page.getByTestId("palette")).toBeVisible();
  await page.keyboard.type("deck");
  await expect(page.getByTestId("palette")).not.toContainText("Deck Screen");
  await page.keyboard.press("Escape");
  // a PDF dragged over the page gets no drop area: the browser keeps its own behavior
  const b64 = readFileSync(PDF).toString("base64");
  await page.evaluate((data) => {
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], "test-deck.pdf", { type: "application/pdf" }));
    window.dispatchEvent(new DragEvent("dragover", { dataTransfer: dt, bubbles: true, cancelable: true }));
  }, b64);
  await page.waitForTimeout(300);
  await expect(page.getByTestId("deck-catch")).toHaveCount(0);
});

// Courtside's rule (10-14-26): motion never follows the Mac's Reduce Motion, which user's Mac has on (11-03-26: "should
// these items be glowing? because they are not glowing"); Scout's own Settings › Appearance › Motion turns it off.
test("the Live dot breathes even with Reduce Motion on; with Scout's Motion switch off it holds a steady mint glow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page, "/");
  const dot = page.locator(".ticker .lbl i");
  expect(await dot.evaluate((e) => getComputedStyle(e).animationName)).toBe("sk-live");
  const glows = await dot.evaluate(async (e) => {
    const out = new Set<string>();
    for (let i = 0; i < 6; i++) { out.add(getComputedStyle(e).boxShadow); await new Promise((r) => setTimeout(r, 400)); }
    return out.size;
  });
  expect(glows).toBeGreaterThan(1); // it moves
  await page.evaluate(() => localStorage.setItem("scout.motion", "off"));
  await ready(page, "/");
  await page.waitForTimeout(200);
  expect(await dot.evaluate((e) => getComputedStyle(e).boxShadow)).toContain("rgba(48, 225, 174, 0.85) 0px 0px 12px 4px");
});
