// The Proof Finder (Plan step 13b, 11-04-26), on pages captured from the real sources that day
// (tests/fixtures/proof/): Google News' RSS, its redirect page and batchexecute answer, Rebuy's newsroom (its seed,
// with Sidekick), PR Newswire's Mangomint Series B (no Sidekick) and TechCrunch's WordPress search (Lantern's seed).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { addressOf, articleUrl, batchBody, decodeGoogleNews, googleId, resetLinks, signatureOf } from "@/lib/sources/gnews";
import { transport, resetBackoff } from "@/lib/sources/http";
import { companyNames, dateOf, earliest, fundsInRound, namesIn, pressPages, proofFrom, reputable, tidy, type Proof } from "@/lib/proof";

const fx = (f: string) => readFileSync(join(__dirname, "../../fixtures/proof", f), "utf8");
const realFetch = transport.fetch;
afterEach(() => {
  transport.fetch = realFetch;
  resetLinks();
  resetBackoff();
});

describe("Google News links", () => {
  const rss = fx("gnews-rebuy-sidekick.xml");
  const link = rss.match(/<link>(https:\/\/news\.google\.com\/rss\/articles\/[^<]+)<\/link>/)![1];

  it("hold only an id today, so the old decoding finds no address", () => {
    expect(googleId(link)).toMatch(/^CBMi/);
    expect(decodeGoogleNews(link)).toBeNull();
  });

  it("are traded for the article's address the way Google's own page does", () => {
    const sig = signatureOf(fx("gnews-article-page.html"));
    expect(sig).not.toBeNull();
    const sent = JSON.parse(JSON.parse(decodeURIComponent(batchBody(googleId(link)!, sig!).slice("f.req=".length)))[0][0][1]);
    expect(sent.slice(-3)).toEqual([googleId(link), Number(sig!.ts), sig!.sg]);
    expect(addressOf(fx("gnews-batchexecute.txt"))).toBe("https://techcrunch.com/2023/02/24/rebuy-commerce-personalization-series-a/");
  });

  it("open to the article itself, and a link Google no longer opens is never kept", async () => {
    transport.fetch = (async (u: string | URL | Request) =>
      new Response(String(u).includes("batchexecute") ? fx("gnews-batchexecute.txt") : fx("gnews-article-page.html"), { status: 200 })) as typeof fetch;
    expect(await articleUrl(link)).toBe("https://techcrunch.com/2023/02/24/rebuy-commerce-personalization-series-a/");
    resetLinks();
    resetBackoff();
    transport.fetch = (async () => new Response("<html>no signature</html>", { status: 200 })) as typeof fetch;
    expect(await articleUrl(link)).toBeNull();
  }, 15_000);
});

describe("a proof", () => {
  it("is a reputable page that names the company, Sidekick Partners and the round (Rebuy's own release)", () => {
    const p = proofFrom(fx("rebuy-seed.html"), "https://www.rebuyengine.com/news-room/rebuy-raises-4m-series-seed-investment-led-by-peterson-ventures", { company: "Rebuy", via: "own-site" })!;
    expect(p).not.toBeNull();
    expect(p.quote).toContain("Sidekick Partners");
    expect(p.round).toBe("seed");
    expect(p.date).toBe("2021-12-15"); // "Published: Dec 15, 2021", not the menus' other dates
    expect(p.amount).toBe(4_400_000);
  });

  it("counts a news site's report too, not only the startup's own (user, 11-04-26): TechCrunch on Lantern", () => {
    const [post] = JSON.parse(fx("techcrunch-wp-lantern.json"));
    const p = proofFrom(post.content.rendered, post.link, { company: "Lantern Platform", via: "outlet-search", title: post.title.rendered, date: post.date.slice(0, 10) })!;
    expect(p).not.toBeNull();
    expect(p.quote).toMatch(/participation from Sidekick Partners/);
    expect(p.round).toBe("seed");
    expect(p.date).toBe("2025-10-16");
  });

  it("is never a funding story that leaves the firm out (Mangomint's Series B)", () => {
    expect(proofFrom(fx("mangomint-series-b.html"), "https://www.prnewswire.com/news-releases/mangomint-raises-35-million-series-b-302241113.html", { company: "Mangomint", via: "news-funding" })).toBeNull();
  });

  it("counts investor directories (user, 11-04-26: \"these should of course count\"), never a social post, a job ad or a Google link", () => {
    for (const u of ["https://www.linkedin.com/posts/x", "https://x.com/sidekick/status/1", "https://venturecapitalcareers.com/companies/sidekick-partners/jobs/1", "https://news.google.com/rss/articles/CBMi"]) expect(reputable(u)).toBe(false);
    for (const u of ["https://techcrunch.com/2023/02/24/x/", "https://www.prnewswire.com/news-releases/x.html", "https://www.rebuyengine.com/news-room/x", "https://www.crunchbase.com/organization/rebuy", "https://www.cbinsights.com/investor/sidekick-partners", "https://pitchbook.com/profiles/company/1"]) expect(reputable(u)).toBe(true);
  });

  it("reads a directory's deal row as a proof (CB Insights' table: date, round, company, amount, co-investors)", () => {
    const html = "<title>Sidekick Partners Investments</title><p>Sidekick Partners Investments Activity. Date Round Company Amount New? Co-Investors Sources 2/24/2023 Series A Rebuy $17M No Dynamism Capital, M13, R-Squared Ventures, and Salt VC.</p>";
    const p = proofFrom(html, "https://www.cbinsights.com/investor/sidekick-partners", { company: "Rebuy", via: "fund-list" })!;
    expect(p).not.toBeNull();
    expect(p.round).toBe("series-a");
  });

  it("dates a firm's deal by the first round it joined: Rebuy's seed, not its Series A", () => {
    const p = (date: string, round: string) => ({ company: "Rebuy", url: `https://x/${round}`, date, round, amount: null, currency: "$", quote: "", title: "", via: "own-site" }) as Proof;
    expect(earliest([p("2023-02-24", "series-a"), p("2021-12-15", "seed"), { ...p("", "x"), date: null }])!.round).toBe("seed");
  });

  it("names the other funds in the same round, for the co-investors", () => {
    const p = proofFrom(fx("rebuy-seed.html"), "https://www.rebuyengine.com/news-room/rebuy-raises-4m-series-seed-investment-led-by-peterson-ventures", { company: "Rebuy", via: "own-site" })!;
    expect(fundsInRound(p, ["Peterson Ventures", "M13", "LEAD"])).toEqual(["Peterson Ventures"]);
  });
});

describe("names and pages", () => {
  it("match the press's short name, capitals and headlines in capitals", () => {
    expect(companyNames("Lantern Platform")).toEqual(["Lantern Platform", "Lantern"]);
    expect(namesIn("MANGOMINT RAISES $35 MILLION", "Mangomint")).toBe(true);
    expect(namesIn("the green lantern's sidekick", "Lantern")).toBe(false);
    expect(namesIn("backed by sidekick partners", "Sidekick Partners")).toBe(true);
  });

  it("read a startup's sitemap for its funding pages first, then its press pages (none of 'express')", () => {
    const urls = ["https://www.mangomint.com/features/express-booking/", "https://lantern.is/press", "https://www.rebuyengine.com/news-room/series-a-announcement", "https://www.mangomint.com/blog/series-a-funding-announcement/", "https://x.com/pricing"];
    expect(pressPages(urls)).toEqual(["https://www.rebuyengine.com/news-room/series-a-announcement", "https://www.mangomint.com/blog/series-a-funding-announcement/", "https://lantern.is/press"]);
  });

  it("date a release by its dateline when it has no date tags", () => {
    expect(dateOf("<p>DALLAS, Texas, Feb. 24, 2023 /PRNewswire/ -- Rebuy raised</p>", "https://x/y")).toBe("2023-02-24");
    expect(dateOf("<p>nothing</p>", "https://techcrunch.com/2025/10/16/lantern/")).toBe("2025-10-16");
  });
});

describe("tidy", () => {
  const p = (url: string, title: string, date: string, via: Proof["via"] = "own-site", quote = "We raised $4.4 million from Peterson Ventures and Sidekick Partners.") => ({ company: "Rebuy", url, date, round: null, amount: null, currency: "$", quote, title, via }) as Proof;
  it("drops a round's sentence shown as a teaser on another page of the same site (the dry run, 11-04-26)", () => {
    const seed = p("https://www.rebuyengine.com/news-room/rebuy-raises-4m-series-seed", "Rebuy Raises $4.4M Series Seed Investment", "2021-12-15");
    const teaser = p("https://www.rebuyengine.com/news-room/shopify-plus-certified-app", "Rebuy Joins Shopify Plus Certified App Program", "2021-11-08");
    expect(tidy([seed, teaser]).map((x) => x.url)).toEqual([seed.url]);
    expect(earliest(tidy([seed, teaser]))!.date).toBe("2021-12-15");
  });
  it("keeps the page's own words over the Claude-checked note for the same address", () => {
    const hand = p("https://x.com/seed", "Rebuy: seed", "2021-12-15", "fund-list", "Salt VC and Sidekick Partners in Rebuy's seed, checked by hand.");
    const page = p("https://x.com/seed", "Rebuy Raises Seed", "2021-12-15");
    expect(tidy([hand, page])).toEqual([page]);
  });
});
