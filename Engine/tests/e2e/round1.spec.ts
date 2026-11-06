import { test, expect } from "@playwright/test";
import { HOME, PATHS, ROWS, THEME_UNDERLINED, look, on } from "./pages";

// Round 1 of user's 10-14-26 Vercel feedback: each fix has a click or a measurement here.

test("the site moves even when the Mac asks for reduced motion, and Settings can switch motion off", async ({ page }) => {
  // each part as the firm's look answers it (src/firm/effects.ts): Engine's own keyframes, the firm's own, or none
  // ("off": the firm's theme hides the part; its own effects test checks that it never moves)
  const expected = (k: Parameters<typeof look>[0], engine: string) => (n: string) => (look(k) === "engine" ? expect(n).toBe(engine) : look(k) === "own" ? expect(n).not.toBe("none") : undefined);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(HOME);
  expected("ticker", "tick")(await page.locator(".ticker .track").evaluate((el) => getComputedStyle(el).animationName));
  expected("liveDot", "liveglow")(await page.locator(".ticker .lbl i").evaluate((el) => getComputedStyle(el).animationName));
  await page.goto("/pipeline");
  expected("headLine", "sweep")(await page.locator(".rule").first().evaluate((el) => getComputedStyle(el, "::after").animationName));
  await page.evaluate(() => (document.documentElement.dataset.motion = "off"));
  expect(await page.locator(".ticker .track").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});

test("the top bar stays put while the page scrolls", async ({ page }) => {
  await page.goto("/pipeline");
  expect(await page.locator("header.top").evaluate((el) => getComputedStyle(el).position)).toBe("sticky");
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(200);
  const top = await page.locator("header.top").evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBe(0);
});

test("the theme chip is a symbol with no keycap (the key lives in its tooltip)", async ({ page }) => {
  await page.goto(HOME);
  const chip = page.locator("[data-theme-chip]");
  expect((await chip.innerText()).trim()).toBe("");
  expect(await chip.locator(".kbd").evaluate((el) => getComputedStyle(el).display)).toBe("none");
  expect(await chip.getAttribute("title")).toMatch(/⇧T/);
  const [chipBorder, searchBorder] = await Promise.all([chip.evaluate((el) => getComputedStyle(el).borderColor), page.locator("[data-search-chip]").evaluate((el) => getComputedStyle(el).borderColor)]);
  expect(chipBorder).toBe(searchBorder);
});

test("red links carry no underline at rest and a dotted one on hover; neutral prose links show a quiet dotted one", async ({ page }) => {
  await page.goto("/trends");
  // a link the firm's theme underlines at rest is its look of record (THEME_UNDERLINED), not this rule's
  const plain = await page.locator("main a:not(.btn):not([class*='x-'])").evaluateAll((els, own) => els.findIndex((el) => !el.querySelector("img") && !(own && el.matches(own))), THEME_UNDERLINED);
  const a = page.locator("main a:not(.btn):not([class*='x-'])").nth(Math.max(plain, 0));
  if (plain >= 0) {
    expect(await a.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe("none");
    await a.hover();
    expect(await a.evaluate((el) => [getComputedStyle(el).textDecorationLine, getComputedStyle(el).textDecorationStyle])).toEqual(["underline", "dotted"]);
  }
  // V2 (10-26-26): links in prose are neutral, not red, so a dotted underline marks them as links ("Connect Slack")
  await page.goto(PATHS.peerFunds);
  const p = page.locator(".ph-lede a").first();
  if (!(await p.count())) return; // this firm's lede has no link
  expect(await p.evaluate((el) => [getComputedStyle(el).textDecorationLine, getComputedStyle(el).textDecorationStyle])).toEqual(["underline", "dotted"]);
  await p.hover();
  expect(await p.evaluate((el) => getComputedStyle(el).textDecorationStyle)).toBe("solid");
});

test("the Pipeline dropdowns sit on one line and never offer an empty option", async ({ page }) => {
  await page.goto("/pipeline");
  const tops = await page.locator(".x-pfilters .fsel").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(tops.length).toBeGreaterThan(3);
  expect(new Set(tops).size).toBe(1);
  // every offered Signal option yields at least one card
  const opts = await page.locator('select[aria-label="Signal"] option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
  for (const v of opts) {
    await page.locator('select[aria-label="Signal"]').selectOption(v);
    expect(await page.locator(ROWS).count(), `signal ${v}`).toBeGreaterThan(0);
  }
});

test("moving one weight rebalances the others and lights Save", async ({ page }) => {
  await page.goto("/settings?s=scoring");
  const slider = page.getByRole("slider", { name: "Thesis fit" });
  const before = await slider.inputValue();
  await slider.fill(String(Number(before) + 3));
  await expect(page.locator('[data-testid="weights-total"] b')).toHaveText("100");
  const save = page.locator("button", { hasText: "Save Changes" });
  await expect(save).toBeEnabled();
  await page.locator("button", { hasText: "Discard" }).click();
});

test("the removed features and words are gone", async ({ page, request }) => {
  // a feature the firm turned off has no page at all (Sidekick: Culture and Sponsor Radar, 11-01-26)
  for (const [key, path] of [["culture", "/culture"], ["sponsorRadar", "/sponsors"]] as const) if (!on(key)) expect((await request.get(path, { timeout: 30_000 })).status(), path).toBe(404);
  for (const path of [HOME, "/about", "/company/3", ...(on("culture") ? ["/culture"] : [])]) {
    await page.goto(path);
    const text = await page.locator("body").innerText();
    expect(text, path).not.toMatch(/Flag a UI problem|No payments|non-commercial|Newest first|&#\d+;|&amp;/i);
  }
  await page.goto(HOME);
  await expect(page.locator("footer.foot a", { hasText: "Settings" })).toBeVisible();
  await expect(page.locator("footer.foot a", { hasText: "About" })).toBeVisible();
  await expect(page.locator("nav.nav a", { hasText: "IC Meeting" })).toBeVisible();
  await page.goto("/about");
  await expect(page.locator("[data-talk]").first()).toBeVisible();
});
