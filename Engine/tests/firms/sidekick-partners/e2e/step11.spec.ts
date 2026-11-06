// Plan step 11 in the browser, on Sidekick: the look of record (Sidekick Partners/design/NOTES.md) is what the site
// draws. These stand in, for Sidekick, for the tests that check Courtside's red (tests/e2e/round3.spec.ts and
// v2.spec.ts keep checking Courtside's frozen look).
import { test, expect, type Page } from "@playwright/test";

const BRASS = "rgb(201, 164, 92)";
const CARD = "rgb(246, 241, 228)";
const COURTSIDE_RED = "rgb(204, 0, 61)";

async function ready(page: Page, path: string) {
  await page.goto(path);
  await page.waitForSelector("html[data-hydrated='1']");
}

/** Every element on the page painted in Courtside's red, by what paints it. */
const redOnPage = (page: Page) =>
  page.evaluate((red) => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const cs = getComputedStyle(el);
      for (const k of ["color", "backgroundColor", "borderTopColor", "outlineColor"] as const) if (cs[k] === red) out.push(`${el.tagName.toLowerCase()}.${el.className} ${k}`);
    }
    return out;
  }, COURTSIDE_RED);

test("the header: Sidekick's logo with AI SCOUT in Bodoni Moda, and the Light / Dark switch", async ({ page }) => {
  await ready(page, "/");
  const logo = page.locator(".top img.brand-logo");
  await expect(logo).toBeVisible();
  expect(await logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator(".top .brand-word")).toHaveText("AI SCOUT");
  expect(await page.locator(".top .brand-word").evaluate((el) => getComputedStyle(el).fontFamily)).toContain("Bodoni Moda");
  expect(await page.locator(".top").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(13, 44, 36)");
  // two looks since 11-03-26 (user: "add a dark mode to the app"): a light device opens on Light, Shift+T flips to Dark
  await expect(page.locator("[data-theme-chip]")).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("light");
  await page.keyboard.press("Shift+T");
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
});

test("Today: cream cards with small-capital Cormorant headings, brass for the call to action, no red", async ({ page }) => {
  await ready(page, "/");
  const shortlist = page.locator("section[aria-label='Shortlist']");
  expect(await shortlist.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(CARD);
  const h2 = shortlist.locator(".x-h2");
  expect(await h2.evaluate((el) => getComputedStyle(el).fontFamily)).toContain("Cormorant Garamond");
  expect(await h2.evaluate((el) => getComputedStyle(el).fontVariantCaps)).toBe("small-caps");
  expect(await page.locator("body").evaluate((el) => getComputedStyle(el).fontFamily)).toContain("Source Sans 3");
  expect(await page.getByTestId("start-brief").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(BRASS);
  expect(await redOnPage(page)).toEqual([]);
  // labels show as written (Title Case), never forced into capitals
  const caps = await page.evaluate(() => Array.from(document.querySelectorAll("main *")).filter((el) => getComputedStyle(el).textTransform === "uppercase").length);
  expect(caps).toBe(0);
});

test("a company page: the one brass button is Visit Website, and nothing is Courtside's red", async ({ page }) => {
  await ready(page, "/");
  const href = await page.locator("a[title='Open Chairside in Scout']").first().getAttribute("href");
  await ready(page, href!);
  const visit = page.locator(".x-deal .x-btn.site.cta");
  await expect(visit).toHaveText(/Visit Website/);
  expect(await visit.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(BRASS);
  const brass = await page.locator("main .x-btn").evaluateAll((els, b) => els.filter((e) => getComputedStyle(e).backgroundColor === b).map((e) => e.textContent?.trim()), BRASS);
  expect(brass).toEqual([expect.stringContaining("Visit Website")]);
  expect(await page.locator(".x-deal").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(CARD);
  expect(await redOnPage(page)).toEqual([]);
});

for (const scheme of ["light", "dark"] as const)
test(`pages with text on the green stay readable in ${scheme === "light" ? "Light" : "Dark"}: no word is lost on what it sits on`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: scheme });
  await ready(page, "/");
  const company = (await page.locator("a[title='Open Crownwell in Scout']").first().getAttribute("href"))!;
  for (const path of ["/pipeline", "/tracking", "/settings", "/about", "/filings", "/trends", company]) {
    await ready(page, path);
    // the luminance of each visible word's color against what it sits on: never dark on dark, never light on light
    const bad = await page.evaluate(() => {
      // a computed color is rgb(), rgba() or, from color-mix(), color(srgb r g b / a) with channels from 0 to 1
      const parse = (c: string) => {
        const n = (c.match(/[\d.]+/g) || []).map(Number);
        const rgb = c.startsWith("color(") ? n.slice(0, 3).map((v) => v * 255) : n.slice(0, 3);
        return { rgb, a: n[3] ?? 1 };
      };
      const lum = (c: string) => {
        const [r, g, b] = parse(c).rgb.map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const bgOf = (el: Element | null): string => {
        for (let e = el; e; e = e.parentElement) {
          const bg = getComputedStyle(e).backgroundColor;
          // a see-through fill (a chip on a picture) shows what is under it: keep looking up
          if (bg && bg !== "transparent" && parse(bg).a >= 0.5) return bg;
        }
        return "rgb(5, 33, 26)"; // the floor
      };
      const out: string[] = [];
      for (const el of Array.from(document.querySelectorAll("main *"))) {
        const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim());
        if (!own) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || getComputedStyle(el).visibility === "hidden" || getComputedStyle(el).opacity === "0") continue;
        const a = lum(getComputedStyle(el).color), b = lum(bgOf(el));
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        if (ratio < 3) out.push(`${el.tagName.toLowerCase()}.${el.className}: ${el.textContent!.trim().slice(0, 30)} (${ratio.toFixed(1)})`);
      }
      return out;
    });
    expect(bad, path).toEqual([]);
  }
});

test("Must See: the fit ring sits clear of the chips and the name, and shows no stage or sources (user, 11-02-26)", async ({ page }) => {
  await ready(page, "/");
  const hero = page.locator(".x-tile.hero");
  const ring = await hero.locator(".x-tl").boundingBox();
  for (const sel of [".x-over .x-tags", ".x-over .x-name"]) {
    const box = await hero.locator(sel).first().boundingBox();
    expect(ring!.y + ring!.height, sel).toBeLessThanOrEqual(box!.y);
  }
  await expect(hero.locator(".x-stage, .x-srcbtn")).toHaveCount(0);
  await expect(hero.locator(".x-funds .x-amt")).toHaveText("$4.1M");
});

test("a startup with no icon shows its letter, never Google's blank globe", async ({ page }) => {
  await ready(page, "/");
  // Chairside's site has no icon: Google answers with a 16-pixel globe, which counts as none
  const logo = page.locator("section[aria-label='Shortlist'] .x-rr").first().locator(".x-logo");
  await expect(logo).toHaveClass(/mono/);
  await expect(logo).toHaveText("C");
});

test("the Shortlist: a Found column in days instead of a New badge, and every fit number shows whole (user, 11-02-26)", async ({ page }) => {
  await ready(page, "/");
  const list = page.locator("section[aria-label='Shortlist']");
  await expect(list.locator(".x-rhead")).toContainText("Found");
  await expect(list.locator(".x-rr .x-new")).toHaveCount(0);
  // the test data finds Chairside three days before the run, Olea & Oak nine
  await expect(list.locator(".x-rr").first().locator(".x-rfound")).toHaveText("3 days ago");
  await expect(list.locator(".x-rr").last().locator(".x-rfound")).toHaveText("9 days ago");
  // a fit number never runs past the end of its track (84% was cut to "84" once the Found column narrowed it)
  const cut = await list.locator(".x-rtrack").evaluateAll((tracks) =>
    tracks.filter((t) => t.querySelector("b")!.getBoundingClientRect().right > t.getBoundingClientRect().right + 0.5).map((t) => t.textContent),
  );
  expect(cut).toEqual([]);
});

test("user's review (11-02-26): sources are links, deal statuses open their source, no pills, no ring disc", async ({ page }) => {
  await ready(page, "/");
  const href = await page.locator("a[title='Open Crownwell in Scout']").first().getAttribute("href");
  await ready(page, href!);
  // the facts under the cover carry labels; Found in days; the backer links to the news that names it
  const facts = page.locator(".x-deal .x-facts");
  await expect(facts.locator("dt")).toHaveText(["Found", "Backed By", "Latest Signal"]);
  await expect(facts.locator("dd").first()).toHaveText("6 days ago");
  await expect(page.locator(".x-deal .x-new")).toHaveCount(0);
  await expect(facts.locator("a", { hasText: "Unilever Ventures" })).toHaveAttribute("href", /^https:\/\//);
  // one round: no split bar repeating the total
  await expect(page.locator(".x-deal .x-stack")).toHaveCount(0);
  // the fit ring has no pale disc behind it
  expect(await page.locator(".x-deal .x-fit").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
  // every Verified or Reported in Likely Acquirers opens its source; a missing multiple is a dash, never "Not Published"
  const acq = page.getByTestId("acq-panel");
  const tags = acq.locator(".x-st.verified, .x-st.reported");
  expect(await tags.count()).toBeGreaterThan(3);
  for (const href of await tags.evaluateAll((els) => els.map((e) => e.getAttribute("href")))) expect(href).toMatch(/^https:\/\//);
  await expect(acq).not.toContainText("Not Published");
  // Team Notes: the heading's words clear the copy button
  const notes = page.locator("section[aria-label='Team Notes']");
  const [h, btn] = await Promise.all([notes.locator(".note-h").boundingBox(), notes.locator(":scope > .x-mdcopy").boundingBox()]);
  expect(h!.x + h!.width).toBeLessThanOrEqual(btn!.x);
});

/** Every page a visitor can reach, with the tabs and Settings sections that draw their own blocks. */
async function everyPage(page: Page) {
  await ready(page, "/");
  const company = (await page.locator("a[title='Open Crownwell in Scout']").first().getAttribute("href"))!;
  // no Deck Screen (off and incomplete) and no Change Log (user, 11-03-26)
  return ["/", "/pipeline", company, "/tracking", "/tracking#trends", "/tracking#people", "/tracking#alerts", "/tracking#configure",
    "/settings", "/settings?s=thesis", "/settings?s=scoring", "/settings?s=sources", "/settings?s=jobs", "/settings?s=funds", "/settings?s=trackers", "/settings?s=hidden", "/settings?s=alerts", "/settings?s=ai", "/settings?s=shortcuts", "/settings?s=appearance",
    "/about", "/backtest", "/trends", "/filings", "/co-investors", "/synergistic-funds",
    // the screen review's hard states (11-03-26): an empty list, a missing address and a mistyped company address
    "/pipeline?q=no-such-startup-zz", "/pipeline?view=board", "/no-such-page", "/company/abc"];
}

// The screen review (11-02-26): Trends, Tracking, Filings, the Funding pages, Settings, About and Backtest were never on
// a design page, and their rows and text sat straight on the green floor while every designed page drew cream cards.
test("no section sits straight on the green: every page's words are on a cream card (Sidekick Partners/CLAUDE.md, Two looks)", async ({ page }) => {
  for (const path of await everyPage(page)) {
    await ready(page, path);
    const loose = await page.evaluate(() => {
      const out = new Set<string>();
      for (const el of Array.from(document.querySelectorAll("main *"))) {
        if (!Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim())) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || getComputedStyle(el).visibility === "hidden") continue;
        // drawn on the green by design: Today's counts and the breadcrumb
        if (el.closest(".mast, .crumb")) continue;
        let e: Element | null = el;
        while (e && e.tagName !== "MAIN" && getComputedStyle(e).backgroundColor === "rgba(0, 0, 0, 0)" && getComputedStyle(e).backgroundImage === "none") e = e.parentElement;
        if (!e || e.tagName === "MAIN") out.add(`${el.tagName.toLowerCase()}.${String(el.className).trim().split(/\s+/).join(".")} "${el.textContent!.trim().slice(0, 40)}"`);
      }
      return [...out];
    });
    expect(loose, `${path}: words on the green floor; put their block in the cream cards list in Sidekick Partners/brand/theme.css`).toEqual([]);
  }
});

// The same review: Trends' tags and sources, Settings' toggles, Filings' table head and Backtest's steps were Cormorant
// at 12px, Engine's small capitals labels with the capitals taken away.
test("small labels are never in the heading font: Cormorant is for headings, Source Sans 3 for anything under 17px", async ({ page }) => {
  for (const path of await everyPage(page)) {
    await ready(page, path);
    const small = await page.evaluate(() => {
      const out = new Set<string>();
      for (const el of Array.from(document.querySelectorAll("main *"))) {
        if (!Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim()) || !el.getBoundingClientRect().width) continue;
        if (el.closest(".x-logo")) continue; // a startup's letter, standing in for its icon
        const cs = getComputedStyle(el);
        if (/Cormorant/.test(cs.fontFamily) && parseFloat(cs.fontSize) < 17) out.add(`${el.tagName.toLowerCase()}.${String(el.className).trim().split(/\s+/).join(".")} ${cs.fontSize} "${el.textContent!.trim().slice(0, 30)}"`);
      }
      return [...out];
    });
    expect(small, `${path}: a small label in Cormorant; add it to the small-labels rule in Sidekick Partners/brand/theme.css`).toEqual([]);
  }
});

test("every source Scout links to looks like a link, on every page (user, 11-02-26: link items to showcase proof)", async ({ page }) => {
  await ready(page, "/");
  const href = await page.locator("a[title='Open Crownwell in Scout']").first().getAttribute("href");
  for (const path of ["/", href!, "/pipeline", "/tracking", "/co-investors", "/synergistic-funds", "/filings", "/trends", "/backtest", "/about"]) {
    await ready(page, path);
    // an outside link (a source) in the page's content: underlined, or set apart from the words around it
    const plain = await page.evaluate(() => [...document.querySelectorAll("main a[href^='http']")].filter((a) => {
      const cs = getComputedStyle(a);
      if (!a.textContent!.trim() || !a.getClientRects().length || cs.textDecorationLine.includes("underline")) return false;
      // a source chip with its site's icon (Trends' src2) is set apart by its border, like x-sig
      if (/btn|x-st|x-sig|chip|x-logo|src2/.test(a.className)) return false;
      return cs.color === getComputedStyle(a.parentElement!).color;
    }).map((a) => a.textContent!.trim()));
    expect(plain, path).toEqual([]);
  }
});

test("a copy button never sits on a heading, a link or a button (user, 11-02-26: \"fix overlapping icons\")", async ({ page }) => {
  await ready(page, "/");
  const href = await page.locator("a[title='Open Crownwell in Scout']").first().getAttribute("href");
  // every page that has copy buttons: Today, a company page, Tracking
  for (const path of ["/", href!, "/tracking"]) {
    await ready(page, path);

    const hits = await page.evaluate(() => {
      const meet = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      return [...document.querySelectorAll<HTMLElement>(".x-mdcopy")].flatMap((btn) => {
        const box = btn.getBoundingClientRect();
        return [...btn.parentElement!.querySelectorAll<HTMLElement>("a, button, h2, .x-flabel, .note-h")]
          .filter((el) => {
            if (el === btn || btn.contains(el) || !el.getClientRects().length) return false;
            // a link or button by its whole box (border included); a heading by its words, not its full-width block
            if (/^(A|BUTTON)$/.test(el.tagName)) return meet(box, el.getBoundingClientRect());
            const words = document.createRange();
            words.selectNodeContents(el);
            return [...words.getClientRects()].some((r) => meet(box, r));
          })
          .map((el) => `${btn.parentElement!.getAttribute("aria-label")}: ${el.textContent!.trim().slice(0, 30)}`);
      });
    });
    expect(hits, path).toEqual([]);
  }
});

test("a company page opens on a cover (user, 11-02-26: round 6's B): what it does under its name, tags that read as tags", async ({ page }) => {
  await ready(page, "/");
  const href = await page.locator("a[title='Open Crownwell in Scout']").first().getAttribute("href");
  await ready(page, href!);
  const cover = page.locator(".x-deal.x-cover .x-cv");
  await expect(cover.locator("h1")).toHaveText("Crownwell");
  // the one-line description sits right under the name, on the picture
  const [name, desc] = await Promise.all([cover.locator("h1").boundingBox(), cover.locator(".x-why").boundingBox()]);
  expect(desc!.y - (name!.y + name!.height)).toBeLessThan(24);
  expect(Math.abs(desc!.x - name!.x)).toBeLessThan(2);
  // the industry and Buyer Already Invested are filled chips; Found is a labeled fact with no fill
  await expect(cover.locator(".x-tag")).toHaveText(["Premium Consumer Brands", "Buyer Already Invested"]);
  for (const bg of await cover.locator(".x-tag").evaluateAll((els) => els.map((e) => getComputedStyle(e).backgroundColor))) expect(bg).not.toBe("rgba(0, 0, 0, 0)");
  expect(await page.locator(".x-facts dd").first().evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
  await expect(cover.locator(".x-skymark")).toBeHidden(); // the picture's own name label would say it twice
  // the numbers below: the fit panel and Funds Raised with its round and source
  await expect(page.locator(".x-cover .x-cvnums .fitp")).toContainText("71");
  const funds = page.locator(".x-cover .fundp");
  await expect(funds).toContainText("$3.2M");
  await expect(funds.locator("a")).toHaveAttribute("href", /^https:\/\//);
});

test("the Pipeline is the Fit Table (user, 11-02-26: \"use this pipeline\"), under its title and filters on a cream card", async ({ page }) => {
  await ready(page, "/pipeline");
  for (const sel of [".ph", ".x-pfilters", ".x-ftable"]) expect(await page.locator(sel).evaluate((el) => getComputedStyle(el).backgroundColor), sel).toBe(CARD);
  const t = page.locator(".x-ftable");
  await expect(t.locator("thead th")).toHaveText(["#", "Startup", "Industry", "Thesis Fit", "Found", "Latest Signal", "Funds Raised"]);
  const rows = t.locator("tbody tr");
  await expect(rows).toHaveCount(6);
  const first = rows.first();
  await expect(first).toContainText("Chairside");
  await expect(first).toContainText("84%");
  await expect(first).toContainText("Vertical SaaS + Embedded Payments");
  await expect(first).toContainText("$4.1M");
  await expect(first.locator("a.ft-sig")).toHaveAttribute("href", /^https:\/\//);
  // the picture rows are gone: no fit ring, no row of buttons
  await expect(page.locator(".x-row")).toHaveCount(0);
  // a click anywhere on the line opens the startup; the signal link opens its story instead
  const box = (await first.locator("td").nth(4).boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForURL(/\/company\/\d+$/);
  await expect(page.locator(".x-deal h1")).toHaveText("Chairside");
});

// Settings, 11-03-26 ("broken design" on the Shortcuts filter): a block that is a card on the page drew a second card
// inside Settings' own, a box in a box. A card is a card only once.
test("no card sits inside another card", async ({ page }) => {
  for (const path of await everyPage(page)) {
    await ready(page, path);
    const nested = await page.evaluate(() => {
      // the theme's cream-card list: the one rule that sets --field
      let list = "";
      for (const sh of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try { rules = sh.cssRules; } catch { continue; }
        for (const r of Array.from(rules)) if (r instanceof CSSStyleRule && r.style.getPropertyValue("--field")) list = r.selectorText;
      }
      if (!list) return ["the theme's cream-card rule (the one that sets --field) was not found"];
      // a block on the list that still draws its frame: a side border or a shadow
      const drawn = (e: Element) => { const cs = getComputedStyle(e); return e.matches(list) && (parseFloat(cs.borderLeftWidth) > 0 || cs.boxShadow !== "none"); };
      return Array.from(document.querySelectorAll("main *")).filter((e) => {
        if (!e.getBoundingClientRect().width || !drawn(e)) return false;
        for (let a: Element | null = e.parentElement; a && a.tagName !== "MAIN"; a = a.parentElement) if (drawn(a)) return true;
        return false;
      }).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).trim().split(/\s+/).join(".")}`);
    });
    expect(nested, `${path}: a card inside a card; take the inner block off the cream cards list in Sidekick Partners/brand/theme.css, or give it a class that isn't on it`).toEqual([]);
  }
});

// Settings › Thesis, 11-03-26 ("doesn't make any sense"): each search sat in a dark green field under dark ink. Every
// field on a card is light, and its words read on it.
test("every field on a card is light, with words that read on it", async ({ page }) => {
  for (const path of await everyPage(page)) {
    await ready(page, path);
    const bad = await page.evaluate(() => {
      const rgb = (c: string) => (c.match(/[\d.]+/g) || []).slice(0, 4).map(Number);
      const lum = ([r, g, b]: number[]) => [r, g, b].map((v) => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((t, v, i) => t + v * [0.2126, 0.7152, 0.0722][i], 0);
      const back = (e: Element | null): number[] => {
        for (; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.length === 3 || c[3] > 0.5) return c; }
        return [255, 255, 255];
      };
      const out: string[] = [];
      for (const f of document.querySelectorAll("main input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=file]), main textarea, main select")) {
        if (!f.getBoundingClientRect().width) continue;
        const bg = back(f), fg = rgb(getComputedStyle(f).color);
        const [hi, lo] = [lum(bg), lum(fg)].sort((x, y) => y - x);
        const ratio = (hi + 0.05) / (lo + 0.05);
        if (lum(bg) < 0.5 || ratio < 4.5) out.push(`${f.tagName.toLowerCase()}[aria-label="${f.getAttribute("aria-label")}"] on rgb(${bg.join(",")}) at ${ratio.toFixed(1)}:1`);
      }
      return out;
    });
    expect(bad, `${path}: a dark or unreadable field; set --field on the cream cards in Sidekick Partners/brand/theme.css`).toEqual([]);
  }
});

// Settings, 11-03-26: "broken design, see the areas with no shortcuts" (Yours, Shared, Record read as three more
// sections, Shared jammed under Shortcuts), and "from settings remove: phase II, change log"
test("Settings: its group names stand apart as headers, and it has no Phase II or Change Log", async ({ page }) => {
  await ready(page, "/settings");
  const nav = page.locator(".snav");
  await expect(nav.locator(".grp")).toHaveText(["Yours", "Shared"]);
  await expect(nav).not.toContainText("Phase II");
  await expect(nav).not.toContainText("Change Log");
  // measured once the sidebar is laid out (right after hydration it can still be zero height)
  await expect(nav.locator(".grp").nth(1)).toBeVisible();
  const g = await page.evaluate(() => {
    const grps = [...document.querySelectorAll(".snav .grp")];
    const link = document.querySelector(".snav a")!;
    return grps.map((e) => {
      const prev = (e.parentElement!.previousElementSibling?.lastElementChild || null) as Element | null;
      const cs = getComputedStyle(e);
      // from the section above to the group's own words (the rule sits halfway)
      return { gap: prev ? e.getBoundingClientRect().top + parseFloat(cs.paddingTop) - prev.getBoundingClientRect().bottom : null, weight: Number(cs.fontWeight), color: cs.color, linkColor: getComputedStyle(link).color, rule: cs.borderTopWidth };
    });
  });
  expect(g[0].gap).toBeNull();
  for (const x of g.slice(1)) {
    expect(x.gap!, JSON.stringify(g)).toBeGreaterThanOrEqual(24); // room above, so Shared never reads as part of Shortcuts
    expect(x.rule).toBe("1px");
  }
  for (const x of g) {
    expect(x.weight).toBeGreaterThanOrEqual(700);
    expect(x.color).not.toBe(x.linkColor);
  }
  // an old address for a removed section opens the first one; ⌃O and ⌃P open nothing
  await ready(page, "/settings?s=log");
  await expect(page.locator(".pane h2")).toContainText("Appearance");
  for (const k of ["Control+o", "Control+p"]) {
    await page.keyboard.press(k);
    await expect(page.locator(".pane h2")).toContainText("Appearance");
  }
  await expect(page.locator(".lede2")).toHaveText("Shared settings change Scout for everyone. ⌘Z undoes a change right after it is made. Your settings stay in this browser.");
});

test("Settings › Shortcuts: the filter and its count sit on one line, on the section's own card", async ({ page }) => {
  await ready(page, "/settings?s=shortcuts");
  const box = page.getByRole("textbox", { name: "Filter shortcuts" });
  const count = page.locator(".pane .frow .mono");
  await expect(count).toHaveText(/^\d+ of \d+ shown$/);
  const [b, c] = [await box.boundingBox(), await count.boundingBox()];
  expect(Math.abs(b!.y + b!.height / 2 - (c!.y + c!.height / 2))).toBeLessThan(4);
  expect(c!.x).toBeGreaterThan(b!.x + b!.width);
  await box.fill("next");
  await expect(count).toHaveText(/^1 of \d+ shown$/);
});

test("Settings › Thesis: names Sidekick's five industries, explains a search, and ⌘Z puts a saved search back", async ({ page }) => {
  await ready(page, "/settings?s=thesis");
  await expect(page.locator(".pane .sub").first()).toHaveText(
    "The thesis covers 5 industries: Premium Consumer Brands, Consumer Health, E-Commerce Software, Vertical SaaS + Embedded Payments and Tech-Enabled Roll-Ups + AI Services. Each line below is a search Scout runs on funding news every morning to find startups in them. Words in quotes must appear together, and OR means either one.",
  );
  await expect(page.locator(".pane")).not.toContainText("Sports");
  const first = page.getByRole("textbox", { name: "Search 1" });
  const was = await first.inputValue();
  await first.fill(`${was} OR kombucha`);
  await page.getByRole("button", { name: /Save Changes/ }).click();
  await expect(page.getByTestId("toast").filter({ hasText: "1 Change Saved" })).toBeVisible();
  await ready(page, "/settings?s=thesis");
  await expect(page.getByRole("textbox", { name: "Search 1" })).toHaveValue(`${was} OR kombucha`);
  // the save is undone with ⌘Z, the way back now that Settings has no Change Log
  await page.getByRole("textbox", { name: "Search 1" }).fill(`${was} OR kombucha OR kefir`);
  await page.getByRole("button", { name: /Save Changes/ }).click();
  await expect(page.getByTestId("toast").filter({ hasText: "1 Change Saved" }).last()).toBeVisible();
  await page.locator("body").click({ position: { x: 5, y: 300 } });
  await page.keyboard.press("Meta+z");
  await expect(page.getByTestId("toast").filter({ hasText: "Save Undone" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Search 1" })).toHaveValue(`${was} OR kombucha`);
  await ready(page, "/settings?s=thesis");
  await expect(page.getByRole("textbox", { name: "Search 1" })).toHaveValue(`${was} OR kombucha`);
  // put the fixture back for the next run
  await page.getByRole("textbox", { name: "Search 1" }).fill(was);
  await page.getByRole("button", { name: /Save Changes/ }).click();
  await expect(page.getByTestId("toast").filter({ hasText: "1 Change Saved" }).last()).toBeVisible();
});

// The phone width (11-03-26): the cards kept the desktop's 40px margins, so a company page scrolled 104px sideways and
// Team Notes sat narrower than the cards above it. On a phone every card starts 12px from the edge.
test("on a phone every card on Today and a company page lines up, 12px from the edge, and nothing scrolls the page sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await ready(page, "/");
  const company = (await page.locator("a[title='Open Crownwell in Scout']").first().getAttribute("href"))!;
  // every page's title card lines up with the cards under it too: Filings', Co-Investors' and Trends' sat 28px in from
  // their filter chips' card (user's screen review, 11-03-26)
  for (const path of ["/pipeline", "/filings", "/co-investors", "/synergistic-funds", "/trends", "/tracking", "/backtest", "/brief"]) {
    await ready(page, path);
    const left = await page.locator("main .ph, main .ph-lede, main .filters, main .lanes, main .list, main .tabs, main .tabadd").evaluateAll((els) =>
      els.filter((e) => (e as HTMLElement).offsetParent).map((e) => `${e.className}: ${Math.round(e.getBoundingClientRect().left)}`),
    );
    for (const e of left) expect(e, path).toMatch(/: 12$/);
  }
  for (const path of ["/", company]) {
    await ready(page, path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), path).toBeLessThanOrEqual(1);
    const edges = await page.locator("main .x-start, main .x-deal, main .x-sec, main .x-rounds, main .x-already, main .x-notrec, main .dcol .sec, main .memo").evaluateAll((els) =>
      els.filter((e) => (e as HTMLElement).offsetParent).map((e) => `${e.getAttribute("aria-label") || e.className}: ${Math.round(e.getBoundingClientRect().left)}`),
    );
    expect(edges.length, path).toBeGreaterThan(2);
    for (const e of edges) expect(e, path).toMatch(/: 12$/);
  }
});

// user, 11-03-26, on the Board: "The text size is too small within each card"
test("the Board's cards read at body size: the startup's line at 16px, its name at 20px, in Source Sans 3", async ({ page }) => {
  await ready(page, "/pipeline?view=board");
  const sizes = await page.locator(".board .mini").first().evaluate((c) => {
    const f = (sel: string) => { const e = c.querySelector(sel); return e ? [parseFloat(getComputedStyle(e).fontSize), getComputedStyle(e).fontFamily] : null; };
    return { why: f(".why"), nm: f(".nm"), facts: f(".facts") };
  });
  expect(sizes.why![0]).toBeGreaterThanOrEqual(16);
  expect(sizes.nm![0]).toBeGreaterThanOrEqual(20);
  expect(sizes.facts![0]).toBeGreaterThanOrEqual(15);
  for (const v of Object.values(sizes)) expect(String(v![1])).toMatch(/Source Sans/);
});

// Dark is round 3's Blue Charcoal (user, 11-03-26: "use this color scheme", design/pages/FE-tracking.html): only
// the cards turn dark charcoal with cool grey words and white search boxes; the floor, the header, the ticker and the
// brass call to action are Light's.
test("Dark: blue-charcoal cards with white words, white search boxes, the call to action still brass", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await ready(page, "/");
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  const shortlist = page.locator("section[aria-label='Shortlist']");
  expect(await shortlist.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(25, 28, 33)");
  expect(await shortlist.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(243, 245, 248)");
  expect(await page.locator(".top").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(13, 44, 36)");
  const company = (await page.locator("a[title='Open Chairside in Scout']").first().getAttribute("href"))!;
  await ready(page, company);
  const visit = page.locator(".x-deal .x-btn.site.cta");
  expect(await visit.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(BRASS);
  expect(await page.locator(".x-deal").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(25, 28, 33)");
  expect(await redOnPage(page)).toEqual([]);
  // the search boxes are white with dark words (user, 11-03-26: "make the highlight area ... white")
  for (const path of ["/filings", "/pipeline", "/tracking"]) {
    await ready(page, path);
    const box = page.locator("main .fsearch").first();
    expect(await box.evaluate((el) => getComputedStyle(el).backgroundColor), path).toBe("rgb(255, 255, 255)");
    expect(await box.locator("input").evaluate((el) => getComputedStyle(el).color), path).toBe("rgb(29, 38, 34)");
  }
});


// 🔁 2nd report (11-03-26: "the logo text is still unaligned"): AI SCOUT's capitals are as tall as Sidekick's letters
// and stand on the same line (design/logo/lockup.py). Measured on the real header: the word's baseline (a zero-height
// marker inside it) against the logo's bottom edge, its cap height (the font's own measure) against Sidekick's letters
// (300 of the logo's 463 units). The lockup test checked only the font size and missed the centering.
for (const scheme of ["light", "dark"] as const)
test(`the header lockup in ${scheme === "light" ? "Light" : "Dark"}: AI SCOUT on Sidekick's line, as tall as its letters`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: scheme });
  await ready(page, "/");
  await page.evaluate(() => document.fonts.ready);
  const m = await page.evaluate(() => {
    const img = document.querySelector(".top img.brand-logo") as HTMLImageElement;
    const word = document.querySelector(".top .brand-word") as HTMLElement;
    const mark = document.createElement("i");
    mark.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
    word.appendChild(mark);
    const baseline = mark.getBoundingClientRect().top;
    mark.remove();
    const cs = getComputedStyle(word);
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const cap = ctx.measureText("AISCOUT").actualBoundingBoxAscent;
    const r = img.getBoundingClientRect();
    return { baseline, logoBottom: r.bottom, cap, letters: (r.height * 300) / 463 };
  });
  expect(Math.abs(m.baseline - m.logoBottom), `baseline ${m.baseline} vs the logo's bottom ${m.logoBottom}`).toBeLessThanOrEqual(1);
  expect(Math.abs(m.cap - m.letters), `capitals ${m.cap.toFixed(1)}px vs Sidekick's letters ${m.letters.toFixed(1)}px`).toBeLessThanOrEqual(1);
});

// 11-03-26, user on the Dark Filings and Tracking: "broken designs - too many boxes". Light joins a page's title,
// description and filters into one card by turning their own frames off; the dark block framed each part again. In
// both looks each part of a page header draws the same frame.
test("a page header is one card in Dark as in Light, never a box per part", async ({ page }) => {
  const frames = async (scheme: "light" | "dark") => {
    await page.emulateMedia({ colorScheme: scheme });
    const out: string[] = [];
    for (const path of ["/filings", "/tracking", "/pipeline", "/co-investors"]) {
      await ready(page, path);
      await page.locator("main .ph").first().waitFor(); // the Pipeline draws its header in the browser
      out.push(...(await page.locator("main .ph, main .ph-lede, main .filters").evaluateAll((els) => els.map((e) => `${e.className}: ${getComputedStyle(e).boxShadow}`))));
    }
    return out;
  };
  const light = await frames("light");
  expect(light.length).toBeGreaterThan(0);
  expect(await frames("dark")).toEqual(light);
});

// Co-Investors as a timeline (user, 11-03-26, round 1's C: "use that version", design/pages/CC-coinvestors.html):
// one feed of deals, newest first, under This Week then each month; no fund cards; the search filters it.
test("Co-Investors: one timeline of deals, newest first, and the search filters it", async ({ page }) => {
  await ready(page, "/co-investors");
  await expect(page.locator('section[aria-label="The funds"]')).toHaveCount(0);
  const dates = await page.locator("#fund-feed .te time").allInnerTexts();
  expect(dates.length).toBeGreaterThan(3);
  const iso = dates.map((d) => { const [m, dd, y] = d.trim().split("-"); return `20${y}-${m}-${dd}`; });
  expect(iso).toEqual([...iso].sort().reverse());
  await expect(page.locator("#fund-feed .tg h3").first()).toBeVisible();
  await expect(page.locator("#fund-feed .tl-chip.side").first()).toHaveText("With Sidekick");
  const first = (await page.locator("#fund-feed .te").first().getAttribute("data-filter"))!.split(" ")[0];
  await page.locator('input[aria-label="Search co-investor deals"]').fill(first);
  await expect.poll(async () => page.locator("#fund-feed .te:visible").count()).toBeLessThan(dates.length);
});
