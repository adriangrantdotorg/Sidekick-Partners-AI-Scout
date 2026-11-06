// The firm's fund lists (its folder's funds.ts), and the helpers every reader shares.
import { firm } from "@/firm";
export type { FundDef, Shared } from "@/firm";

/** Funds that have shared a deal with the firm (Courtside: the Neighborhood), stored with kind "neighborhood". */
export const CO_INVESTORS = firm.funds.coInvestors;
/** Funds that invest in the firm's areas (Courtside: Synergistic Funders), stored with kind "synergistic". */
export const PEER_FUNDS = firm.funds.peers;
/** Names shared with other things: queries need "venture OR VC OR seed" and a round in the headline. */
export const COMMON_NAMES = firm.funds.commonNames;

export function normName(n: string) {
  return n.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");
}

/** Seed fund ids were assigned in this order: the co-investors, then the peer funds (Courtside: 65, then 41). */
export const SEED_ORDER = [...CO_INVESTORS.map((f) => f.name), ...PEER_FUNDS.map((f) => f.name)];
