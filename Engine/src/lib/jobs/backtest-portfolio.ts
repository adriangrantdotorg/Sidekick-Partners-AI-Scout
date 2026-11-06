// The firm's own deals, backtested (Plan step 13b): every portfolio company's first round the firm joined, proven by
// a reputable page (src/lib/proof.ts), then Scout's earlier signals before it. Courtside's deals came from its "Why We
// Invested" posts; a firm with no posts (Sidekick) had none, so this reads the portfolio instead, for every firm.
// A company with no proven round is remembered as "unproven" with when the firm's own page first listed it, and is
// searched again after 30 days. Each proven round also names the other funds in it: a fund on the firm's lists gets
// that round as a shared one, and a peer fund in it moves to the co-investors (the co-investor watch's rule).
import { eq } from "drizzle-orm";
import { db, schema as S } from "@/db";
import { runBacktest } from "../backtest";
import { findProofs, earliest, fundsInRound, listedBy, type Proof } from "../proof";
import { domainOf, slugify } from "../format";
import { normKey } from "../companies";
import type { Ctx } from "./runner";
import { firm, NAMES } from "@/firm";
import { setSetting } from "../settings";

const RETRY_DAYS = 30;
/** Set when a run has been through every portfolio company: from then on the weekly job keeps the Backtest current. */
export const BACKTESTED = "portfolioBacktestAt";
/** One company's search takes about a minute (most of it Google's 2 s manners). */
const ONE_COMPANY_MS = 90_000;

/** The other funds a proven round names, saved on each fund. */
async function sharedRounds(ctx: Ctx, p: Proof) {
  const funds = await db().select().from(S.funds);
  const named = new Set(fundsInRound(p, funds.map((f) => f.name)));
  for (const f of funds) {
    if (!named.has(f.name)) continue;
    const have = (f.shared || []).some((s) => s.url === p.url || (normKey(s.company) === normKey(p.company) && (s.round || "") === (p.round || "")));
    if (have) continue;
    const shared = [...(f.shared || []), { company: p.company, round: p.round || undefined, date: p.date || undefined, url: p.url }];
    const last = [f.lastSharedDate, p.date].filter(Boolean).sort().at(-1) || null;
    if (f.kind === "synergistic") {
      await db().update(S.funds).set({ kind: "neighborhood", shared, lastSharedDate: last }).where(eq(S.funds.id, f.id));
      await db().insert(S.changeLog).values({ kind: "fund-move", summary: `${f.name} moved to the ${NAMES.coInvestors}: ${p.company}, with ${firm.short}`, target: `fund:${f.id}`, before: { kind: "synergistic" }, after: { kind: "neighborhood", url: p.url } });
      ctx.change(`${f.name} moved to the ${NAMES.coInvestors}: ${p.company}`);
    } else {
      await db().update(S.funds).set({ shared, lastSharedDate: last }).where(eq(S.funds.id, f.id));
      ctx.change(`${f.name}: shared round added, ${p.company}`);
    }
  }
}

/** Remember a company with no proven round, and when the firm's own page first listed it. */
async function unproven(name: string, domain: string | null) {
  const listed = await listedBy(name);
  const evidence = listed
    ? [{ url: listed.url, date: listed.date, kind: "Listed", note: `On ${firm.short}'s portfolio page by this date (the Wayback Machine's first copy that names it)`, title: `${firm.short}'s portfolio page`, counts: false, domain: "web.archive.org" }]
    : [];
  const row = { company: name, domain, announceDate: null, announceUrl: null, announceTitle: null, verdict: "unproven", ownDeal: true, leadDays: null, flaggedOn: null, signal: null, evidence, createdAt: new Date() };
  await db()
    .insert(S.backtests)
    .values({ slug: slugify(name), ...row })
    .onConflictDoUpdate({ target: S.backtests.slug, set: row });
}

export async function portfolioBacktest(ctx: Ctx) {
  const port = await db().select().from(S.portfolio).orderBy(S.portfolio.name);
  const rows = await db().select({ slug: S.backtests.slug, verdict: S.backtests.verdict, at: S.backtests.createdAt, ownDeal: S.backtests.ownDeal }).from(S.backtests);
  const by = new Map(rows.map((r) => [r.slug, r]));
  const stale = (d: Date | null) => !d || Date.now() - d.getTime() > RETRY_DAYS * 86400000;
  const due = port.filter((p) => {
    const r = by.get(slugify(p.name));
    return !r || !r.ownDeal || (r.verdict === "unproven" && stale(r.at));
  });
  await ctx.stage(`${firm.short}'s deals: finding each round`, 0, due.length);
  let all = true;
  for (const p of due) {
    if (ctx.timeLeft() < ONE_COMPANY_MS) {
      ctx.more();
      all = false;
      break;
    }
    const domain = p.site ? domainOf(p.site) : null;
    const t0 = Date.now();
    const proofs = await findProofs({ name: p.name, domain });
    const first = earliest(proofs);
    const t1 = Date.now();
    if (first) {
      const res = await runBacktest({ name: p.name, announceDate: first.date, announceUrl: first.url, announceTitle: first.title, website: domain, proof: first }, () => {}, { ownDeal: true });
      if (res) ctx.change(`Backtest: ${p.name}, ${first.round || "round"} of ${first.date}${res.verdict === "win" ? `, ${res.leadDays} days early` : ""}`);
      for (const pr of proofs) await sharedRounds(ctx, pr);
      ctx.item();
    } else await unproven(p.name, domain);
    // the run's own log (Vercel's function log, or the terminal): which company took how long
    console.log(`[portfolio-backtest] ${p.name}: ${first ? `${first.round || "round"} ${first.date} via ${first.via}` : "unproven"} · proof ${Math.round((t1 - t0) / 1000)} s, backtest ${Math.round((Date.now() - t1) / 1000)} s`);
    ctx.tick();
  }
  if (all) await setSetting(BACKTESTED, new Date().toISOString());
}
