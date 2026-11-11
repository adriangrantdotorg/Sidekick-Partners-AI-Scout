// The startups the team added by hand with checked details (the firm's library.ts, a pick's `details`; user,
// 11-11-26: "add the below companies to the sidekick scout … ensure all their key details are filled out"). Each gets
// its card once, from those details: no funding-story search and no AI Thesis Check, since every detail was checked
// against its source. Runs first in the daily Startup Signals job, so the Scoring job an hour later scores it and the
// Funds Raised, Websites and Pictures job that afternoon adds its logo; the Library Backfill runs it too. A ship does
// all three at once before its build (teamPicksJob below), so the deployed site already shows them.
import { eq } from "drizzle-orm";
import { db, schema as S } from "@/db";
import { knownCompany, upsertCompany } from "../companies";
import { LIBRARY } from "../library";
import { enrichCompanies } from "./enrich";
import { scoreAll } from "./score";
import type { Ctx } from "./runner";

/** Adds each checked pick Scout doesn't have yet: tracked (as the Tracking page's Add does), kept by the startup
 *  filter, and marked screened so the AI never asks about it. A company Scout already has keeps its own row; its page
 *  still shows the facts. Two lookups a pick once it is in, so it costs nothing on later days. */
export async function addTeamPicks(ctx: Ctx): Promise<number[]> {
  const added: number[] = [];
  for (const p of LIBRARY) {
    const d = p.details;
    if (!d || (await knownCompany(p.name, p.domain))) continue;
    const r = await upsertCompany({
      name: p.name,
      domain: p.domain || null,
      thesisArea: d.area,
      stage: d.stage || null,
      description: d.description,
      descriptionUrl: d.descriptionUrl,
      signal: { type: "news", source: d.signal.source, title: d.signal.title, url: d.signal.url, date: new Date(`${d.signal.date}T12:00:00Z`) },
    });
    if (!r) continue;
    const now = new Date();
    await db()
      .update(S.companies)
      .set({
        keep: true,
        thesisCheck: { ok: true, area: d.area, why: `Added by the team; details checked ${d.checked}`, model: "team", at: now.toISOString() },
        ...(r.created ? { tracked: true, trackedAt: now } : {}),
      })
      .where(eq(S.companies.id, r.id));
    ctx.item();
    added.push(r.id);
    if (r.created) ctx.change(`Added by the team: ${p.name}`);
  }
  return added;
}

/** The whole of it at once, for a ship (scripts/team-picks.ts, run by update.sh before the build; user, 11-11-26:
 *  "i want all this stuff that happens tomorrow to happen immediately after ship … i want these companies live asap"):
 *  the card, then its website, logo and pictures, then its score. Only the cards it just added are touched, so a ship
 *  with nothing new costs two lookups a pick. */
export async function teamPicksJob(ctx: Ctx) {
  const ids = await addTeamPicks(ctx);
  if (!ids.length) return;
  await enrichCompanies(ctx, { ids, search: false });
  await scoreAll(ctx, { ids });
}
