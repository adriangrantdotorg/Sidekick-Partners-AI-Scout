// Sidekick Partners' Scout: everything that makes the shared Engine Sidekick's (VC Scout Plan, sections 0 to 5).
// Sidekick uses the standard names except Synergistic Funds (Plan section 1; renamed 11-04-26); its thesis is the five industries.
import type { FirmProfile, MemoFacts } from "../Engine/src/firm/types";
import { thesis } from "./thesis";
import { sources, portfolio } from "./sources";
import { funds } from "./funds";
import { library } from "./library";
import { buyers, exitNotes } from "./buyers";
import { unitEconomics } from "./unit-economics";
import { deck } from "./deck";

// The memo keeps the screen in Sidekick Thesis (Enhanced) section 5 (stage, business model, path to profit, founder,
// community leverage, exit path) inside a typical memo's order since 11-04-26 (below).
// Revised 11-04-26 (user: the download "doesn't actually communicate what a typical investment memo would communicate"):
// the order most memos use (Visible, Capwave, Bessemer's Twitch memo, Claude's memo guide: the call first, then company,
// problem and product, market, traction, model, team, competition, the round, risks), with Sidekick's own screen inside
// it (path to profit, community leverage, exit path). Nothing assumes a deck: what the public record answers is filled
// in, and what only the founder can answer is a question for the first meeting.
const outline = (f: MemoFacts) => `## 1. Recommendation
[TBD: take the meeting or pass, in one sentence, and the one reason that decides it.]
Thesis fit: ${f.fit ?? "[TBD]"}%${f.area ? ` in ${f.area}` : ""} (Scout's score${f.found ? `; first seen ${f.found}` : ""}).
The case in three points: [TBD]

## 2. The company
${f.description || "[TBD: one paragraph in plain words]"}${f.descriptionUrl ? `\nSource: ${f.descriptionUrl}` : ""}${f.domain ? `\nWebsite: https://${f.domain}` : ""}
Industry: ${f.area || "[TBD: which of Sidekick's five industries]"}

## 3. Problem and product
The problem: [TBD: who has the pain, and what it costs them today].
The product: [TBD: what it does, and why it beats the way they solve it now].

## 4. Market and timing
Market size: [TBD: a sourced figure, never a guess]. Why now: [TBD: what changed in the last two years].

## 5. Traction
What the public record shows: ${f.signals || "[TBD]"}.
To ask the founder: revenue, number of paying customers, and how many stay after a year: [TBD].

## 6. Business model and path to profit
How it makes money: [TBD]. Gross margin, retention, and the cost to win a customer: [TBD: ask in the first meeting].
Path to profit: [TBD: can it get there without another big round? The month and the cash it needs.]
Mark every number "from the founder", "estimated" or "unknown".

## 7. The founders
${f.founders}
Why this team wins this market: [TBD: operator or repeat founder, and their reason to own it].

## 8. Competition
[TBD: the two or three closest alternatives, and what keeps a customer from switching].${f.portfolio ? `\nScout's portfolio check${f.portfolio.replace(/^; portfolio check/, "")}.` : ""}

## 9. The round
${f.name}'s ${f.round}. Backed by: ${f.investors || "[TBD: who led, and who participated]"}.
Sidekick invests at Seed and Series A, past product, with paying customers: [TBD: is this one?]. Terms: [TBD: the raise, the valuation, Sidekick's check].

## 10. Why Sidekick
${f.whyFits || "[TBD: why it fits Sidekick's thesis]"}${f.play ? `\nThe play: ${f.play.label}, the play behind Sidekick's investment in ${f.play.parallel}.` : ""}
Community leverage: which Sidekick member or portfolio company can open the first doors (retail buyers, Shopify brands, service operators): [TBD].

## 11. Exit path
${f.buyers ? `The strategic buyers already buying${f.area ? ` in ${f.area}` : ""}, from Scout's Likely Acquirers:\n${f.buyers}` : `[TBD: the likely buyers and what they paid; Scout has no checked deal for this industry yet]`}

## 12. Risks and how they ease
[TBD: the top three risks, each with what would ease it.]
The question the founder would least like asked: [TBD].

## 13. Next steps
[TBD: what to check before a term sheet: customer calls, the numbers, references.]`;

const sidekick: FirmProfile = {
  id: "sidekick-partners",
  name: "Sidekick Partners",
  short: "Sidekick",
  // the name on screen (user, 10-29-26)
  product: "Sidekick Partners AI Scout",
  // every tab and link preview says it is a demo (user, 11-12-26)
  titleTag: "(DEMO)",
  description:
    "Deal sourcing for Sidekick Partners: Seed and Series A startups in its five industries, every fact linked to its source. An independent demo, not affiliated with Sidekick Partners.",
  site: "https://www.sidekickpartners.com",
  // the public copy (Open Source Maker, the Plan's final step, 11-05-26); it answers once user publishes it
  repoUrl: "https://github.com/adriangrantdotorg/Sidekick-Partners-AI-Scout",
  // the Sidekick Team, from sidekickpartners.com (10-29-26)
  people: [
    { name: "Collins Ward", role: "Partner, Sidekick Partners" },
    { name: "Dylan Schuler", role: "Partner, Sidekick Partners" },
    { name: "Walton Ward", role: "Partner, Sidekick Partners" },
    { name: "Andrew Pluff", role: "Chief of Staff, Sidekick Partners" },
    { name: "Eric Hardy", role: "Director of Finance, Sidekick Partners" },
    { name: "Hayden Kim", role: "Investment Associate, Sidekick Partners" },
  ],
  // the standard names (src/firm/defaults.ts), except the peer funds: Synergistic Funds (user, 11-04-26: "this should
  // not be named Consumer Funds. It should be called Synergistic Funds"): its 29 funds back all five industries, not
  // only consumer ones (funds.ts)
  names: {
    peerFunds: "Synergistic Funds",
    peerFund: "Synergistic Fund",
    peerFundMoves: "Synergistic fund moves",
    peerFundWatch: "Synergistic fund watch",
  },
  // the standard addresses, except the page named for the peer funds (Plan step 9; renamed 11-04-26)
  paths: { peerFunds: "/synergistic-funds" },
  movedPaths: { "/consumer-funds": "/synergistic-funds" },
  thesis,
  sources,
  portfolio,
  funds,
  library,
  buyers,
  exitNotes,
  // off (features.unitEconomics, 11-02-26: Scout presumes no deck); the lines stay for Phase II, if decks come in
  unitEconomics,
  deck,
  copy: {
    pitch: "We invest at Seed and Series A in premium consumer brands, consumer health, e-commerce software, vertical software with embedded payments, and tech-enabled roll-ups",
    specialistFocus: "consumer brands, consumer health, commerce software, vertical software, fintech and insurance",
    ownSources: "its portfolio page",
  },
  memo: { title: "Investment Memo", voice: "clear, numbers-first, sourced, never hype-y; private equity discipline with venture upside", outline },
  alerts: [
    { title: "Alert me when a startup inside our thesis files a Form D over $2M.", rule: { subject: "thesis", event: "formd", keywords: [], sources: ["sec"], minAmount: 2000000 } },
    { title: "Alert me when one of our co-investors or synergistic funds leads a seed round in consumer brands or consumer health.", rule: { subject: "funds", event: "lead-seed", keywords: ["consumer-brands", "consumer-health"], sources: ["news"] } },
    { title: "Alert me when funding news names a Shopify app raising a seed round.", rule: { subject: "any", event: "keywords", keywords: ["shopify", "seed"], sources: ["news"] } },
  ],
  // the look of record (design/NOTES.md, signed off 10-31-26): Boardroom on Emerald Exchange, After Hours E1 logo
  brand: {
    fonts: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@600&family=Cormorant+Garamond:wght@600;700&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap",
    logo: { word: "AI SCOUT" },
    // Trends in two columns with labeled buttons (user, 11-04-26: round 1's B, round 2's A: "use this version")
    trends: "columns",
    // Trepo's teal wordmark is drawn white on its picture (user, 11-06-26: "Change this logo to white so it looks
    // better", then "a one-time thing for that specific logo")
    whiteLogos: ["https://hellotrepo.com/media/wordmark.png"],
    themeColor: "#0d2c24",
    // two looks since 11-03-26: the signed-off cream cards are Light (drawn before the viewer's device setting is read),
    // and Dark is round 1's Charcoal and Brass (user: "use this", design/pages/DB-today.html)
    defaultLook: "light",
    // the Pipeline as a table (user, 11-02-26, picking round 5's D: "use this pipeline")
    pipeline: "table",
    // the Co-Investors page as one timeline of deals, newest first (user, 11-03-26, round 1's C: "use that version")
    coInvestors: "timeline",
    // the top of a company page as a cover (user, 11-02-26, picking round 6's B: "use this version")
    dealSheet: "cover",
  },
  // sidekickpartners.com has no newsletter and no memo series; its Shopify blog feed (/blogs/news.atom) is empty and
  // unlinked (checked 10-31-26), so there are no posts to read. No creator or podcast feeds, so no Culture and no
  // Sponsor Radar (Plan section 4). Holdings and Group filers are let in as possible roll-ups (Plan section 2). The
  // three v1 features, Start Here and Copy as Markdown are on (Plan step 10). The Deck Screen is off and marked
  // incomplete (user, 11-03-26: it "lacks the rigorous 'smell test' VCs need"; INCOMPLETE in Engine/src/firm/features.ts),
  // and with it the deck benchmarks. Settings has no Phase II or Change Log (user, 11-03-26: "from settings remove").
  // no Slack (user, 11-04-26: "if You're saying I need to create a Slack application that the users can then access,
  // then I want you to remove all mentions of Slack throughout the app"): `slack` off
  features: { firmPosts: false, creatorFeeds: false, culture: false, sponsorRadar: false, rollUpTag: true, unitEconomics: false, likelyAcquirers: true, deckScreen: false, deckBenchmarks: false, startHere: true, copyMarkdown: true, changeLog: false, phaseTwoSettings: false, slack: false },
  // Every moving part Engine draws, seen in Sidekick's look (Engine/src/firm/effects.ts; user, 11-02-26: "How do we
  // avoid this in the future, especially as we build for other firms?"). `seen` is the design page he saw it move on.
  effects: {
    liveDot: { look: "own", seen: "R8-A-today.html" }, // round 8's A: a mint dot breathing on the brass tab
    ticker: { look: "engine", seen: "R8-A-today.html" },
    headLine: { look: "off", why: "the signed-off pages (V5-today.html, V5-company.html) have no line under page headings, so the theme hides it" },
    leadCount: { look: "engine", seen: "R8-A-today.html" },
    sky: { look: "engine", seen: "R8-A-today.html" },
    sparkline: { look: "engine", seen: "review-trends-glow.html" }, // Engine's draw-in, with a mint glow (user, 11-03-26: "mint glow")
    readingStep: { look: "off", why: "the Deck Screen is off for Sidekick (features.deckScreen, 11-03-26)" },
    launchDots: { look: "engine", seen: "review-launch.html" }, // the dot and the current step's bar (user, 11-03-26: "those items look good")
  },
  ai: {
    screenFor:
      "a Seed and Series A fund that backs founder-led companies with a clear path to near-term profit: premium consumer brands, consumer health, e-commerce software, vertical software with embedded payments, and tech-enabled roll-ups and AI services.",
    rejectWhen: [
      "the business needs a technology cycle to pay off (crypto, blockchain, frontier AI models) or a long science timeline (drug discovery, biotech, deep hardware research)",
      "it is an investment fund, a bank, a real estate or energy project, or a single local shop or restaurant with no plan to scale",
    ],
    yesWhen: "a startup in one of those industries, selling to consumers or to businesses",
  },
};

export default sidekick;
