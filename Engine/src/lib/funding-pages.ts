// The Funding menu's three pages, by the address segment each firm gives them (VC Scout Plan step 9). src/app/[funding]
// serves exactly these, so Sidekick's /synergistic-funds and Courtside's live /synergistic-funders are the same page.
// A firm's old address for one of them (movedPaths: Sidekick's /consumer-funds) is served too, as a redirect.
import { NAMES, PATHS, firm, on } from "@/firm";

export type FundingPage = "filings" | "coInvestors" | "peerFunds";

const segment = (path: string) => path.replace(/^\//, "");

/** "synergistic-funds" → the peer funds page, with its title. */
export const FUNDING_PAGES: Record<string, { page: FundingPage; title: string }> = {
  [segment(PATHS.filings)]: { page: "filings", title: NAMES.filings },
  [segment(PATHS.coInvestors)]: { page: "coInvestors", title: NAMES.coInvestors },
  [segment(PATHS.peerFunds)]: { page: "peerFunds", title: NAMES.peerFunds },
};

/** "consumer-funds" → "/synergistic-funds": a Funding page's old one-segment address and where it lives now. */
export const MOVED_FUNDING: Record<string, string> = Object.fromEntries(
  Object.entries(firm.movedPaths ?? {})
    .filter(([from, to]) => /^\/[^/]+$/.test(from) && FUNDING_PAGES[segment(to)] && !FUNDING_PAGES[segment(from)])
    .map(([from, to]) => [segment(from), to]),
);

/** The Filings page's line on what the daily read drops, from the firm's own Form D rule: Courtside drops real estate
 *  and banking, Sidekick lets them in (CoverForce and StartSure are insurance companies it backed). */
export function filingsDrops(drop: RegExp = firm.thesis.formD.drop): string {
  const kinds = (
    [
      ["pooled funds", "Pooled Investment Fund"],
      ["real estate", "Real Estate"],
      ["oil and gas", "Oil and Gas"],
      ["banking", "Commercial Banking"],
    ] as const
  )
    .filter(([, group]) => drop.test(group))
    .map(([word]) => word);
  return kinds.length > 1 ? `${kinds.slice(0, -1).join(", ")} and ${kinds[kinds.length - 1]}` : kinds[0] || "pooled funds";
}

/** The roll-up note under it, for a firm that tags Holdings and Group filers (switch: rollUpTag). */
export const rollUpNote = () => (on("rollUpTag") ? " Filers named Holdings or Group stay in, tagged Possible Roll-Up Vehicle." : "");
