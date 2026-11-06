// One producer for every shown date, money, stage and thesis label.
import { firm } from "@/firm";

/** The firm's thesis areas, in its order. */
export const AREAS: readonly string[] = firm.thesis.areas.map((a) => a.key);
export type Area = string;

export const AREA_LABEL: Record<string, string> = Object.fromEntries(firm.thesis.areas.map((a) => [a.key, a.label]));

export const STAGE_LABEL: Record<string, string> = {
  "pre-seed": "Pre-Seed",
  seed: "Seed",
  "series-a": "Series A",
  "series-b": "Series B",
  later: "Series B+",
  unknown: "Unknown",
};

export const STATUS_LABEL: Record<string, string> = {
  new: "New",
  watching: "Watching",
  reached: "Reached Out",
  passed: "Passed",
};
export const STATUSES = ["new", "watching", "reached", "passed"] as const;

export function areaLabel(a?: string | null): string {
  return a ? AREA_LABEL[a] || a : "";
}

export function stageLabel(s?: string | null): string {
  if (!s) return "Unknown";
  return STAGE_LABEL[s] || s;
}

export function pastStage(s?: string | null): boolean {
  return s === "series-b" || s === "later";
}

const pad = (n: number) => String(n).padStart(2, "0");
// Every shown date is New York time, on the server and in the browser alike.
const NY = (x: Date) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "2-digit", month: "2-digit", day: "2-digit", hour: "numeric", minute: "2-digit", hour12: true })
      .formatToParts(x)
      .map((p) => [p.type, p.value]),
  );
  return parts as Record<string, string>;
};

/** MM-DD-YY */
export function fmtDate(d: Date | string | number | null | undefined): string {
  if (d === null || d === undefined || d === "") return "";
  const x = d instanceof Date ? d : new Date(typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d + "T12:00:00Z" : d);
  if (isNaN(x.getTime())) return "";
  const p = NY(x);
  return `${p.month}-${p.day}-${p.year}`;
}

/** MM-DD-YY h:mm AM */
export function fmtExact(d: Date | string | number | null | undefined): string {
  if (d === null || d === undefined || d === "") return "";
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return "";
  const p = NY(x);
  return `${p.month}-${p.day}-${p.year} ${p.hour}:${p.minute} ${p.dayPeriod}`;
}

/** Relative time at every age: just now · 5m · 3h · 2d · 3w · 4mo · 1y ago */
export function ago(d: Date | string | number | null | undefined, now = Date.now()): string {
  if (d === null || d === undefined || d === "") return "";
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  if (isNaN(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 14) return `${days}d ago`;
  const w = Math.round(days / 7);
  if (days < 60) return `${w}w ago`;
  const mo = Math.round(days / 30.44);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(days / 365.25)}y ago`;
}

/** How long ago, in whole days and spelled out: "Today", "1 day ago", "5 days ago", "3 weeks ago" (the Shortlist's
 *  Found column, user 11-02-26: "use relative dates like 1 day ago, 5 days ago"). */
export function agoDays(d: Date | string | number | null | undefined, now = Date.now()): string {
  if (d === null || d === undefined || d === "") return "";
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  if (isNaN(t)) return "";
  const days = Math.floor(Math.max(0, now - t) / 86400000);
  const n = (k: number, unit: string) => `${k} ${unit}${k === 1 ? "" : "s"} ago`;
  if (days < 1) return "Today";
  if (days < 14) return n(days, "day");
  if (days < 60) return n(Math.floor(days / 7), "week");
  if (days < 365) return n(Math.round(days / 30.44), "month");
  return n(Math.round(days / 365.25), "year");
}

/** Countdown: "in 6h 12m", "in 3d 14h" */
export function until(d: Date | string | number | null | undefined, now = Date.now()): string {
  if (d === null || d === undefined) return "";
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  const s = Math.round((t - now) / 1000);
  if (s <= 30) return "any minute";
  const m = Math.floor(s / 60);
  if (m < 60) return `in ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `in ${h}h ${m % 60}m`;
  const days = Math.floor(h / 24);
  return `in ${days}d ${h % 24}h`;
}

export function clock(sec: number): string {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  return `${m}:${String(sec % 60).padStart(2, "0")}`;
}

export function fmtMoney(amount: number | string | null | undefined, currency = "$"): string {
  if (amount === null || amount === undefined || amount === "") return "";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!isFinite(n) || n <= 0) return "";
  const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "INR" ? "₹" : currency === "USD" ? "$" : currency;
  if (n >= 1e9) return `${sym}${(n / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
  if (n >= 1e6) return `${sym}${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${sym}${Math.round(n / 1e3)}K`;
  return `${sym}${Math.round(n)}`;
}

export function domainOf(url?: string | null): string {
  if (!url) return "";
  try {
    return new URL(url.startsWith("http") ? url : "https://" + url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function favicon(domainOrUrl?: string | null): string {
  const d = domainOrUrl?.includes("/") ? domainOf(domainOrUrl) : domainOrUrl || "";
  return d ? `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(d)}` : "";
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export { titleCase } from "./titlecase";

export function plural(n: number, one: string, many = one + "s"): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Print a domain so no browser linkifies it: an empty inline element before each dot. */
export function unlinkableParts(domain: string): string[] {
  return domain.split(".");
}

/** Next scheduled UTC run of a daily cron at hour H (weekday optional, 0=Sun). */
export function nextRun(hourUtc: number, now = new Date(), weekday?: number): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hourUtc, 0, 0));
  if (d.getTime() <= now.getTime()) d.setUTCDate(d.getUTCDate() + 1);
  if (weekday !== undefined) while (d.getUTCDay() !== weekday) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

/** A buyer's deal date, as exact as its source (Likely Acquirers): "2025-05-12" → "05-12-25", "2025-06" → "06-25", "2025" → "2025". */
/** Where a trend's Find Startups goes (11-04-26: it searched every play trend for the word "play", the first word of
 *  its id): a play trend ("play-<key>") filters the Pipeline to that play; any other trend searches for its idea. */
export function trendPipelineHref(slug: string, term: string): string {
  return slug.startsWith("play-") ? `/pipeline?play=${encodeURIComponent(slug.slice(5))}` : `/pipeline?q=${encodeURIComponent(term)}`;
}

export function dealDate(d: string): string {
  const m = d.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
  if (!m) return d;
  if (m[3]) return `${m[2]}-${m[3]}-${m[1].slice(2)}`;
  if (m[2]) return `${m[2]}-${m[1].slice(2)}`;
  return m[1];
}
