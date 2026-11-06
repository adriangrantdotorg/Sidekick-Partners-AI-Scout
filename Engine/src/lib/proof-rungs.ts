// The Proof Finder's sources, in the order it tries them (src/lib/proof.ts). Its own module so Settings › Sources,
// a client component, can name them without loading the finder.
export const RUNGS = {
  "fund-list": "Rounds Already Checked by AI",
  "own-site": "The Startup's Own Site",
  "news-firm": "Google News: Company and Firm by Name",
  "outlet-search": "Search on News Sites",
  "news-funding": "Google News Funding Stories, Each Read",
} as const;
export type Rung = keyof typeof RUNGS;
/** The news sites whose own WordPress search the Proof Finder asks ("Search on News Sites"); a firm adds more in
 *  `sources.proofOutlets`. */
export const PROOF_OUTLETS = ["techcrunch.com", "www.modernretail.co", "www.glossy.co", "www.beautyindependent.com", "fortune.com", "dallasinnovates.com"];
