// The backtest of one of the firm's deals, end to end on a test database with every outside source answered by hand
// (Plan step 13b, 11-04-26): the round's page is kept as its proof, never a signal; a Hacker News post counts only
// when it links the company's own site (Sidekick's portfolio run read a 2012 "Banked" post as a 10-year lead).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";
import { transport, resetBackoff } from "@/lib/sources/http";
import type { Proof } from "@/lib/proof";

const realFetch = transport.fetch;
beforeAll(async () => {
  const pg = new PGlite();
  const d = drizzle(pg, { schema });
  await migrate(d, { migrationsFolder: "./drizzle" });
  (globalThis as { __scoutTestDb?: unknown }).__scoutTestDb = d;
  const hn = {
    hits: [
      { title: "Banked", url: "https://banked.example.org/2012", created_at: "2012-03-01T00:00:00Z", objectID: "1", points: 3 },
      { title: "Show HN: Banked, pay by bank at checkout", url: "https://banked.com/launch", created_at: "2021-06-01T00:00:00Z", objectID: "2", points: 40 },
    ],
  };
  transport.fetch = (async (u: string | URL | Request) => {
    const url = String(u);
    if (url.includes("hn.algolia.com")) return new Response(JSON.stringify(hn), { status: 200 });
    if (url.includes("news.google.com")) return new Response("<rss><channel></channel></rss>", { status: 200 });
    if (url.includes("efts.sec.gov")) return new Response(JSON.stringify({ hits: { hits: [] } }), { status: 200 });
    return new Response("", { status: 404 });
  }) as typeof fetch;
  resetBackoff();
}, 120_000);
afterAll(() => {
  transport.fetch = realFetch;
});

describe("a backtest of the firm's deal", () => {
  it("keeps the round's page as its proof and counts only a post that links the company's site", async () => {
    const { runBacktest } = await import("@/lib/backtest");
    const proof: Proof = { company: "Banked", url: "https://techfundingnews.com/banked-20m", date: "2022-02-14", round: "series-a", amount: 20e6, currency: "$", quote: "Banked raised $20M led by Acrew Capital, with Sidekick Partners.", title: "Banked secures $20M", via: "fund-list" };
    const r = (await runBacktest({ name: "Banked", announceDate: "2022-02-14", announceUrl: proof.url, announceTitle: proof.title, website: "banked.com", proof }, () => {}, { ownDeal: true }))!;
    expect(r.verdict).toBe("win");
    expect(r.flaggedOn).toBe("2021-06-01");
    expect(r.leadDays).toBe(258);
    const old = r.evidence.find((e) => e.title === "Banked")!;
    expect(old.counts).toBe(false);
    expect(old.note).toMatch(/doesn't link the company's own site/);
    const p = r.evidence.find((e) => e.kind === "Proof")!;
    expect(p).toMatchObject({ counts: false, url: proof.url, note: proof.quote });
    const { db, schema: S } = await import("@/db");
    const [row] = await db().select().from(S.backtests);
    expect(row).toMatchObject({ company: "Banked", ownDeal: true, announceTitle: "Banked secures $20M", verdict: "win" });
  }, 60_000);
});
