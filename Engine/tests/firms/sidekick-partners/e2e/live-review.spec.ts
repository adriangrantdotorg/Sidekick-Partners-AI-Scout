// user's look at the live site (Plan step 14, 11-04-26, note `Throwaway/Vercel feedback.md`), one test per fix, on
// the made-up local Scout. The Backtest's changes are in proof.spec.ts; the memo outline's in ../profile.test.ts.
import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const MEDIA = fileURLToPath(new URL("./media/", import.meta.url));

async function ready(page: Page, p: string) {
  await page.goto(p);
  await page.waitForSelector("html[data-hydrated='1']");
}

test("Synergistic Funds: the new name and address, the old address sends you on, both sections named, no PitchBook line", async ({ page }) => {
  await ready(page, "/consumer-funds");
  await expect(page).toHaveURL(/\/synergistic-funds$/);
  await expect(page.locator("main h1")).toHaveText("Synergistic Funds");
  await expect(page.locator("main .ph-lede")).toContainText("Funds synergistic to Sidekick Partners");
  await expect(page.locator("main h2", { hasText: "Their Latest Deals" })).toBeVisible();
  await expect(page.locator("main h2", { hasText: "The Funds Scout Watches" })).toBeVisible();
  for (const gone of ["Consumer Funds", "PitchBook, X and LinkedIn", "links only in this prototype"]) await expect(page.locator("body")).not.toContainText(gone);
  await expect(page.locator(".top .nav")).toContainText("Synergistic Funds");
});

test("Must See: the picture and the name open the company page; its buttons stay their own", async ({ page }) => {
  await ready(page, "/");
  const hero = page.locator(".x-tile.hero");
  const name = hero.locator(".x-name a");
  await expect(name).toHaveAttribute("href", /^\/company\/\d+$/);
  const href = await name.getAttribute("href");
  // a point on the picture with nothing of its own on it: the middle of the picture's top half
  const box = (await hero.locator(".x-tm").boundingBox())!;
  const at = { x: box.x + box.width * 0.6, y: box.y + box.height * 0.3 };
  const hit = await page.evaluate(({ x, y }) => (document.elementFromPoint(x, y) as HTMLElement | null)?.className || "", at);
  expect(hit).toContain("x-tmlink");
  // Track keeps its own click: what sits at its centre is the button (scrolled into view first: below the fold
  // nothing can be hit)
  const track = hero.locator("[data-act='track']");
  await track.scrollIntoViewIfNeeded();
  const tb = (await track.boundingBox())!;
  expect(await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest("[data-act='track']"), { x: tb.x + tb.width / 2, y: tb.y + tb.height / 2 })).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.mouse.click(at.x, at.y);
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});

test("the Phase II dialog: the footnote on its own line, Cancel and Talk to user side by side under it", async ({ page }) => {
  for (const width of [1440, 900]) {
    await page.setViewportSize({ width, height: 1000 });
    await ready(page, "/about");
    await page.locator("footer").getByText("Phase II", { exact: true }).first().click();
    const door = page.getByTestId("door");
    await expect(door).toBeVisible();
    const [note, cancel, talk] = await Promise.all([door.locator(".why2"), door.getByRole("button", { name: /Cancel/ }), door.getByRole("link", { name: "Talk to user" })].map((l) => l.boundingBox()));
    expect(Math.abs(cancel!.y - talk!.y), `${width}px: the two buttons share a row`).toBeLessThan(2);
    expect(cancel!.y, `${width}px: the buttons sit under the footnote`).toBeGreaterThanOrEqual(note!.y + note!.height - 1);
    await page.keyboard.press("Escape");
  }
});

// no Slack for Sidekick (user, 11-04-26: "if You're saying I need to create a Slack application that the users can then
// access, then I want you to remove all mentions of Slack throughout the app"): switch `slack` off
test("no Slack anywhere: no page says it, Settings has no Slack section, and its addresses are closed", async ({ page, request }) => {
  for (const p of ["/", "/tracking", "/brief", "/backtest", "/about", "/settings", "/settings?s=alerts"]) {
    await ready(page, p);
    await expect(page.locator("body"), p).not.toContainText(/slack/i);
  }
  await ready(page, "/settings");
  await expect(page.locator(".pane, main").getByRole("link", { name: "Slack" })).toHaveCount(0);
  for (const a of ["/api/slack/start", "/api/slack/callback"]) expect((await request.get(a, { maxRedirects: 0 })).status(), a).toBe(404);
  expect((await request.post("/api/slack/test", { data: {} })).status()).toBe(404);
});

test("the company cover: the words sit on a dark shade, so a picture with its own words can't drown them", async ({ page }) => {
  await ready(page, "/pipeline");
  const first = page.locator("main a[href^='/company/']").first();
  await ready(page, (await first.getAttribute("href"))!);
  const shade = await page.locator("header.x-cover .x-cv").evaluate((el) => getComputedStyle(el, "::after").backgroundImage);
  expect(shade).toContain("rgba(8, 10, 9, 0.9)");
  expect(await page.locator("header.x-cover .x-dname").evaluate((el) => getComputedStyle(el).textShadow)).not.toBe("none");
});

// a website's product video is often a silent loop (11-04-26: 5 of the 9 live ones): the player says so, and Mute works
for (const [file, silent] of [["silent.webm", true], ["sound.webm", false]] as const)
  test(`the video player: ${silent ? "a file with no sound track says so" : "Mute and Unmute follow the video"}`, async ({ page }) => {
    await page.route(`**/__test-media/${file}`, (r) => r.fulfill({ body: fs.readFileSync(MEDIA + file), contentType: "video/webm" }));
    await ready(page, "/tracking");
    await page.evaluate((src) => document.dispatchEvent(new CustomEvent("scout:play", { detail: { name: "Sample", site: null, logo: null, media: { kind: "mp4", mp4: src, play: "Play Product Video" } } })), `/__test-media/${file}`);
    const th = page.getByTestId("theater");
    await expect(th).toBeVisible();
    await th.locator("video").evaluate((v: HTMLVideoElement) => { v.muted = false; return v.play().catch(() => undefined); });
    if (silent) {
      await expect(th.getByTestId("silent")).toHaveText("This Video Has No Sound", { timeout: 8000 });
      await expect(th.locator(".x-thsound")).toHaveCount(0);
    } else {
      await page.waitForTimeout(1800);
      await expect(th.getByTestId("silent")).toHaveCount(0);
      const sound = th.locator(".x-thsound");
      await expect(sound).toHaveText("Mute");
      await sound.click();
      await expect(sound).toHaveText("Unmute");
      expect(await th.locator("video").evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
      await sound.click();
      await expect(sound).toHaveText("Mute");
      expect(await th.locator("video").evaluate((v: HTMLVideoElement) => v.muted)).toBe(false);
    }
  });

// 11-04-26: Find Startups opened the Pipeline searched for the word "play" on every play trend (the first word of the
// trend's id); a play trend now filters to its play (trendPipelineHref, tested in ../trends.test.ts), and the made-up
// Scout's trends, which are not plays, search for their idea
test("Trends: the short description, and Find Startups searches for the trend's idea", async ({ page }) => {
  await ready(page, "/trends");
  await expect(page.locator("main .ph-lede")).toHaveText("Ideas that two or more independent sources raised this week, each in one of Sidekick's industries.");
  const find = page.locator("#trend-list article#ai-upsells-shopify").getByRole("link", { name: "Find Startups in This Trend" });
  await expect(find).toHaveAttribute("href", "/pipeline?q=AI%20upsells");
});

test("the Pipeline at ?play=: the Play menu shows the play, and Clear Filters takes it away", async ({ page }) => {
  await ready(page, "/pipeline?play=shopify-tools");
  const play = page.locator("label.fsel", { hasText: "Play" }).locator("select");
  await expect(play).toHaveValue("shopify-tools");
  await page.getByRole("button", { name: "Clear Filters" }).click();
  await expect(page.locator("label.fsel", { hasText: "Play" })).toHaveCount(0);
});

// 11-05-26 (user: "do this", to Copy the Draft): once a draft is written, one button copies it, titled, and never the outline
test("the memo: Copy the Draft copies the finished draft with its title", async ({ page }) => {
  const draft = "## 1. Recommendation\nTake the meeting: it fits.\n\n## Questions for Founders\n\n### Traction\n1. What is ARR?";
  await page.route("**/api/memo/1", (r) => (r.request().method() === "POST" ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ name: "x", markdown: draft }) }) : r.continue()));
  await ready(page, "/company/1");
  const memo = page.locator("#memo");
  await expect(memo.getByRole("button", { name: "Copy the Draft" })).toHaveCount(0); // nothing to copy before a draft
  await memo.getByRole("button", { name: "Draft the Memo" }).click();
  await expect(memo.locator("pre")).toContainText("What is ARR?");
  const name = ((await memo.locator("p").first().innerText()).match(/draft of (.+?)['’]s memo/) || [])[1];
  expect(name).toBeTruthy();
  await memo.getByRole("button", { name: "Copy the Draft" }).click();
  await expect(page.getByText("Draft Copied")).toBeVisible();
  const copied = await page.evaluate(() => (window as { __lastCopied?: string }).__lastCopied);
  expect(copied).toBe(`# Investment Memo: ${name}\n\n${draft}\n`);
});

// 11-04-26 (user: "remove the download the Markdown file btn, as it contains elements that are incomplete, which is
// of no value to a prospective investor"): the outline is never handed out; More › Draft Investment Memo opens the panel
test("the memo: Draft the Memo only, no outline to download or copy, and More opens the memo panel", async ({ page }) => {
  await ready(page, "/company/1");
  const memo = page.locator("#memo");
  await expect(memo.getByRole("button")).toHaveText([/Draft the Memo/]);
  await expect(memo).not.toContainText(/Download|Copy the Outline|\.md/);
  await page.goto("/");
  await page.waitForSelector("html[data-hydrated='1']");
  const hero = page.locator(".x-tile.hero");
  const id = await hero.getAttribute("data-company");
  await hero.locator("button.x-more").click();
  await page.locator(".x-menu button[data-act=memo]").click();
  await expect(page).toHaveURL(new RegExp(`/company/${id}#memo$`));
  await expect(page.locator("#memo")).toBeVisible();
});

// 11-05-26 (user: "it's not possible to see the scrub bar or the video controls"): the player has a scrub bar under
// the video with the time played and the length; dragging it moves the video
test("the video player: a scrub bar shows the time and moves the video", async ({ page }) => {
  await page.route("**/__test-media/sound.webm", (r) => r.fulfill({ body: fs.readFileSync(MEDIA + "sound.webm"), contentType: "video/webm" }));
  await ready(page, "/tracking");
  // a blob address, so the browser can seek in it (a routed reply has no byte ranges, and Chrome won't seek without them)
  await page.evaluate(async () => {
    const src = URL.createObjectURL(await (await fetch("/__test-media/sound.webm")).blob());
    document.dispatchEvent(new CustomEvent("scout:play", { detail: { name: "Sample", site: null, logo: null, media: { kind: "mp4", mp4: src, play: "Play Product Video" } } }));
  });
  const th = page.getByTestId("theater");
  const scrub = th.getByTestId("scrub");
  await expect(scrub).toBeVisible();
  const range = scrub.locator("input[type=range]");
  await expect(range).toBeEnabled({ timeout: 8000 });
  const max = Number(await range.getAttribute("max"));
  expect(max).toBeGreaterThan(0);
  await expect(scrub.locator(".x-thtime").last()).toHaveText(/^\d+:\d\d$/);
  // the bar sits inside the window, under the video, with nothing on top of it
  const box = (await scrub.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  expect(await range.evaluate((el) => { const r = el.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el; })).toBe(true);
  await th.locator("video").evaluate((v: HTMLVideoElement) => v.pause());
  // a press at the slider's middle moves the video to about half way
  await range.click();
  await expect.poll(() => th.locator("video").evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(max * 0.3);
  await expect(scrub.locator(".x-thtime").first()).not.toHaveText("0:00");
});

// 11-05-26 (user: the masthead "should not move to display the green background"): a startup's picture drifts left
// and back, so at the far point of the drift it must still reach the card's right edge. The site's img { max-width:100% }
// had held it to the card's width.
test("Brand Sky: the drifting picture never shows the page behind it", async ({ page }) => {
  await ready(page, "/");
  const gap = await page.evaluate(() => {
    const sky = document.createElement("div");
    sky.className = "x-sky";
    sky.style.cssText = "position:relative;width:900px;height:320px";
    const art = document.createElement("img");
    art.className = "x-skyart x-drift";
    art.src = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
    art.style.animation = "none";
    art.style.transform = "translateX(-12%)"; // the far point of x-skydrift
    sky.appendChild(art);
    document.body.appendChild(sky);
    const gap = sky.getBoundingClientRect().right - art.getBoundingClientRect().right;
    sky.remove();
    return gap;
  });
  expect(gap).toBeLessThanOrEqual(0);
});
