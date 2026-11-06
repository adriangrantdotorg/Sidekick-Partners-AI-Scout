// Every Engine feature and source a firm can turn on or off (VC Scout Plan, section 0). Each firm's profile answers
// every key in its `features`, and tests/unit/firm.test.ts fails until it does, so a feature built for one firm is
// never skipped in silence for another. Add a key here with the code that reads it, never ahead of it.
export const FEATURES = {
  firmPosts: "The firm's own posts: its blog feed and newsletter, read daily, and its memo-named posts in the backtest",
  creatorFeeds: "The creator and podcast feeds: YouTube channels and shows read daily (Settings › Creators and Shows), the source Culture and Sponsor Radar read",
  culture: "Culture: the page of creators and shows mentioning a startup, and the score's Culture part (needs creatorFeeds)",
  sponsorRadar: "Sponsor Radar: the brands buying ads on the tracked shows, with its page, Today's count, the Spotlight's rule and the brief's section (needs creatorFeeds)",
  rollUpTag: "The Possible Roll-Up Vehicle tag on a Form D filer named Holdings or Group (a firm that backs tech-enabled roll-ups lets them in)",
  unitEconomics: "Unit Economics: the company page's panel of lines per industry with dated references, and the score's Unit Economics part (needs the firm's `unitEconomics` lines)",
  likelyAcquirers: "Likely Acquirers: the strategic buyers in a company's industry with the deals they did, and the Buyer Already Invested line when a buyer's venture arm backed it (needs the firm's `buyers`)",
  deckScreen: "Deck Screen: drop a pitch deck anywhere and get a first pass on the firm's screen, shown once and never saved (needs the firm's `deck` questions and AI)",
  deckBenchmarks: "Deck benchmarks: on a Deck Screen result, the deck's figures set against its industry's Unit Economics references; no score part and nothing on company pages (needs deckScreen and the firm's `unitEconomics` lines)",
  startHere: "Start Here: a one-time panel on Today for a first-time visitor: what Scout is, today's three best picks, one click to the IC brief",
  copyMarkdown: "Copy as Markdown: a button on each content section that copies it as Markdown",
  changeLog: "Settings › Change Log: every shared change, newest first, each with Undo (without it, ⌘Z undoes a shared change right after it is made)",
  slack: "Slack: Settings › Slack, Share to Slack on the brief, Backtest and About, the Connect Slack links, and alert hits and the Monday brief posted to a channel (needs a Slack app of the firm's: its client id and secret on the site)",
  phaseTwoSettings: "Settings › Phase II: what the builder and the firm would build together, with its Talk to button (About keeps its Phase II section)",
} as const;

export type FeatureKey = keyof typeof FEATURES;

/** Features that read another feature's data: on only when that one is on too (tests/unit/firm.test.ts). */
export const NEEDS: Partial<Record<FeatureKey, FeatureKey>> = { culture: "creatorFeeds", sponsorRadar: "creatorFeeds", deckBenchmarks: "deckScreen" };

/** Features built but not finished: what each still lacks, read by whoever turns one on. A firm that turns one on fails
 *  tests/unit/firm.test.ts with this note, so the gap is seen at the moment of activation, never found after a launch. */
export const INCOMPLETE: Partial<Record<FeatureKey, string>> = {
  // user, 11-03-26: "remove the decking screen feature for the sidekick scout and mark the feature as incomplete …
  // (lacks the rigorous 'smell test' VCs need)"
  deckScreen:
    "Deck Screen is incomplete: it lacks the rigorous smell test VCs need (11-03-26). Before turning it on: " +
    "design that smell test first, then prove a real AI read of a real deck returns the Status Table " +
    "(npm run check:ai runs one whenever deckScreen is on), and take its browser tests off skip " +
    "(tests/firms/<firm>/e2e/step10.spec.ts).",
};

/** The daily jobs that belong to a feature: a firm without it never schedules or runs them. */
export const JOB_FEATURE: Record<string, FeatureKey> = { culture: "culture", sponsors: "sponsorRadar" };
