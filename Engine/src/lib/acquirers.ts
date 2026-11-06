// Likely Acquirers (VC Scout Plan section 5): the strategic buyers in a company's industry, the deals they did and what
// they paid, Claude-checked and loaded in the firm's buyers.ts and never scored. When a buyer's venture arm shows up in a company's
// funding news, the company carries Buyer Already Invested and that buyer leads its list.
import { firm, type BuyerDeal, type ExitNote, type FirmBuyer } from "@/firm";
export { dealDate } from "./format";

export type Acquirer = { name: string; arm: FirmBuyer["ventureArm"] | null; invested: boolean; deals: BuyerDeal[] };

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Whether a venture arm is named in these words: "Unilever Ventures", and "PepsiCo Ventures" for "PepsiCo Ventures Group". */
export function armNamed(arm: string, words: string): boolean {
  const forms = [arm, arm.replace(/\s+(Group|Fund|Capital)$/i, "")].filter((x, i, a) => a.indexOf(x) === i);
  return forms.some((f) => new RegExp(`(^|[^\\w])${esc(f)}(?![\\w])`, "i").test(words));
}

/** The words of a company's funding news: its rounds' investors and its headlines (where a venture arm shows up). */
export const fundingWords = (c: { funds: { rounds: { investors: string | null }[] }; signals: { title: string }[] }) => [...c.funds.rounds.map((r) => r.investors || ""), ...c.signals.map((s) => s.title)];

/** The buyer whose venture arm backed this company, from its rounds' investors and its news headlines. */
export function investedBuyer(evidence: string[]): FirmBuyer | null {
  const words = evidence.filter(Boolean).join("\n");
  return (words && firm.buyers.find((b) => b.ventureArm && armNamed(b.ventureArm.name, words))) || null;
}

const newest = (b: FirmBuyer) => b.deals.reduce((x, d) => (d.date > x ? d.date : x), "");

/** A company's likely buyers: the buyer already invested first, then buyers with a checked deal, newest deal first.
 *  `also` names the industry's active buyers with no deal loaded yet; `notes` are the dated facts for the industry. */
export function likelyAcquirers(area: string | null | undefined, evidence: string[]): { buyers: Acquirer[]; also: string[]; notes: ExitNote[]; invested: Acquirer | null } {
  const inv = investedBuyer(evidence);
  const inArea = firm.buyers.filter((b) => !!area && b.areas.includes(area));
  const pool = [...(inv && !inArea.includes(inv) ? [inv] : []), ...inArea].filter((b) => b.deals.length || b === inv);
  const rank = (b: FirmBuyer) => (b === inv ? 0 : b.deals.some((d) => d.verified) ? 1 : 2);
  const buyers = pool
    .sort((a, b) => rank(a) - rank(b) || newest(b).localeCompare(newest(a)))
    .map((b) => ({ name: b.name, arm: b.ventureArm || null, invested: b === inv, deals: [...b.deals].sort((x, y) => y.date.localeCompare(x.date)) }));
  const also = inArea.filter((b) => !b.deals.length && b !== inv).map((b) => b.name);
  const notes = (firm.exitNotes || []).filter((n) => !n.areas || (!!area && n.areas.includes(area)));
  return { buyers, also, notes, invested: buyers.find((b) => b.invested) || null };
}
