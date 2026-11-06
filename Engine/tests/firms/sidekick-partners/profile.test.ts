// Sidekick's profile on the shared Engine (VC Scout Plan step 8): this project runs with "@firm-profile" pointed at
// Sidekick Partners/profile.ts (vitest.config.ts), so classify, score and the memo outline are Sidekick's here.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { firm, NAMES } from "@/firm";
import { classify, notVentureScale, NOT_CONSUMER, DROP_NAME } from "@/lib/thesis";
import { scoreCompany, type ScoreInput } from "@/lib/score";
import { DEFAULT_WEIGHTS } from "@/lib/settings";
import { CAP } from "@/lib/v2";
import { slugify } from "@/lib/format";

describe("Sidekick's profile is the one loaded", () => {
  it("names, standard terms and the cap", () => {
    expect(firm.id).toBe("sidekick-partners");
    expect(firm.product).toBe("Sidekick Partners AI Scout");
    expect(NAMES.peerFunds).toBe("Synergistic Funds");
    expect(NAMES.shortlist).toBe("Shortlist");
    expect(NAMES.filings).toBe("Filings");
    expect(firm.thesis.areas.map((a) => a.label)).toEqual(["Premium Consumer Brands", "Consumer Health", "E-Commerce Software", "Vertical SaaS + Embedded Payments", "Tech-Enabled Roll-Ups + AI Services"]);
    expect(CAP).toBe(30_000_000);
    // Culture's 15 out (Plan section 4); Scout presumes no deck (user, 11-02-26), so Unit Economics' 20 went 5 each to
    // Thesis Fit, Stage and Check, Signal Strength and Team; the parts add up to 100
    expect(DEFAULT_WEIGHTS).toEqual({ thesis: 35, stage: 25, signal: 20, culture: 0, unitEconomics: 0, team: 15, geo: 5 });
    expect(Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });
});

describe("the five industries classify", () => {
  const cases: [string, string][] = [
    ["Booking, payments and an AI receptionist for salons and spas, with embedded payments.", "vertical-saas"],
    ["A Shopify app that lifts average order value with AI upsells and post-purchase offers for DTC brands.", "ecommerce-software"],
    ["A premium hand sanitizer and bodycare brand, now at Target and Sephora.", "consumer-brands"],
    ["At-home blood test kits and clinician-guided GLP-1 weight loss care.", "consumer-health"],
    ["A roll-up of accounting firms and CPA firms running on AI: tech-enabled services.", "roll-ups"],
  ];
  for (const [text, area] of cases) it(`${area}: ${text.slice(0, 40)}…`, () => expect(classify(text).area).toBe(area));

  it("salon software is venture scale for Sidekick, a charity is not", () => {
    expect(notVentureScale("Mangomint: software for salons and spas")).toBe(false);
    expect(notVentureScale("a nonprofit food bank")).toBe(true);
  });
  it("technology-cycle bets are outside; B2B software and fintech are in", () => {
    expect(NOT_CONSUMER.test("a crypto wallet for stablecoin payments")).toBe(true);
    expect(NOT_CONSUMER.test("drug discovery with AI")).toBe(true);
    expect(NOT_CONSUMER.test("B2B SaaS for payroll and accounting firms")).toBe(false);
  });
  it("Form D names: fund vehicles drop, holdings and groups stay as possible roll-ups", () => {
    expect(DROP_NAME.test("Acme Growth Fund LP")).toBe(true);
    expect(DROP_NAME.test("Ledger Holdings")).toBe(false);
    expect(DROP_NAME.test("Summit CPA Group")).toBe(false);
  });
});

describe("scoring reads Sidekick's stage and geography", () => {
  const base: ScoreInput = { name: "Glossa", description: "Booking, payments and an AI receptionist for salons and spas, with embedded payments for every appointment.", thesisArea: null, stage: "seed", amount: 3_000_000, currency: "$", signals: [], voiceMentions: 0, sponsorShows: 0, relatedPersons: 0, yc: false, geoText: "", learned: 0, competes: false, checkRange: firm.thesis.check };
  const w = DEFAULT_WEIGHTS;
  it("Seed and Series A full, Pre-Seed half", () => {
    expect(scoreCompany(base, w).breakdown.stage).toBe(25);
    expect(scoreCompany({ ...base, stage: "series-a" }, w).breakdown.stage).toBe(25);
    expect(scoreCompany({ ...base, stage: "pre-seed" }, w).breakdown.stage).toBe(13); // half of 25, rounded
  });
  it("NYC and Dallas-Fort Worth 5, the rest of the US 4, UK and Israel 3, elsewhere 2", () => {
    const geo = (t: string) => scoreCompany({ ...base, geoText: t }, w).breakdown.geo;
    expect(geo("a New York-based startup")).toBe(5);
    expect(geo("based in Dallas")).toBe(5);
    expect(geo("based in Chicago")).toBe(4);
    expect(geo("a London startup")).toBe(3);
    expect(geo("a Berlin startup")).toBe(2);
  });
  it("a salon-software startup scores in, with no not-venture-scale penalty", () => {
    const s = scoreCompany(base, w);
    expect(s.breakdown.penalties).toBe(0);
    expect(s.breakdown.thesis).toBeGreaterThan(15);
    expect(s.breakdown.culture).toBe(0);
  });
});

describe("the portfolio list page", () => {
  const html = readFileSync("tests/fixtures/sidekick-portfolio-list.html", "utf8");
  const L = firm.portfolio.list!;
  const names = L.names(html);
  it("reads every identified name, joins Lantern Platform and leaves out the 16 unidentified", () => {
    expect(names).toHaveLength(86);
    expect(names).toContain("Lantern Platform");
    expect(names).toContain("Alternative Payments");
    expect(names).not.toContain("Platform");
    expect(names).not.toContain("Vault");
  });
  it("every name on the page has its checked details", () => {
    const known = new Set(L.known.flatMap((k) => [k.name, ...(k.aka || [])].map(slugify)));
    expect(names.filter((n) => !known.has(slugify(n)))).toEqual([]);
  });
  it("a company in one of the five industries maps to it", () => {
    const touchland = L.known.find((k) => k.name === "Touchland")!;
    expect(firm.portfolio.areaOf(touchland.sector, touchland.description)).toBe("consumer-brands");
    const mangomint = L.known.find((k) => k.name === "Mangomint")!;
    expect(firm.portfolio.areaOf(mangomint.sector, mangomint.description)).toBe("vertical-saas");
  });
});

describe("the memo and the buyers", () => {
  // a typical memo's order with the recommendation first, the thesis's screen inside it, and no deck (user, 11-04-26)
  it("the memo reads like a typical investment memo, and needs no deck", () => {
    const md = firm.memo.outline({ name: "Glossa", area: "Vertical SaaS + Embedded Payments", round: "$3M Seed", play: null, description: "Salon software.", descriptionUrl: null, domain: null, founders: "[TBD]", whyFits: "", portfolio: "", fit: 61, found: "11-03-26", investors: "Salt VC (https://example.com/a)", signals: "2 stories from 2 sources, newest 11-03-26 (listed at the end)", buyers: "- Instacart: bought Caper (10-21), about $350M: https://example.com/b" });
    const heads = [...md.matchAll(/^## \d+\. (.+)$/gm)].map((m) => m[1]);
    expect(heads).toEqual(["Recommendation", "The company", "Problem and product", "Market and timing", "Traction", "Business model and path to profit", "The founders", "Competition", "The round", "Why Sidekick", "Exit path", "Risks and how they ease", "Next steps"]);
    expect(md).toContain("Community leverage");
    expect(md).toContain("Thesis fit: 61% in Vertical SaaS + Embedded Payments");
    expect(md).toContain("Backed by: Salt VC (https://example.com/a)");
    expect(md).toContain("- Instacart: bought Caper");
    expect(md).not.toMatch(/\bdeck\b|Why We Invested|Courtside/i);
    // with nothing known, each gap is a placeholder, never a guess
    const bare = firm.memo.outline({ name: "Glossa", area: null, round: "[TBD: round size]", play: null, description: "", descriptionUrl: null, domain: null, founders: "[TBD]", whyFits: "", portfolio: "" });
    expect(bare).toContain("[TBD: who led, and who participated]");
    expect(bare).toContain("Scout has no checked deal for this industry yet");
  });
  // 11-04-26 (user: "ok you can build this"): Likely Acquirers hides itself in an industry with no buyer loaded, and
  // every one of Sidekick's five industries has buyers, so no company page loses the section
  it("every industry has at least one likely buyer with a deal", () => {
    for (const a of firm.thesis.areas) expect(firm.buyers.some((b) => b.areas.includes(a.key) && b.deals.length > 0), a.key).toBe(true);
  });
  it("every comp and venture arm links its source, and buyers name real industries", () => {
    const keys = firm.thesis.areas.map((a) => a.key);
    for (const b of firm.buyers) {
      expect(b.areas.every((a) => keys.includes(a)), b.name).toBe(true);
      for (const d of b.deals) expect(d.url, `${b.name}: ${d.company}`).toMatch(/^https:\/\//);
      if (b.ventureArm) expect(b.ventureArm.proof).toMatch(/^https:\/\//);
    }
    expect(firm.buyers.find((b) => b.name === "Unilever")?.ventureArm?.name).toBe("Unilever Ventures");
  });
  it("every co-investor's shared round links its source, and no fund is on both lists", () => {
    const co = firm.funds.coInvestors;
    expect(co.length).toBeGreaterThan(20);
    for (const f of co) {
      expect(f.shared?.length, f.name).toBeGreaterThan(0);
      for (const r of f.shared!) {
        expect(r.url, `${f.name}: ${r.company}`).toMatch(/^https:\/\//);
        expect(r.date, `${f.name}: ${r.company}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
    const names = new Set(co.map((f) => f.name.toLowerCase()));
    expect(firm.funds.peers.filter((f) => names.has(f.name.toLowerCase())).map((f) => f.name)).toEqual([]);
    expect(firm.funds.peers.every((f) => firm.thesis.areas.some((a) => a.key === f.area))).toBe(true);
  });
});
