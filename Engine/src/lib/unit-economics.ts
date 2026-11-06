// Unit Economics (VC Scout Plan section 5): the company page's panel and the score's Unit Economics part, from the
// firm's lines (its unit-economics.ts). Every line is filled from a dropped deck, estimated from a public signal, or
// unknown. Only a deck's number at or past a verified reference earns points; an estimate never does, and an unknown
// line costs nothing, so a quiet company is never punished (the vault's Unit Economics.md, section 4).
import { firm, type RefStatus, type UeLine, type UeText } from "@/firm";
import { areaLabel } from "./format";

/** The four blocks of user's Startup Docs SaaS Dashboard, in order. */
export const UE_BLOCKS: [UeLine["block"], string][] = [
  ["price", "Price and Revenue"],
  ["cost", "Cost to Win a Customer"],
  ["value", "What a Customer Is Worth"],
  ["payback", "Months to Pay Back"],
];

/** The chip beside a reference: only Verified can score. */
export const REF_LABEL: Record<RefStatus, string> = { verified: "Verified", reported: "Reported", fyi: "FYI", thumb: "Rule of Thumb", none: "" };

export function ueLines(area: string | null | undefined): UeLine[] {
  return (area && firm.unitEconomics?.lines[area]) || [];
}

/** The lines that can earn points: a verified reference with a bar. */
export const scoringLines = (area: string | null | undefined) => ueLines(area).filter((l) => l.status === "verified" && l.good);

/** Whether a number clears its line's bar. */
export const clears = (l: UeLine, n: number | null | undefined) => n !== null && n !== undefined && !!l.good && (l.good.lower ? n <= l.good.at : n >= l.good.at);

/** The part of the Unit Economics points a deck's numbers earn, 0 to 1: each scoring line is an equal share. */
export function ueShare(area: string | null | undefined, nums: Record<string, number | null | undefined>): number {
  const lines = scoringLines(area);
  return lines.length ? lines.filter((l) => clears(l, nums[l.key])).length / lines.length : 0;
}

export type UeRow = {
  key: string;
  label: string;
  block: UeLine["block"];
  /** "Unknown", "Not in the Deck", a deck's figure or an estimate's words. */
  value: string;
  kind: "deck" | "est" | "unk";
  /** "From the deck", "Estimate: …"; null for an unknown line. */
  note: string | null;
  ref: string;
  status: RefStatus;
  source: { name: string; url: string } | null;
  /** A deck number past a verified reference. */
  earns: boolean;
  /** A deck number that misses its verified reference's bar. */
  below?: boolean;
};

/** The panel's rows: a deck's figures when there are any (a Deck Screen result), else estimates from public signals. */
export function ueRows(area: string | null | undefined, text: UeText | null, deck?: { key: string; value: string | null; number: number | null }[]): UeRow[] {
  const fromDeck = new Map((deck || []).map((d) => [d.key, d]));
  return ueLines(area).map((l) => {
    const base = { key: l.key, label: l.label, block: l.block, ref: l.ref, status: l.status, source: l.source || null };
    if (deck) {
      const d = fromDeck.get(l.key);
      if (d?.value) {
        const earns = l.status === "verified" && clears(l, d.number);
        const below = l.status === "verified" && !!l.good && d.number !== null && !earns;
        return { ...base, value: d.value, kind: "deck" as const, note: "From the deck", earns, below };
      }
      return { ...base, value: "Not in the Deck", kind: "unk" as const, note: null, earns: false };
    }
    const est = text && l.estimate ? l.estimate(text) : null;
    if (est) return { ...base, value: est, kind: "est" as const, note: "Estimate from public signals", earns: false };
    return { ...base, value: "Unknown", kind: "unk" as const, note: null, earns: false };
  });
}

/** Why an industry's lines can't score yet (the firm's sentence), or null when they can. */
export function unscoredWhy(area: string | null | undefined): string | null {
  return (!!area && !scoringLines(area).length && firm.unitEconomics?.unscored?.[area]) || null;
}

/** The line under the score bars, short and actionable (user, 11-02-26: "too verbose and unclear"):
 *  "Unit Economics: 0 of 20 until a deck adds numbers." The company page adds a Drop a Deck link after it. */
export function ueNote(rows: UeRow[], points: number, max: number, area?: string | null): string {
  if (unscoredWhy(area)) return `Unit Economics: not scored for ${areaLabel(area)} yet.`;
  if (rows.some((r) => r.kind === "deck")) return `Unit Economics: ${points} of ${max}, from the deck's numbers.`;
  return `Unit Economics: ${points} of ${max} until a deck adds numbers.`;
}

/** The line under a Deck Screen result's fit: how its Unit Economics scored, or why its industry is scored out of
 *  fewer points. */
export function deckNote(rows: UeRow[], fit: { ue: number; outOf: number }, max: number, area: string | null): string {
  const why = unscoredWhy(area);
  return why ? `Scored out of ${fit.outOf}, not 100. ${why}` : ueNote(rows, fit.ue, max, area);
}

/** The panel's heading note: "Premium Consumer Brands · Benchmarks From 2025-26 Industry Reports" (no "Industry 1":
 *  the number meant nothing on screen; user, 11-02-26). */
export function ueHeading(area: string | null | undefined): string {
  if (!area) return "";
  return [areaLabel(area), firm.unitEconomics?.asOf].filter(Boolean).join(" · ");
}

/** Old or narrow sources for this company, shown under the panel and never scored. */
export function ueFyi(area: string | null | undefined, text: string): { text: string; url?: string }[] {
  return (firm.unitEconomics?.fyi || []).filter((f) => !!area && f.areas.includes(area) && (!f.re || f.re.test(text))).map(({ text: t, url }) => ({ text: t, url }));
}
