// Alerts, the Monday brief, the weekly upkeep and Refresh Now.
import { and, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { db, schema as S } from "@/db";
import * as F from "../sources/fetchers";
import { fmtMoney, slugify, AREAS } from "../format";
import { cultureOverlaps, sponsorCards, trendCards, recommendable } from "../queries";
import { groupStories } from "../stories";
import { quietCheck } from "./collect-media";
import { stageQuick, stageNews, stageFirmPosts } from "./collect-signals";
import { runBacktest } from "../backtest";
import { portfolioBacktest, BACKTESTED } from "./backtest-portfolio";
import { getSetting } from "../settings";
import type { Ctx } from "./runner";
import { firm, on, type PortfolioCo } from "@/firm";

const DAY = 86400000;

/* ---------- Alerts: each rule checked once a day against everything new ---------- */
export async function alertsJob(ctx: Ctx) {
  const rules = await db().select().from(S.alerts).where(eq(S.alerts.active, true));
  const since = new Date(Date.now() - 2 * DAY);
  await ctx.stage("checking alerts", 0, rules.length);
  const port = (await db().select({ n: S.portfolio.name }).from(S.portfolio)).map((p) => p.n);
  for (const a of rules) {
    const r = a.rule;
    const hits: { title: string; url: string; date: Date | null; source: string }[] = [];
    if (r.event === "mention" && r.subject === "portfolio") {
      const ms = await db().select().from(S.mentions).where(and(eq(S.mentions.kind, "portfolio"), gte(S.mentions.date, since)));
      for (const m of ms) hits.push({ title: `${m.voice} mentioned ${m.entity}: "${(m.quote || "").slice(0, 140)}"`, url: m.url, date: m.date, source: m.voice });
      void port;
    } else if (r.event === "formd") {
      const fs = await db().select().from(S.filings).where(and(isNotNull(S.filings.thesisArea), gte(S.filings.filedAt, since)));
      for (const f of fs) if ((f.amountSold || f.amountOffered || 0) >= (r.minAmount || 0)) hits.push({ title: `${f.issuer} filed a Form ${f.form.replace("/A", "")} for ${fmtMoney(f.amountSold || f.amountOffered, f.currency)}`, url: f.url, date: f.filedAt, source: "SEC EDGAR" });
    } else if (r.event === "overlap") {
      const ov = (await cultureOverlaps(7, 40)).filter((o) => o.voices.length >= 2 && o.kind !== "portfolio");
      for (const o of ov.slice(0, 10)) hits.push({ title: `${o.entity}: mentioned by ${o.voices.slice(0, 4).join(", ")}`, url: o.quotes[0].url, date: o.quotes[0].date ? new Date(o.quotes[0].date) : null, source: "Culture" });
    } else if (r.event === "lead-seed") {
      const items = (await db().execute(sql`select i.title, i.url, i.date, f.name from fund_items i join funds f on f.id = i.fund_id
        where i.kind = 'deal' and i.role = 'lead' and i.round in ('seed','pre-seed') and i.thesis_area in (${sql.join(leadAreas(r.keywords).map((x) => sql`${x}`), sql`, `)}) and i.date > ${since}`)) as unknown as { rows: { title: string; url: string; date: string; name: string }[] };
      for (const i of items.rows) hits.push({ title: i.title, url: i.url, date: new Date(i.date), source: i.name });
    } else if (r.keywords?.length) {
      const kw = r.keywords.map((k) => k.toLowerCase());
      const items = await db().select().from(S.feedItems).where(gte(S.feedItems.createdAt, since)).limit(4000);
      for (const it of items) {
        const t = `${it.title} ${it.text || ""}`.toLowerCase();
        if (r.subject && r.subject !== "any" && !t.includes(r.subject.toLowerCase())) continue;
        if (kw.every((k) => t.includes(k))) hits.push({ title: it.title, url: it.url, date: it.date, source: it.voice || it.source });
      }
    }
    for (const h of hits.slice(0, 25)) {
      const x = await db().insert(S.alertHits).values({ alertId: a.id, title: h.title.slice(0, 400), url: h.url, date: h.date, source: h.source }).onConflictDoNothing().returning({ id: S.alertHits.id });
      if (x.length) ctx.item();
    }
    ctx.tick();
  }
  if (on("slack")) await postSlackHits(ctx);
}

async function postSlackHits(ctx: Ctx) {
  const { slackPost } = await import("../slack");
  const fresh = await db().select().from(S.alertHits).where(gte(S.alertHits.createdAt, new Date(Date.now() - 60 * 60 * 1000))).limit(10);
  if (!fresh.length) return;
  const site = process.env.SITE_URL || "";
  const ok = await slackPost(`Scout alerts: ${fresh.length} new hit${fresh.length > 1 ? "s" : ""}\n` + fresh.map((h) => `• <${h.url}|${h.title}>`).join("\n") + `\n<${site}/alerts|Open Alerts in Scout>`);
  if (ok === false) ctx.error("Slack did not accept the alert post");
}

/* ---------- Monday brief ---------- */
export async function mondayBrief(ctx: Ctx, weekOverride?: string) {
  const now = new Date();
  const week = weekOverride || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7))).toISOString().slice(0, 10);
  await ctx.stage("building the brief", 0, 7);
  const since = new Date(Date.now() - 7 * DAY);
  const down = (await db().execute(sql`select item_id from votes where item_type='company' group by item_id having sum(value) < 0`)) as unknown as { rows: { item_id: string }[] };
  const downIds = down.rows.map((d) => Number(d.item_id));
  let startups = await db()
    .select({ id: S.companies.id, name: S.companies.name, why: S.companies.whyFits, score: S.companies.score, area: S.companies.thesisArea })
    .from(S.companies)
    .where(and(isNotNull(S.companies.thesisArea), eq(S.companies.hidden, false), recommendable(), gte(S.companies.firstSeen, since)))
    .orderBy(desc(S.companies.score))
    .limit(12);
  if (startups.length < 5)
    startups = await db()
      .select({ id: S.companies.id, name: S.companies.name, why: S.companies.whyFits, score: S.companies.score, area: S.companies.thesisArea })
      .from(S.companies)
      .where(and(isNotNull(S.companies.thesisArea), eq(S.companies.hidden, false), recommendable()))
      .orderBy(desc(S.companies.lastSignal))
      .limit(12);
  startups = startups.filter((s) => !downIds.includes(s.id)).sort((a, b) => b.score - a.score).slice(0, 5);
  const sigs = startups.length ? await db().select().from(S.signals).where(inArray(S.signals.companyId, startups.map((s) => s.id))).orderBy(desc(S.signals.date)) : [];
  ctx.tick();
  const trends = (await trendCards(3)).map((t) => ({ slug: t.slug, headline: t.headline, delta: t.delta, isNew: t.isNew, url: t.sources[0]?.url || null }));
  ctx.tick();
  // Sponsor Radar and Culture sections only for a firm with those features (switches: sponsorRadar, culture)
  const sponsors = on("sponsorRadar") ? (await sponsorCards()).filter((s) => s.firstSeen && Date.now() - new Date(s.firstSeen).getTime() < 30 * DAY).slice(0, 5).map((s) => ({ key: s.key, brand: s.brand, stamp: s.stamp, url: s.sightings[0]?.url || null })) : [];
  ctx.tick();
  const culture = on("culture") ? (await cultureOverlaps(7, 3)).map((o) => ({ entity: o.entity, voices: o.voices, url: o.quotes[0]?.url })) : [];
  ctx.tick();
  const fundRows = async (kind: string) =>
    ((await db().execute(sql`select i.title, i.url, i.company, f.name as fund, f.slug from fund_items i join funds f on f.id = i.fund_id where f.kind = ${kind} and i.date > ${since} and i.possible = false order by i.date desc limit 12`)) as unknown as { rows: { title: string; url: string; company: string | null; fund: string; slug: string }[] }).rows;
  // one entry per story: the same funder and amount reported twice is one deal with two sources (V2, 10-26-26)
  const neighborhood = groupStories(await fundRows("neighborhood")).slice(0, 3);
  const synergistic = groupStories(await fundRows("synergistic")).slice(0, 3);
  ctx.tick();
  const [formd] = await db().select().from(S.filings).where(and(isNotNull(S.filings.thesisArea), gte(S.filings.filedAt, since))).orderBy(desc(S.filings.amountSold)).limit(1);
  const data = {
    week,
    startups: startups.map((s) => ({ ...s, sources: sigs.filter((g) => g.companyId === s.id).slice(0, 2).map((g) => ({ title: g.title, url: g.url, source: g.source })) })),
    trends,
    sponsors,
    culture,
    neighborhood,
    synergistic,
    formd: formd ? { id: formd.id, issuer: formd.issuer, amount: fmtMoney(formd.amountSold || formd.amountOffered, formd.currency), url: formd.url, area: formd.thesisArea } : null,
  };
  await db().insert(S.briefs).values({ week, data }).onConflictDoUpdate({ target: S.briefs.week, set: { data, createdAt: new Date() } });
  ctx.item();
  if (!on("slack")) return;
  const { slackPost } = await import("../slack");
  const site = process.env.SITE_URL || "";
  await slackPost(`The Monday brief for ${week} is ready: ${startups.map((s) => s.name).join(", ")}.\n<${site}/brief/${week}|Open the brief>`);
}

/** A portfolio page with names only: each new name joins with the details the firm checked (portfolio.list.known),
 *  else by name alone. A page under 40 names failed to load or changed shape, so nothing changes that week. */
async function portfolioFromList(ctx: Ctx) {
  const L = firm.portfolio.list!;
  const names = await F.portfolioNames();
  if (names.length < 40) return;
  const known = new Map<string, PortfolioCo>();
  for (const k of L.known) for (const n of [k.name, ...(k.aka || [])]) known.set(slugify(n), k);
  const listed = names.map((n) => known.get(slugify(n)) ?? n);
  const slugs = listed.map((x) => slugify(typeof x === "string" ? x : x.name));
  const have = new Set((await db().select({ s: S.portfolio.slug }).from(S.portfolio)).map((p) => p.s));
  const added: string[] = [];
  for (const x of listed) {
    const k = typeof x === "string" ? null : x;
    const name = k ? k.name : (x as string);
    const s = slugify(name);
    if (have.has(s)) continue;
    have.add(s);
    await db().insert(S.portfolio).values({ name, slug: s, sector: k?.sector ?? null, description: k?.description ?? null, descriptionUrl: firm.portfolio.site, site: k?.site ? `https://${k.site}` : null, exitNote: k?.exitNote ?? null }).onConflictDoNothing();
    added.push(name);
  }
  if (added.length > 5) ctx.change(`${added.length} portfolio companies added`);
  else for (const n of added) ctx.change(`New portfolio company: ${n}`);
  const gone = [...have].filter((h) => !slugs.includes(h));
  if (gone.length && gone.length < 10) await db().delete(S.portfolio).where(inArray(S.portfolio.slug, gone));
}

/** A lead-seed alert's areas: the rule's keywords that name an area (Courtside's starter alert: sports, gaming), else every area. */
function leadAreas(keywords: string[] | undefined): string[] {
  const a = (keywords || []).filter((k) => AREAS.includes(k));
  return a.length ? a : [...AREAS];
}

/* ---------- Weekly: portfolio, quiet shows, links, the firm's own posts → backtests ---------- */
export async function weeklyJob(ctx: Ctx) {
  await ctx.stage(`${firm.short} portfolio`, 0, 4);
  const slugs = firm.portfolio.list ? [] : await F.portfolioSlugs();
  if (firm.portfolio.list) await portfolioFromList(ctx);
  else if (slugs.length >= 40) {
    const have = new Set((await db().select({ s: S.portfolio.slug }).from(S.portfolio)).map((p) => p.s));
    for (const s of slugs.filter((x) => !have.has(x)).slice(0, 10)) {
      const d = await F.portfolioDetail(s);
      if (!d) continue;
      await db().insert(S.portfolio).values({ name: d.name, slug: s, sector: d.sector, description: d.description, descriptionUrl: `${firm.portfolio.site}/${s}`, exitNote: d.exitNote }).onConflictDoNothing();
      ctx.change(`New portfolio company: ${d.name}`);
    }
    const gone = [...have].filter((h) => !slugs.includes(h));
    if (gone.length && gone.length < 10) await db().delete(S.portfolio).where(inArray(S.portfolio.slug, gone));
  }
  ctx.tick();
  // the 90-day rule is for the creator feeds' shows (switch: creatorFeeds)
  if (on("creatorFeeds")) {
    await ctx.stage("quiet shows (the 90-day rule)", 1, 4);
    await quietCheck(ctx);
  }
  ctx.tick();
  await ctx.stage("re-checking source links", 2, 4);
  const sigs = await db().select({ id: S.signals.id, url: S.signals.url }).from(S.signals).orderBy(sql`random()`).limit(40);
  for (const s of sigs) {
    if (ctx.outOfTime()) break;
    if (s.url.includes("news.google.com")) continue;
    if (!(await F.linkAlive(s.url))) {
      await db().delete(S.signals).where(eq(S.signals.id, s.id));
      ctx.error(`broken link hidden: ${s.url}`);
    }
  }
  ctx.tick();
  await ctx.stage(`new ${firm.short} posts for the backtest`, 3, 4);
  // the firm's own memo-named posts become backtests (switch: firmPosts)
  const posts = on("firmPosts") ? await db().select().from(S.firmPosts).where(eq(S.firmPosts.kind, "medium")) : [];
  for (const p of posts) {
    const m = p.title.match(new RegExp(`^${firm.memo.title}:\\s*(.+)$`, "i"));
    if (!m || ctx.outOfTime()) continue;
    const slug = slugify(m[1]);
    const [have] = await db().select({ id: S.backtests.id }).from(S.backtests).where(eq(S.backtests.slug, slug)).limit(1);
    if (have) continue;
    const res = await runBacktest({ name: m[1], announceDate: p.date?.toISOString().slice(0, 10) || null, announceUrl: p.url, website: null }, () => {}, { ownDeal: true });
    if (res) {
      await db().update(S.backtests).set({ ownDeal: true, announceTitle: p.title }).where(eq(S.backtests.slug, slug));
      ctx.change(`Backtest added: ${m[1]}`);
    }
  }
  ctx.tick();
  // every portfolio company the backtest hasn't dated yet, with the time left (the Proof Finder, Plan step 13b), once
  // user has started the first full run himself (user, 11-04-26: "I want to be able to trigger that at my own
  // convenience"); until then a deploy never starts it
  if (await getSetting<string | null>(BACKTESTED, null)) await portfolioBacktest(ctx);
}

/* ---------- Refresh Now: the fastest sources, inside one function call ---------- */
export async function refreshNow(ctx: Ctx) {
  await stageQuick(ctx);
  await stageNews(ctx, 3);
  await stageFirmPosts(ctx);
}
