// Every AI call has a time limit, and a thesis check never runs past the room its job has left: a call that never
// answers would otherwise hold its job until Vercel stops it at 300 s. The model is a stand-in that honors the limit
// the way the AI SDK does.
import { describe, it, expect, beforeAll, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";

const h = vi.hoisted(() => ({ calls: [] as { timeout?: number; prompt?: string }[], stall: false, replies: [] as string[] }));
vi.mock("ai", () => ({
  generateText: async (o: { timeout?: number }) => {
    h.calls.push(o);
    if (h.stall) await new Promise((_, no) => setTimeout(() => no(new Error("The operation timed out.")), o.timeout ?? 3_600_000));
    return { text: h.replies.shift() ?? "YES | gaming | a consumer game studio" };
  },
}));

const topdog = { name: "Topdog", area: "gaming", description: null, headlines: ["Topdog raises $2.5M seed for real-time multiplayer skill games"] };
// a fresh copy of the module each time, so the 12.5 s gap from the last test's call never adds to the next
const fresh = async () => {
  vi.resetModules();
  return import("@/lib/ai");
};

beforeAll(async () => {
  const d = drizzle(new PGlite(), { schema });
  await migrate(d, { migrationsFolder: "./drizzle" });
  (globalThis as { __scoutTestDb?: unknown }).__scoutTestDb = d;
  process.env.AI_GATEWAY_API_KEY ||= "test";
}, 60_000);

describe("AI time limits (10-26-26)", () => {
  it("a normal check answers, under a 30 s limit", async () => {
    h.stall = false;
    const { thesisCheck, TIMEOUTS } = await fresh();
    const r = await thesisCheck(topdog);
    expect(r?.ok).toBe(true);
    expect(h.calls.at(-1)!.timeout).toBeGreaterThan(0);
    expect(h.calls.at(-1)!.timeout).toBeLessThanOrEqual(TIMEOUTS.checkMs);
  });
  it("a stalled check gives up inside the room its job has left, and never retries past it", async () => {
    h.stall = true;
    const { thesisCheck } = await fresh();
    const n = h.calls.length;
    const t0 = Date.now();
    expect(await thesisCheck(topdog, 6_000)).toBeNull();
    expect(Date.now() - t0).toBeLessThan(7_000);
    expect(h.calls.length - n).toBe(1); // the retry would wait the 12.5 s gap: no room for it
    expect(h.calls.at(-1)!.timeout).toBeLessThanOrEqual(6_000);
  });
  it("a check with no room left makes no call at all", async () => {
    const { thesisCheck } = await fresh();
    const n = h.calls.length;
    expect(await thesisCheck(topdog, 2_000)).toBeNull();
    expect(h.calls.length).toBe(n);
  });
  it("memo drafts and the daily AI check carry their limits too", async () => {
    h.stall = false;
    const { draftMemo, checkAi, TIMEOUTS } = await fresh();
    await draftMemo(1, "# Outline");
    expect(h.calls.at(-1)!.timeout).toBeLessThanOrEqual(TIMEOUTS.memoMs);
    expect(h.calls.at(-1)!.timeout).toBeGreaterThan(TIMEOUTS.memoMs - 5_000);
    expect(TIMEOUTS.memoMs).toBeLessThan(300_000); // Vercel stops a function at 300 s: the draft fails cleanly first
    await checkAi();
    expect(h.calls.at(-1)!.timeout).toBe(TIMEOUTS.dailyCheckMs);
  });
});

describe("the launch run checks every card on ship day, once a month (10-26-26)", () => {
  it("goes past the daily cap only in launch mode", async () => {
    h.stall = false;
    const { thesisCheck, CAPS } = await fresh();
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");
    await db().execute(sql`insert into ai_usage (day, calls, checks) values (current_date, 0, ${CAPS.thesisCheckDailyCap}) on conflict (day) do update set checks = ${CAPS.thesisCheckDailyCap}`);
    expect(await thesisCheck(topdog)).toBeNull(); // today's 60 are used
    vi.resetModules(); // a fresh 12.5 s gap
    const again = await import("@/lib/ai");
    expect((await again.thesisCheck(topdog, undefined, true))?.ok).toBe(true);
  });
  it("allows one launch day a calendar month, every round of that day included", async () => {
    const { launchAllowed } = await import("@/lib/jobs/enrich");
    expect(await launchAllowed("2026-10-27")).toBe(true);
    expect(await launchAllowed("2026-10-27")).toBe(true); // the next 270 s round, same day
    expect(await launchAllowed("2026-10-29")).toBe(false); // a second launch day in October
    expect(await launchAllowed("2026-11-03")).toBe(true); // November gets its own
  });
});

describe("a job with work left asks for another round (10-26-26)", () => {
  it("more() marks the run partial and tells pipeline:all to go on", async () => {
    const { runJob } = await import("@/lib/jobs/runner");
    const r = await runJob("test-more", async (c) => c.more());
    expect(r.more).toBe(true);
    expect(r.status).toBe("partial");
    const done = await runJob("test-done", async () => {});
    expect(done.more).toBe(false);
    expect(done.status).toBe("ok");
  });
});


describe("Gaps Become Questions: a draft that breaks the shape is drawn once more (11-04-26)", () => {
  const filler = "Scout found it through its seed announcement and its own site, and it sells to Shopify merchants. ".repeat(3);
  const good = `## 1. Recommendation\nTake the meeting: ${filler}(https://a.example.com)\n\n## 4. Market and timing\nMarket size comes from the first meeting; see the questions below.\n\n## Questions for Founders\n### Market and timing\n1. What market size do you plan for?\n\n## Sources\nhttps://a.example.com`;
  const outline = "## 1. Recommendation\n[TBD]\nWebsite: https://a.example.com";
  it("redraws with what broke, counts the redraw, and keeps the good one", async () => {
    h.stall = false;
    const { draftMemo } = await fresh();
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");
    await db().execute(sql`delete from ai_usage`);
    h.replies = [good.replace("comes from the first meeting; see the questions below", "is TBD"), good];
    const n = h.calls.length;
    const md = await draftMemo(7, outline);
    expect(h.calls.length - n).toBe(2);
    expect(h.calls.at(-1)!.prompt).toMatch(/Your last draft broke these rules[\s\S]*is TBD/);
    expect(md).toContain("Market size comes from the first meeting");
    const r = (await db().execute(sql`select calls from ai_usage where day = current_date`)) as unknown as { rows: { calls: number }[] };
    expect(Number(r.rows[0].calls)).toBe(2); // the redraw counts against the 4 a day, so the month stays under $5
  });
  it("with no draft left today, takes the gap out instead of redrawing", async () => {
    const { draftMemo, CAPS } = await fresh();
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");
    await db().execute(sql`update ai_usage set calls = ${CAPS.memoDailyCap - 1} where day = current_date`);
    h.replies = [good.replace("comes from the first meeting; see the questions below", "is TBD")];
    const n = h.calls.length;
    const md = await draftMemo(8, outline);
    expect(h.calls.length - n).toBe(1);
    expect(md).not.toMatch(/TBD/);
    expect(md).toContain("Take the meeting");
  });
});
