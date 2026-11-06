import { test, expect, type Page } from "@playwright/test";
import { PAGES, IGNORE_CONSOLE, HOME, FIRM, NAMES, TABLE, ROWS, AREA_LABELS, THEME_UNDERLINED, BUILDER } from "./pages";

const BANNED = [/\blanes?\b/i, /\bvoices\b/i, /key insight/i, /context only/i, /\bPre-seed\b/, /\bpretend\b/i, /\bthesis areas?\b/, /\b(no payments|no ads|non-commercial)\b/i, /Flag a UI problem/i, /&#\d+;|&amp;/, /\b(near|close to|next to) [A-Z][^.;]* in the portfolio\b/];
/** Scout never sounds like a product selling itself. A startup's own words may (Crownwell's "subscribe option",
 *  Cartwise's "upsell offers"), and so may a firm's industry ("Premium Consumer Brands", 11-03-26), so this reads only
 *  Scout's own words: never a card, row, trend or table line about a startup, nor the ticker. */
const SELLING = /\b(pricing|subscribe|upsell|premium|paid tier|hiring|on board)\b/i;
const ABOUT_STARTUPS = "[data-company], .ticker, article.tcard, table tbody, .x-deal, .x-rounds, .x-acq, .x-already, [data-testid=buyer-invested], a[href^='http'], a[href^='/trends#']"; // a link out or to a trend shows its story's or trend's own headline

async function open(page: Page, path: string) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && !IGNORE_CONSOLE.test(m.text()) && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  const r = await page.goto(path);
  expect(r?.status(), path).toBe(200);
  await page.waitForLoadState("domcontentloaded");
  return errors;
}

for (const path of PAGES) {
  test(`page ${path}: renders, words, links, layout`, async ({ page }) => {
    const errors = await open(page, path);
    await page.waitForTimeout(800);
    expect(await page.locator("html").getAttribute("data-theme")).toBe(await page.evaluate(() => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"))); // a first visit follows the device (11-03-26)
    // Scout's own words: quoted episode notes and creators' quotes are someone else's text ("Innovation-based pricing", 10-26-26)
    const [text, own] = await page.locator("body").evaluate((b, about) => {
      const read = (drop: string) => {
        const c = b.cloneNode(true) as HTMLElement;
        c.querySelectorAll(drop).forEach((q) => q.remove());
        document.body.appendChild(c);
        c.style.cssText = "position:absolute;left:-99999px;top:0";
        const t = c.innerText;
        c.remove();
        return t;
      };
      return [read("blockquote, q, [data-quote]"), read(`blockquote, q, [data-quote], ${about}`)];
    }, ABOUT_STARTUPS);
    for (const b of BANNED) expect(text, `${path} shows ${b}`).not.toMatch(b);
    expect(AREA_LABELS.reduce((t, l) => t.split(l).join(""), own), `${path}: Scout's own words`).not.toMatch(SELLING);
    // links: no underline at rest (the dotted underline comes on hover, tested in round1.spec) unless the firm's theme
    // underlines them (THEME_UNDERLINED: Sidekick's source links); never browser blue
    for (const theme of ["dark", "light"]) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      const bad = await page.evaluate((own) => {
        const OPT = "nav a, .ticker a, a.seg, a.btn, a.lane-chip, a.src, a.src2, .evi a, .views a, .brands > a, .sim > a, .faces a, a.brand, .votes a, .toc a, .snav a, .tabbar a, a.pal-it, a.fund-chip, a.nl, .tabmenu a";
        const out: string[] = [];
        document.querySelectorAll("a").forEach((a) => {
          const cs = getComputedStyle(a);
          if (cs.display === "none" || !a.offsetParent) return;
          const opted = a.matches(OPT);
          if (cs.color === "rgb(0, 0, 238)") out.push("blue:" + a.textContent);
          // neutral links in prose carry a quiet dotted underline so they read as links without red (V2, 10-26-26)
          if (cs.textDecorationLine.includes("underline") && !a.matches(".band h2 a, .ph-lede a, .pgh .lede2 a, .doc .main li > a, .doc .main p > a, .x-popbox li > a, .x-ftable .ft-sig") && !(own && a.matches(own))) out.push("underlined at rest:" + a.textContent?.slice(0, 40));
          void opted;
        });
        return out.slice(0, 10);
      }, THEME_UNDERLINED);
      expect(bad, `${path} ${theme}`).toEqual([]);
    }
    // buttons never carry an X glyph
    const xs = await page.locator("button.btn, .btn").evaluateAll((els) => els.filter((e) => /[✕✖×]/.test(e.textContent || "")).length);
    expect(xs).toBe(0);
    expect(errors, path).toEqual([]);
  });
}

test("nav labels are one line from 1440 down to 920", async ({ page }) => {
  for (const w of [1440, 1320, 1180, 1024, 920]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto("/pipeline");
    const tall = await page.locator(".nav > a, .nav .dd > button").evaluateAll((els) => els.filter((e) => (e as HTMLElement).offsetHeight > 0 && e.getBoundingClientRect().height > 70).map((e) => e.textContent));
    expect(tall, `width ${w}`).toEqual([]);
    const overlap = await page.evaluate(() => {
      const nav = document.querySelector(".nav")!.getBoundingClientRect();
      const tools = document.querySelector(".tools")!.getBoundingClientRect();
      const last = [...document.querySelectorAll(".nav > a, .nav .dd")].pop()!.getBoundingClientRect();
      return last.right > tools.left + 1 && nav.width > 0;
    });
    expect(overlap, `nav overlaps the tools at ${w}`).toBe(false);
  }
});

for (const w of [390, 768, 1024, 1280, 1440]) {
  test(`no horizontal scroll and no clipped text at ${w}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    // every page, not a hand-picked few: Filings and the two fund pages scrolled a phone sideways while this list
    // skipped them (screen review, 11-03-26)
    for (const p of PAGES) {
      await page.goto(p);
      await page.waitForTimeout(300);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(sw, `${p} at ${w}`).toBeLessThanOrEqual(1);
      const clipped = await page.evaluate(() =>
        [...document.querySelectorAll("main p, main h1, main h2, main h3, main .why, main .cdesc, main .cname")]
          .filter((e) => (e as HTMLElement).offsetParent && e.scrollWidth > e.clientWidth + 2)
          .map((e) => e.textContent?.slice(0, 40)),
      );
      expect(clipped, `${p} at ${w}`).toEqual([]);
      // from a laptop's width up, no table needs its own sideways scroll either: its words wrap (Filings, 11-03-26)
      if (w >= 1024) {
        const scrolls = await page.evaluate(() => [...document.querySelectorAll("main .x-tscroll")].filter((e) => e.scrollWidth > e.clientWidth + 1).length);
        expect(scrolls, `${p} at ${w}: a table scrolls sideways inside its card`).toBe(0);
      }
    }
  });
}

// every firm ships both looks; a first visit follows the device's setting until the viewer picks one (11-03-26)
for (const scheme of ["dark", "light"] as const) {
  test(`a first visit on a ${scheme} device is ${scheme}, and the theme chip switches it and remembers`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto(HOME);
    const other = scheme === "dark" ? "light" : "dark";
    expect(await page.locator("html").getAttribute("data-theme")).toBe(scheme);
    expect(await page.locator("[data-theme-chip]").getAttribute("title")).toContain(scheme === "dark" ? NAMES.lightLook : NAMES.darkLook);
    await page.locator("[data-theme-chip]").click();
    expect(await page.locator("html").getAttribute("data-theme")).toBe(other);
    await page.reload();
    expect(await page.locator("html").getAttribute("data-theme")).toBe(other);
  });
}

test("phone: the tab bar works and every card action is reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pipeline");
  await expect(page.locator(".tabbar")).toBeVisible();
  await page.locator(".tabbar a", { hasText: "Trends" }).click();
  await expect(page).toHaveURL(/\/trends/);
  await page.goto("/pipeline");
  if (TABLE) {
    // the Fit Table: each line opens its startup, its last column (Funds Raised) reachable by scrolling the table
    const last = page.locator(`${ROWS}`).first().locator("td").last();
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport({ ratio: 0.5 });
    return;
  }
  const acts = page.locator(".x-row").first().locator(".x-side > *");
  for (let i = 0; i < (await acts.count()); i++) await expect(acts.nth(i)).toBeInViewport({ ratio: 0.01 }).catch(async () => {
    await acts.nth(i).scrollIntoViewIfNeeded();
    await expect(acts.nth(i)).toBeVisible();
  });
});

test("icons are the firm's", async ({ request }) => {
  for (const p of ["/icon.png", "/favicon.ico"]) {
    const r = await request.get(p);
    expect(r.status()).toBe(200);
    expect((await r.body()).length).not.toBe(25931);
  }
});

test("View on GitHub: the top bar and the footer open the public repo in a new window", async ({ page, context }) => {
  const REPO = FIRM.repoUrl;
  test.skip(!REPO, "this firm shows no GitHub link (repoUrl is empty)");
  await context.route("https://github.com/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<title>repo</title>" }));
  // the label shortens with the other chips but never disappears (user, 10-30-26: icon + text)
  for (const [w, label] of [[1440, "View on GitHub"], [1180, "GitHub"], [390, "GitHub"]] as const) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto("/pipeline");
    const chip = page.locator(".tools a[data-github]");
    await expect(chip, `width ${w}`).toBeVisible();
    expect((await chip.innerText()).trim().toLowerCase(), `width ${w}`).toBe(label.toLowerCase());
    expect(await chip.locator("svg.gh-mark").boundingBox(), `mark at ${w}`).not.toBeNull();
    const foot = page.locator("footer.foot a[data-github]");
    await expect(foot).toHaveText("View on GitHub");
    await expect(foot.locator("svg.gh-mark")).toBeVisible();
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const sel of [".tools a[data-github]", "footer.foot a[data-github]"]) {
    const a = page.locator(sel);
    await expect(a).toHaveAttribute("href", REPO);
    await expect(a).toHaveAttribute("target", "_blank");
    await a.scrollIntoViewIfNeeded();
    const hit = await a.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!top && el.contains(top);
    });
    expect(hit, `${sel} is the thing under its center`).toBe(true);
    const [popup] = await Promise.all([page.waitForEvent("popup"), a.click()]);
    expect(popup.url()).toBe(REPO);
    await popup.close();
  }
});

test("every Talk to <builder> opens the builder's page in a new window, and none shows without a builder", async ({ page }) => {
  await page.goto("/about");
  if (!BUILDER.url) {
    // a copy whose firm names no builder (the public copy, 11-05-26): no Talk to button and no credit anywhere
    await expect(page.locator("[data-talk]")).toHaveCount(0);
    await expect(page.locator("footer.foot")).not.toContainText("Built by");
    return;
  }
  const a = page.locator("[data-talk]").first();
  await expect(a).toHaveAttribute("href", BUILDER.url);
  await expect(a).toHaveAttribute("target", "_blank");
  await page.goto("/tracking");
  await page.locator(".lock-chip").first().click();
  const door = page.getByTestId("door");
  await expect(door).toBeVisible();
  await expect(door.locator("[data-talk]")).toHaveAttribute("href", BUILDER.url);
  await page.keyboard.press("Escape");
  await expect(door).toHaveCount(0);
});

test("external links open in a new window", async ({ page }) => {
  await page.goto("/company/3");
  const bad = await page.evaluate(() => [...document.querySelectorAll("a[href^='http']")].filter((a) => !(a as HTMLAnchorElement).href.startsWith(location.origin) && a.getAttribute("target") !== "_blank").map((a) => a.getAttribute("href")));
  expect(bad).toEqual([]);
});

// The screen review (11-03-26): a missing address showed Next.js's bare "404 | This page could not be found." in its own
// font with no way back, and a mistyped company address (/company/abc) crashed into an error. Both are Scout's own
// Page Not Found now (components/Miss.tsx), in the firm's look, with Go to Today.
test("an address with no page shows Scout's Page Not Found, with a way back", async ({ page }) => {
  for (const p of ["/no-such-page", "/company/abc", "/company/1.5", "/company/99999999999999999999", "/company/999999"]) {
    const res = await page.goto(p);
    expect(res!.status(), p).toBe(404);
    await expect(page.getByTestId("miss").locator("h1"), p).toHaveText("Page Not Found");
    await expect(page.locator(".next-error-h1"), p).toHaveCount(0);
  }
  await page.getByTestId("miss").getByRole("link", { name: "Go to Today" }).click();
  await expect(page).toHaveURL(/\/$/);
});

// The screen review (11-03-26), at 390px: the footer's links split ("Phase / II", "View on / GitHub"), Tracking's "· next"
// split from "in 11h 3m", and the picture behind a Tracking row drew its own logo and name over the row's.
test("on a phone no footer link or check time splits, and a row's picture never draws a second name over its words", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  for (const p of [HOME, "/tracking"]) {
    await page.goto(p);
    await page.waitForTimeout(300);
    const split = await page.evaluate(() =>
      [...document.querySelectorAll(".foot .left > *, .foot .right > *, main .ph-lede.mono > span")]
        .filter((e) => (e as HTMLElement).offsetParent)
        .filter((e) => {
          // the words only: an icon beside them (View on GitHub's mark) sits at its own height
          const tops = new Set<number>();
          const walk = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
          for (let n = walk.nextNode(); n; n = walk.nextNode()) {
            if (!n.textContent!.trim()) continue;
            const r = document.createRange();
            r.selectNodeContents(n);
            for (const x of r.getClientRects()) if (x.width > 1) tops.add(Math.round(x.bottom));
          }
          return tops.size > 1;
        })
        .map((e) => (e.textContent || "").trim()),
    );
    expect(split, `${p}: these split across lines`).toEqual([]);
  }
  const covered = await page.evaluate(() => {
    const bad: string[] = [];
    for (const mk of document.querySelectorAll(".x-row .x-sky .x-skymark")) {
      const m = mk.getBoundingClientRect();
      if (!m.width || getComputedStyle(mk).display === "none") continue;
      for (const el of mk.closest(".x-row")!.querySelectorAll(".x-bover .x-name, .x-bover .x-why, .x-bover .x-tags > *, .x-bover .x-logo")) {
        const t = el.getBoundingClientRect();
        if (Math.min(m.right, t.right) > Math.max(m.left, t.left) && Math.min(m.bottom, t.bottom) > Math.max(m.top, t.top)) bad.push(`${(mk.closest(".x-row")!.querySelector(".x-name")?.textContent || "").trim()}: the picture's mark covers ${el.className}`);
      }
    }
    return bad;
  });
  expect(covered).toEqual([]);
});

// user, 11-03-26, on the Pipeline's Board: "Remove up/down indicators from all cards"
test("a Board card has no up/down votes", async ({ page }) => {
  await page.goto("/pipeline?view=board");
  await expect(page.locator(".board .mini").first()).toBeVisible();
  await expect(page.locator(".board .mini .votes, .board .mini [data-vote]")).toHaveCount(0);
});

