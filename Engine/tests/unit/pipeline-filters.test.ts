// The Pipeline's address holds its filters, page and view (user, 11-10-26: Back from a startup on page 3 opened
// page 1), the Details menu hides startups Scout knows nothing about, and Funds Raised offers Under $5M.
import { describe, expect, it } from "vitest";
import { filtersFrom, pageFrom, pipelineQuery, matches } from "@/components/Pipeline";
import { FUNDS_OPTS, UNDER_5M, bucketOf, fundsLabel, hasDetails, inFunds } from "@/lib/v2";
import { radarFrom, radarKeys } from "@/components/V2";
import type { CompanyCard } from "@/lib/queries";

const card = (x: Partial<CompanyCard>) => ({ name: "Nocionix", domain: null, descSegs: [], signals: [], score: 60, votes: 0, bucket: 2, known: false, thesisArea: "consumer-health", play: null, firstSeen: new Date().toISOString(), ...x }) as CompanyCard;

describe("the Pipeline's address", () => {
  it("round-trips every filter, the page and the view", () => {
    const f = { ...filtersFrom(new URLSearchParams()), q: "AI upsells", bucket: UNDER_5M, details: "known", score: "50", area: "consumer-health" };
    const qs = pipelineQuery(f, 2, "list");
    expect(qs).toBe("q=AI+upsells&funds=lt5&area=consumer-health&min=50&details=known&page=3");
    const back = new URLSearchParams(qs);
    expect(filtersFrom(back)).toEqual(f);
    expect(pageFrom(back)).toBe(2);
  });
  it("leaves page 1 and an empty list out, and a bad page reads as page 1", () => {
    expect(pipelineQuery(filtersFrom(new URLSearchParams()), 0, "list")).toBe("");
    expect(pipelineQuery(filtersFrom(new URLSearchParams()), 4, "board")).toBe("view=board");
    for (const p of ["", "0", "1", "-3", "abc"]) expect(pageFrom(new URLSearchParams({ page: p }))).toBe(0);
  });
  it("still reads the links other pages open: the masthead's ?seen=today and ?min=, a trend's ?play= and ?q=", () => {
    const f = filtersFrom(new URLSearchParams("seen=today&min=55&play=shopify-tools&q=AI%20upsells"));
    expect([f.seen, f.score, f.play, f.q]).toEqual(["today", "55", "shopify-tools", "AI upsells"]);
  });
});

describe("Details: a startup with no description of its own and no website", () => {
  it("has no details; a real description or a website is enough", () => {
    expect(hasDetails({ description: null, domain: null })).toBe(false);
    expect(hasDetails({ description: "  Raised $2M.  ", domain: null })).toBe(false);
    expect(hasDetails({ description: "Single-estate olive oil in a refill tin.", domain: null })).toBe(true);
    expect(hasDetails({ description: null, domain: "nextvein.com" })).toBe(true);
  });
  it("Has Details hides it, No Details shows only it", () => {
    const f = filtersFrom(new URLSearchParams());
    expect(matches(card({ known: false }), { ...f, details: "known" }, Date.now())).toBe(false);
    expect(matches(card({ known: true }), { ...f, details: "known" }, Date.now())).toBe(true);
    expect(matches(card({ known: true }), { ...f, details: "unknown" }, Date.now())).toBe(false);
  });
});

describe("Funds Raised: Under $5M", () => {
  it("takes every startup with a known amount under $5M, and never an unknown one", () => {
    expect([0, 999_999, 1_000_000, 4_999_999, 5_000_000].map((n) => inFunds(bucketOf(n), UNDER_5M))).toEqual([false, true, true, true, false]);
    expect(inFunds(bucketOf(null), UNDER_5M)).toBe(false);
    expect(inFunds(2, "2")).toBe(true);
    expect(inFunds(3, "")).toBe(true);
  });
  it("sits in the menu after Under $1M, with its label", () => {
    expect(FUNDS_OPTS.map(([, l]) => l).slice(0, 3)).toEqual(["Unknown", "Under $1M", "Under $5M"]);
    expect(fundsLabel(UNDER_5M)).toBe("Under $5M");
    expect(fundsLabel("")).toBe("All");
  });
});

describe("Today's On the Radar keeps its place the same way", () => {
  it("round-trips its filters and Show More", () => {
    const f = { bucket: UNDER_5M, area: "consumer-health", fit50: true, newonly: true };
    const k = radarKeys(f, 36);
    expect(k).toEqual({ funds: "lt5", area: "consumer-health", fit: "50", new: "1", shown: "36" });
    expect(radarFrom(new URLSearchParams(Object.entries(k)))).toEqual({ f, limit: 36 });
  });
  it("an empty or odd address is the first 18 tiles, unfiltered", () => {
    expect(radarFrom(new URLSearchParams("shown=abc"))).toEqual({ f: { bucket: "", area: "", fit50: false, newonly: false }, limit: 18 });
    expect(Object.values(radarKeys({ bucket: "", area: "", fit50: false, newonly: false }, 18)).every((v) => v === "")).toBe(true);
  });
});
