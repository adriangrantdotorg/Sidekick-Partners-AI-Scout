// Thesis-fit score (0-100), the "why it fits" line and the portfolio check. Deterministic, no AI.
import { classify, notVentureScale, type Area } from "./thesis";
import { pastStage, fmtMoney, fmtDate } from "./format";
import { standInWhat } from "./v2";
import type { Weights } from "./settings";
import { firm, on, type FirmPlay, type FirmWeights } from "@/firm";

export type Plays = FirmPlay;

// The plays the firm has backed (its thesis.ts), each named by a portfolio company.
export const PLAYS: Plays[] = firm.thesis.plays;

export function playOf(text: string, area: string | null): Plays | null {
  for (const p of PLAYS) if (p.re.test(text) && (!p.areas || !area || p.areas.includes(area as Area))) return p;
  return null;
}

export type ScoreInput = {
  name: string;
  description: string;
  thesisArea: string | null;
  stage: string;
  amount: number | null;
  currency: string;
  signals: { type: string; date: Date | null }[];
  voiceMentions: number;
  sponsorShows: number;
  relatedPersons: number;
  yc: boolean;
  geoText: string;
  learned: number; // -15..15
  competes: boolean;
  manual?: { thesis: number; stage: number; team: number; geo: number } | null;
  checkRange: { minCheck: number; maxCheck: number };
  /** The part of the Unit Economics points earned, 0 to 1 (src/lib/unit-economics.ts): only a deck's numbers earn any. */
  ueShare?: number;
};

/** The score's parts as pages show them, in order; the Culture part goes with Culture and the Unit Economics part with
 *  Unit Economics (their switches). Settings › Scoring and the company page both read this list. */
export const SCORE_PARTS: [keyof FirmWeights, string][] = (
  [
    ["thesis", "Thesis Fit"],
    ["stage", "Stage and Check"],
    ["unitEconomics", "Unit Economics"],
    ["signal", "Signal Strength"],
    ["culture", "Culture"],
    ["team", "Team"],
    ["geo", "Geography"],
  ] as [keyof FirmWeights, string][]
).filter(([k]) => (k !== "culture" || on("culture")) && (k !== "unitEconomics" || on("unitEconomics")));

export type Breakdown = { thesis: number; stage: number; signal: number; culture: number; unitEconomics: number; team: number; geo: number; learned: number; penalties: number };

export function scoreCompany(i: ScoreInput, w: Weights, now = Date.now()): { score: number; breakdown: Breakdown } {
  const text = `${i.name}. ${i.description}`;
  const c = classify(text);
  const area = i.thesisArea || c.area;
  const play = playOf(text, area);
  // thesis fit
  let thesis = 0;
  const hasDesc = (i.description || "").trim().length > 30;
  if (area) thesis = w.thesis * ((hasDesc ? 0.5 : 0.3) + Math.min(0.3, 0.3 * c.confidence)) + (play && hasDesc ? w.thesis * 0.2 : 0);
  thesis = Math.round(Math.min(w.thesis, thesis));
  // stage and check
  let stage = 0;
  if (pastStage(i.stage)) stage = Math.round(w.stage * 0.1);
  else if (firm.thesis.stages.includes(i.stage)) stage = w.stage;
  else if (firm.thesis.stageShare?.[i.stage] !== undefined) stage = Math.round(w.stage * firm.thesis.stageShare[i.stage]);
  else stage = Math.round(w.stage * 0.7);
  if (i.amount && i.currency === "$" && i.amount > i.checkRange.maxCheck * 10) stage = Math.round(stage * 0.5);
  if (i.amount && i.currency === "$" && i.amount < i.checkRange.minCheck * 0.6) stage = Math.round(stage * 0.6);
  // signals: independent kinds, recency, momentum
  const kinds = new Set(i.signals.map((s) => s.type));
  const newest = Math.max(0, ...i.signals.map((s) => (s.date ? s.date.getTime() : 0)));
  const ageDays = newest ? (now - newest) / 86400000 : 999;
  const recentCount = i.signals.filter((s) => s.date && now - s.date.getTime() < 14 * 86400000).length;
  let signal = Math.min(0.5, kinds.size * 0.17) * w.signal + (ageDays < 7 ? 0.3 : ageDays < 21 ? 0.2 : ageDays < 45 ? 0.1 : 0) * w.signal + Math.min(0.2, recentCount * 0.07) * w.signal;
  signal = Math.round(Math.min(w.signal, signal));
  // culture: creators and shows, sponsor activity
  const culture = Math.round(Math.min(w.culture, i.voiceMentions * 0.34 * w.culture + (i.sponsorShows > 0 ? 0.4 * w.culture : 0)));
  // unit economics: a known line past its verified reference earns its share; an unknown line costs nothing
  const unitEconomics = on("unitEconomics") ? Math.round((w.unitEconomics || 0) * Math.max(0, Math.min(1, i.ueShare ?? 0))) : 0;
  // team: founders visible in public sources
  const team = Math.round(Math.min(w.team, (i.yc ? 0.5 : 0) * w.team + (i.relatedPersons > 0 ? 0.3 : 0) * w.team));
  // geography: full marks at home, 60% abroad, unless the firm's rule gives an area full marks there (Courtside: gaming in
  // India, LatAm, the Middle East and Africa); a firm with finer rules says the share itself
  const G = firm.thesis.geo;
  const geo = G.share
    ? Math.round(w.geo * Math.max(0, Math.min(1, G.share(i.geoText, area))))
    : !G.abroad.test(i.geoText) ? w.geo : G.fullAbroad && area === G.fullAbroad.area && G.fullAbroad.re.test(i.geoText) ? w.geo : Math.round(w.geo * 0.6);
  const parts = i.manual ? { thesis: i.manual.thesis, stage: i.manual.stage, team: i.manual.team, geo: i.manual.geo } : { thesis, stage, team, geo };
  let penalties = 0;
  if (i.competes) penalties -= 10;
  if (pastStage(i.stage)) penalties -= 15;
  if (notVentureScale(text)) penalties -= 20;
  const learned = Math.max(-15, Math.min(15, Math.round(i.learned)));
  const raw = parts.thesis + parts.stage + signal + culture + unitEconomics + parts.team + parts.geo + learned + penalties;
  return { score: Math.max(0, Math.min(100, raw)), breakdown: { ...parts, signal, culture, unitEconomics, learned, penalties } };
}

const SIG_FACT: Record<string, string> = {
  formd: "filed a Form D",
  formc: "opened a Form C raise",
  yc: "in Y Combinator's newest batch",
  producthunt: "launched on Product Hunt",
  hn: "launched on Hacker News",
  appstore: "climbing the App Store charts",
  news: "in the news",
  voice: "mentioned on a tracked show",
  sponsor: "sponsoring a tracked show",
};

/** Under 30 words: the play first (with its named parallel), the dated fact last. */
const HEADLINE = /\b(raises|raised|secures|secured|closes|closed|nabs|bags|lands|funding|launches)\b/i;

export function whyFitsLine(i: { name: string; description: string; thesisArea: string | null; stage: string; amount: number | null; currency: string; lastSignal: { type: string; date: Date | null } | null }): string {
  const text = `${i.name}. ${i.description}`;
  const play = playOf(text, i.thesisArea);
  const area = i.thesisArea ? i.thesisArea[0].toUpperCase() + i.thesisArea.slice(1) : "";
  const d = (i.description || "").trim();
  // A bare name or a stripped-to-nothing sentence never leaves the line starting with ":" or "," (10-14-26).
  const what = ownWhat(d) || standInWhat(area);
  // A portfolio tie is only ever the "Overlaps with …" tag, for real competitors; the line never says "near X in the
  // portfolio" (user, 10-30-26: 305 cards read "near Religion of Sports" from a loose keyword match).
  const head = play ? `${what}: ${play.label}, like ${play.parallel}` : `${what}, inside ${firm.short}'s thesis`;
  let fact = "";
  if (i.amount) fact = `raised ${fmtMoney(i.amount, i.currency)}${i.stage !== "unknown" ? " " + (i.stage === "pre-seed" ? "pre-seed" : i.stage === "seed" ? "seed" : i.stage === "series-a" ? "Series A" : "") : ""}`.trim();
  else if (i.lastSignal) {
    const f = SIG_FACT[i.lastSignal.type] || "a new signal";
    fact = i.lastSignal.type === "yc" ? f : `${f}${i.lastSignal.date ? " on " + fmtDate(i.lastSignal.date) : ""}`;
  }
  const line = fact ? `${head}; ${fact}.` : `${head}.`;
  const words = line.split(/\s+/);
  return words.length > 30 ? words.slice(0, 29).join(" ").replace(/[,;:]$/, "") + "." : line;
}

/** What the startup does, in its own words, from its description: "" when the description is missing, a headline
 *  ("X raises $2M") or too short. whyFitsLine() writes the stand-in instead. */
export function ownWhat(description: string | null): string {
  const d = (description || "").trim();
  return d.length > 30 && !HEADLINE.test(d.split(/(?<=[.!?])\s/)[0]) ? shortWhat(d) : "";
}
/** A description that says nothing: no words of its own, or fewer than three ("Homepage", the name again). The enrich
 *  job replaces it with the company's own homepage description (user, 11-10-26: "if a website is known, then surely
 *  there should be a description"). */
export function weakDescription(description: string | null): boolean {
  return ownWhat(description).split(/\s+/).filter(Boolean).length < 3;
}

function shortWhat(desc: string): string {
  const d = (desc || "").replace(/\s+/g, " ").trim();
  let first = d.split(/(?<=[.!?])\s/)[0] || d;
  first = first.replace(/^[A-Z][\w.&'-]*(?:\s[A-Z][\w.&'-]*){0,2}\s+(is|are|builds|helps|makes|lets|offers|provides)\s+/i, (_m, v: string) => (v.toLowerCase() === "is" || v.toLowerCase() === "are" ? "" : v.toLowerCase() + " "));
  first = first.replace(/^(a|an|the)\s+/i, (m) => m[0].toUpperCase() + m.slice(1).toLowerCase());
  first = first.replace(/[.!?]+$/, "");
  const words = first.split(" ");
  const out = (words.length > 12 ? words.slice(0, 12).join(" ").replace(/[,;:]$/, "") : first).trim();
  if (!/[a-z]/i.test(out)) return "";
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/* ---------- portfolio check ---------- */
const STOP = new Set(
  "the a an and or for of to in on at with by from is are be as its it this that their they we our your you company platform app apps startup based founded founder founders ceo team users user people new first world leading help helps building builds build make makes using use used through via into across more all every each other most best data technology tech solution solutions service services products product brand brands including such like over well also has have had which who what when where how than can will one two three focused focus focuses mobile online digital free daily easy simple better faster fast real time way ways need needs get gets work works live home life day days week now today top big small high low next last only just any some own same about after before between under modern smart powered designed built create creates created provides provide offers offer enables enable allows allow delivers deliver"
    .split(" "),
);
function tokens(s: string): Set<string> {
  return new Set(
    (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
      .map((w) => w.replace(/s$/, "")),
  );
}

export type PortfolioRow = { name: string; sector: string | null; description: string | null };
export type Check = { kind: "competes" | "adjacent"; with: string; reason: string } | null;

/** "Competes with" (red) or "Adjacent to, possible intro" (amber), with the shared ground in words. */
export function portfolioCheck(c: { name: string; description: string; thesisArea: string | null }, port: PortfolioRow[]): Check {
  const a = tokens(`${c.name} ${c.description}`);
  if (!a.size) return null;
  const play = playOf(c.description, c.thesisArea);
  let best: { p: PortfolioRow; shared: string[]; score: number } | null = null;
  for (const p of port) {
    if (p.name.toLowerCase() === c.name.toLowerCase()) continue;
    const b = tokens(`${p.description || ""}`);
    const shared = [...a].filter((t) => b.has(t));
    const pPlay = playOf(p.description || "", null);
    const score = shared.length + (play && pPlay && play.key === pPlay.key ? 2 : 0);
    if (!best || score > best.score) best = { p, shared, score };
  }
  if (!best || best.score < 3) return null;
  const ground = best.shared.filter((t) => t.length > 3).slice(0, 3).join(", ");
  if (best.score >= 4) return { kind: "competes", with: best.p.name, reason: `Both build ${ground ? "around " + ground : "the same product"}` };
  return { kind: "adjacent", with: best.p.name, reason: ground ? `Both touch ${ground}` : "Nearby in the portfolio" };
}
