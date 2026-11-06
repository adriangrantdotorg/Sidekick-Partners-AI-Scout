// The launch seed carries V2's company fields, so a fresh launch looks like V2 on day one (10-27-26).
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";

const V2_FIELDS = ["rounds", "totalRaised", "media", "notStartup", "keep", "thesisCheck", "enrichedAt"];

beforeAll(async () => {
  const d = drizzle(new PGlite(), { schema });
  await migrate(d, { migrationsFolder: "./drizzle" });
  (globalThis as { __scoutTestDb?: unknown }).__scoutTestDb = d;
}, 60_000);

describe("the launch seed and V2", () => {
  it("loads Funds Raised, the picture, the filter's verdict, a restore and the AI check", async () => {
    const { loadSeed } = await import("@/lib/seed");
    const { db, schema: S } = await import("@/db");
    const rounds = [{ amount: 2_500_000, low: null, stage: "seed", date: "2026-05-01", investors: null, sources: [] }];
    const media = { kind: "image", src: "https://example.com/topdog.png" };
    const thesisCheck = { ok: true, area: "gaming", why: "a consumer game studio", model: "openai/gpt-5-mini", at: "2026-10-27T12:00:00Z" };
    const { firm } = await import("@/firm");
    await loadSeed({
      name: `${firm.product} launch seed`,
      companies: [{ key: "topdog", name: "Topdog", thesisArea: "gaming", stage: "seed", score: 61, rounds, totalRaised: 4_100_000, media, notStartup: null, keep: true, thesisCheck, enrichedAt: "2026-10-27T12:00:00Z", signals: [] }],
    } as never);
    const [c] = await db().select().from(S.companies);
    expect(c.rounds).toEqual(rounds);
    expect(c.totalRaised).toBe(4_100_000);
    expect(c.media).toEqual(media);
    expect(c.keep).toBe(true);
    expect(c.thesisCheck).toEqual(thesisCheck);
    expect(c.enrichedAt).not.toBeNull();
  });
  it("stores the seed's thesisQueries (the 10-29-26 seed bug read only laneQueries)", async () => {
    const { loadSeed } = await import("@/lib/seed");
    const { db, schema: S } = await import("@/db");
    const { eq } = await import("drizzle-orm");
    const queries = { sports: ["sports startup raises seed round"] };
    const { firm } = await import("@/firm");
    await loadSeed({ name: `${firm.product} launch seed`, companies: [], settings: { thesisQueries: queries } } as never);
    const [row] = await db().select().from(S.settings).where(eq(S.settings.key, "thesisQueries"));
    expect(row?.value).toEqual(queries);
  });
  it("refuses another firm's seed, so Courtside's data never fills Sidekick's database (Plan step 8)", async () => {
    const { loadSeed, seedFirmError } = await import("@/lib/seed");
    const { firm } = await import("@/firm");
    expect(seedFirmError({ name: `${firm.product} launch seed` })).toBeNull();
    expect(seedFirmError({ name: "Another Firm Scout launch seed" })).toMatch(/only loads its own seed/);
    expect(seedFirmError({})).toMatch(/unnamed/);
    await expect(loadSeed({ name: "Another Firm Scout launch seed", companies: [] } as never)).rejects.toThrow(/only loads its own seed/);
  });
  it("the export writes every one of those fields", () => {
    const src = readFileSync("scripts/export-seed.ts", "utf8");
    for (const f of V2_FIELDS) expect(src).toMatch(new RegExp(`\\b${f}: c\\.${f}\\b`));
  });
});
