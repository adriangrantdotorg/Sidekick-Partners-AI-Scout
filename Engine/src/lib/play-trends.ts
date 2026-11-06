// A trend without shows (11-03-26): one of the firm's plays (thesis.plays) that this week's items match from two or more
// independent outlets, inside the thesis. Pure, so tests/unit/play-trends.test.ts holds the rule; the trends job
// (src/lib/jobs/media-jobs.ts) writes what it returns.
import type { FirmPlay } from "@/firm/types";

export type PlayItem = { title: string; text?: string | null; source: string; kind: string; url: string; date: Date | null };

/** Whether a story's industry is one of the play's own (11-04-26: a play matched any story inside the thesis, so
 *  "AI as a new storefront", an E-Commerce Software play, took a beauty retailer's store openings). A play with no
 *  industries of its own takes any story inside the thesis. */
export function inPlayArea(p: FirmPlay, area: string | null | undefined): boolean {
  return !!area && (!p.areas?.length || p.areas.includes(area));
}

/** The play's items this week and their distinct outlets; null when fewer than two outlets carry it. */
export function playTrend<T extends PlayItem>(p: FirmPlay, items: T[], inThesis: (text: string) => boolean) {
  const hits = items.filter((n) => p.re.test(`${n.title} ${n.text || ""}`) && inThesis(`${n.title} ${n.text || ""}`));
  const outlets = [...new Set(hits.map((h) => h.source.trim()).filter(Boolean))];
  return outlets.length >= 2 ? { hits, outlets } : null;
}
