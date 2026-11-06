// The Deck Screen's question to the AI and the answer's shape (src/lib/deck.ts has the steps). Server only.
import { z } from "zod";
import { firm, on, type DeckResult, type DeckStatus, type MoatStrength } from "@/firm";
import { AREAS, areaLabel } from "./format";
import { ueLines, ueShare, unscoredWhy } from "./unit-economics";
import { SCORE_PARTS, scoreCompany } from "./score";
import { DECK_LIMITS, DECK_STATUS, LENS, MOAT, type DeckInput } from "./deck";
import type { Weights } from "./settings";

// Two switches. Unit Economics scores a deck's figures (off for Sidekick since 11-02-26: "presume that we will not have
// access to the deck"); deck benchmarks only sets them against their references on the result (user, 11-02-26: "yes
// do this"). Either one has the read ask for the figures; only Unit Economics lets them move the fit.
const FIGURES = () => on("unitEconomics") || on("deckBenchmarks");
const UE = () => on("unitEconomics");
const allLineKeys = () => [...new Set(Object.values(firm.unitEconomics?.lines || {}).flat().map((l) => l.key))];
const allFlags = () => [...new Set(Object.values(firm.deck?.redFlags || {}).flat())];
const oneOf = (xs: string[]) => (xs.length ? z.enum(xs as [string, ...string[]]) : z.string());
const STATUS = z.enum(Object.keys(DECK_STATUS) as [DeckStatus, ...DeckStatus[]]);

/** The answer's shape. Every field is required (OpenAI's strict structured output); "unknown" answers are null. */
export function deckSchema() {
  return z.object({
    company: z.string(),
    oneLine: z.string(),
    area: z.enum(["none", ...AREAS] as [string, ...string[]]),
    stage: z.string().nullable(),
    raising: z.string().nullable(),
    screen: z.object(Object.fromEntries((firm.deck?.screen || []).map((s) => [s.key, z.object({ status: STATUS, figure: z.string().nullable(), text: z.string() })]))),
    ...(FIGURES() ? { unitEconomics: z.array(z.object({ key: oneOf(allLineKeys()), value: z.string(), number: z.number().nullable() })) } : {}),
    moat: z.object({ strength: z.enum(Object.keys(MOAT) as [MoatStrength, ...MoatStrength[]]), text: z.string() }),
    vaguestClaim: z.object({ quote: z.string(), status: STATUS, why: z.string() }),
    hardestQuestion: z.string(),
    redFlags: z.array(z.object({ flag: oneOf(allFlags()), seen: z.enum(["found", "missing", "clear"]) })),
    bottomLine: z.string(),
  });
}
export type DeckAnswer = z.infer<ReturnType<typeof deckSchema>>;

const money = (n: number) => (n >= 1e6 ? `$${+(n / 1e6).toFixed(1)}M` : `$${Math.round(n / 1e3)}K`);

/** The question the Deck Screen asks the AI. */
export function deckPrompt(): string {
  const t = firm.thesis;
  const d = firm.deck!;
  const unit = (u: string) => (u === "%" ? "a percent: 71 for 71%, 210 for 3.1x growth" : u === "x" ? "a multiple: 2.4 for 2.4x" : u === "$" ? "dollars" : "months");
  const lines = AREAS.map((a) => {
    const ls = ueLines(a);
    return ls.length ? `  ${a}: ${ls.map((l) => `${l.key} (${l.label}${l.good ? `; number in ${unit(l.good.unit)}` : ""})`).join(", ")}` : "";
  }).filter(Boolean);
  const flags = AREAS.map((a) => (d.redFlags[a]?.length ? `  ${a}: ${d.redFlags[a].map((f) => `"${f}"`).join("; ")}` : "")).filter(Boolean);
  return [
    `You read pitch decks for ${firm.name}, ${firm.ai.screenFor}`,
    `It invests at ${t.stageLabel}, writing checks of ${money(t.check.minCheck)} to ${money(t.check.maxCheck)}, and never in a company that has raised ${money(t.capUsd)} or more in total.`,
    "Read the deck below the way a partner would before a first meeting. Its text comes page by page; pictures of some pages follow. Write in plain words, one or two short sentences per answer, with figures exactly as the deck gives them. Name a method by what it does, never by its jargon (\"a test against a control group\", not \"a holdout test\"). Never invent a number, a name or a date: when the deck doesn't say, say so. No hype, no swearing.",
    "Answer every field:",
    "- company: the company's name. oneLine: what it does, in under 12 words, no period.",
    `- area: the industry it fits: ${AREAS.map((a) => `${a} (${areaLabel(a)})`).join(", ")}; or none.`,
    "- stage: the round it is raising (Pre-Seed, Seed, Series A, Series B or later), or null. raising: the amount, like $2.5M, or null.",
    `- screen, one answer each, as status, figure and text. status: ${Object.entries(DECK_STATUS).map(([k, v]) => `${k} (${v.means.replace(/\.$/, "").toLowerCase()})`).join(", ")}. figure: the one key figure behind it, under 4 words, like "$1.2M ARR" or "2 Founders", or null when there is none. text: the answer in one short sentence. The checks:\n${d.screen.map((s) => `  - ${s.key} (${s.label}): ${s.asks}`).join("\n")}`,
    FIGURES() && `- unitEconomics: only the lines of the industry you chose that the deck gives a figure for, with value (short, as the deck says it) and number (null unless asked for). Lines per industry:\n${lines.join("\n")}`,
    `- moat: ${LENS[0].asks}, in 12 months, as strength and text. strength: ${Object.entries(MOAT).map(([k, v]) => `${k} (${v.means})`).join(", ")}. text: one short sentence on why.`,
    "- vaguestClaim: the deck's vaguest claim, as quote (its own words, in quotation marks), status (as for the screen) and why (what's wrong with it, in plain words, one sentence).",
    "- hardestQuestion: the question the founder would least like asked.",
    `- redFlags: each red flag of the industry you chose: found (the deck shows it), missing (the deck doesn't say) or clear (the deck answers it well). Flags per industry:\n${flags.join("\n")}`,
    "- bottomLine: one sentence: take the meeting or pass, and on what condition.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** A finished answer → the result shown: in the firm's screen order, only its industry's lines and flags. */
export function toResult(a: DeckAnswer, file: string): DeckResult {
  const area = a.area !== "none" && AREAS.includes(a.area) ? a.area : null;
  const keys = new Set(ueLines(area).map((l) => l.key));
  const flags = new Set(area ? firm.deck?.redFlags[area] || [] : []);
  const screen = a.screen as Record<string, { status: DeckStatus; figure: string | null; text: string } | undefined>;
  return {
    company: a.company.trim() || "This Startup",
    oneLine: a.oneLine.trim().replace(/\.$/, ""),
    area,
    stage: a.stage,
    raising: a.raising,
    screen: (firm.deck?.screen || []).map((s) => ({ key: s.key, status: screen[s.key]?.status || "absent", figure: screen[s.key]?.figure?.trim() || null, text: screen[s.key]?.text || "" })),
    moat: a.moat,
    vaguestClaim: a.vaguestClaim,
    hardestQuestion: a.hardestQuestion,
    bottomLine: a.bottomLine,
    unitEconomics: ((a as { unitEconomics?: DeckResult["unitEconomics"] }).unitEconomics || []).filter((u) => keys.has(u.key)).map((u) => ({ key: u.key, value: u.value || null, number: u.number })),
    redFlags: a.redFlags.filter((f) => flags.has(f.flag)),
    file,
  };
}

const STAGE: [RegExp, string][] = [
  [/pre-?seed/i, "pre-seed"],
  [/seed/i, "seed"],
  [/series\s*a\b/i, "series-a"],
  [/series\s*[b-z]\b/i, "series-b"],
];

/** "$2.5M" → 2,500,000. */
export function raiseAmount(s: string | null): number | null {
  const m = (s || "").match(/\$\s?(\d+(?:\.\d+)?)\s?(k|m|b|thousand|million|billion)?/i);
  if (!m) return null;
  const mult = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, billion: 1e9 }[(m[2] || "").toLowerCase()] || 1;
  return Math.round(Number(m[1]) * mult);
}

/** The result's thesis fit, scored the way Scout scores a card. A deck brings no public signals, so Signal Strength is 0.
 *  An industry whose Unit Economics can't score yet is scored out of the other parts' points (80 of 100 for Sidekick's
 *  Consumer Health), shown as a percent of those. */
export function deckFit(r: DeckResult, w: Weights): { score: number; ue: number; outOf: number } {
  const text = [r.oneLine, ...r.screen.map((s) => s.text)].join(". ");
  const nums = Object.fromEntries(r.unitEconomics.map((u) => [u.key, u.number]));
  const share = UE() ? ueShare(r.area, nums) : 0;
  const s = scoreCompany(
    {
      name: r.company,
      description: text,
      thesisArea: r.area,
      stage: STAGE.find(([re]) => re.test(r.stage || ""))?.[1] || "unknown",
      amount: raiseAmount(r.raising),
      currency: "$",
      signals: [],
      voiceMentions: 0,
      sponsorShows: 0,
      relatedPersons: r.screen.some((x) => x.key === "founderFit" && x.text) ? 1 : 0,
      yc: false,
      geoText: text,
      learned: 0,
      competes: false,
      checkRange: firm.thesis.check,
      ueShare: share,
    },
    w,
  );
  const total = SCORE_PARTS.reduce((a, [k]) => a + (w[k] || 0), 0);
  if (!UE() || !unscoredWhy(r.area)) return { score: s.score, ue: s.breakdown.unitEconomics, outOf: total };
  const outOf = total - (w.unitEconomics || 0);
  return { score: Math.min(100, Math.round((s.score * 100) / (outOf || 1))), ue: 0, outOf };
}

/** The browser's deck, checked: text page by page and a few page pictures, inside Vercel's 4.5 MB a request. */
export function parseDeck(body: unknown): DeckInput | string {
  const b = (body || {}) as Partial<DeckInput>;
  if (typeof b.file !== "string" || !Array.isArray(b.pages) || !Array.isArray(b.images)) return "That wasn't a deck Scout could read.";
  const pages = b.pages.filter((p) => p && typeof p.text === "string" && Number.isFinite(p.n)).slice(0, DECK_LIMITS.pages).map((p) => ({ n: p.n, text: p.text.slice(0, DECK_LIMITS.chars) }));
  const images = b.images.filter((im) => im && typeof im.data === "string" && /^[A-Za-z0-9+/=]+$/.test(im.data) && Number.isFinite(im.n)).slice(0, DECK_LIMITS.images);
  if (images.reduce((s, im) => s + im.data.length, 0) > DECK_LIMITS.bytes) return "The deck's pictures are too large to send.";
  if (!pages.some((p) => p.text.trim().length > 40) && !images.length) return "Scout couldn't find any words or pictures in this PDF.";
  return { file: b.file.slice(0, 160), pages, images };
}
