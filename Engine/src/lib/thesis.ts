// Thesis classification by keyword rules, with the traps that cost earlier runs a rescore. The areas, keywords, traps
// and filters are the firm's own (its folder's thesis.ts, read through "@/firm"); how they are used lives here.
import { firm, on } from "@/firm";

/** An area key from the firm's thesis: "sports" for Courtside. */
export type Area = string;

const T = firm.thesis;
// Strong terms count 2; weak terms count 1. Traps are removed before matching.
const TERMS: Record<Area, { strong: string[]; weak: string[] }> = Object.fromEntries(T.areas.map((a) => [a.key, { strong: a.strong, weak: a.weak }]));
const TRAPS = T.traps;

function norm(s: string) {
  let t = ` ${s.toLowerCase()} `;
  for (const r of TRAPS) t = t.replace(r, " ");
  return t.replace(/[^a-z0-9+.\- ]+/g, " ").replace(/\s+/g, " ");
}

function count(text: string, term: string): number {
  const re = new RegExp(`(?<![a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z0-9])`, "g");
  return (text.match(re) || []).length;
}

export type Classified = { area: Area | null; confidence: number; hits: string[]; scores: Record<Area, number> };

/** Confidence 0.27 + 0.15 per hit (a weak keyword is half a hit); an area needs 0.4. One weak keyword is not a thesis area. */
export function classify(text: string, extra?: Partial<Record<Area, string[]>>): Classified {
  const t = norm(text || "");
  const scores = Object.fromEntries(T.areas.map((a) => [a.key, 0])) as Record<Area, number>;
  const hitsBy: Record<string, string[]> = {};
  for (const a of Object.keys(TERMS) as Area[]) {
    const strong = [...TERMS[a].strong, ...(extra?.[a] || [])];
    for (const k of strong) if (count(t, k)) ((scores[a] += 1), (hitsBy[a] ||= []).push(k));
    for (const k of TERMS[a].weak) if (count(t, k)) ((scores[a] += 0.5), (hitsBy[a] ||= []).push(k));
  }
  for (const d of T.demote) if (d.re.test(t) && d.area in scores) scores[d.area] = Math.max(0, scores[d.area] - d.by);
  let best: Area | null = null;
  for (const a of Object.keys(scores) as Area[]) if (!best || scores[a] > scores[best]) best = a;
  if (!best || scores[best] === 0) return { area: null, confidence: 0, hits: [], scores };
  const confidence = Math.min(0.99, 0.27 + 0.15 * scores[best]);
  return { area: confidence >= 0.4 ? best : null, confidence, hits: hitsBy[best] || [], scores };
}

/** Not venture scale: agencies, services, single-location businesses. */
export function notVentureScale(text: string): boolean {
  return T.notVentureScale.test(text);
}

/** Industry groups Form D filings carry that are never startups for this firm, and the groups that map to an area. */
export const DROP_INDUSTRY = T.formD.drop;
/** Issuer names skipped before a filing is read: fund vehicles, and whatever else the firm never backs by name. */
export const DROP_NAME = T.formD.dropName;
export const THESIS_INDUSTRY: Record<string, Area | null> = T.formD.industries;

/** A filer named Holdings or Group is often a company buying up others (VC Scout Plan section 2). */
export const ROLL_UP_NAME = /\b(holdings|group)\b/i;
/** Whether a filing gets the Possible Roll-Up Vehicle tag: only for a firm that lets those filers in (switch: rollUpTag). */
export const rollUpVehicle = (issuer: string) => on("rollUpTag") && ROLL_UP_NAME.test(issuer);

/** Businesses outside the thesis on every source (for Courtside: developer, B2B and enterprise tools). */
export const NOT_CONSUMER = T.outside;
/** Big companies are not startups: a Form D or a launch from them is not a find. */
export const INCUMBENT = T.incumbent;
