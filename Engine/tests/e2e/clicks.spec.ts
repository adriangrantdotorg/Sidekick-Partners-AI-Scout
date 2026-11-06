import { test, expect } from "@playwright/test";
import { PAGES, LIVE, ready } from "./pages";

// One test per page: press every visible, enabled button and require a visible effect.
const SKIP = /refresh|print|csv|copy|slack|send|delete|remove|reset|undo|run backtest|draft the memo|disconnect|flag a ui|move up|move down|confirm|save|discard|add$|add note|track person|save alert|me too|mark fixed|connection email|email|not a fit/i;
const SKIP_LIVE = /track|vote|this fits|not for|good call|not useful|worth|convincing|day|night|roomy|compact|normal|large|move to|useful hit|a great source|matters/i;
/** Buttons that change data other tests read: Track, the votes, Add. Never pressed here, locally either: the browser
 *  tests run three at a time on one server, and this test untracked Cartwise while round4's Tracking test was checking
 *  for it (11-05-26: 2 of 6 runs failed side by side, 0 of 3 alone; the "needs a refresh" sightings of 11-04 and 11-05).
 *  Each has its own test (round4.spec.ts, interact.spec.ts). */
const SHARED = ["track", "up", "down", "add"];

for (const path of PAGES) {
  test(`click every button on ${path}`, async ({ page }) => {
    test.setTimeout(150_000);
    await page.goto(path);
    await ready(page);
    await page.waitForTimeout(300);
    const handles = (await page.locator("main button:visible").elementHandles()) as import("@playwright/test").ElementHandle<HTMLElement>[];
    const labels: string[] = [];
    for (const h of handles) labels.push(((await h.getAttribute("aria-label")) || (await h.textContent()) || (await h.getAttribute("title")) || "").trim());
    let pressed = 0;
    const dead: string[] = [];
    for (let i = 0; i < handles.length && pressed < 30; i++) {
      const b = handles[i];
      const label = labels[i];
      if (!(await b.isVisible().catch(() => false)) || (await b.isDisabled().catch(() => true))) continue;
      if (SKIP.test(label) || (LIVE && SKIP_LIVE.test(label))) continue;
      if (await b.evaluate((el, s) => s.includes(el.getAttribute("data-act") || ""), SHARED)) continue;
      if (LIVE && (await b.evaluate((el) => el.getAttribute("role") === "switch" || el.closest(".mini") !== null || el.hasAttribute("data-act")))) continue;
      const inGroup = await b.evaluate((el) => !!el.closest('[role="group"]') && el.getAttribute("aria-pressed") === "true");
      if (inGroup) continue;
      const before = await b.evaluate((el) => ({ p: el.getAttribute("aria-pressed"), e: el.getAttribute("aria-expanded"), c: el.getAttribute("aria-checked") }));
      const url = page.url();
      const html = await page.locator("main").innerHTML();
      let req2xx = false;
      const onResp = (r: { status: () => number; request: () => { method: () => string } }) => {
        if (r.status() < 300 && r.request().method() !== "GET") req2xx = true;
      };
      page.on("response", onResp);
      await b.click({ timeout: 3000 }).catch(() => {});
      const effect = async () => {
        const gone = !(await b.evaluate((el) => el.isConnected).catch(() => false));
        const after = gone ? null : await b.evaluate((el) => ({ p: el.getAttribute("aria-pressed"), e: el.getAttribute("aria-expanded"), c: el.getAttribute("aria-checked") })).catch(() => null);
        return (
          gone ||
          page.url() !== url ||
          (await page.locator(".veil, [data-testid=toast], [data-testid=error-card], [role=tooltip], [data-testid=theater]").count()) > 0 ||
          (after && (after.p !== before.p || after.e !== before.e || after.c !== before.c)) ||
          (await page.locator("main").innerHTML()) !== html ||
          req2xx
        );
      };
      await page.waitForTimeout(300);
      // a button that fetches first (Download .md loads the outline, then says so) gets a second look on a busy Mac
      let moved = await effect();
      if (!moved) {
        await page.waitForTimeout(1500);
        moved = await effect();
      }
      page.off("response", onResp);
      if (!moved) dead.push(label);
      pressed++;
      // close what the press opened (a dialog, the player, a menu) so it never covers the next button
      if (await page.locator(".veil, [data-testid=theater], .x-pop > button[aria-expanded=true]").count()) await page.keyboard.press("Escape");
      if (page.url() !== url) {
        await page.goto(path);
        await ready(page);
      }
    }
    expect(dead, `buttons with no visible effect on ${path}`).toEqual([]);
  });
}
