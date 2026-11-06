// Plan step 9 on Sidekick's profile: Sponsor Radar, Culture, the creator feeds and the firm's own posts are gone; the
// Funding pages carry the standard names at Sidekick's own addresses; About and the footer say Scout is user's
// independent prototype; Form D filers named Holdings or Group carry the Possible Roll-Up Vehicle tag.
import { describe, it, expect, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UIProvider } from "@/components/ui";
import { BUILDER, DISCLAIMER, NAMES, PATHS, fundPath, on } from "@/firm";
import { ALL_JOBS, JOBS } from "@/lib/jobs";
import { ACTIONS } from "@/lib/shortcuts";
import { PHASE2_ITEMS, DOORS } from "@/lib/phase2";
import { SCORE_PARTS } from "@/lib/score";
import { DEFAULT_WEIGHTS } from "@/lib/settings";
import { DROP_NAME, rollUpVehicle } from "@/lib/thesis";
import { FUNDING_PAGES, MOVED_FUNDING, filingsDrops, rollUpNote } from "@/lib/funding-pages";
import { NAV, MONEY } from "@/components/Shell";
import { rebalance } from "@/components/settings/SettingsView";
import { titleCase } from "@/lib/format";
import { BUCKETS } from "@/lib/v2";

/** Renders a page or part the way the site does, inside the app's UI wrapper. */
const Wrap = UIProvider as unknown as (p: { palette: () => null; sheet: () => null; children?: ReactNode }) => ReactNode;
const render = (tree: ReactNode) => renderToStaticMarkup(createElement(Wrap, { palette: () => null, sheet: () => null }, tree)).replace(/<!-- -->/g, "").replace(/&#x27;/g, "'");

const notFound = async (p: Promise<unknown> | (() => unknown)) => {
  try {
    await (typeof p === "function" ? p() : p);
  } catch (e) {
    return String((e as { digest?: string }).digest || e).includes("404");
  }
  return false;
};

describe("Sidekick has no Sponsor Radar, Culture, creator feeds or firm posts", () => {
  it("every one of those switches is off", () => {
    for (const k of ["firmPosts", "creatorFeeds", "culture", "sponsorRadar"] as const) expect(on(k), k).toBe(false);
  });
  it("the top bar, the ⌘K pages and the shortcuts never offer them", () => {
    const labels = NAV.map((n) => n.label);
    expect(labels).toEqual(["Today", "Pipeline", "IC Meeting", "Trends", "Tracking", "Backtest"]);
    expect(NAV.map((n) => n.href)).not.toContain("/sponsors");
    expect(NAV.map((n) => n.href)).not.toContain("/culture");
    expect(ACTIONS.map((a) => a.id)).not.toContain("goCulture");
  });
  it("their daily jobs never run: the cron answers at once, the About schedule and the local pipeline skip them", async () => {
    expect(Object.keys(JOBS)).not.toContain("culture");
    expect(Object.keys(JOBS)).not.toContain("sponsors");
    expect(ALL_JOBS.culture).toBeTruthy(); // vercel.json still calls them: they must not 404
    // the creator-feeds job keeps following the tracked people (Sidekick's team)
    expect(JOBS["collect-media"].label).toBe("People tracked");
    vi.stubEnv("CRON_SECRET", "test-secret");
    const { GET } = await import("@/app/api/cron/[job]/route");
    const req = (job: string) => [new Request(`http://x/api/cron/${job}`, { headers: { authorization: "Bearer test-secret" } }), { params: Promise.resolve({ job }) }] as const;
    for (const job of ["culture", "sponsors"]) {
      const r = await GET(...(req(job) as unknown as Parameters<typeof GET>));
      expect(r.status, job).toBe(200);
      expect(await r.json()).toEqual({ skipped: true, why: "off for this firm" });
    }
    vi.unstubAllEnvs();
  });
  it("the Sponsor Radar and Culture pages answer 404, and creators can't be added", async () => {
    const culture = (await import("@/app/culture/page")).default;
    const sponsors = (await import("@/app/sponsors/page")).default;
    expect(await notFound(() => culture())).toBe(true);
    expect(await notFound(() => sponsors())).toBe(true);
    const { POST, DELETE } = await import("@/app/api/voices/route");
    expect((await POST(new Request("http://x/api/voices", { method: "POST", body: JSON.stringify({ input: "Some Show" }) }))).status).toBe(404);
    expect((await DELETE(new Request("http://x/api/voices", { method: "DELETE", body: JSON.stringify({ id: 1 }) }))).status).toBe(404);
  });
  it("Phase II drops the creators' social networks and the taste map", () => {
    expect(PHASE2_ITEMS.map(([d]) => d)).not.toContain("socials");
    for (const [, text] of PHASE2_ITEMS) expect(text).not.toMatch(/taste map|Instagram|TikTok/);
    expect(DOORS.realtime.later.join(" ")).not.toMatch(/taste map/);
    expect(PHASE2_ITEMS.find(([d]) => d === "realtime")![1]).toBe("Real-time updates: the Spotlight, alerts and Trending through the day, not once a day.");
  });
});

describe("the Culture part goes with Culture (leftover from step 8)", () => {
  it("the company page and Settings › Scoring show five parts: no Culture row, and no Unit Economics (it needs a deck; 11-02-26)", () => {
    expect(SCORE_PARTS.map(([, l]) => l)).toEqual(["Thesis Fit", "Stage and Check", "Signal Strength", "Team", "Geography"]);
  });
  it("moving a weight rebalances the five shown parts to 100 and never hands points to Culture or Unit Economics", () => {
    for (const n of [0, 10, 40, 60]) {
      const r = rebalance({ ...DEFAULT_WEIGHTS }, "thesis", n);
      expect(r.culture, `thesis ${n}`).toBe(0);
      expect(r.unitEconomics, `thesis ${n}`).toBe(0);
      expect(SCORE_PARTS.reduce((a, [k]) => a + r[k], 0), `thesis ${n}`).toBe(100);
    }
  });
});

describe("the Funding pages: standard names at Sidekick's own addresses", () => {
  it("Filings, Co-Investors and Synergistic Funds under the Funding menu", () => {
    expect(NAMES.fundingMenu).toBe("Funding");
    expect(MONEY).toEqual([
      { href: "/filings", label: "Filings" },
      { href: "/co-investors", label: "Co-Investors" },
      { href: "/synergistic-funds", label: "Synergistic Funds" },
    ]);
    expect(NAMES.filingsCount).toBe("Filings");
    expect(fundPath("neighborhood")).toBe("/co-investors");
    expect(fundPath("synergistic")).toBe("/synergistic-funds");
    for (const m of MONEY) expect(titleCase(m.label)).toBe(m.label);
  });
  it("the one route serves exactly those three addresses, each with its own page and title", async () => {
    const route = await import("@/app/[funding]/page");
    expect(route.dynamicParams).toBe(false);
    // the old /consumer-funds is served too, as a redirect to /synergistic-funds (renamed 11-04-26)
    expect(route.generateStaticParams()).toEqual([{ funding: "filings" }, { funding: "co-investors" }, { funding: "synergistic-funds" }, { funding: "consumer-funds" }]);
    expect(MOVED_FUNDING).toEqual({ "consumer-funds": "/synergistic-funds" });
    expect(FUNDING_PAGES["synergistic-funds"]).toEqual({ page: "peerFunds", title: "Synergistic Funds" });
    expect(await route.generateMetadata({ params: Promise.resolve({ funding: "co-investors" }) })).toEqual({ title: "Co-Investors" });
    // Courtside's live addresses are not Sidekick's pages
    for (const old of ["throw-some-ds", "neighborhood", "synergistic-funders"]) expect(await notFound(() => route.default({ params: Promise.resolve({ funding: old }) }))).toBe(true);
    expect(PATHS).toEqual({ filings: "/filings", coInvestors: "/co-investors", peerFunds: "/synergistic-funds" });
  });
  it("the Funds Raised filter's last range runs to Sidekick's $30M cap (leftover from step 8)", () => {
    expect(BUCKETS[3]).toBe("$5–30M");
  });
  it("the Filings page says what Sidekick's daily read drops: no real estate or banking, which Sidekick lets in", () => {
    expect(filingsDrops()).toBe("pooled funds and oil and gas");
  });
});

describe("Form D filers named Holdings or Group: Possible Roll-Up Vehicle", () => {
  it("they get in, and they carry the tag", () => {
    expect(on("rollUpTag")).toBe(true);
    for (const n of ["Summit CPA Group", "Ledger Holdings LLC", "Bright Smiles Dental Group, Inc."]) {
      expect(DROP_NAME.test(n), n).toBe(false);
      expect(rollUpVehicle(n), n).toBe(true);
    }
    for (const n of ["Glossa Inc", "Groupon-ish Labs", "Holdco Bakery"]) expect(rollUpVehicle(n), n).toBe(false);
    expect(rollUpNote()).toBe(" Filers named Holdings or Group stay in, tagged Possible Roll-Up Vehicle.");
    expect(titleCase("Possible Roll-Up Vehicle")).toBe("Possible Roll-Up Vehicle");
  });
  it("the Filings table shows the tag on such a filer only", async () => {
    const { FilingTable } = await import("@/components/rows");
    const row = (id: number, issuer: string) => ({ id, issuer, form: "D", url: "https://www.sec.gov/x", filedAt: new Date("2026-10-30"), firstSale: null, amountSold: 2_000_000, amountOffered: null, currency: "$", thesisArea: "roll-ups", confidence: 0.8, beforePress: false, related: [], industry: null, companyId: null, votes: 0 });
    const html = render(FilingTable({ rows: [row(1, "Summit CPA Group"), row(2, "Glossa Inc")] as never }));
    expect(html.match(/data-rollup/g)?.length).toBe(1);
    expect(html).toContain("Possible Roll-Up Vehicle");
  });
});

describe("the top bar names Sidekick, never Courtside", () => {
  it("its two lines come from the product name", async () => {
    const { BRAND_LINES } = await import("@/firm");
    expect(BRAND_LINES).toEqual(["SIDEKICK", "PARTNERS AI SCOUT"]);
  });
});

describe("About and the footer: user's independent prototype", () => {
  // the builder comes from brand/builder.json, private to this repo (the public copy credits no one: builder.test.ts)
  it.skipIf(!BUILDER.name)("the line, word for word (Plan section 1)", () => {
    expect(DISCLAIMER).toBe("An independent prototype. Not affiliated with or endorsed by Sidekick Partners.");
  });
  it.skipIf(!BUILDER.name)("About carries it, the Phase II line, and no creators, shows or Courtside sources", async () => {
    const About = (await import("@/app/about/page")).default;
    const html = render(await About());
    expect(html).toContain(DISCLAIMER);
    expect(html).toContain("A deal-sourcing site built around Sidekick Partners' thesis.");
    expect(html).toContain("Phase I is this prototype: built by user alone, on free public sources.");
    expect(html).toContain("is the production version, built with Sidekick:");
    expect(html).not.toMatch(/creators and shows|podcast|Sponsor Radar|Culture|Medium|4th Quarter|73 portfolio/);
    expect(html).not.toMatch(/Courtside/);
  });
});
