// A trend's Find Startups (11-04-26: it searched every play trend for the word "play")
import { describe, it, expect } from "vitest";
import { trendPipelineHref } from "@/lib/format";
import { firm } from "@/firm";

describe("Find Startups in This Trend", () => {
  it("a play trend filters the Pipeline to its play; any other trend searches for its idea", () => {
    expect(trendPipelineHref("play-beauty-efficacy", "clinical skincare")).toBe("/pipeline?play=beauty-efficacy");
    expect(trendPipelineHref("ai-upsells-shopify", "AI upsells")).toBe("/pipeline?q=AI%20upsells");
  });
  it("every play trend's key is one of the firm's plays", () => {
    for (const p of firm.thesis.plays) expect(trendPipelineHref(`play-${p.key}`, p.label)).toBe(`/pipeline?play=${p.key}`);
  });
});

// 11-04-26, measured on the live site's 585 stories that week: the three play trends shown were built on stories that
// didn't fit. A story counts toward a play only when the play's words hit and its industry is the play's own.
import { classify } from "@/lib/thesis";
import { inPlayArea } from "@/lib/play-trends";

const counts = (key: string, title: string) => {
  const p = firm.thesis.plays.find((x) => x.key === key)!;
  return p.re.test(title) && inPlayArea(p, classify(title).area);
};

describe("a story counts toward a play only when it fits", () => {
  it("the stories that wrongly made this week's trends no longer count", () => {
    expect(counts("beauty-efficacy", "Wrapped Health Raises $2.1M to Connect Clinical Care and Consumer Health")).toBe(false);
    expect(counts("beauty-efficacy", "AI vendors, health systems join physicians in liability for clinical AI: AMA")).toBe(false);
    expect(counts("shopify-tools", "How Much Did Shopify Raise? Funding & Key Investors")).toBe(false);
    expect(counts("shopify-tools", "Why Nespresso brought its loyalty program back from dormancy")).toBe(false);
    expect(counts("agentic-commerce", "Beauty Briefing: Violet Grey's expansion plans are taking it to Dallas and Aspen")).toBe(false);
  });
  it("stories that are the play still count", () => {
    expect(counts("shopify-tools", "Post-purchase upsell app for Shopify merchants raises a seed round")).toBe(true);
    expect(counts("beauty-efficacy", "Dermatologist-developed skincare brand raises $4M seed")).toBe(true);
  });
});
