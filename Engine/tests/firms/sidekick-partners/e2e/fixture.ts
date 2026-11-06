// A small made-up Scout for browser tests on Sidekick's profile before its database exists (Plan step 13): six sample
// startups from the design (Sidekick Partners/design/pages/build.py), AI marked on, and a three-page test deck; since
// 11-03-26 also Sidekick's real fund list with made-up deals, Tracking items and two filings (sampleWorld), so every
// look test reads Co-Investors, Synergistic Funds, Tracking and Filings with rows on them, not empty. Since 11-03-26 also
// four trends and a Monday brief built by Scout's own weekly job, so Engine's browser tests (tests/e2e/, Courtside's
// lessons) read Trends and the IC Meeting with rows on them.
// Writes a local data copy for SCOUT_PGLITE and a PDF; nothing here touches a real database.
// npx tsx tests/firms/sidekick-partners/e2e/fixture.ts [.local-db/sidekick-fixture.tar.gz]
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq, inArray } from "drizzle-orm";
import * as S from "../../../../src/db/schema";
import { CO_INVESTORS, CONSUMER_FUNDS } from "../../../../../Sidekick Partners/funds";
import * as mod from "../../../../../Sidekick Partners/profile";
import type { FirmProfile } from "../../../../src/firm/types";

const profile = ((mod as { default: unknown }).default as { default?: FirmProfile }).default ?? ((mod as { default: FirmProfile }).default);
const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const FIXTURE_DB = ".local-db/sidekick-fixture.tar.gz";
export const FIXTURE_PDF = ".local-db/test-deck.pdf";

const day = (n: number) => new Date(Date.now() - n * 86400000);
const iso = (n: number) => day(n).toISOString().slice(0, 10);
type Co = { name: string; area: string; score: number; desc: string; amount: number; stage: string; investors: string; headline: string; ago: number };
// made up, like the design's sample data; Unilever Ventures backs Crownwell so its page shows Buyer Already Invested
export const COMPANIES: Co[] = [
  { name: "Chairside", area: "vertical-saas", score: 84, desc: "Booking, payroll and card payments for independent salons and spas.", amount: 4.1e6, stage: "seed", investors: "Peterson Ventures", headline: "Chairside raises $4.1M seed for salon booking and payments", ago: 2 },
  { name: "Cartwise", area: "ecommerce-software", score: 78, desc: "AI upsell offers for Shopify brands, priced from $450/month.", amount: 2.4e6, stage: "seed", investors: "M13", headline: "Cartwise raises $2.4M to bring AI upsells to Shopify brands", ago: 3 },
  { name: "Brightbench", area: "roll-ups", score: 74, desc: "Buys dental billing offices and runs them with AI.", amount: 6.5e6, stage: "series-a", investors: "Peterson Ventures", headline: "Brightbench acquires two dental billing firms", ago: 4 },
  { name: "Crownwell", area: "consumer-brands", score: 71, desc: "Premium scalp care sold online and at Sephora, with a subscribe option.", amount: 3.2e6, stage: "seed", investors: "Unilever Ventures", headline: "Crownwell launches at Sephora after a $3.2M seed led by Unilever Ventures", ago: 5 },
  { name: "Steadfast Health", area: "consumer-health", score: 69, desc: "Menopause care paid for by employers, from $79 a month.", amount: 5.2e6, stage: "seed", investors: "Willow Growth", headline: "Steadfast Health signs two employers for its menopause care", ago: 6 },
  { name: "Olea & Oak", area: "consumer-brands", score: 66, desc: "Single-estate olive oil in a refill tin.", amount: 1.5e6, stage: "seed", investors: "angels", headline: "Olea & Oak raises $1.5M for refillable olive oil", ago: 8 },
];

/** A valid three-page PDF with one line of text per page, written by hand (no PDF library on this Mac). */
export function testDeck(): Buffer {
  const pages = ["Cartwise Seed Deck: AI upsell offers for Shopify brands", "Traction: $1.2M ARR from 140 merchants, 71% gross margin, 3.1x growth in 12 months", "Raising $2.5M Seed. Lifts average order value 18%."];
  const objs: string[] = [];
  const kids = pages.map((_, i) => `${4 + i * 2} 0 R`).join(" ");
  objs.push("<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  pages.forEach((t, i) => {
    const stream = `BT /F1 18 Tf 40 700 Td (${t.replace(/[()\\]/g, "\\$&")}) Tj ET`;
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`);
    objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(Buffer.byteLength(out));
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

const src = (n: number, source: string, title: string) => ({ url: `https://news.example.com/${slug(title)}`, date: day(n).toISOString(), title, source });

/** Four made-up trends (Trends draws its sparklines; a deep link needs a fourth card to land on). */
export const TRENDS = [
  {
    slug: "ai-upsells-shopify", term: "AI upsells", headline: "AI upsell offers for Shopify brands", thesisArea: "ecommerce-software", score: 9, weekly: [1, 2, 4, 7],
    why: "Three seed rounds in a month for tools that pick the offer a shopper sees at checkout.",
    sources: [src(2, "news", "Cartwise raises $2.4M for AI upsells"), src(5, "hn", "Show HN: checkout offers that learn"), src(9, "google-trends", "Searches for Shopify upsell app")],
    sourceKinds: ["news", "hn", "google-trends"],
  },
  {
    slug: "salon-software-payments", term: "Salon payments", headline: "Booking and payments for independent salons", thesisArea: "vertical-saas", score: 7, weekly: [2, 3, 3, 5],
    why: "Salon software is adding card payments and payroll, and two roll-ups bought their software vendors.",
    sources: [src(3, "news", "Chairside raises $4.1M seed"), src(8, "formd", "Form D: salon software seed round")],
    sourceKinds: ["news", "formd"],
  },
  {
    slug: "menopause-care-employers", term: "Menopause care", headline: "Menopause care paid for by employers", thesisArea: "consumer-health", score: 5, weekly: [5, 4, 3, 2],
    why: "Fewer new mentions each week after a busy month of employer benefit launches.",
    sources: [src(6, "news", "Steadfast Health signs two employers"), src(12, "google-trends", "Searches for menopause benefits")],
    sourceKinds: ["news", "google-trends"],
  },
  {
    slug: "refill-tins-pantry", term: "Refill tins", headline: "Pantry staples sold in refill tins", thesisArea: "consumer-brands", score: 4, weekly: [1, 1, 2, 3],
    why: "Two pantry brands raised seed rounds this month for refill tins sold online first.",
    sources: [src(8, "news", "Olea & Oak raises $1.5M for refillable olive oil")],
    sourceKinds: ["news"],
  },
];

/** The Monday brief as Scout's weekly job builds it (src/lib/jobs/other.ts), run on this made-up data. */
async function mondayBriefOn(d: ReturnType<typeof drizzle<typeof S>>) {
  (globalThis as { __scoutTestDb?: unknown }).__scoutTestDb = d;
  const { mondayBrief } = await import("../../../../src/lib/jobs/other");
  const ctx = { runId: 0, stage: async () => {}, tick: () => {}, item: () => {}, error: (m: string) => { throw new Error(m); }, timeLeft: () => 1e9, outOfTime: () => false, cursor: async <T,>(f: T) => f, saveCursor: async () => {}, change: () => {}, more: () => {} };
  await mondayBrief(ctx);
  delete (globalThis as { __scoutTestDb?: unknown }).__scoutTestDb;
}

/** Funds, made-up deals, Tracking items and filings: the pages that sat empty in the browser tests until 11-03-26,
 *  when user asked to see them with data and their rows showed labels the look tests had never read. */
async function sampleWorld(d: ReturnType<typeof drizzle<typeof S>>) {
  await d.insert(S.trends).values(TRENDS);
  // the funds as Scout launches with them (Sidekick Partners/funds.ts: names, sites and checked shared deals)
  const ids: Record<string, number> = {};
  for (const [kind, list] of [["neighborhood", CO_INVESTORS], ["synergistic", CONSUMER_FUNDS]] as const)
    for (const f of list) {
      const [row] = await d
        .insert(S.funds)
        .values({ slug: slug(f.name), name: f.name, kind, focus: f.focus, thesisArea: f.area || null, site: f.site || null, note: f.note || null, shared: f.shared || [], lastSharedDate: f.shared?.map((x) => x.date || "").sort().pop() || null })
        .returning({ id: S.funds.id });
      ids[f.name] = row.id;
    }
  // made-up recent deals: only the test startups, each a link to news.example.com (never a real fund's real news)
  const deal = (fund: string, n: number, company: string, round: string, amount: number, area: string, role = "participated") => ({
    fundId: ids[fund], kind: "deal", title: `${company} raises $${amount / 1e6}M ${round} with ${fund}`, url: `https://news.example.com/${slug(company)}-${slug(fund)}`,
    date: day(n), company, round, amount, role, thesisArea: area, source: "Example News",
  });
  await d.insert(S.fundItems).values([
    deal("M13", 2, "Cartwise", "seed", 2.4e6, "ecommerce-software", "lead"),
    deal("Salt VC", 3, "Chairside", "seed", 4.1e6, "vertical-saas", "lead"),
    deal("Salt VC", 9, "Brightbench", "Series A", 6.5e6, "roll-ups"),
    deal("Gaingels", 5, "Olea & Oak", "seed", 1.5e6, "consumer-brands"),
    deal("QED Investors", 7, "Chairside", "seed", 4.1e6, "vertical-saas"),
    deal("Willow Growth Partners", 6, "Steadfast Health", "seed", 5.2e6, "consumer-health", "lead"),
    // the live site's case (11-05-26): the newest story about a startup doesn't name its fund (a possible match), the
    // proven one is a day older and is the one the ticker links to, so the page must land on the row for both
    deal("Female Founders Fund", 1, "Crownwell", "seed", 3.2e6, "consumer-brands"),
    { ...deal("Silas Capital", 0.5, "Crownwell", "seed", 3.2e6, "consumer-brands"), title: "Crownwell raises $3.2M seed for its bath line", possible: true },
    deal("igniteXL Ventures", 8, "Steadfast Health", "seed", 5.2e6, "consumer-health"),
  ]);
  // Tracking: three startups and one trend followed, two made-up founders, the profile's three alerts with hits
  await d.update(S.companies).set({ tracked: true, trackedAt: day(4) }).where(inArray(S.companies.name, ["Cartwise", "Chairside", "Steadfast Health"]));
  await d.update(S.trends).set({ tracked: true }).where(eq(S.trends.slug, "ai-upsells-shopify"));
  const people = await d
    .insert(S.people)
    .values([
      { slug: "maya-okafor", name: "Maya Okafor", role: "Founder and CEO, Cartwise (made up)", site: "https://news.example.com/maya-okafor" },
      { slug: "daniel-reyes", name: "Daniel Reyes", role: "Founder, Chairside (made up)", site: "https://news.example.com/daniel-reyes" },
    ])
    .returning({ id: S.people.id });
  await d.insert(S.personItems).values([
    { personId: people[0].id, kind: "post", title: "What 140 Shopify brands taught us about checkout offers", url: "https://news.example.com/maya-checkout-offers", date: day(1), source: "Example Blog" },
    { personId: people[0].id, kind: "appearance", title: "Maya Okafor on the Commerce Operators podcast", url: "https://news.example.com/maya-podcast", date: day(6), source: "Example Podcast" },
    { personId: people[1].id, kind: "news", title: "Chairside founder on why salons want payroll in the booking app", url: "https://news.example.com/daniel-salons", date: day(3), source: "Example News" },
  ]);
  const alerts = await d.insert(S.alerts).values(profile.alerts.map((a) => ({ title: a.title, rule: a.rule }))).returning({ id: S.alerts.id });
  await d.insert(S.alertHits).values([
    { alertId: alerts[0].id, title: "Chairside files a Form D for $4.1M", url: "https://news.example.com/chairside-form-d", date: day(2), source: "SEC", createdAt: day(2) },
    { alertId: alerts[1].id, title: "Willow Growth Partners leads Steadfast Health's $5.2M seed", url: "https://news.example.com/steadfast-health-willow-growth-partners", date: day(6), source: "Example News", createdAt: day(5) },
    { alertId: alerts[2].id, title: "Cartwise raises $2.4M seed for AI upsells on Shopify", url: "https://news.example.com/cartwise-m13", date: day(2), source: "Example News", createdAt: day(1) },
  ]);
  await d.insert(S.jobRuns).values({ job: "alerts", startedAt: new Date(Date.now() - 3 * 3600000), finishedAt: new Date(Date.now() - 3 * 3600000 + 40000), status: "ok", items: 3 }); // "ok", as runJob writes it (src/lib/jobs/runner.ts): Today's "Updated 3h ago" reads it
  await d.insert(S.filings).values([
    { accession: "0009990001-26-000001", form: "D", issuer: "Chairside, Inc.", industry: "Other Technology", amountSold: 4.1e6, amountOffered: 5e6, firstSale: iso(4), filedAt: day(2), thesisArea: "vertical-saas", confidence: 0.8, url: "https://sec.example.com/chairside-form-d", website: "chairside.example", companyId: null },
    { accession: "0009990001-26-000002", form: "D", issuer: "Ledgerline Holdings LLC", industry: "Other", amountSold: 2.6e6, amountOffered: 8e6, firstSale: iso(9), filedAt: day(7), thesisArea: "roll-ups", confidence: 0.6, url: "https://sec.example.com/ledgerline-form-d", beforePress: true },
    // as long as the live site's longest (11-03-26: ADVOCATE SOUTHWEST AMBULATORY SURGERY CENTER pushed Filings wider
    // than a 1,100-pixel window), with every note: Before any press, an industry group and a first sale
    { accession: "0009990001-26-000003", form: "D", issuer: "SOUTHWEST REGIONAL AMBULATORY SURGERY AND RECOVERY CENTER", industry: "Other Health Care", amountSold: null, amountOffered: 1.89e5, firstSale: iso(30), filedAt: day(1), thesisArea: "consumer-health", confidence: 0.45, url: "https://sec.example.com/southwest-form-d", beforePress: true },
  ]);
  // the Backtest (Plan step 13b): one of the firm's deals dated by a page that names the firm, and two with no such
  // page yet, named under the cards
  await d.insert(S.backtests).values([
    {
      slug: "fieldnote",
      company: "Fieldnote",
      domain: "fieldnote.example",
      announceDate: iso(400),
      announceUrl: "https://news.example.com/fieldnote-seed",
      announceTitle: "Fieldnote Raises $3M Seed for Salon Inventory",
      verdict: "win",
      ownDeal: true,
      leadDays: 61,
      flaggedOn: iso(461),
      signal: "News",
      evidence: [
        { url: "https://news.example.com/fieldnote-launch", date: iso(461), kind: "News", note: "Launch news", title: "Fieldnote launches inventory for salons (Example News)", counts: true, domain: "news.example.com" },
        { url: "https://news.example.com/fieldnote-seed", date: iso(400), kind: "Proof", note: `Fieldnote raised $3 million in seed funding led by Example Ventures, with participation from ${profile.name}.`, title: "Fieldnote Raises $3M Seed for Salon Inventory", counts: false, domain: "news.example.com" },
      ],
    },
    { slug: "tidewell", company: "Tidewell", verdict: "unproven", ownDeal: true, evidence: [{ url: "https://web.archive.org/web/20250425/x", date: iso(500), kind: "Listed", note: "On the portfolio page by this date", title: "Portfolio page", counts: false, domain: "web.archive.org" }] },
    { slug: "brightcap", company: "Brightcap", verdict: "unproven", ownDeal: true, evidence: [] },
  ]);
}

/** `more` adds rows on top (the screen review's copy: review-fixture.ts). */
export async function writeFixture(out = FIXTURE_DB, more?: (d: ReturnType<typeof drizzle<typeof S>>) => Promise<void>) {
  const pg = new PGlite();
  const d = drizzle(pg, { schema: S });
  await migrate(d, { migrationsFolder: "./drizzle" });
  for (const c of COMPANIES) {
    const url = `https://news.example.com/${c.name.toLowerCase().replace(/\W+/g, "-")}`;
    const [row] = await d
      .insert(S.companies)
      .values({
        key: c.name.toLowerCase().replace(/\W+/g, "-"),
        name: c.name,
        // one official site, so a card shows Visit Website (the look's one brass button); .example never resolves
        domain: c.name === "Chairside" ? "chairside.example" : null,
        description: c.desc,
        thesisArea: c.area,
        stage: c.stage,
        amount: c.amount,
        totalRaised: c.amount,
        whyFits: `${c.desc.replace(/\.$/, "")}, inside Sidekick's thesis.`,
        score: c.score,
        breakdown: { thesis: 26, stage: 20, signal: 12, team: 6, geo: 5 },
        firstSeen: day(c.ago + 1),
        lastSignal: day(c.ago),
        rounds: [{ stage: c.stage, amount: c.amount, low: null, currency: "$", date: iso(c.ago), investors: c.investors, sources: [{ name: "Example News", url, amount: c.amount, date: iso(c.ago), title: c.headline }] }],
        enrichedAt: day(0),
      })
      .returning({ id: S.companies.id });
    await d.insert(S.signals).values({ companyId: row.id, type: "news", source: "Example News", title: c.headline, url, date: day(c.ago) });
  }
  await d.insert(S.settings).values({ key: "aiCheck", value: { ok: true, at: new Date().toISOString() } });
  await sampleWorld(d);
  if (more) await more(d);
  await mondayBriefOn(d);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(await (await pg.dumpDataDir("gzip")).arrayBuffer()));
  writeFileSync(FIXTURE_PDF, testDeck());
  await pg.close();
}

if (process.argv[1]?.endsWith("fixture.ts")) await writeFixture(process.argv[2]);
