// Deck Screen (VC Scout Plan section 5): a dropped pitch deck's first pass on the firm's screen, then three checks shaped
// on Slow Ventures' public Slow Lens prompt (Moat, Open Questions, Bottom Line; its structure only, never its beliefs or
// tone). Shown once in the browser that dropped the deck and never saved (user, 10-30-26). This file is the part the
// browser needs too: the steps and how far a read has got. The question and the answer's shape are in deck-read.ts,
// the AI call in ai.ts, the reading of the PDF in the browser (src/components/DeckScreen.tsx).
import { firm, on, type DeckCheck, type DeckStatus, type MoatStrength } from "@/firm";

/** What the browser sends: the deck's text page by page, and pictures of the pages that carry charts. */
export type DeckInput = { file: string; pages: { n: number; text: string }[]; images: { n: number; data: string }[] };

/** The limits on what the browser sends (Vercel takes 4.5 MB a request; a page's text rarely passes 6,000 characters). */
export const DECK_LIMITS = { pages: 80, chars: 6_000, images: 16, bytes: 3_800_000 };

export const READ_STEP: DeckCheck = { key: "read", label: "Read the Deck", asks: "Every page, its text and its charts" };
export const LENS: DeckCheck[] = [
  { key: "moat", label: "Moat", asks: "What stops a funded rival from copying it within a year" },
  { key: "openQuestions", label: "Open Questions", asks: "Its vaguest claim, and the question the founder least wants asked" },
  { key: "bottomLine", label: "Bottom Line", asks: "One sentence: take the meeting, or pass" },
];

/** The Status Table's four words, each defined above the table where it is used (user, 11-02-26: "whats the
 *  difference between 'partly' and 'a claim'"; never a "!" mark). The AI is given the same definitions. */
export const DECK_STATUS: Record<DeckStatus, { word: string; means: string }> = {
  shown: { word: "Shown", means: "The deck backs it with facts." },
  partial: { word: "Partly Shown", means: "Some of the facts are there, not all." },
  claimed: { word: "Claimed, Not Shown", means: "The deck says it but shows nothing behind it." },
  absent: { word: "Not in the Deck", means: "The deck doesn't cover it." },
};
/** The Moat Strength meter: how many of its four steps light, and the word under it. */
export const MOAT: Record<MoatStrength, { n: number; word: string; means: string }> = {
  thin: { n: 1, word: "Thin", means: "a funded rival could copy it within a year" },
  modest: { n: 2, word: "Modest", means: "copying it would take a funded rival a year or more" },
  solid: { n: 3, word: "Solid", means: "it has something a rival can't buy quickly: data, contracts or a network" },
  strong: { n: 4, word: "Strong", means: "a rival would struggle to copy it at any price" },
};

/** The steps shown while a deck is read, in order. */
export const deckSteps = (): DeckCheck[] => [READ_STEP, ...(firm.deck?.screen || []), ...LENS];

/** The answer's fields in the order the AI writes them (the schema's order). A step is done once a later field starts. */
export const fieldOrder = (): string[] => [
  "company",
  "oneLine",
  "area",
  "stage",
  "raising",
  ...(firm.deck?.screen || []).map((s) => `screen.${s.key}`),
  ...(on("unitEconomics") || on("deckBenchmarks") ? ["unitEconomics"] : []),
  "moat",
  "vaguestClaim",
  "hardestQuestion",
  "redFlags",
  "bottomLine",
];

/** The field each step waits for: a screen line's own, Open Questions' last one. */
const STEP_FIELD: Record<string, string> = { moat: "moat", openQuestions: "hardestQuestion", bottomLine: "bottomLine" };
export const stepField = (key: string) => STEP_FIELD[key] || `screen.${key}`;

/** How far a half-written answer has got: the index of the last field it has started (-1 for none). */
export function reached(partial: unknown): number {
  const p = (partial || {}) as Record<string, unknown>;
  const screen = (p.screen || {}) as Record<string, unknown>;
  let at = -1;
  fieldOrder().forEach((f, i) => {
    const v = f.startsWith("screen.") ? screen[f.slice(7)] : p[f];
    if (v !== undefined && v !== null) at = i;
  });
  return at;
}

/** Whether a step is done, given how far the answer has got (`finished` once it is whole). */
export function stepDone(key: string, at: number, finished: boolean): boolean {
  if (key === READ_STEP.key) return true;
  return finished || at > fieldOrder().indexOf(stepField(key));
}
