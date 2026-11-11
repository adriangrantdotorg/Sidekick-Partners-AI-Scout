// npx tsx scripts/team-picks.ts: the startups the team added with checked details (the firm's library.ts, a pick's
// `details`) go onto the site now, with their website, logo, pictures and score, rather than over the next day's jobs
// (user, 11-11-26: "i want all this stuff that happens tomorrow to happen immediately after ship … i want these
// companies live asap with all their items live as well asap"). update.sh runs it before the build, so the deployed
// pages already show them. A pick Scout already has is left alone: with nothing new it makes two lookups a pick.
// Reads the database in .env.local (SCOUT_ENV_FILE for another folder's keys); SCOUT_PGLITE=<copy> runs it on a copy.
import { config } from "dotenv";
config({ path: process.env.SCOUT_ENV_FILE || ".env.local", quiet: true });
const { runNamed } = await import("../src/lib/jobs");
const { saveLocalDb } = await import("../src/db");
const r = await runNamed("team-picks", 180_000);
await saveLocalDb();
console.log(r.changes.length ? r.changes.join("\n") : "Nothing new: every startup the team added is already on the site");
console.log(`team-picks: ${r.status}, ${r.changes.filter((c) => c.startsWith("Added by the team")).length} added, ${r.errors} errors`);
process.exit(r.status === "ok" || r.status === "partial" ? 0 : 1);
