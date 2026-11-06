// Example Firm: a blank profile to copy for the next firm (VC Scout Plan, section 0). Copy this folder, rename it to the
// firm's name, add it to FIRMS in Engine/firm.config.mjs, then fill every value below. A value left blank makes its
// part of Scout quiet (no areas: nothing scores in; no feeds: none are read), never another firm's data.
// The firm's look goes in brand/ (icon.png, apple-icon.png, opengraph-image.jpg with its .alt.txt, share-preview.md,
// theme.css); see Courtside Ventures (draft)/brand/ for the shape. Without an icon the deploy guard refuses to ship.
import type { FirmProfile } from "../Engine/src/firm/types";

const NEVER = /$^/; // a pattern that matches nothing

const exampleFirm: FirmProfile = {
  id: "example-firm",
  name: "Example Firm",
  // a firm whose short name is an everyday word keeps its full name here, so Engine's no-firm-names test can find it
  short: "Example Firm",
  product: "Example Firm Scout",
  description: "Deal sourcing for Example Firm: startups inside its thesis, every fact linked to its source.",
  site: "https://www.example.com",
  // the View on GitHub link: a public repo only (a private one is GitHub's 404 page for every visitor); "" shows none
  repoUrl: "",
  people: [],
  thesis: {
    // one entry per industry: { key: "consumer-health", label: "Consumer Health", strong: [...], weak: [...], sky: { base: "#14595a", sun: "#9ef0c4" } }
    areas: [],
    traps: [],
    demote: [],
    notVentureScale: NEVER,
    // fund vehicles file Form Ds too; most firms skip them by name
    formD: { drop: NEVER, dropName: /\b(fund|lp|l\.p\.|reit|spv|a series of|feeder|offshore|master|co-invest)\b/i, industries: {} },
    outside: NEVER,
    incumbent: NEVER,
    stages: ["pre-seed", "seed", "series-a"],
    stageLabel: "Pre-Seed to Series A",
    check: { minCheck: 500000, maxCheck: 4000000 },
    capUsd: 15_000_000,
    geo: { label: "US first", abroad: NEVER },
    plays: [],
    weights: { thesis: 30, stage: 20, signal: 20, culture: 0, unitEconomics: 0, team: 10, geo: 5 },
  },
  // appGenres: Apple's genre ids, e.g. { "6013": "Health & Fitness" }
  sources: { newsQueries: [], feeds: [], appGenres: {}, yc: { in: [], out: [] }, githubQueries: [], gdeltQuery: "" },
  portfolio: { site: "https://www.example.com/portfolio", areaOf: () => null },
  funds: { coInvestors: [], peers: [], commonNames: new Set() },
  library: [],
  buyers: [],
  // names: leave out to use the standard names (Filings, Co-Investors, Peer Funds, Funding, Shortlist)
  // paths: leave out to use the standard addresses (/filings, /co-investors, /peer-funds)
  copy: { pitch: "We invest at pre-seed through Series A", specialistFocus: "the firm's industries", ownSources: "its portfolio page" },
  memo: {
    title: "Investment Memo",
    voice: "clear, specific, sourced",
    outline: (f) => `## 1. The company\n${f.description || "[TBD: one paragraph in plain words]"}\n\n## 2. The round\n${f.name}'s ${f.round}.\n\n## 3. The team\n${f.founders}\n\n## 4. Why it fits\n${f.whyFits || "[TBD: why it fits the thesis]"}`,
  },
  alerts: [],
  // Unit Economics, Likely Acquirers and Deck Screen need the firm's own lines, buyers and deck questions: turn each
  // on once its data is filled in. Start Here and Copy as Markdown need nothing of the firm's.
  // The Deck Screen is incomplete (INCOMPLETE in Engine/src/firm/features.ts): it stays off until it is finished.
  // Settings' Change Log and Phase II follow Sidekick's call (user, 11-03-26): off.
  features: { firmPosts: false, creatorFeeds: false, culture: false, sponsorRadar: false, rollUpTag: false, unitEconomics: false, likelyAcquirers: false, deckScreen: false, deckBenchmarks: false, startHere: true, copyMarkdown: true, changeLog: false, phaseTwoSettings: false, slack: false },
  // Every moving part Engine draws (Engine/src/firm/effects.ts). Show each one to user moving in this firm's look on
  // a design page, then answer it: Engine's (`seen`: that page), the firm's own, or off with why. The launch stops while
  // any is unseen.
  effects: {
    liveDot: { look: "unseen" },
    ticker: { look: "unseen" },
    headLine: { look: "unseen" },
    leadCount: { look: "unseen" },
    sky: { look: "unseen" },
    sparkline: { look: "unseen" },
    readingStep: { look: "unseen" },
    launchDots: { look: "unseen" },
  },
  ai: {
    screenFor: "a pre-seed and seed fund.",
    rejectWhen: [],
    yesWhen: "a startup inside the firm's thesis",
  },
};

export default exampleFirm;
