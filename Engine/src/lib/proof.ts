// The Proof Finder (VC Scout Plan step 13b, user 11-04-26): the round a firm joined, proven by a reputable page that
// names the company, the firm and the round. Any reputable page counts: the startup's own release, a wire service, a
// news site (user: "If a reputable source also mentioned the round with the investor and company, that should also
// count"), and investor directories (user, 11-04-26: "these should of course count"). Scout reads no directory by
// itself: Crunchbase, PitchBook, OpenVC and Dealroom answer scripts with 403, and CB Insights' robots.txt asks them
// to stay off its investor pages; a directory link that reaches Scout another way (the fund list, a search) counts. Searches use the firm's name only, never its partners'
// (user: "the firm name almost always is" included). Each source is tried in order and its hit rate is kept for
// Settings › Sources, so the next firm starts from the sources that worked (LEARNINGS.md, 11-04-26).
import { sql } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { firm } from "@/firm";
import * as F from "./sources/fetchers";
import { fetchRaw, fetchJSON } from "./sources/http";
import { articleUrl } from "./sources/gnews";
import { stageOf, moneyOf, normKey } from "./companies";
import { getSetting, setSetting } from "./settings";

import { RUNGS, PROOF_OUTLETS, type Rung } from "./proof-rungs";
export { RUNGS, PROOF_OUTLETS, type Rung };

/** News sites whose own WordPress search answers (each tested 11-04-26): it searches the article text and returns it,
 *  so no extra fetch is needed. FinSMEs, BevNET, NOSH, Axios and GeekWire refuse it (403). */

export type Proof = {
  company: string;
  url: string;
  date: string | null;
  round: string | null;
  amount: number | null;
  currency: string;
  /** The sentence that names the investor, as the page says it. */
  quote: string;
  title: string;
  via: Rung;
  /** The page's text, kept only in memory (other funds named in the same round). */
  text?: string;
};

/** Social posts, job boards and Google's own links are never proof: anyone can post them, and a job ad lists a
 *  portfolio, not a round. Investor directories (Crunchbase, CB Insights, PitchBook …) do count. */
export const NOT_A_SOURCE = /(^|\.)(linkedin|x|twitter|facebook|instagram|reddit|tiktok|youtube|venturecapitalcareers|getro|indeed|glassdoor)\.[a-z]{2,}$|^news\.google\.com$/i;

export function reputable(url: string): boolean {
  try {
    const u = new URL(url);
    return /^https?:$/.test(u.protocol) && !NOT_A_SOURCE.test(u.host.replace(/^www\./, ""));
  } catch {
    return false;
  }
}

const ENT: Record<string, string> = { amp: "&", quot: '"', apos: "'", nbsp: " ", lt: "<", gt: ">", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…" };
export function unescape(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => (e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENT[e.toLowerCase()] ?? m));
}

/** A page's words: no scripts, styles or tags. */
export function pageText(html: string): string {
  return unescape(
    html
      .replace(/<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|section|article)>/gi, ". ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .replace(/(\.\s*){2,}/g, ". ")
    .trim();
}

export function titleOf(html: string): string {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title/i)?.[1];
  const t = og || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
  return unescape(t).replace(/\s+/g, " ").trim();
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** A name on word boundaries. One-word or short names must match their capitals ("Lantern", not "lantern"), or be
 *  all capitals as a release's headline writes them ("MANGOMINT RAISES"). */
export function namesIn(text: string, name: string): boolean {
  const n = name.trim();
  const re = (x: string, f: string) => new RegExp(`(^|[^\\w])${esc(x)}(?=[^\\w]|$)`, f).test(text);
  if (n.includes(" ") && n.length > 8) return re(n, "i");
  return re(n, "") || re(n.toUpperCase(), "");
}

/** The names the press uses for a company: "Lantern Platform" is "Lantern" at TechCrunch. */
export function companyNames(name: string): string[] {
  const short = name.replace(/\s+(Platform|Inc\.?|Labs|Technologies|Technology|Co\.?|HQ|App|Group|Holdings|Brands)$/i, "").trim();
  return short && short !== name && short.length >= 4 ? [name, short] : [name];
}
const namesAny = (text: string, names: string[]) => names.some((n) => namesIn(text, n));

const ROUND_WORDS = /\b(rais(e|es|ed|ing)|funding|round|seed|series [a-e]|investments?|invest(s|ed|ors?)?|capital|backed|backing|led by|participat(ion|ed|ing)|financing|stake)\b/i;

/** The sentence that puts the investor in the company's round, or null. The sentence has a round word and names the
 *  investor, the company or both; whichever it leaves out is the page's headline subject (a release says "the company"
 *  after its title; a directory's page on the firm lists its deals as rows: "2/24/2023 Series A Rebuy $17M"). */
export function roundSentence(text: string, title: string, company: string, investors: string[]): string | null {
  const cos = companyNames(company);
  if (!namesAny(`${title} ${text}`, cos)) return null;
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z“"$0-9])/);
  const investorTitle = investors.some((n) => namesIn(title, n));
  const companyTitle = namesAny(title, cos);
  for (const s of sentences) {
    if (s.length > 900 || !ROUND_WORDS.test(s)) continue;
    const inv = investors.some((n) => namesIn(s, n));
    const co = namesAny(s, cos);
    if ((inv && (co || companyTitle)) || (co && investorTitle)) return s.trim().slice(0, 400);
  }
  return null;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH = "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
function ymd(mon: string, d: string, y: string): string | null {
  const m = MONTHS.indexOf(mon.slice(0, 3).toLowerCase());
  return m < 0 ? null : `${y}-${String(m + 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** When the page was published: its own date tags, then "Published: <date>", then a release's dateline
 *  ("MINNEAPOLIS, Minnesota, Dec. 15, 2021 /PR Newswire/ --"), then a /YYYY/MM/DD/ address. A page whose many dates
 *  belong to its menus (Rebuy's newsroom lists three other posts) is read in that order for that reason. */
export function dateOf(html: string, url: string): string | null {
  const iso = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null);
  const meta =
    iso(html.match(/<meta[^>]+(?:property|name|itemprop)=["'](?:article:published_time|og:published_time|datePublished|date|pubdate|publish-date)["'][^>]+content=["']([^"']+)/i)?.[1]) ||
    iso(html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["'](?:article:published_time|datePublished)["']/i)?.[1]) ||
    iso(html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1]) ||
    iso(html.match(/<time[^>]+datetime=["']([^"']+)/i)?.[1]);
  if (meta) return meta;
  const text = pageText(html);
  const pub = text.match(new RegExp(`\\bPublished:?\\s+${MONTH}\\.?\\s+(\\d{1,2}),?\\s+(20\\d\\d)`, "i"));
  if (pub) return ymd(pub[1], pub[2], pub[3]);
  const line = text.match(new RegExp(`[A-Z][A-Za-z.]+(?:,\\s*[A-Z][A-Za-z. ]+)?,\\s+${MONTH}\\.?\\s+(\\d{1,2}),?\\s+(20\\d\\d)\\s*(?:\\/[^/]{2,30}\\/)?\\s*[-–—]`));
  if (line) return ymd(line[1], line[2], line[3]);
  const u = url.match(/\/(20\d\d)\/(\d\d)\/(\d\d)\//);
  return u ? `${u[1]}-${u[2]}-${u[3]}` : null;
}

/** The firm's names as they appear in a round's report. */
export function firmNames(): string[] {
  return [firm.name, ...(firm.aliases || [])];
}

/** A page → a proof that the firm was in the company's round, or null. */
export function proofFrom(html: string, url: string, o: { company: string; via: Rung; title?: string; date?: string | null; text?: string }): Proof | null {
  if (!reputable(url)) return null;
  const text = o.text ?? pageText(html);
  const title = o.title || titleOf(html);
  const quote = roundSentence(text, title, o.company, firmNames());
  if (!quote) return null;
  const st = stageOf(quote);
  const round = st !== "unknown" ? st : stageOf(title) !== "unknown" ? stageOf(title) : null;
  const money = moneyOf(quote) || moneyOf(title);
  return { company: o.company, url, date: o.date || dateOf(html, url), round, amount: money?.amount ?? null, currency: money?.currency || "$", quote, title, via: o.via, text };
}

const hostOf = (u: string) => {
  try {
    return new URL(u).host.replace(/^www\./, "");
  } catch {
    return u;
  }
};

/** One proof per page, and no teasers. A page's own words win over the Claude-checked note for the same address. The
 *  same sentence on several pages of one site is a teaser in a menu or a list (Rebuy's newsroom shows its seed news on
 *  every post, so a Shopify post of 11-08-21 read as the seed, 11-04-26): only the page whose headline is about the
 *  round is kept, or none when no headline says which. */
export function tidy(ps: Proof[]): Proof[] {
  const byUrl = new Map<string, Proof>();
  for (const p of ps) {
    const had = byUrl.get(p.url);
    if (!had) byUrl.set(p.url, p);
    else if (had.via === "fund-list" && p.via !== "fund-list") byUrl.set(p.url, { ...p, date: p.date || had.date, round: p.round || had.round });
  }
  const groups = new Map<string, Proof[]>();
  for (const p of byUrl.values()) {
    const k = p.via === "fund-list" ? p.url : `${hostOf(p.url)}|${p.quote}`;
    groups.set(k, [...(groups.get(k) || []), p]);
  }
  const out: Proof[] = [];
  for (const g of groups.values()) {
    if (g.length === 1 || new Set(g.map((p) => p.title)).size === 1) out.push(g[0]);
    else out.push(...g.filter((p) => ROUND_WORDS.test(p.title)));
  }
  return out;
}

/** The firm's first proven round: the earliest dated proof. */
export function earliest(proofs: Proof[]): Proof | null {
  return proofs.filter((p) => p.date).sort((a, b) => (a.date! < b.date! ? -1 : 1))[0] || null;
}

async function page(url: string): Promise<string | null> {
  const r = await fetchRaw(url, { timeoutMs: 12_000, accept: "text/html" });
  return r.ok && r.text ? r.text.slice(0, 1_500_000) : null;
}

/** A press or funding page by its address. */
const PRESS_PATH = /(?<![a-z])(rais(e|es|ed|ing)|funding|financing|series-?[a-e](?![a-z])|seed|investment|invest|backed|press|news-?room|announc)/;
const FUNDING_PATH = /(?<![a-z])(rais(e|es|ed|ing)|funding|financing|series-?[a-e](?![a-z])|seed|investment|backed)/;

/** The startup's own pages whose address reads like a release, funding pages first. */
export function pressPages(urls: string[]): string[] {
  const path = (u: string) => {
    try {
      return new URL(u).pathname.toLowerCase();
    } catch {
      return "";
    }
  };
  const hits = urls.filter((u) => PRESS_PATH.test(path(u)));
  return [...hits.filter((u) => FUNDING_PATH.test(path(u))), ...hits.filter((u) => !FUNDING_PATH.test(path(u)))];
}

async function sitemapUrls(domain: string): Promise<string[]> {
  const hosts = domain.startsWith("www.") ? [domain] : [domain, `www.${domain}`];
  for (const h of hosts) {
    const robots = await fetchRaw(`https://${h}/robots.txt`, { timeoutMs: 8000 });
    const maps = robots.ok ? [...robots.text.matchAll(/^sitemap:\s*(\S+)/gim)].map((m) => m[1]) : [];
    const queue = maps.length ? maps : [`https://${h}/sitemap.xml`];
    const seen = new Set<string>();
    const pages: string[] = [];
    while (queue.length && seen.size < 10 && pages.length < 6000) {
      const m = queue.shift()!;
      if (seen.has(m)) continue;
      seen.add(m);
      const r = await fetchRaw(m, { timeoutMs: 10_000 });
      if (!r.ok) continue;
      for (const [, loc] of r.text.matchAll(/<loc>\s*([^<\s]+)/g)) (/\.xml(\.gz)?$/i.test(loc) ? queue : pages).push(unescape(loc));
    }
    if (pages.length) return pages;
  }
  return [];
}

type Co = { name: string; domain?: string | null };

/** Rounds checked by hand: each fund's shared rounds in the firm's profile and, once the watch has moved one, the
 *  database's. Each page is read again for its own sentence; a page a script can't read (a 403) keeps the Claude check,
 *  with no quote, so the card never shows words the page didn't write. */
async function fundList(c: Co): Promise<Proof[]> {
  const key = normKey(c.name);
  const rows: { name: string; shared: { company: string; round?: string; date?: string; url?: string }[] }[] = [...firm.funds.coInvestors, ...firm.funds.peers].map((f) => ({ name: f.name, shared: f.shared || [] }));
  if (hasDb()) {
    try {
      const r = (await db().execute(sql`select name, shared from funds`)) as unknown as { rows: typeof rows };
      rows.push(...r.rows);
    } catch {
      /* the profile's list is enough */
    }
  }
  const out = new Map<string, Proof>();
  for (const f of rows)
    for (const s of f.shared || []) {
      if (normKey(s.company) !== key || !s.url || out.has(s.url)) continue;
      out.set(s.url, { company: c.name, url: s.url, date: s.date || null, round: s.round || null, amount: s.round ? moneyOf(s.round)?.amount ?? null : null, currency: "$", quote: "", title: `${c.name}: ${s.round || "round"}`, via: "fund-list" });
    }
  for (const [url, p] of out) {
    const html = await page(url);
    const read = html && proofFrom(html, url, { company: c.name, via: "fund-list", date: p.date });
    if (read) out.set(url, { ...read, round: p.round || read.round, amount: p.amount ?? read.amount });
  }
  return [...out.values()];
}

async function ownSite(c: Co, seen: Set<string>): Promise<Proof[]> {
  if (!c.domain) return [];
  const out: Proof[] = [];
  for (const u of pressPages(await sitemapUrls(c.domain)).slice(0, 8)) {
    if (seen.has(u)) continue;
    seen.add(u);
    const html = await page(u);
    const p = html && proofFrom(html, u, { company: c.name, via: "own-site" });
    if (p) out.push(p);
  }
  return out;
}

async function fromNews(c: Co, q: string, via: Rung, seen: Set<string>, max: number, keep: (title: string) => boolean = () => true): Promise<Proof[]> {
  const out: Proof[] = [];
  const items = (await F.googleNews(q, "3650d")).filter((n) => keep(n.title)).slice(0, max);
  for (const n of items) {
    const u = await articleUrl(n.url);
    if (!u || seen.has(u) || !reputable(u)) continue;
    seen.add(u);
    const html = await page(u);
    const p = html && proofFrom(html, u, { company: c.name, via, date: n.date ? n.date.slice(0, 10) : null });
    if (p) out.push(p);
  }
  return out;
}

async function outlets(c: Co, seen: Set<string>): Promise<Proof[]> {
  const out: Proof[] = [];
  const hosts = [...PROOF_OUTLETS, ...(firm.sources.proofOutlets || [])];
  for (const h of hosts) {
    const posts = await fetchJSON<{ date: string; link: string; title: { rendered: string }; content: { rendered: string } }[]>(
      `https://${h}/wp-json/wp/v2/posts?search=${encodeURIComponent(`${companyNames(c.name).at(-1)} ${firm.name}`)}&per_page=5&_fields=date,link,title,content`,
      { timeoutMs: 12_000 },
    );
    for (const p of Array.isArray(posts) ? posts : []) {
      if (!p?.link || seen.has(p.link)) continue;
      seen.add(p.link);
      const html = p.content?.rendered || "";
      const pr = proofFrom(html, p.link, { company: c.name, via: "outlet-search", title: unescape(p.title?.rendered || ""), date: p.date ? p.date.slice(0, 10) : null });
      if (pr) out.push(pr);
    }
  }
  return out;
}

type Stats = Partial<Record<Rung, { tried: number; found: number }>>;

/** Every proof Scout can find that the firm was in the company's rounds, each source in turn. The costly one (every
 *  funding story opened) runs only when nothing cheaper found a round. Each source's hit rate is kept. */
export async function findProofs(c: Co, o: { budgetMs?: number; onRung?: (rung: Rung, ms: number, found: number) => void } = {}): Promise<Proof[]> {
  const seen = new Set<string>();
  // one company never holds a run: past its budget the remaining sources wait for the next search (30 days)
  const deadline = Date.now() + (o.budgetMs ?? 75_000);
  // the short name the press uses ("Lantern"): the firm's name in the query keeps it precise
  const name = companyNames(c.name).at(-1)!;
  const firmQ = `"${name}" "${firm.name}"`;
  const fundingQ = `"${c.name}" (raises OR raised OR funding OR seed OR "pre-seed" OR "Series A" OR investment OR investors)`;
  const plan: [Rung, () => Promise<Proof[]>][] = [
    ["fund-list", () => fundList(c)],
    ["own-site", () => ownSite(c, seen)],
    ["news-firm", () => fromNews(c, firmQ, "news-firm", seen, 6)],
    ["outlet-search", () => outlets(c, seen)],
    ["news-funding", () => fromNews(c, fundingQ, "news-funding", seen, 8, (t) => namesAny(t, companyNames(c.name)) && ROUND_WORDS.test(t))],
  ];
  const out: Proof[] = [];
  const stats: Stats = hasDb() ? (await getSetting<Stats>("proofStats", {})) || {} : {};
  for (const [rung, run] of plan) {
    if ((rung === "news-funding" && out.length) || Date.now() > deadline) break;
    const t0 = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const found = await Promise.race([run().catch(() => [] as Proof[]), new Promise<Proof[]>((r) => (timer = setTimeout(() => r([]), Math.max(1000, deadline - Date.now()))))]);
    clearTimeout(timer);
    o.onRung?.(rung, Date.now() - t0, found.length);
    out.push(...found);
    const s = stats[rung] || { tried: 0, found: 0 };
    stats[rung] = { tried: s.tried + 1, found: s.found + (found.length ? 1 : 0) };
  }
  if (hasDb()) await setSetting("proofStats", stats).catch(() => {});
  return tidy(out);
}

/** The other funds a proof's page puts in the same round (case-sensitive names, so "LEAD" never matches "lead"). */
export function fundsInRound(p: Proof, funds: string[]): string[] {
  if (!p.text) return [];
  return funds.filter((f) => !!roundSentence(p.text!, p.title, p.company, [f.replace(/\s*\(.*?\)\s*/g, "").trim()]));
}

const archived = new Map<string, string>();
/** When the firm's own portfolio page first listed the company, from the Wayback Machine: a bound shown when no round
 *  can be proven ("on Sidekick's portfolio page by 04-25-25"), never a round's date. */
export async function listedBy(company: string): Promise<{ date: string; url: string } | null> {
  const site = firm.portfolio.site;
  const caps = await fetchJSON<string[][]>(`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(site)}&output=json&fl=timestamp&filter=statuscode:200&collapse=digest&limit=40`, { source: "wayback" });
  for (const [ts] of (caps || []).slice(1)) {
    if (!archived.has(ts)) archived.set(ts, (await fetchRaw(`https://web.archive.org/web/${ts}id_/${site}`, { timeoutMs: 20_000 })).text || "");
    if (namesIn(pageText(archived.get(ts)!), company)) return { date: `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`, url: `https://web.archive.org/web/${ts}/${site}` };
  }
  return null;
}
