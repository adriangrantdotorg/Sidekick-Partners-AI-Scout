// user, 11-03-26, on Sidekick's empty Trends page: "there should be trends". Trends came only from shows, and Sidekick
// has the creator feeds off; now a play the thesis names counts once two independent outlets carry it this week.
import { describe, it, expect } from "vitest";
import { playTrend } from "@/lib/play-trends";

const play = { key: "protein-creep", label: "protein and fiber in foods people already buy", parallel: "Seven Sundays", re: /\b(high[- ]protein|prebiotic)\b/i, areas: ["consumer-brands"] };
const item = (title: string, source: string) => ({ title, source, kind: "news", url: `https://x.example/${encodeURIComponent(title)}`, date: new Date() });
const yes = () => true;

describe("a play becomes a trend from two independent outlets", () => {
  it("two outlets: a trend", () => {
    const t = playTrend(play, [item("High-protein cereal brand raises seed", "Food Dive"), item("The prebiotic soda boom", "Axios")], yes);
    expect(t?.outlets).toEqual(["Food Dive", "Axios"]);
  });
  it("one outlet twice: not yet", () => {
    expect(playTrend(play, [item("High-protein cereal raises", "Food Dive"), item("Prebiotic soda grows", "Food Dive")], yes)).toBeNull();
  });
  it("outside the thesis: not counted", () => {
    expect(playTrend(play, [item("High-protein dog food", "A"), item("Prebiotic horse feed", "B")], () => false)).toBeNull();
  });
});
