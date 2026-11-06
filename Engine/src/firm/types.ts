// What makes one firm's Scout its own (VC Scout Plan, section 0). Each firm folder at the repo root exports one
// FirmProfile from its profile.ts; the Engine reads it through "@/firm" and names no firm itself.
// Built up in layers during Plan step 7: identity first, then names, thesis, sources, funds, brand and switches.
import type { FeatureKey } from "./features";
import type { EffectAnswer, EffectKey } from "./effects";

export type FirmPerson = { name: string; role: string; blog?: string };

export type FirmArea = {
  /** The key stored on every card and filing: "sports". */
  key: string;
  /** The name pages show: "Sports". */
  label: string;
  /** Keywords worth a full point toward this area; a weak one is worth half. An area needs 0.4 confidence. */
  strong: string[];
  weak: string[];
  /** The painted sky for a startup in this area with no colors of its own. */
  sky: { base: string; sun: string };
};

/** A play the firm has backed, named by a portfolio company: the "why it fits" line leads with it. */
export type FirmPlay = { key: string; label: string; parallel: string; re: RegExp; areas?: string[] };

/** The score's parts and their points out of 100 (Settings › Scoring starts from these). */
export type FirmWeights = { thesis: number; stage: number; signal: number; culture: number; unitEconomics: number; team: number; geo: number };

export type FirmThesis = {
  /** The areas, in the order chips, filters and the AI Thesis Check list them. */
  areas: FirmArea[];
  /** Phrases removed before keyword matching ("game changer" is not gaming). */
  traps: RegExp[];
  /** Text that lowers one area's score (drug makers are not consumer health). Tested on lowercase text. */
  demote: { area: string; re: RegExp; by: number }[];
  /** Agencies, services, single-location businesses: a 20-point penalty. */
  notVentureScale: RegExp;
  /** Form D industry groups that are never startups for this firm, and the groups that map to an area; `dropName`
   *  skips an issuer by its name before its filing is read (fund vehicles, and for Courtside "holdings" and "group"). */
  formD: { drop: RegExp; dropName: RegExp; industries: Record<string, string | null> };
  /** Businesses outside the thesis on every source (developer and enterprise tools, for a consumer-focused firm). */
  outside: RegExp;
  /** Big companies: a filing or launch from them is not a find. */
  incumbent: RegExp;
  /** The stages that get the full stage score, and how Settings describes stage and check. */
  stages: string[];
  /** Stages that get part of the stage score: { "pre-seed": 0.5 }. Any other stage before the firm's gets 70%. */
  stageShare?: Record<string, number>;
  stageLabel: string;
  /** The default check size (Settings › Stage overrides it). */
  check: { minCheck: number; maxCheck: number };
  /** A company that has raised this much in total, in dollars, is never recommended. */
  capUsd: number;
  /** Geography: full marks at home, 60% abroad, unless `fullAbroad` matches for its area. A firm with finer rules
   *  gives `share`: the part of the geography points a startup's text earns (0 to 1), read instead of the rest. */
  geo: { label: string; abroad: RegExp; fullAbroad?: { area: string; re: RegExp }; share?: (text: string, area: string | null) => number };
  /** The plays the firm has backed. */
  plays: FirmPlay[];
  /** The score's default points per part. */
  weights: FirmWeights;
};

export type FirmSources = {
  /** More news sites with an open WordPress search for the Proof Finder, beyond Engine's (PROOF_OUTLETS in
   *  src/lib/proof.ts): host names such as "www.example.com", each tested to answer /wp-json/wp/v2/posts?search=. */
  proofOutlets?: string[];
  /** Google News searches: the default for Settings › Queries. */
  newsQueries: string[];
  /** Industry news feeds read every day: [name, url]. */
  feeds: [string, string][];
  /** App Store top-free charts read daily: Apple's genre id → its name ("6013": "Health & Fitness"). */
  appGenres: Record<string, string>;
  /** Y Combinator industries and tags inside and outside the thesis (lowercase, matched as parts of a tag). */
  yc: { in: string[]; out: string[] };
  /** Extra sources (Settings › Sources): GitHub searches and one GDELT query. */
  githubQueries: string[];
  gdeltQuery: string;
  /** The firm's own posts: its blog's RSS feed and a beehiiv newsletter. None: no posts are read. */
  posts?: { blogFeed: string; newsletter?: string };
};

/** A portfolio company the firm's team checked by hand: its details, for a page that lists names only. */
export type PortfolioCo = { name: string; site?: string; sector: string; description: string; exitNote?: string; aka?: string[] };

export type FirmPortfolio = {
  /** The firm's portfolio page, read weekly; each company's page is <site>/<slug> (Courtside). */
  site: string;
  /** A portfolio company's sector and description → a thesis area. */
  areaOf: (sector: string | null, desc: string | null) => string | null;
  /** A page that lists names only (Sidekick): the names on it, and the checked details per company. A name with no
   *  details still joins the portfolio by name, so a new company shows up the week it's listed. */
  list?: { names: (html: string) => string[]; known: PortfolioCo[] };
};

export type Shared = { company: string; round?: string; date?: string; url: string };
export type FundDef = { name: string; focus: "specialist" | "broad"; shared?: Shared[]; site?: string; note?: string; area?: string; edgarName?: string; youtube?: string[]; feeds?: string[] };

export type FirmFunds = {
  /** Funds that have shared a deal with the firm, in the brief's order (Courtside: the Neighborhood). */
  coInvestors: FundDef[];
  /** Funds that invest in the firm's areas (Courtside: Synergistic Funders). */
  peers: FundDef[];
  /** Fund names too common to match alone in the news. */
  commonNames: Set<string>;
};

export type FirmAi = {
  /** Who the AI Thesis Check screens for, after "You screen names for <firm name>, ". One sentence, ending in a period. */
  screenFor: string;
  /** The firm's own reasons to answer NO, one bullet each (the shared ones: a person, a release, a big company, a phrase). */
  rejectWhen: string[];
  /** What a YES is: "a consumer startup in one of those areas". */
  yesWhen: string;
};

/** Names the pages show for Engine features. A firm without its own branding gets the standard names (defaults.ts). */
export type FirmNames = {
  /** The Form D and Form C filings page: "Filings". */
  filings: string;
  /** Today's masthead count of the week's filings: "Filings". */
  filingsCount: string;
  /** Funds that have co-invested with the firm, and one of them in Settings' list picker: "Co-Investors", "Co-Investor". */
  coInvestors: string;
  coInvestor: string;
  /** Funds that invest in the firm's areas, and one of them in Settings' list picker: "Peer Funds", "Peer Fund". */
  peerFunds: string;
  peerFund: string;
  /** The top-bar menu that holds those three pages: "Funding". */
  fundingMenu: string;
  /** Today's middle tier, between Must See and On the Radar: "Shortlist". */
  shortlist: string;
  /** The Monday brief's sections, in sentence case (headings get Title Case): "Co-Investor deals". */
  coInvestorDeals: string;
  peerFundMoves: string;
  filingOfTheWeek: string;
  /** The daily job that reads the peer funds' news: "Peer fund watch". */
  peerFundWatch: string;
  /** The Spotlight reason when a co-investor or peer fund backs a startup: "Co-investor deal". */
  coInvestorDeal: string;
  /** The two looks' names on the switch, in Settings and ⌘K: "Dark" and "Light" (Courtside: "Night" and "Day"). */
  darkLook: string;
  lightLook: string;
};

/** The addresses of the pages a firm names its own way, each one path segment: "/filings". A firm without its own gets
 *  the standard ones (defaults.ts); Engine links only through PATHS from "@/firm", and src/app/[funding] serves them. */
export type FirmPaths = {
  /** The Form D and Form C filings page. */
  filings: string;
  /** The co-investors page. */
  coInvestors: string;
  /** The peer funds page. */
  peerFunds: string;
};

export type FirmCopy = {
  /** The outreach email's pitch, after "I'm reaching out from <firm>.": "We invest at pre-seed through Series A in …". */
  pitch: string;
  /** What the firm's specialist funds focus on, in Settings › Funds: "sports, gaming, media, creators, consumer lifestyle". */
  specialistFocus: string;
  /** The About page's line on the firm's own sources: "its Medium posts, its portfolio page and The 4th Quarter". */
  ownSources: string;
};

/** What Scout knows about a company when it writes the memo outline. Every field is ready to print. */
export type MemoFacts = {
  name: string;
  /** The industry's label, or null when Scout has none. */
  area: string | null;
  /** "$4M Seed", "Seed" or "[TBD: round size]". */
  round: string;
  play: FirmPlay | null;
  description: string;
  descriptionUrl: string | null;
  domain: string | null;
  /** The people a Form D names, with its link, or "[TBD: founders and their track record]". */
  founders: string;
  whyFits: string;
  /** "; portfolio check: competes with X (reason)", or "". */
  portfolio: string;
  /** Scout's thesis fit, 0 to 100, and the day Scout first saw it ("11-03-26"). */
  fit?: number;
  found?: string;
  /** Who backed it, from its funding news, with the story's link ("Salt VC, M13 (https://…)"), or null. */
  investors?: string | null;
  /** One line on the public signals Scout has: "4 stories from 3 outlets, newest 11-03-26 (listed at the end)". */
  signals?: string;
  /** The likely buyers in its industry with what they bought and paid, one Markdown bullet each; "" when none is loaded. */
  buyers?: string;
};

export type FirmMemo = {
  /** The memo's name, in its title and the draft prompt: "Why We Invested". The firm's own posts with this name feed the backtest. */
  title: string;
  /** The voice, after the name: "confident, specific, optimistic, never hype-y". */
  voice: string;
  /** The memo's numbered sections, in Markdown from "## 1." on. Engine adds the title, the voice note and every source. */
  outline: (f: MemoFacts) => string;
};

/** A deal a buyer did: a comp for Likely Acquirers. `date` is as exact as the source: "2025-05-12", "2025-06" or "2025".
 *  `verified` is a primary source; otherwise reported or secondary. */
export type BuyerDeal = { company: string; date: string; price: string; multiple?: string; verified: boolean; url: string };

/** A strategic buyer in the firm's industries, with its venture arm when it has one (Plan section 5, Likely Acquirers).
 *  When a pick's funding news names the arm, the card says "Buyer already invested" and this buyer leads its list. */
export type FirmBuyer = {
  name: string;
  /** The industries it buys in (area keys). */
  areas: string[];
  /** `story`: the past case in one sentence, linked to `proof`. */
  ventureArm?: { name: string; proof: string; verified: boolean; story?: string };
  deals: BuyerDeal[];
};

/** A dated fact shown under Likely Acquirers, never scored; `areas` limits it to those industries (none: every one). */
export type ExitNote = { areas?: string[]; text: string; url: string };

/** How sure a reference is (Unit Economics.md section 2): only a verified one can earn score points. */
export type RefStatus = "verified" | "reported" | "fyi" | "thumb" | "none";

/** What Scout knows about a company when it estimates a line from public signals: its own words and its news. */
export type UeText = { description: string; headlines: string[] };

/** One Unit Economics line (Plan section 5, Unit Economics). Every line is from a deck, estimated or unknown. */
export type UeLine = {
  /** Also the key a deck answer fills: "contributionMargin". */
  key: string;
  /** Title Case: "Contribution Margin". */
  label: string;
  /** Which of the four blocks it sits in (the layout of user's Startup Docs SaaS Dashboard). */
  block: "price" | "cost" | "value" | "payback";
  /** The dated reference beside it: "Median 48% · great 50%+". */
  ref: string;
  status: RefStatus;
  /** Verified lines only: a number at or past `at` earns the line's share of the points; `lower` when less is better. */
  good?: { at: number; unit: "%" | "x" | "$" | "months"; lower?: boolean };
  /** Where the reference comes from, linked beside it. */
  source?: { name: string; url: string };
  /** A rough read from public signals, naming the signal ("Its news names Sephora"); null when there is none. */
  estimate?: (t: UeText) => string | null;
};

export type FirmUnitEconomics = {
  /** The lines per area key; an area without lines shows no panel. */
  lines: Record<string, UeLine[]>;
  /** How old the references are, after the industry in the panel's heading: "Benchmarks From 2025-26 Industry Reports". */
  asOf: string;
  /** Old or narrow sources shown under the panel, never scored: `re` limits one to companies whose words match. */
  fyi?: { areas: string[]; re?: RegExp; text: string; url?: string }[];
  /** Industries whose lines can't score yet, with the reason in one sentence: a Deck Screen result there is scored
   *  without Unit Economics (out of 80 instead of 100 for Sidekick) and says why. */
  unscored?: Record<string, string>;
};

/** One line of the Deck Screen's screen: its Title Case label and what it asks, shown while the deck is read. */
export type DeckCheck = { key: string; label: string; asks: string };

/** A Deck Screen result. Shown once and never saved (user, 10-30-26), except the firm's one sample deck. */
/** How well the deck backs a check (the Status Table, user's pick, R9): each word is defined above the table. */
export type DeckStatus = "shown" | "partial" | "claimed" | "absent";
/** How hard the startup is to copy, on the four-step Moat Strength meter. */
export type MoatStrength = "thin" | "modest" | "solid" | "strong";

export type DeckResult = {
  company: string;
  oneLine: string;
  /** The area key it fits, or null. */
  area: string | null;
  stage: string | null;
  /** "$2.5M", or null when the deck doesn't say. */
  raising: string | null;
  /** Each screen line as a row of the Status Table: its status, its one key figure ("$1.2M ARR", null when there is
   *  none) and the line in brief. */
  screen: { key: string; status: DeckStatus; figure: string | null; text: string }[];
  moat: { strength: MoatStrength; text: string };
  /** The deck's vaguest claim, quoted, how well the deck backs it, and what's wrong with it in plain words. */
  vaguestClaim: { quote: string; status: DeckStatus; why: string };
  hardestQuestion: string;
  bottomLine: string;
  /** Its industry's Unit Economics lines as the deck gives them: `number` in the line's unit, null when it doesn't. */
  unitEconomics: { key: string; value: string | null; number: number | null }[];
  redFlags: { flag: string; seen: "found" | "missing" | "clear" }[];
  /** "Cartwise_Seed_Deck.pdf · 18 pages". */
  file?: string;
  /** The firm's sample deck: every made-up number reads Sample. */
  sample?: boolean;
};

export type FirmDeck = {
  /** The screen's lines in the order it reads them; Engine adds Moat, Open Questions and Bottom Line after them. */
  screen: DeckCheck[];
  /** Questions for a deck per area key, from the firm's diligence checklists: never scored. */
  redFlags: Record<string, string[]>;
  /** The one deck result kept for the demo (made up). */
  sample: DeckResult;
};

/** The firm's look beyond its colors (its brand/theme.css): the fonts its theme names, and its own logo. */
export type FirmBrand = {
  /** The Google Fonts address that loads the fonts its theme.css names. */
  fonts?: string;
  /** The firm's logo (brand/logo.svg) in the header, with this word set beside it in the brand font: "AI SCOUT". */
  logo?: { word: string };
  /** The browser bar's color on phones. */
  themeColor?: string;
  /** The look a page draws before it knows the viewer's device setting (no script yet): "light" or "dark" (the default).
   *  Every firm ships both looks (user, 11-03-26: "ensure that light and dark modes also ship with new firms"); there
   *  is no one-look firm any more, and tests/unit/firm.test.ts fails on a theme with no dark look. */
  defaultLook?: "light" | "dark";
  /** The Pipeline's list: a row per startup with its picture (the default), or the Fit Table: one table line per
   *  startup with its fit bar, found date, latest signal and funds (Sidekick, user 11-02-26: "use this pipeline"). */
  pipeline?: "rows" | "table";
  /** The Co-Investors page: a table of recent deals and a card per fund (the default), or one timeline of deals, newest
   *  first, news and shared rounds together (Sidekick, user 11-03-26, picking round 1's C: "use that version"). */
  coInvestors?: "table" | "timeline";
  /** The top of a company page: the fit and funds panels beside the picture (the default), or a cover: the picture
   *  across the card with the name, what it does and the tags on it (Sidekick, user 11-02-26: "use this version"). */
  dealSheet?: "panels" | "cover";
  /** The Trends page: a card per trend with its action bar (the default), or two columns: the story on the left with
   *  Find Startups in This Trend and See the N Stories as labeled buttons, the mentions, sparkline, outlets and Track on
   *  the right (Sidekick, user 11-04-26: round 1's B, then round 2's A, "use this version"). */
  trends?: "cards" | "columns";
  /** Startup logos (their file addresses, as Brand Sky found them) drawn white with a soft shadow on their picture.
   *  One logo at a time, picked by eye, never a rule for every dark logo (Sidekick, user 11-06-26, Trepo: "a one-time
   *  thing for that specific logo"). A new logo file at that startup draws in its own colors again. */
  whiteLogos?: string[];
};

/** An alert the Alerts page starts with (the shape of AlertRule in src/db/schema.ts). */
export type FirmAlert = { title: string; rule: { subject: string; event: string; keywords: string[]; sources: string[]; minAmount?: number } };

/** A startup the firm's team saved: from its link library, its thesis page, or named by the team. */
export type LibraryPick = { name: string; domain?: string; from: "library" | "thesis" | "team" };

export type FirmProfile = {
  /** Folder key, also the build's NEXT_PUBLIC_SCOUT_FIRM: "sidekick-partners". */
  id: string;
  /** The firm's name: "Courtside Ventures". */
  name: string;
  /** The name inside a sentence: "inside Courtside's thesis". */
  short: string;
  /** Other names the press uses for the firm ("Courtside VC"); a round's report naming any of them proves the firm was
   *  in it (the Proof Finder, src/lib/proof.ts). Leave out when the press uses the full name only. */
  aliases?: string[];
  /** The site's name in titles, Slack and the header: "Courtside Ventures Scout". */
  product: string;
  /** The site's description for search and link previews. */
  description: string;
  /** The firm's own website. */
  site: string;
  /** While set, the firm's live site deploys from this other folder (Courtside: its old repo, for good), so
   *  Engine here never opens the firm's real database: local data copies only (SCOUT_PGLITE). */
  liveElsewhere?: string;
  /** The public code link in the header and footer; "" shows none. It must open for anyone: a private repo is GitHub's
   *  404 page for every visitor (Sidekick's pointed at the private VC-Scout repo, 11-03-26), and `verify:live` fails on it. */
  repoUrl: string;
  /** People Scout tracks from the first day (the firm's team, and anyone else worth following). */
  people: FirmPerson[];
  /** The thesis: areas, keywords, filters, stage, cap, geography and plays. */
  thesis: FirmThesis;
  /** Where Scout looks: searches, feeds, YC tags, the firm's own posts. */
  sources: FirmSources;
  /** The firm's portfolio page. */
  portfolio: FirmPortfolio;
  /** The fund lists: co-investors and peer funds. */
  funds: FirmFunds;
  /** The startups the team saved, for the Library backfill. */
  library: LibraryPick[];
  /** Strategic buyers with their venture arms and comps, for Likely Acquirers. None: []. */
  buyers: FirmBuyer[];
  /** Dated facts under Likely Acquirers (exit pace, the stage buyers buy at). */
  exitNotes?: ExitNote[];
  /** The Unit Economics lines per industry (switch: unitEconomics). */
  unitEconomics?: FirmUnitEconomics;
  /** The Deck Screen's questions, red flags and sample deck (switch: deckScreen). */
  deck?: FirmDeck;
  /** Branded names that replace the standard ones; leave out any to keep the standard name. */
  names?: Partial<FirmNames>;
  /** Page addresses that replace the standard ones (a live site keeps the addresses people already link to). */
  paths?: Partial<FirmPaths>;
  /** Addresses a page used to have, each sent on to its address now (a renamed page keeps every old link working). */
  movedPaths?: Record<string, string>;
  /** Copy that names the firm's thesis. */
  copy: FirmCopy;
  /** The investment memo's name and voice. */
  memo: FirmMemo;
  /** The Alerts page's starter alerts. */
  alerts: FirmAlert[];
  /** Fonts, logo and browser color; leave out for Scout's own (Plan step 11). */
  brand?: FirmBrand;
  /** On or off for every Engine feature and source (features.ts lists them). */
  features: Record<FeatureKey, boolean>;
  /** How the firm's look answers every moving part Engine draws (effects.ts lists them): Engine's, its own, off, or
   *  not shown to user yet, which stops the launch. */
  effects: Record<EffectKey, EffectAnswer>;
  /** What the AI Thesis Check asks for this firm. */
  ai: FirmAi;
};
