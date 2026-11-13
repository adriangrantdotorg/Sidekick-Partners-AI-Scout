// The standard names every firm gets unless its profile brands its own (VC Scout Plan, sections 1 and 4).
import type { FirmNames, FirmPaths } from "./types";

export const DEFAULT_NAMES: FirmNames = {
  filings: "Filings",
  filingsCount: "Filings",
  coInvestors: "Co-Investors",
  coInvestor: "Co-Investor",
  peerFunds: "Peer Funds",
  peerFund: "Peer Fund",
  fundingMenu: "Funding",
  shortlist: "Shortlist",
  coInvestorDeals: "Co-investor deals",
  peerFundMoves: "Peer fund moves",
  filingOfTheWeek: "Filing of the week",
  peerFundWatch: "Peer fund watch",
  coInvestorDeal: "Co-investor deal",
  darkLook: "Dark",
  lightLook: "Light",
};

/** The standard page addresses (VC Scout Plan step 9). */
export const DEFAULT_PATHS: FirmPaths = {
  filings: "/filings",
  coInvestors: "/co-investors",
  peerFunds: "/peer-funds",
};

/** Coined names that are retired (VC Scout Plan step 12): Sidekick's first drafts and Courtside's own branding. Engine
 *  and a firm show one only when the firm brands it as its own (its profile's `names`: Courtside's "The Combine").
 *  Guards: tests/unit/names.test.ts (Engine's words, the standard names, every profile) and tests/e2e/labels.spec.ts
 *  (every page as drawn). */
export const RETIRED_NAMES: { name: string; re: RegExp }[] = [
  // the word, never a name with Lane in it ("West Lane Capital", a buyer in Sidekick's portfolio notes)
  { name: "lanes", re: /\blanes?\b|(?<![A-Z][\w'&.-]* )\bLanes?\b(?! [A-Z])/ },
  { name: "Trade-Up Brands", re: /\bTrade-Up Brands\b/i },
  { name: "Brand Tools", re: /\bBrand Tools\b/i },
  { name: "Vertical Software + Payments", re: /\bVertical Software \+ Payments\b/i },
  // the industry's name of record is "Tech-Enabled Roll-Ups + AI Services"
  { name: "Roll-Ups + AI Services", re: /(?<!Tech-Enabled )\bRoll-Ups \+ AI Services\b/i },
  { name: "Deck Drop", re: /\bDeck Drop\b/ },
  // every Scout says "demo" (user, 11-12-26: "on all scout sites it should say demo, no longer use the term prototype")
  { name: "prototype", re: /\bprototypes?\b/i },
  // nobody checks by hand; what Claude checks is "Claude-checked", and only in notes, never on a page (user, 11-04-26)
  { name: "hand-checked", re: /\bhand[- ](?:checked|loaded|verified)\b/i },
  { name: "Claude-checked", re: /\bClaude[- ]checked\b/i },
  // Sidekick's peer funds back all five industries, so they are Synergistic Funds (user, 11-04-26)
  { name: "Consumer Funds", re: /\bConsumer Funds?\b/i },
  { name: "Unit Economics Read", re: /\bUnit Economics Read\b/i },
  { name: "Exit Map", re: /\bExit Map\b/i },
  { name: "Portfolio Pulse", re: /\bPortfolio Pulse\b/i },
  { name: "Intro Match", re: /\bIntro Match\b/i },
  { name: "Founder Watch", re: /\bFounder Watch\b/i },
  { name: "The Combine", re: /\bThe Combine\b/ },
  { name: "Neighborhood deals", re: /\bNeighborhood deals?\b/i },
  { name: "Synergistic funder moves", re: /\bSynergistic funder moves\b/i },
  { name: "Form D of the week", re: /\bForm D of the week\b/i },
  { name: "Money Moves", re: /\bMoney Moves\b/ },
];
