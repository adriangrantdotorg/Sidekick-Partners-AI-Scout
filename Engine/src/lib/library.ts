// The startups the firm's team saved (its library.ts), for the Library backfill (user, 10-26-26): each gets a name search for its funding
// story, and the AI Thesis Check is the screen, so only a consumer startup in the thesis, under the cap, gets a card.
// Scout can't read Notion: this list was pulled on 10-26-26 and is pulled again when the pages change.
import { isSubject } from "./backtest";
import { stageOf, moneyOf, normKey } from "./companies";
import { domainOf } from "./format";
import { usd, CAP } from "./v2";

export type { LibraryPick } from "@/firm";
import type { CheckedFact, LibraryPick } from "@/firm";
import { firm } from "@/firm";

/** The firm's saved startups (its folder's library.ts). */
export const LIBRARY: LibraryPick[] = firm.library;

/** The saved startup a company is: the same domain, else the same name. */
export function pickFor(c: { name: string; domain: string | null }): LibraryPick | undefined {
  const d = c.domain ? domainOf(c.domain) : null;
  return LIBRARY.find((p) => (d && p.domain && domainOf(p.domain) === d) || normKey(p.name) === normKey(c.name));
}

/** The facts the team added for this company (its saved startup's `details`), or none. */
export function checkedFacts(c: { name: string; domain: string | null }): CheckedFact[] {
  return pickFor(c)?.details?.facts || [];
}

// "bags" only with an amount after it: "the viral Pierre Laborde bags" are handbags, not a raise (10-26-26)
const FUNDING = /\b(raises|raised|secures|closes|nabs|funding|seed round|pre-seed|series a)\b|\bbags\s+(an?\s+)?[$€£\d]/i;
/** A funding story counts for two years: an older seed is likely past Courtside's stage by now. */
export const LIBRARY_DAYS = 730;

export type Story = { title: string; url: string; date: string | null; text?: string; outlet?: string };

/** The newest story that names this company as raising money, or null. A later round (Series B and on) or one round
 *  of $15M or more means the company is past Courtside's stage, so there is no card. */
export function libraryStory<T extends Story>(name: string, items: T[], now = Date.now()): (T & { stage: string; amount: number | null; currency: string }) | null {
  const fresh = items
    .filter((n) => isSubject(name, n.title) && FUNDING.test(n.title) && (!n.date || now - Date.parse(n.date) < LIBRARY_DAYS * 86400000))
    .sort((a, b) => (b.date ? Date.parse(b.date) : 0) - (a.date ? Date.parse(a.date) : 0));
  const n = fresh[0];
  if (!n) return null;
  const stage = stageOf(n.title);
  if (stage === "later" || stage === "series-b") return null;
  const m = moneyOf(n.title);
  if (m && (usd(m.amount, m.currency) ?? 0) >= CAP) return null;
  return { ...n, stage, amount: m?.amount ?? null, currency: m?.currency || "$" };
}
