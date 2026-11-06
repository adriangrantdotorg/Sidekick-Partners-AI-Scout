// Every moving part Engine draws: one entry per @keyframes in its CSS (globals.css, v2.css, progress.css). A firm's
// look answers each one in its profile's `effects` (user, 11-02-26, after Sidekick's brass tab hid Engine's white
// Live glow: "How do we avoid this in the future, especially as we build for other firms?").
//
//   engine  Engine's own, unchanged; `seen` names the design page where user saw it moving in the firm's look
//   own     the firm's theme draws its own in its place; `seen` names the page where he picked it
//   off     the firm's look leaves it out; `why` says why
//   unseen  not shown to him yet: the launch stops until it is (scripts/effects.ts, run by launch.sh)
//
// Guards: tests/unit/effects.test.ts (every @keyframes listed, every firm answers, a `seen` page exists and draws the
// part) and, per firm, its browser tests (only the answered parts move, and each one visibly changes the screen).

export type EffectSpec = {
  /** The @keyframes names that draw it. */
  keyframes: string[];
  /** A class the part's element carries, found on any page that draws it. */
  el: string;
  /** What a viewer sees, in plain words. */
  what: string;
  /** Where it shows. */
  where: string;
};

export const EFFECTS = {
  liveDot: { keyframes: ["liveglow"], el: "lbl", what: "the ticker's Live dot glows", where: "every page, the ticker" },
  ticker: { keyframes: ["tick"], el: "track", what: "the ticker's names scroll by", where: "every page, the ticker" },
  headLine: { keyframes: ["sweep"], el: "rule", what: "a light sweeps the thin line under a page heading", where: "Pipeline, a company page, Settings" },
  leadCount: { keyframes: ["breatheG"], el: "seg hero", what: "the glow under Today's lead count breathes", where: "Today, the counts" },
  sky: { keyframes: ["x-skydrift"], el: "x-drift", what: "clouds drift across a startup's picture", where: "On the Radar cards, Pipeline rows and company pages (never Must See)" },
  sparkline: { keyframes: ["draw"], el: "spark", what: "a trend's four-week line draws itself", where: "Trends" },
  readingStep: { keyframes: ["x-dotbreathe"], el: "x-steps", what: "the step the Deck Screen is on breathes while it reads", where: "Deck Screen, while a deck is read" },
  launchDots: { keyframes: ["pg-br"], el: "pg-note", what: "the launch progress page's dots breathe", where: "the progress page during a launch" },
} as const satisfies Record<string, EffectSpec>;

export type EffectKey = keyof typeof EFFECTS;

/** Keyframes left in Engine's CSS from Courtside's first look that no page draws today. A component that starts
 *  using one of these classes moves it into EFFECTS (the unit test fails until it does). */
export const NOT_DRAWN: Record<string, string> = {
  frameglow: "glowframe",
  arc: "gauge",
  needle: "gauge",
  fFill: "bar",
};

export type EffectAnswer =
  | { look: "engine" | "own"; seen: string }
  | { look: "off"; why: string }
  | { look: "unseen" };
