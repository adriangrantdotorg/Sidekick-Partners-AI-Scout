// Who built the site: the footer's "Built by", the About page, Phase II's "Talk to" button and the disclaimer
// (user, 11-05-26: "credit only my site"). It lives in the firm's brand/builder.json, copied here by
// firm.config.mjs, never in Engine's code; the public copy leaves that file out, so a stranger's site credits no one.
// A Vercel setting was the first plan, but a local build reads a Production value as "[SENSITIVE]".
import data from "./builder.json";

export type Builder = { name: string; url: string };
export const BUILDER: Builder = { name: String(data.name || "").trim(), url: String(data.url || "").trim() };
/** "user" from "the user": the Talk to button's word. */
export const builderFirst = (b: Builder = BUILDER) => b.name.split(/\s+/)[0] || "";
/** The builder link's tooltip: "Opens the user on LinkedIn in a new window". */
export const builderTip = (b: Builder = BUILDER) => `Opens ${b.name}${/linkedin\.com/.test(b.url) ? " on LinkedIn" : ""} in a new window`;
/** The not-affiliated line, with the builder's name only when the firm's folder names one. */
export const disclaimer = (firmName: string, b: Builder = BUILDER) => `An independent demo${b.name ? ` by ${b.name}` : ""}. Not affiliated with or endorsed by ${firmName}.`;
