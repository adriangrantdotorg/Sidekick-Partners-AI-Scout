// The Co-Investors feed as a timeline (user, 11-03-26: "The purpose of this section is to showcase recent deals done by
// firms they've co-invested with. This needs to look more like a news feed, sorted with the most recent at the top", then
// round 1's C, Timeline: "use that version"). One entry per deal, newest first, under its month (This Week first): the
// deals the co-investor watch found in the news, and the checked rounds the co-investors shared with the firm. Pure, so
// tests/unit/timeline.test.ts holds the rules; src/components/Timeline.tsx draws it.

export type FeedNews = { title: string | null; url: string; source: string | null; date: Date | string | null; company: string | null; companyId?: number | null; round: string | null; amount: number | string | null; currency: string | null; role: string | null; possible: boolean | null; thesisArea: string | null; kind: string; fundName: string; id?: number; also?: { id: number; possible: boolean; fund: { name: string } }[] };
export type FeedFund = { name: string; shared: { company: string; round?: string | null; date?: string | null; url?: string }[] };

export type Entry = {
  date: string; // YYYY-MM-DD
  company: string;
  companyId: number | null;
  round: string;
  funds: string[];
  headline: string | null; // the story's own headline (news); null for a shared round (the line is written from its facts)
  url: string;
  outlet: string;
  area: string | null;
  lead: boolean;
  unnamed: boolean; // the headline doesn't name the fund
  shared: boolean; // a round the fund shared with the firm
  ids: string[]; // the page addresses this entry answers to (`fi<deal id>`, one per fund's copy of the deal): the ticker links there
};

const ymd = (d: Date | string | null) => (d ? (typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10)) : "");
const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
const ROUNDS: Record<string, string> = { seed: "Seed", "pre-seed": "Pre-Seed", "series-a": "Series A", "series a": "Series A", unknown: "" };

export function money(n: number | string | null, cur = "$") {
  const v = Number(n);
  if (!v) return "";
  return v >= 1e6 ? `${cur}${(v / 1e6).toFixed(1).replace(/\.0$/, "")}M` : `${cur}${Math.round(v / 1e3)}K`;
}

/** The feed: news deals (one fund each) and shared rounds (one entry per round, with every fund in it), newest first. */
export function timeline(news: FeedNews[], funds: FeedFund[]): Entry[] {
  const out: Entry[] = [];
  for (const n of news) {
    if (n.kind !== "deal" || !n.company) continue;
    const rnd = ROUNDS[(n.round || "").toLowerCase()] ?? (n.round || "");
    out.push({
      date: ymd(n.date),
      company: n.company,
      companyId: n.companyId ?? null,
      round: [money(n.amount, n.currency || "$"), rnd].filter(Boolean).join(" ") || "A round",
      funds: [n.fundName, ...(n.also || []).filter((a) => !a.possible).map((a) => a.fund.name)],
      headline: n.title,
      url: n.url,
      outlet: n.source || host(n.url),
      area: n.thesisArea,
      lead: n.role === "lead",
      unnamed: !!n.possible,
      shared: false,
      ids: n.id ? [n.id, ...(n.also || []).map((a) => a.id)].map((i) => `fi${i}`) : [],
    });
  }
  const rounds = new Map<string, Entry>();
  for (const f of funds)
    for (const s of f.shared || []) {
      if (!s.date) continue;
      const k = `${s.company}|${s.round || ""}|${s.date}`;
      const e = rounds.get(k);
      if (e) e.funds.push(f.name);
      else rounds.set(k, { date: s.date.slice(0, 10), company: s.company, companyId: null, round: s.round || "A round", funds: [f.name], headline: null, url: s.url || "", outlet: s.url ? host(s.url) : "", area: null, lead: false, unnamed: false, shared: true, ids: [] });
    }
  out.push(...rounds.values());
  return out.filter((e) => e.date).sort((a, b) => b.date.localeCompare(a.date) || a.company.localeCompare(b.company));
}

/** Entries under their heading: This Week for the last seven days, then each month ("October 2026"). */
export function byMonth(entries: Entry[], now = new Date()): { heading: string; entries: Entry[] }[] {
  const groups: { heading: string; entries: Entry[] }[] = [];
  for (const e of entries) {
    const d = new Date(`${e.date}T12:00:00Z`);
    const heading = now.getTime() - d.getTime() < 7 * 86400000 ? "This Week" : d.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    const g = groups[groups.length - 1];
    if (g && g.heading === heading) g.entries.push(e);
    else groups.push({ heading, entries: [e] });
  }
  return groups;
}

/** "Nyca Partners, Gaingels and Insight Partners"; past three, "and 2 more". */
export function fundsLine(fs: string[], n = 3) {
  if (fs.length <= n) return fs.length > 1 ? `${fs.slice(0, -1).join(", ")} and ${fs[fs.length - 1]}` : fs[0] || "";
  return `${fs.slice(0, n).join(", ")} and ${fs.length - n} more`;
}
