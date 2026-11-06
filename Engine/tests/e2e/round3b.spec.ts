import { test, expect } from "@playwright/test";
import { HOME, TABLE, on, BUILDER } from "./pages";

// user's review of rounds 1 to 3 (10-14-26), each item pressed or measured.

test("the ticker keeps moving under the pointer", async ({ page }) => {
  await page.goto(HOME);
  const track = page.locator(".ticker .track");
  const box = (await page.locator(".ticker").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); // the track itself moves, so the pointer parks over the strip
  expect(await track.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("running");
});

test("a deep link lands with the item fully below the sticky top bar", async ({ page }) => {
  await page.goto("/trends");
  const slug = await page.locator("article.tcard").nth(3).getAttribute("id");
  await page.goto(`/trends#${slug}`);
  await page.waitForTimeout(400);
  const barBottom = await page.locator("header.top").evaluate((el) => el.getBoundingClientRect().bottom);
  const top = await page.locator(`#${slug}`).evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(barBottom);
  // right under the bar, unless the page ends first (a short page can't scroll its last card to the top)
  const atEnd = await page.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 2);
  if (!atEnd) expect(top - barBottom).toBeLessThan(60);
});

// Second report, 11-05-26 (user: "clicking items in the ticker should directly link to the actual item"): the
// ticker's Silas Capital deal opened Synergistic Funds at the top, because the page showed that startup's row under
// another fund and an in-app click never sets :target. Clicked the way he clicks (an in-app navigation, not a page
// load), every ticker link with an address must land on a marked item right under the top bar. The test data holds
// the live case: Crownwell's newest story is a possible match, the ticker links the proven one.
test("every ticker link lands on its item, marked, right under the top bar", async ({ page }) => {
  await page.goto(HOME);
  const hrefs = [...new Set(await page.locator(".ticker .track > a:not([aria-hidden])").evaluateAll((as) => as.map((a) => a.getAttribute("href") || "").filter((h) => h.includes("#"))))];
  expect(hrefs.some((h) => h.includes("#fi"))).toBe(true);
  for (const href of hrefs) {
    await page.goto(HOME);
    await page.waitForSelector("html[data-hydrated]");
    await page.locator(`.ticker .track > a[href="${href}"]`).first().evaluate((a) => (a as HTMLAnchorElement).click());
    await page.waitForURL((u) => u.pathname + u.hash === href);
    const hash = href.split("#")[1];
    const landed = page.locator("[data-landed]");
    await expect(landed, `${href} lands on an item`).toHaveCount(1);
    const at = await landed.evaluate((el) => [el.id, ...(el.getAttribute("data-also") || "").split(" ")]);
    expect(at, `${href} lands on its own item`).toContain(hash);
    const marked = await landed.evaluate((el) => getComputedStyle(el.tagName === "TR" ? el.querySelector("td")! : el).boxShadow);
    expect(marked, `${href}: the landed item wears the edge`).toContain("inset");
    const barBottom = await page.locator("header.top").evaluate((el) => el.getBoundingClientRect().bottom);
    await expect.poll(async () => {
      const top = await landed.evaluate((el) => el.getBoundingClientRect().top);
      const atEnd = await page.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 2);
      return top >= barBottom - 1 && (atEnd || top - barBottom < 60);
    }, { message: `${href} scrolls its item right under the top bar` }).toBe(true);
  }
});

test("no keycap appears in the top bar, even on hover", async ({ page }) => {
  await page.goto(HOME);
  // every chip in the top bar: the theme chip and the search chip
  const chips = page.locator(".tools > a, .tools > button");
  expect(await chips.count()).toBeGreaterThan(0);
  for (const chip of await chips.all()) {
    await chip.hover();
    const shown = await page.locator("header.top .kbd").evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== "none" && (e as HTMLElement).offsetWidth > 0).map((e) => e.textContent));
    expect(shown).toEqual([]);
  }
});

test("home blocks never spill past their column", async ({ page }) => {
  await page.goto(HOME);
  const spills = await page.locator("main .x-sec, #radar .x-tile").evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).length);
  expect(spills).toBe(0);
});

test("footer: pages on the left, the person on the right; Funds Raised on the card", async ({ page }) => {
  await page.goto("/pipeline");
  const left = await page.locator("footer.foot .left").boundingBox();
  const right = await page.locator("footer.foot .right").boundingBox();
  expect(left!.x).toBeLessThan(right!.x);
  await expect(page.locator("footer.foot .left")).toContainText("Settings");
  if (BUILDER.name) await expect(page.locator("footer.foot .right")).toContainText(`Built by ${BUILDER.name}`);
  await expect(page.locator(TABLE ? ".x-ftable thead" : ".x-row .x-funds").first()).toContainText("Funds Raised");
});

test("every Phase II on the Culture and Alerts pages opens the door", async ({ page }) => {
  for (const path of [...(on("culture") ? ["/culture"] : []), "/tracking#configure"]) {
    await page.goto(path);
    const links = page.locator("main button.p2");
    expect(await links.count(), path).toBeGreaterThan(0);
    await links.first().click();
    await expect(page.getByRole("dialog")).toContainText("Phase II");
    await page.keyboard.press("Escape");
  }
});

test("Sponsor Radar: dropdowns on one row", async ({ page }) => {
  test.skip(!on("sponsorRadar"), "Sponsor Radar is off for this firm");
  await page.goto("/sponsors");
  const tops = await page.locator(".frow.sels .fsel").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
});

test("Backtest shows only wins", async ({ page }) => {
  await page.goto("/backtest");
  expect(await page.locator(".card2.none").count()).toBe(0);
  // 11-04-26, round 1's C: the deals found first are tiles, and the misses are never listed
  await expect(page.locator("main")).not.toContainText("No Earlier Signal");
  await expect(page.locator(".score")).not.toContainText("Found first");
  await expect(page.locator(".score")).not.toContainText("Honest");
});
