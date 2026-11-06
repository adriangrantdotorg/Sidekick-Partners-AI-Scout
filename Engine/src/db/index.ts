import { createRequire } from "node:module";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { firm, possessive } from "@/firm";

export type DB = NeonHttpDatabase<typeof schema>;

let cached: DB | null = null;
let local: { dumpDataDir: (c: "gzip") => Promise<Blob> } | null = null;

// Tests set globalThis.__scoutTestDb to a PGlite drizzle instance with the same schema.
// SCOUT_PGLITE=<file> runs the app on a local copy of the data (npx tsx scripts/local-db.ts makes it), so a change
// can be built and checked before the shared database is migrated. Never on Vercel.
export function db(): DB {
  const g = globalThis as { __scoutTestDb?: unknown };
  if (g.__scoutTestDb) return g.__scoutTestDb as DB;
  // one local copy for the whole server: the build gives each route its own copy of this module, so a copy held here
  // alone let a save in /api/settings vanish from the Settings page (11-03-26); globalThis is shared by all of them
  const shared = globalThis as { __scoutLocalDb?: { db: DB; pg: typeof local } };
  if (!cached && shared.__scoutLocalDb) ({ db: cached, pg: local } = shared.__scoutLocalDb);
  if (!cached && process.env.SCOUT_PGLITE && !process.env.VERCEL) {
    const req = createRequire(import.meta.url);
    const { PGlite } = req("@electric-sql/pglite");
    const { drizzle: pgliteDrizzle } = req("drizzle-orm/pglite");
    const { readFileSync } = req("node:fs");
    local = new PGlite({ loadDataDir: new Blob([readFileSync(process.env.SCOUT_PGLITE)]) });
    cached = pgliteDrizzle(local, { schema }) as unknown as DB;
    shared.__scoutLocalDb = { db: cached, pg: local };
  }
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    // a firm whose live site still deploys from another folder: its real database is that folder's, never this one's
    if (firm.liveElsewhere && !process.env.VERCEL)
      throw new Error(`${possessive(firm.name)} live database belongs to ${firm.liveElsewhere}, never to VC Scout. Use a local copy here: SCOUT_PGLITE=.local-db/scout.tar.gz`);
    cached = drizzle(neon(url), { schema });
  }
  return cached;
}

/** Write the local copy back to its file (jobs run on SCOUT_PGLITE keep what they found). */
export async function saveLocalDb() {
  if (!local || !process.env.SCOUT_PGLITE) return;
  const { writeFileSync } = await import("node:fs");
  writeFileSync(process.env.SCOUT_PGLITE, Buffer.from(await (await local.dumpDataDir("gzip")).arrayBuffer()));
}

export function hasDb(): boolean {
  const g = globalThis as { __scoutTestDb?: unknown };
  return !!g.__scoutTestDb || !!process.env.DATABASE_URL || !!process.env.SCOUT_PGLITE;
}

export { schema };
