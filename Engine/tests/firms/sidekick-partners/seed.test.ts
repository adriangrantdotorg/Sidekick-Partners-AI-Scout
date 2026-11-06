// Sidekick's launch seed (Plan step 16, 11-05-26): exported from its live site with `npm run seed:export`, kept in its
// own folder (firm.config.mjs seedPath), so a fresh Sidekick database starts with what the live site has today. Loaded
// here into a throwaway database through the real loader.
import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";
import { seedPath, FIRMS } from "../../../firm.config.mjs";

const FILE = seedPath("sidekick-partners");
// the seed stays in the private repo (user, 11-05-26: the public copy carries none), so these run only where it is
const HERE = existsSync(FILE);
const seed = HERE ? JSON.parse(readFileSync(FILE, "utf8")) : {};

beforeAll(async () => {
  if (!HERE) return;
  const pg = new PGlite();
  const d = drizzle(pg, { schema });
  await migrate(d, { migrationsFolder: "./drizzle" });
  (globalThis as { __scoutTestDb?: unknown }).__scoutTestDb = d;
  const { loadSeed } = await import("@/lib/seed");
  await loadSeed(seed);
}, 120_000);

describe.skipIf(!HERE)("Sidekick's launch seed", () => {
  it("sits in Sidekick's own folder and is Sidekick's", async () => {
    expect(FILE).toContain(`/${FIRMS["sidekick-partners"]}/seed/`);
    const { seedFirmError } = await import("@/lib/seed");
    expect(seedFirmError(seed)).toBeNull();
    expect(seed.source).toContain("sidekick-partners-scout.vercel.app");
  });

  it("its counts match its rows, and it carries what a fresh site needs on day one", () => {
    for (const [k, n] of Object.entries(seed.counts as Record<string, number>)) {
      if (k === "signals") continue; // signals ride inside each company
      expect((seed[k] as unknown[]).length, k).toBe(n);
    }
    expect(seed.portfolio.length).toBeGreaterThanOrEqual(80);
    expect(seed.funds.length).toBeGreaterThanOrEqual(70);
    expect(seed.companies.length).toBeGreaterThanOrEqual(50);
    expect(seed.backtests.length).toBe(seed.portfolio.length);
    expect(seed.filings.length).toBeGreaterThanOrEqual(1);
  });

  it("carries nothing Sidekick has switched off, and no team activity", () => {
    expect(seed.voices).toEqual([]);
    expect(seed.sponsors).toEqual([]);
    expect(seed.mentions).toEqual([]);
    expect(seed.firmPosts ?? seed.courtsidePosts).toEqual([]); // the key's first name in a seed from before 11-05-26
    const text = JSON.stringify(seed);
    for (const k of ["votes", "trackers", "change_log", "notes"]) expect(Object.keys(seed)).not.toContain(k);
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i); // no email address of anyone
  });

  it("loads into the real schema: its portfolio, backtests, funds and the Shortlist", async () => {
    const { db, schema: S } = await import("@/db");
    expect((await db().select().from(S.portfolio)).length).toBe(seed.portfolio.length);
    const bt = await db().select().from(S.backtests);
    expect(bt.length).toBe(seed.backtests.length);
    expect(bt.filter((b) => b.verdict === "win").length).toBe(seed.backtests.filter((b: { verdict: string }) => b.verdict === "win").length);
    expect((await db().select().from(S.funds)).length).toBeGreaterThanOrEqual(seed.funds.length);
    const { companyCards } = await import("@/lib/queries");
    expect((await companyCards("thesis")).length).toBeGreaterThan(0);
  });

  it("keeps the live site's own score weights", async () => {
    const { getSetting } = await import("@/lib/settings");
    const w = (await getSetting("scoreWeights", {})) as Record<string, number>;
    expect(w.thesis).toBe(seed.settings.scoreWeights.thesis);
    expect(w.stage).toBe(seed.settings.scoreWeights.stage);
  });
});
