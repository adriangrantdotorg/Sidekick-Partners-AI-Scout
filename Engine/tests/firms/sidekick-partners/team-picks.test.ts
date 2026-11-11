// Startups the team added by hand with checked details (user, 11-11-26: "add the below companies to the sidekick
// scout … ensure all their key details are filled out (description, logo, etc). find revenue estimates"): Tip Top
// Proper Cocktails and Kaizntree. Each gets its card from Sidekick's library.ts, tracked, with no AI check, and its page
// lists every fact with the source that states it.
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";
import { firm } from "@/firm";
import { LIBRARY, pickFor, checkedFacts } from "@/lib/library";
import { titleCase } from "@/lib/format";

const added = LIBRARY.filter((p) => p.details);

beforeAll(async () => {
  const d = drizzle(new PGlite(), { schema });
  await migrate(d, { migrationsFolder: "./drizzle" });
  (globalThis as { __scoutTestDb?: unknown }).__scoutTestDb = d;
}, 60_000);

describe("the startups the team added carry checked details", () => {
  it("Tip Top Proper Cocktails and Kaizntree are both there, each with a domain", () => {
    expect(added.map((p) => p.name)).toEqual(expect.arrayContaining(["Tip Top Proper Cocktails", "Kaizntree"]));
    for (const p of added) expect(p.domain, p.name).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/);
  });

  it("each names a real Industry, a short first sentence, a dated story and links that open", () => {
    const areas = firm.thesis.areas.map((a) => a.key);
    for (const p of added) {
      const d = p.details!;
      expect(areas, p.name).toContain(d.area);
      expect(d.checked, p.name).toMatch(/^\d{2}-\d{2}-\d{2}$/);
      // the card's one-line summary is the first sentence's first 12 words: keep it whole
      expect(d.description.split(/(?<=[.!?])\s/)[0].split(/\s+/).length, p.name).toBeLessThanOrEqual(12);
      expect(d.descriptionUrl).toMatch(/^https:\/\//);
      expect(d.signal.url).toMatch(/^https:\/\//);
      expect(d.signal.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (d.logo) expect(d.logo).toMatch(/^https:\/\//);
    }
  });

  it("every fact has a Title Case label, a source with a link, and a real date or none", () => {
    for (const p of added) {
      expect(p.details!.facts.length, p.name).toBeGreaterThan(0);
      for (const f of p.details!.facts) {
        expect(titleCase(f.label), `${p.name}: ${f.label}`).toBe(f.label);
        expect(f.value.trim(), f.label).not.toBe("");
        expect(f.source.trim(), f.label).not.toBe("");
        expect(f.url, f.label).toMatch(/^https:\/\//);
        if (f.date) expect(Number.isNaN(Date.parse(f.date)), f.label).toBe(false);
        // a page Scout shows never says who checked it (repo CLAUDE.md: "Claude-checked" is internal only)
        expect(`${f.label} ${f.value}`).not.toMatch(/claude|hand-checked/i);
      }
    }
  });

  it("Tip Top carries a revenue estimate and names Slrrrp as the Sidekick deal it resembles", () => {
    const facts = checkedFacts({ name: "Tip Top Proper Cocktails", domain: "tiptopcocktails.com" });
    expect(facts.some((f) => /^Revenue, 2025 \(Estimate\)$/.test(f.label))).toBe(true);
    expect(pickFor({ name: "x", domain: "https://www.tiptopcocktails.com/" })?.details?.like).toBe("Slrrrp");
    const slrrrp = firm.portfolio.list?.known.find((k) => k.name === "Slrrrp");
    expect(slrrrp, "Slrrrp must be a portfolio company Scout knows").toBeTruthy();
  });

  it("a company matches its saved startup by domain or by name, and anything else has no facts", () => {
    expect(pickFor({ name: "Something Else", domain: "kaizntree.com" })?.name).toBe("Kaizntree");
    expect(pickFor({ name: "Kaizntree", domain: null })?.name).toBe("Kaizntree");
    expect(checkedFacts({ name: "Rebuy", domain: "rebuyengine.com" })).toEqual([]);
  });
});

describe("the daily Startup Signals job adds them once", () => {
  it("each gets a tracked card with its description and Industry, kept and screened, and a second run adds nothing", async () => {
    const { runJob } = await import("@/lib/jobs/runner");
    const { addTeamPicks } = await import("@/lib/jobs/team-picks");
    const { db, schema: S } = await import("@/db");
    const first = await runJob("team-test", (c) => addTeamPicks(c).then(() => undefined), 30_000);
    expect(first.items).toBe(added.length);
    const rows = await db().select().from(S.companies);
    for (const p of added) {
      const r = rows.find((x) => x.domain === p.domain)!;
      expect(r, p.name).toBeTruthy();
      expect(r.name).toBe(p.name);
      expect(r.description).toBe(p.details!.description);
      expect(r.thesisArea).toBe(p.details!.area);
      expect(r.tracked && r.keep).toBe(true);
      expect(r.thesisCheck?.ok).toBe(true);
    }
    // the team untracks one: a later run never tracks it again
    const tip = rows.find((x) => x.domain === "tiptopcocktails.com")!;
    const { eq } = await import("drizzle-orm");
    await db().update(S.companies).set({ tracked: false }).where(eq(S.companies.id, tip.id));
    const second = await runJob("team-test", (c) => addTeamPicks(c).then(() => undefined), 30_000);
    expect(second.items).toBe(0);
    const [again] = await db().select().from(S.companies).where(eq(S.companies.id, tip.id));
    expect(again.tracked).toBe(false);
    expect((await db().select().from(S.companies)).length).toBe(rows.length);
  });

  it("runs first in Startup Signals and in the Library Backfill, before the AI check", () => {
    expect(readFileSync("src/lib/jobs/collect-signals.ts", "utf8")).toMatch(/= \[\s*\["team", \(c\) => addTeamPicks\(c\)[^\n]*\n\s*\["sec"/);
    expect(readFileSync("src/lib/jobs/library.ts", "utf8")).toMatch(/await addTeamPicks\(ctx\);[^\n]*\n\s*if \(!\(await aiAvailable\(\)\)\)/);
  });
});

describe("the company page shows Key Facts", () => {
  it("lists each fact with a link to its source, and the team's logo wins over a site's tiny icon", () => {
    const page = readFileSync("src/app/company/[id]/page.tsx", "utf8");
    expect(page).toMatch(/aria-label="Key Facts"[\s\S]*<CopyMd \/>\s*<h2 className="x-h2">Key Facts<\/h2>/);
    expect(page).toMatch(/<a href=\{f\.url\}[^>]*>\s*\{f\.source\}\s*<\/a>/);
    expect(readFileSync("src/lib/jobs/enrich.ts", "utf8")).toMatch(/if \(checkedLogo\) media\.logo = checkedLogo/);
  });
});

describe("a ship puts them on the site at once (user, 11-11-26: \"i want these companies live asap\")", () => {
  it("the deploy script adds them before the build, and a failure never stops the deploy", () => {
    const sh = readFileSync("scripts/update.sh", "utf8");
    const add = sh.indexOf("npx tsx scripts/team-picks.ts");
    expect(add).toBeGreaterThan(sh.indexOf("db:migrate"));
    expect(add).toBeLessThan(sh.indexOf("printf '▶ Building"));
    expect(sh).toMatch(/if npx tsx scripts\/team-picks\.ts[^\n]*; then[^\n]*\n\s*else printf[^\n]*; fi/);
  });

  it("the job is on demand, scores only the cards it added, and fills their pictures", async () => {
    const { ON_DEMAND, JOBS } = await import("@/lib/jobs");
    expect("team-picks" in ON_DEMAND).toBe(true);
    expect("team-picks" in JOBS).toBe(false);
    const src = readFileSync("src/lib/jobs/team-picks.ts", "utf8");
    expect(src).toMatch(/enrichCompanies\(ctx, \{ ids, search: false \}\);\s*await scoreAll\(ctx, \{ ids \}\);/);
    expect(readFileSync("src/lib/jobs/score.ts", "utf8")).toMatch(/opts\.ids \? and\(eq\(S\.companies\.hidden, false\), inArray\(S\.companies\.id/);
  });
});
