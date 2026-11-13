// The firm this build is for. Every firm-specific word, list and setting comes from here (VC Scout Plan, section 0).
// "@firm-profile" points at the chosen firm folder's profile.ts (firm.config.mjs), so only that firm is bundled.
import profile from "@firm-profile";
import type { FirmNames, FirmPaths, FirmProfile } from "./types";
import { DEFAULT_NAMES, DEFAULT_PATHS } from "./defaults";
import { JOB_FEATURE, type FeatureKey } from "./features";
import { disclaimer } from "./builder";
export { BUILDER, builderFirst, builderTip, disclaimer, type Builder } from "./builder";

export const firm: FirmProfile = profile;
/** Whether this firm has a feature or source turned on. */
export const on = (key: FeatureKey) => firm.features[key] === true;
/** Whether this firm runs a daily job: a job that belongs to a feature runs only when the feature is on. */
export const jobOn = (name: string) => !JOB_FEATURE[name] || on(JOB_FEATURE[name]);
/** Every shown feature name: the firm's own where it brands one, else the standard name. */
export const NAMES: FirmNames = { ...DEFAULT_NAMES, ...profile.names };
/** Every page address a firm names its own way: the firm's own where it has one, else the standard address. */
export const PATHS: FirmPaths = { ...DEFAULT_PATHS, ...profile.paths };
/** A fund list's page, by the kind stored on every fund ("neighborhood" = co-investors, "synergistic" = peer funds). */
export const fundPath = (kind: string) => (kind === "neighborhood" ? PATHS.coInvestors : PATHS.peerFunds);
/** The peer-fund list's name inside a sentence: "synergistic funders" (one: "synergistic funder"). */
export const peerFundsWord = NAMES.peerFunds.toLowerCase();
export const peerFundWord = peerFundsWord.replace(/s$/, "");
/** "Courtside Ventures'" and "Sidekick Partners'", but "Example Firm's". */
export const possessive = (name: string) => (name.endsWith("s") ? `${name}'` : `${name}'s`);
/** The firm's short name as a key, for source-health names: "sidekick" → "sidekick-portfolio". */
export const firmSlug = firm.short.toLowerCase().replace(/[^a-z0-9]+/g, "-");
/** The top bar's two-line name, from the product: "COURTSIDE" over "VENTURES SCOUT" (until a firm's own logo, Plan step 11). */
export const BRAND_LINES = ((w: string[]) => [w[0], w.slice(1).join(" ")].map((x) => x.toUpperCase()))(firm.product.split(" ")) as [string, string];
/** The site's name in every tab title: "Sidekick Partners AI Scout (DEMO)" (the product, then the firm's titleTag). */
export const SITE_TITLE = firm.titleTag ? `${firm.product} ${firm.titleTag}` : firm.product;
/** The footer's and About page's line: Scout is user's own demo and never speaks as the firm (Plan section 1). */
/** The look a page draws before its script reads the viewer's device setting or their own pick (brand.defaultLook). */
export const DEFAULT_LOOK: "light" | "dark" = firm.brand?.defaultLook ?? "dark";
export const DISCLAIMER = disclaimer(firm.name);
export { FEATURES, NEEDS, JOB_FEATURE, INCOMPLETE, type FeatureKey } from "./features";
export type { FirmProfile, FirmPerson, FirmArea, FirmPlay, FirmWeights, MemoFacts, FirmBuyer, BuyerDeal, PortfolioCo, FirmThesis, FirmAi, FirmSources, FirmPortfolio, FirmFunds, FundDef, Shared, FirmNames, FirmPaths, FirmCopy, FirmMemo, FirmAlert, LibraryPick, CheckedDetails, CheckedFact, ExitNote, RefStatus, UeText, UeLine, FirmUnitEconomics, DeckCheck, DeckResult, DeckStatus, MoatStrength, FirmDeck, FirmBrand } from "./types";
