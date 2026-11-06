// A week with no trend hides Trends everywhere (user, 11-04-26: "if there are scenarios where there are no trends,
// then the trend page should be hidden"; again 11-05-26: "if there's nothing to show on this page (Trends) then the page
// should be hidden"): the top bar, the phone tab bar, ⌘K and g t drop it, and an old link lands on Today.
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";

beforeAll(async () => {
  const d = drizzle(new PGlite(), { schema });
  await migrate(d, { migrationsFolder: "./drizzle" });
  (globalThis as { __scoutTestDb?: unknown }).__scoutTestDb = d;
}, 60_000);

describe("Trends with nothing to show is hidden (11-05-26)", () => {
  it("hasTrends answers no with no trend, and yes once one is found", async () => {
    const { hasTrends } = await import("@/lib/queries");
    const { db, schema: S } = await import("@/db");
    expect(await hasTrends()).toBe(false);
    await db().insert(S.trends).values({ slug: "roll-ups", term: "Roll-ups", headline: "Buying service firms and running them on software" });
    expect(await hasTrends()).toBe(true);
    await db().delete(S.trends);
    expect(await hasTrends()).toBe(false);
  });

  it("the layout passes it to the Shell, the Shell drops Trends from every menu, and the page sends visitors to Today", () => {
    expect(readFileSync("src/app/layout.tsx", "utf8")).toMatch(/const trends = await hasTrends\(\);[\s\S]*<Shell[^\n]*trends=\{trends\}/);
    const shell = readFileSync("src/components/Shell.tsx", "utf8");
    expect(shell).toMatch(/nav: trends \? NAV : NAV_NO_TRENDS, all: trends \? ALL_PAGES : ALL_NO_TRENDS/);
    expect(readFileSync("src/app/trends/page.tsx", "utf8")).toMatch(/if \(!trends\.length\) redirect\("\/"\)/);
  });
});
