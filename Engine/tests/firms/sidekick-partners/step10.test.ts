// Plan step 10 on Sidekick's profile: Likely Acquirers (with Buyer Already Invested), Deck Screen, Start Here and Copy
// as Markdown. Unit Economics is off since 11-02-26 (Scout presumes no deck); its pure parts stay tested for Phase II. The browser half (every new button pressed) is e2e/step10.spec.ts.
import { describe, it, expect, beforeAll, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";
import { UIProvider } from "@/components/ui";
import { firm, on, FEATURES, INCOMPLETE } from "@/firm";
import { AREAS, titleCase } from "@/lib/format";
import { DEFAULT_WEIGHTS } from "@/lib/settings";
import { scoreCompany } from "@/lib/score";
import { UE_BLOCKS, scoringLines, ueLines, ueNote, ueRows, ueShare, unscoredWhy } from "@/lib/unit-economics";
import { armNamed, dealDate, investedBuyer, likelyAcquirers } from "@/lib/acquirers";
import { deckSteps, fieldOrder, reached, stepDone, DECK_STATUS, MOAT, READ_STEP, type DeckInput } from "@/lib/deck";
import { deckFit, deckPrompt, deckSchema, parseDeck, raiseAmount, toResult, type DeckAnswer } from "@/lib/deck-read";
import { LikelyAcquirersPanel, UnitEconomicsPanel, BuyerInvested } from "@/components/panels";
import { StartHere } from "@/components/StartHere";
import { COPY_TIP } from "@/components/CopyMd";
import { MORE } from "@/components/Shell";

// A whole answer, as the AI would write it for the made-up Cartwise deck
const h = vi.hoisted(() => ({
  answer: {
    company: "Cartwise",
    oneLine: "AI upsell offers for Shopify brands",
    area: "ecommerce-software",
    stage: "Seed",
    raising: "$2.5M",
    screen: {
      stageRaise: { status: "shown", figure: "$2.5M", text: "Seed, raising $2.5M." },
      numbers: { status: "partial", figure: " $1.2M ARR ", text: "$1.2M ARR from 140 merchants." },
      pathToProfit: { status: "claimed", figure: "$3M ARR", text: "Break-even at $3M ARR." },
      founderFit: { status: "shown", figure: "2 Founders", text: "Two ex-agency founders." },
      exitPath: { status: "shown", figure: null, text: "Commerce platforms buy tools like this." },
      missing: { status: "absent", figure: "", text: "Churn and payback." },
    },
    unitEconomics: [
      { key: "grossMargin", value: "71%", number: 71 },
      { key: "arrGrowth", value: "3.1x in 12 months", number: 210 },
      { key: "contributionMargin", value: "52%", number: 52 }, // another industry's line: dropped
    ],
    moat: { strength: "thin", text: "Thin today." },
    vaguestClaim: { quote: "\"Lifts average order value 18%.\"", status: "claimed", why: "Measured how?" },
    hardestQuestion: "How many merchants are on Shopify Plus?",
    redFlags: [
      { flag: "Return on ad spend claimed with no test against a control group", seen: "found" },
      { flag: "Gross margin quoted before trade spend and distributor deductions", seen: "missing" }, // another industry's
    ],
    bottomLine: "Take the meeting only if they share a test against a control group.",
  },
}));

vi.mock("@/lib/ai", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/ai")>();
  const { MockLanguageModelV4 } = await import("ai/test");
  const { simulateReadableStream } = await import("ai");
  const text = JSON.stringify(h.answer);
  const model = () =>
    new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start" as const, id: "t" },
            ...(text.match(/[\s\S]{1,40}/g) || []).map((delta) => ({ type: "text-delta" as const, id: "t", delta })),
            { type: "text-end" as const, id: "t" },
            { type: "finish" as const, finishReason: { unified: "stop" as const, raw: undefined }, usage: { inputTokens: { total: 9, noCache: 9, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 9, text: 9, reasoning: undefined } } },
          ],
        }),
      }),
    });
  return { ...real, aiAvailable: async () => true, screenDeck: (input: DeckInput) => real.screenDeck(input, model()) };
});

const Wrap = UIProvider as unknown as (p: { palette: () => null; sheet: () => null; children?: ReactNode }) => ReactNode;
const render = (tree: ReactNode) => renderToStaticMarkup(createElement(Wrap, { palette: () => null, sheet: () => null }, tree)).replace(/<!-- -->/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
/** Every label a page shows in Title Case: headings, table headers, field names and status chips. */
const labels = (html: string) => [...html.matchAll(/<(h[1-4]|th|dt)\b[^>]*>(.*?)<\/\1>|<span class="(?:x-uen|x-st [^"]*)"[^>]*>(.*?)<\/span>/g)].map((m) => (m[2] ?? m[3]).replace(/<[^>]+>/g, "").trim()).filter(Boolean);

beforeAll(async () => {
  const d = drizzle(new PGlite(), { schema });
  await migrate(d, { migrationsFolder: "./drizzle" });
  (globalThis as { __scoutTestDb?: unknown }).__scoutTestDb = d;
}, 60_000);

describe("the switches", () => {
  it("Sidekick has the step 10 features on, with the data each one reads; Unit Economics and the Deck Screen off", () => {
    for (const k of ["likelyAcquirers", "startHere", "copyMarkdown"] as const) {
      expect(FEATURES[k], k).toBeTruthy();
      expect(on(k), k).toBe(true);
    }
    // "presume that we will not have access to the deck" (11-02-26): the part only a deck's figures could fill is off;
    // the Deck Screen itself is off and marked incomplete (11-03-26: it "lacks the rigorous 'smell test' VCs need"),
    // and its benchmarks with it. Its data stays here (deck.ts, unit-economics.ts) for the day it is finished.
    expect(on("unitEconomics")).toBe(false);
    expect(on("deckScreen")).toBe(false);
    expect(on("deckBenchmarks")).toBe(false);
    expect(INCOMPLETE.deckScreen).toMatch(/smell test/);
    for (const a of AREAS) expect(ueLines(a).length, a).toBeGreaterThan(0);
    for (const a of AREAS) expect(firm.deck!.redFlags[a]?.length, a).toBeGreaterThan(0);
    expect(firm.buyers.length).toBeGreaterThan(0);
  });
  it("the Deck Screen has no way in while it is off: not the footer, the phone menu or ⌘K", () => {
    expect(MORE.find((m) => m.href === "/deck")).toBeUndefined();
  });
});

describe("Unit Economics, off: its lines and helpers kept for Phase II", () => {
  it("each line sits in one of the four blocks, Title Case, keys unique per industry", () => {
    const blocks = new Set(UE_BLOCKS.map(([b]) => b));
    for (const a of AREAS) {
      const ls = ueLines(a);
      expect(new Set(ls.map((l) => l.key)).size, a).toBe(ls.length);
      for (const l of ls) {
        expect(blocks.has(l.block), l.key).toBe(true);
        expect(titleCase(l.label), l.label).toBe(l.label);
      }
    }
  });
  it("every Verified reference links its source, so the label opens its proof (user, 11-02-26: link items to showcase proof)", () => {
    const missing = AREAS.flatMap((a) => ueLines(a).filter((l) => l.status === "verified" && !l.source?.url).map((l) => `${a}: ${l.label}`));
    expect(missing).toEqual([]);
  });
  it("only a verified reference with a bar can score; Consumer Health's public-company references never do", () => {
    for (const a of AREAS) for (const l of scoringLines(a)) expect(l.status).toBe("verified");
    expect(scoringLines("consumer-health")).toEqual([]);
    expect(ueLines("consumer-brands").find((l) => l.key === "grossMargin")!.good).toBeUndefined(); // a rule of thumb
  });
  it("estimates name their signal and never score; the rest read Unknown", () => {
    const rows = ueRows("consumer-brands", { description: "Premium scalp care sold online and at Sephora, with a subscribe option.", headlines: ["Crownwell launches at Sephora and Target"] });
    const by = Object.fromEntries(rows.map((r) => [r.key, r]));
    expect(by.retailReach).toMatchObject({ kind: "est", value: "Its news names Sephora and Target", earns: false });
    expect(by.repeat90).toMatchObject({ kind: "est", value: "Sells by subscription or refill: a weak signal" });
    expect(by.cac).toMatchObject({ kind: "unk", value: "Unknown", note: null });
    // short and actionable (user, 11-02-26: "too verbose and unclear"); the page adds Drop a Deck after it
    expect(ueNote(rows, 0, 20)).toBe("Unit Economics: 0 of 20 until a deck adds numbers.");
    expect(ueNote(ueRows("ecommerce-software", null, h.answer.unitEconomics), 8, 20)).toBe("Unit Economics: 8 of 20, from the deck's numbers.");
  });
  it("the other industries' estimates read the company's own words", () => {
    const est = (a: string, description: string, headlines: string[] = []) => Object.fromEntries(ueRows(a, { description, headlines }).filter((r) => r.kind === "est").map((r) => [r.key, r.value]));
    expect(est("consumer-health", "Menopause care paid for by employers, from $79 a month.")).toEqual({ pricePerMonth: "$79 a month, in its own words", employerChannel: "Its news names employers or health plans" });
    expect(est("vertical-saas", "Booking, payroll and card payments for independent salons and spas.")).toEqual({ paymentsAttached: "Takes payments, in its own words", marketsServed: "Sells to salons and spas" });
    expect(est("roll-ups", "Buys dental billing offices.", ["Brightbench acquires two dental billing firms", "Brightbench raises $6.5M"])).toEqual({ acquisitionPace: "1 acquisition in its news" });
  });
  it("Consumer Health says why it isn't scored; the other industries score", () => {
    const why = "Free benchmarks for private Consumer Health companies are still being fine-tuned; they arrive in Phase II.";
    expect(unscoredWhy("consumer-health")).toBe(why);
    for (const a of AREAS.filter((x) => x !== "consumer-health")) expect(unscoredWhy(a), a).toBeNull();
    expect(ueNote(ueRows("consumer-health", { description: "", headlines: [] }), 0, 20, "consumer-health")).toBe("Unit Economics: not scored for Consumer Health yet.");
  });
  it("a deck's numbers past their verified bar would earn shares; switched off, they never move the score", () => {
    expect(ueShare("ecommerce-software", { grossMargin: 71, arrGrowth: 210 })).toBeCloseTo(2 / 5);
    expect(ueShare("ecommerce-software", { cacPayback: 14, burnMultiple: 1.2 })).toBeCloseTo(1 / 5); // payback too slow, burn fine
    expect(ueShare("consumer-health", { grossMargin: 90 })).toBe(0);
    // on a deck result each figure says whether it clears its bar: a 71% gross margin clears 60%, a 91% NRR misses 98%
    const deck = ueRows("ecommerce-software", null, [{ key: "grossMargin", value: "71%", number: 71 }, { key: "nrr", value: "91%", number: 91 }, { key: "price", value: "$450", number: 450 }]);
    const row = Object.fromEntries(deck.map((r) => [r.key, r]));
    expect(row.grossMargin).toMatchObject({ earns: true, below: false });
    expect(row.nrr).toMatchObject({ earns: false, below: true });
    expect(row.price).toMatchObject({ earns: false, below: false }); // no bar to miss
    const base = { name: "X", description: "A Shopify app for upsells", thesisArea: "ecommerce-software", stage: "seed", amount: 2e6, currency: "$", signals: [], voiceMentions: 0, sponsorShows: 0, relatedPersons: 0, yc: false, geoText: "", learned: 0, competes: false, checkRange: firm.thesis.check };
    expect(scoreCompany({ ...base, ueShare: 1 }, DEFAULT_WEIGHTS).breakdown.unitEconomics).toBe(0);
    expect(scoreCompany({ ...base, ueShare: 1 }, DEFAULT_WEIGHTS).score).toBe(scoreCompany(base, DEFAULT_WEIGHTS).score);
  });
  it("the panel renders every block, every label in Title Case, and its copy button", () => {
    const html = render(createElement(UnitEconomicsPanel, { rows: ueRows("ecommerce-software", null, h.answer.unitEconomics), heading: "From the Deck" }));
    for (const [, label] of UE_BLOCKS) expect(html).toContain(label);
    expect(html).toContain(`aria-label="${COPY_TIP}"`);
    expect(html).toContain("Past Its Reference");
    for (const l of labels(html)) expect(titleCase(l), l).toBe(l);
    expect(render(createElement(UnitEconomicsPanel, { rows: [], heading: "" }))).not.toContain("Unit Economics"); // no lines, no panel
  });
});

describe("Likely Acquirers", () => {
  it("a buyer's venture arm in the funding news: Buyer Already Invested, and that buyer leads", () => {
    const a = likelyAcquirers("consumer-brands", ["Unilever Ventures", "Crownwell launches at Sephora"]);
    expect(a.invested?.name).toBe("Unilever");
    expect(a.buyers[0]).toMatchObject({ name: "Unilever", invested: true });
    expect(a.buyers.filter((b) => b.invested)).toHaveLength(1);
    const html = render(createElement(BuyerInvested, { company: "Crownwell", buyer: a.invested! }));
    expect(html).toContain("Unilever Ventures backed Crownwell, so Unilever leads its likely buyers.");
    expect(html).toContain("held 13.2% of Nutrafol");
  });
  it("arms match as phrases, and without their trailing Group", () => {
    expect(armNamed("PepsiCo Ventures Group", "a seed round led by PepsiCo Ventures")).toBe(true);
    expect(armNamed("Unilever Ventures", "Unilever Venturesome Capital")).toBe(false);
    expect(investedBuyer(["Peterson Ventures, M13"])).toBeNull();
  });
  it("without an arm: buyers with a checked deal, verified first; the rest named once; the industry's notes", () => {
    const a = likelyAcquirers("consumer-brands", []);
    expect(a.invested).toBeNull();
    expect(a.buyers.every((b) => b.deals.length > 0)).toBe(true);
    expect(a.buyers[0].deals.some((d) => d.verified)).toBe(true);
    expect(a.also).toContain("L'Oréal");
    expect(a.notes.map((n) => n.text).join(" ")).toContain("75% of 2025's venture-backed acquisitions");
    expect(likelyAcquirers("consumer-health", []).notes.some((n) => n.text.includes("Rock Health"))).toBe(true);
    expect(likelyAcquirers("ecommerce-software", []).notes.some((n) => n.text.includes("Rock Health"))).toBe(false);
  });
  it("dates are as exact as their source, MM-DD-YY", () => {
    expect([dealDate("2025-05-12"), dealDate("2025-06"), dealDate("2025")]).toEqual(["05-12-25", "06-25", "2025"]);
  });
  it("the panel: Title Case labels, the lead row marked, and an honest empty state", () => {
    const a = likelyAcquirers("consumer-brands", ["Unilever Ventures"]);
    const html = render(createElement(LikelyAcquirersPanel, { area: "consumer-brands", buyers: a.buyers, also: a.also, notes: a.notes }));
    expect(html.indexOf("Unilever")).toBeLessThan(html.indexOf("Church & Dwight"));
    expect(html).toContain("Already Invested");
    for (const l of labels(html)) expect(titleCase(l), l).toBe(l);
    const empty = render(createElement(LikelyAcquirersPanel, { area: "roll-ups", buyers: [], also: [], notes: [] }));
    expect(empty).toContain("No checked deals yet for Tech-Enabled Roll-Ups + AI Services, so Scout names no buyers rather than guess.");
  });
});

// The Deck Screen is off for Sidekick and incomplete (11-03-26): what reads its benchmarks or its route waits, skipped,
// for the day it is finished and turned on; its pure parts (steps, the Status Table words) stay tested.
describe("Deck Screen", () => {
  it("reads in order: Read the Deck, Sidekick's six screen lines, then Moat, Open Questions and Bottom Line", () => {
    expect(deckSteps().map((s) => s.label)).toEqual(["Read the Deck", "Stage and Raise", "The Numbers", "Path to Profit", "Founder–Startup Fit", "Exit Path", "What's Missing", "Moat", "Open Questions", "Bottom Line"]);
    for (const s of deckSteps()) expect(titleCase(s.label), s.label).toBe(s.label);
  });
  it("a step is done once the answer moves past its field", () => {
    const partial = { company: "Cartwise", oneLine: "x", area: "ecommerce-software", stage: "Seed", raising: "$2.5M", screen: { stageRaise: "a", numbers: "b" } };
    const at = reached(partial);
    expect(fieldOrder()[at]).toBe("screen.numbers");
    expect(stepDone(READ_STEP.key, -1, false)).toBe(true);
    expect(stepDone("stageRaise", at, false)).toBe(true);
    expect(stepDone("numbers", at, false)).toBe(false); // still being written
    expect(stepDone("bottomLine", reached(h.answer), false)).toBe(false);
    expect(stepDone("bottomLine", reached(h.answer), true)).toBe(true);
  });
  it.skipIf(!on("deckScreen"))("the question names the firm's stage, check and cap, every industry's lines and flags, and no firm address", () => {
    const p = deckPrompt();
    expect(p).toContain("Sidekick Partners");
    expect(p).toContain("$30M");
    for (const a of AREAS) expect(p).toContain(`  ${a}: `);
    expect(p).toContain("Shopify's 15% fee left out of cost of revenue");
    expect(p).not.toMatch(/@|sidekickpartners\.com/);
    expect(p).toContain("- unitEconomics: only the lines"); // the figures, for the benchmarks on the result
  });
  it.skipIf(!on("deckScreen"))("the answer's shape takes a whole answer; the result keeps only its industry's lines and flags", () => {
    const a = deckSchema().parse(h.answer) as DeckAnswer;
    const r = toResult(a, "Cartwise.pdf · 3 pages");
    expect(r.screen.map((s) => s.key)).toEqual(firm.deck!.screen.map((s) => s.key));
    expect(r.unitEconomics.map((u) => u.key)).toEqual(["grossMargin", "arrGrowth"]); // its industry's lines only
    expect(r.redFlags).toEqual([{ flag: "Return on ad spend claimed with no test against a control group", seen: "found" }]);
    expect(raiseAmount("$2.5M")).toBe(2_500_000);
    const fit = deckFit(r, DEFAULT_WEIGHTS);
    expect(fit).toMatchObject({ ue: 0, outOf: 100 });
    expect(fit.score).toBeGreaterThan(40);
    expect(deckSchema().safeParse({ ...h.answer, area: "sports" }).success).toBe(false);
  });
  // the Status Table (user's pick, round 7's D; "i thought i already selected build the table", 11-02-26)
  it("each check comes back as a status, a key figure and a line, the moat as a strength, the vaguest claim quoted", () => {
    const r = toResult(deckSchema().parse(h.answer) as DeckAnswer, "Cartwise.pdf");
    expect(r.screen.map((s) => s.status)).toEqual(["shown", "partial", "claimed", "shown", "shown", "absent"]);
    expect(r.screen.map((s) => s.figure)).toEqual(["$2.5M", "$1.2M ARR", "$3M ARR", "2 Founders", null, null]); // trimmed; empty is none
    expect(r.moat).toEqual({ strength: "thin", text: "Thin today." });
    expect(r.vaguestClaim).toMatchObject({ status: "claimed" });
    const bad = { ...h.answer, screen: { ...h.answer.screen, numbers: { ...h.answer.screen.numbers, status: "a claim" } } };
    expect(deckSchema().safeParse(bad).success).toBe(false); // only the four words the key defines
    expect(deckSchema().safeParse({ ...h.answer, moat: { strength: "weak", text: "x" } }).success).toBe(false);
    // the question gives the AI the same four definitions the page shows above the table, and the meter's four steps
    const p = deckPrompt();
    for (const v of Object.values(DECK_STATUS)) expect(p).toContain(v.means.replace(/\.$/, "").toLowerCase());
    for (const k of Object.keys(MOAT)) expect(p).toContain(`${k} (`);
    // the sample fills every row
    expect(firm.deck!.sample.screen.every((x) => x.status && x.figure)).toBe(true);
  });
  it("every deck is scored out of 100, Consumer Health too: with Unit Economics off nothing is left out (11-02-26)", () => {
    const ch = { ...firm.deck!.sample, sample: false, company: "Steadfast Health", area: "consumer-health", unitEconomics: [], redFlags: [] };
    const f = deckFit(ch, DEFAULT_WEIGHTS);
    expect(f).toMatchObject({ ue: 0, outOf: 100 });
    expect(f.score).toBeGreaterThan(0);
    expect(f.score).toBeLessThanOrEqual(100);
    expect(deckFit(firm.deck!.sample, DEFAULT_WEIGHTS).outOf).toBe(100);
  });
  it("the sample deck is Cartwise, made up, with every screen line answered", () => {
    const s = firm.deck!.sample;
    expect(s).toMatchObject({ company: "Cartwise", sample: true, area: "ecommerce-software" });
    expect(s.screen.map((x) => x.key)).toEqual(firm.deck!.screen.map((x) => x.key));
    expect(s.screen.every((x) => x.text.length > 10)).toBe(true);
  });
  it("what the browser sends is checked: words or pictures, inside Vercel's request limit", () => {
    expect(parseDeck(null)).toBe("That wasn't a deck Scout could read.");
    expect(parseDeck({ file: "x.pdf", pages: [{ n: 1, text: "" }], images: [] })).toBe("Scout couldn't find any words or pictures in this PDF.");
    expect(parseDeck({ file: "x.pdf", pages: [], images: [{ n: 1, data: "A".repeat(3_900_000) }] })).toBe("The deck's pictures are too large to send.");
    const ok = parseDeck({ file: "x.pdf", pages: [{ n: 1, text: "A".repeat(9000) }], images: [{ n: 2, data: "not base64!" }] });
    expect(typeof ok).toBe("object");
    expect((ok as DeckInput).pages[0].text).toHaveLength(6000);
    expect((ok as DeckInput).images).toEqual([]);
  });
  it.skipIf(!on("deckScreen"))("the read streams each answer's start, then the result with its fit; nothing of the deck is stored", async () => {
    const { db, schema: S } = await import("@/db");
    const { POST } = await import("@/app/api/deck/route");
    const deck: DeckInput = { file: "Cartwise.pdf · 3 pages", pages: [{ n: 1, text: "Cartwise: AI upsell offers for Shopify brands. $1.2M ARR from 140 merchants." }], images: [] };
    const res = await POST(new Request("http://x/api/deck", { method: "POST", body: JSON.stringify(deck) }));
    expect(res.status).toBe(200);
    const lines = (await res.text()).trim().split("\n").map((l) => JSON.parse(l));
    const ats = lines.filter((l) => l.at !== undefined).map((l) => l.at);
    expect(ats.length).toBeGreaterThan(3);
    expect([...ats].sort((x, y) => x - y)).toEqual(ats); // only forward
    const done = lines.at(-1);
    expect(done.done).toMatchObject({ company: "Cartwise", area: "ecommerce-software", file: "Cartwise.pdf · 3 pages" });
    expect(done.fit).toMatchObject({ ue: 0, outOf: 100 }); // Unit Economics off: the deck's figures never score
    expect(done.match).toBeNull();
    // only the day's AI count changed: no table holds the deck
    expect((await db().select().from(S.aiUsage))[0].calls).toBe(1);
    expect(await db().select().from(S.companies)).toEqual([]);
    expect((await db().select().from(S.settings)).map((s) => s.key)).not.toContain(expect.stringMatching(/deck/i));
  });
  it.skipIf(!on("deckScreen"))("a bad deck is refused before any AI call", async () => {
    const { POST } = await import("@/app/api/deck/route");
    const res = await POST(new Request("http://x/api/deck", { method: "POST", body: "{}" }));
    expect(res.status).toBe(400);
  });
});

describe("Start Here", () => {
  it("what Scout is, today's three best picks linked, the IC brief and Dismiss", () => {
    const html = render(createElement(StartHere, { picks: [{ id: 1, name: "Chairside" }, { id: 2, name: "Cartwise" }, { id: 3, name: "Brightbench" }] }));
    expect(html).toContain("ranks startups by how well they fit Sidekick's thesis");
    expect(html).toContain("Today's three best picks:");
    expect(html).toMatch(/Chairside<\/b><\/a>, <a[^>]*><b>Cartwise<\/b><\/a> and <a[^>]*><b>Brightbench/);
    expect(html).toContain('href="/brief"');
    expect(html).toContain(">Dismiss<");
  });
});
