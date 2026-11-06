import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { transport, resetBackoff } from "@/lib/sources/http";
import * as F from "@/lib/sources/fetchers";

const real = transport.fetch;
const fx = (f: string) => readFileSync(`tests/fixtures/${f}`, "utf8");
type Mode = "ok" | 404 | 429 | 500 | "timeout" | "junk";
let mode: Mode = "ok";
let body = "";
let calls: string[] = [];
// the SEC is asked only with a contact (the deploy setting SEC_CONTACT_EMAIL, 11-05-26); a made-up one for the recordings
process.env.SEC_CONTACT_EMAIL ||= "scout-tests@example.com";

beforeEach(() => {
  resetBackoff();
  calls = [];
  transport.fetch = (async (url: string, init?: RequestInit) => {
    calls.push(String(url));
    if (mode === "timeout")
      return new Promise((_r, rej) => init?.signal?.addEventListener("abort", () => rej(Object.assign(new Error("aborted"), { name: "AbortError" }))));
    if (typeof mode === "number") return new Response("nope", { status: mode });
    if (mode === "junk") return new Response("<<<not xml or json", { status: 200 });
    return new Response(body, { status: 200 });
  }) as typeof fetch;
});
afterEach(() => {
  transport.fetch = real;
});

// each fetcher with its fixture, then every failure mode: nothing comes back, nothing throws
const CASES: [string, () => Promise<unknown>, string][] = [
  ["SEC daily index", () => F.secDailyIndex(new Date("2026-10-09T12:00:00Z")), "sec-daily-index.idx"],
  ["SEC latest Form D", () => F.secLatest("D"), "sec-formd-atom.xml"],
  ["SEC latest Form C", () => F.secLatest("C"), "sec-formc-atom.xml"],
  ["SEC primary doc", () => F.secPrimary("https://www.sec.gov/Archives/edgar/data/1/2/primary_doc.xml"), "sec-formd-primary.xml"],
  ["EDGAR search", () => F.edgarSearch("Slow Ventures"), "sec-efts.json"],
  ["Hacker News", () => F.hnShow(), "hn-show.json"],
  ["Y Combinator", () => F.ycAll(), "yc-all.json"],
  ["Product Hunt", () => F.productHunt(), "producthunt.xml"],
  ["App Store", () => F.appChart("6004"), "appstore-6004.json"],
  ["Google News", () => F.googleNews("x"), "gnews.xml"],
  ["Google Trends", () => F.googleTrends(), "gtrends.xml"],
  ["YouTube", () => F.youtube("UCxcTeAKWJca6XyJ37_ZoKIQ"), "youtube.xml"],
  ["Podcast", () => F.feed("https://feeds.megaphone.fm/x"), "podcast-megaphone.xml"],
  ["Industry RSS", () => F.feed("https://frontofficesports.com/feed/"), "rss-fos.xml"],
  ["Medium", () => F.feed("https://medium.com/feed/@courtsidevc"), "medium.xml"],
  ["Courtside portfolio", () => F.portfolioSlugs(), "courtside-portfolio.html"],
  ["beehiiv", () => F.beehiiv("https://snailmail.slow.co/"), "beehiiv-archive.html"],
  ["GitHub", () => F.github("sports", "2026-10-01"), "github.json"],
  ["Wayback", () => F.wayback("eloelo.in"), "wayback.json"],
  ["RDAP", () => F.rdap("eloelo.in"), "rdap.json"],
  ["iTunes search", () => F.itunesPodcast("acquired"), "itunes-search.json"],
];

const empty = (v: unknown) => v === null || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && v !== null && "items" in v && (v as { items: unknown[] }).items.length === 0);
let host = 0;

describe.each(CASES)("%s", (_name, run, fixture) => {
  it("reads its recorded response", async () => {
    mode = "ok";
    body = fx(fixture);
    const v = await run();
    expect(empty(v)).toBe(false);
  });
  for (const m of [404, 429, 500, "junk"] as Mode[])
    it(`returns nothing on ${m}`, async () => {
      mode = m;
      host++;
      const v = await run();
      expect(empty(v)).toBe(true);
    });
});

describe("timeouts", () => {
  it("a hung source returns nothing after its timeout", async () => {
    mode = "timeout";
    const { fetchText } = await import("@/lib/sources/http");
    const v = await fetchText("https://slow.example.com/feed", { timeoutMs: 200 });
    expect(v).toBeNull();
  });
});

describe("manners", () => {
  it("sends the Scout User-Agent", async () => {
    let ua = "";
    transport.fetch = (async (_u: string, init?: RequestInit) => {
      ua = String((init?.headers as Record<string, string>)["user-agent"]);
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    // Its own site address, so the test needs no .env.local (VC Scout's Engine has none: secrets stay per firm).
    vi.stubEnv("SITE_URL", "https://scout.example.com");
    const { fetchText } = await import("@/lib/sources/http");
    await fetchText("https://hn.algolia.com/api/v1/x");
    vi.unstubAllEnvs();
    expect(ua).toMatch(/^VCScout\/1\.0 \(\+https?:\/\//);
  });
  it("asks the SEC only with the deploy setting's contact, and never without one", async () => {
    let ua = "";
    transport.fetch = (async (_u: string, init?: RequestInit) => {
      ua = String((init?.headers as Record<string, string>)["user-agent"]);
      return new Response("x", { status: 200 });
    }) as typeof fetch;
    const { fetchText } = await import("@/lib/sources/http");
    vi.stubEnv("SEC_CONTACT_EMAIL", "installer@example.com");
    await fetchText("https://www.sec.gov/cgi-bin/x");
    expect(ua).toBe("VCScout/1.0 installer@example.com");
    ua = "";
    vi.stubEnv("SEC_CONTACT_EMAIL", "");
    expect(await fetchText("https://www.sec.gov/cgi-bin/y")).toBeNull();
    expect(ua).toBe("");
    vi.unstubAllEnvs();
  });
});

describe("mediaLoads: a picture or video link must really load before a card uses it", () => {
  const answer = (status: number, type: string) => ((async () => new Response(null, { status, headers: { "content-type": type } })) as unknown as typeof fetch);
  it("accepts a live image and a live video", async () => {
    const { mediaLoads } = await import("@/lib/sources/http");
    transport.fetch = answer(200, "image/jpeg");
    expect(await mediaLoads("https://www.heliosinc.ai/brand/og-home.jpg", "image")).toBe(true);
    transport.fetch = answer(200, "video/mp4");
    expect(await mediaLoads("https://www.heliosinc.ai/brand/og-home.mp4", "video")).toBe(true);
  });
  it("rejects a 404 (Helios's myhelios.com poster, 10-30-26) and a page served in place of a picture", async () => {
    const { mediaLoads } = await import("@/lib/sources/http");
    transport.fetch = answer(404, "text/html");
    expect(await mediaLoads("https://www.myhelios.com/brand/og-home.jpg", "image")).toBe(false);
    transport.fetch = answer(200, "text/html");
    expect(await mediaLoads("https://example.com/missing.jpg", "image")).toBe(false);
  });
  it("falls back to a one-byte GET when a host refuses HEAD", async () => {
    const { mediaLoads } = await import("@/lib/sources/http");
    const methods: string[] = [];
    transport.fetch = (async (_u: string, init?: RequestInit) => {
      methods.push(String(init?.method));
      return init?.method === "HEAD" ? new Response(null, { status: 405 }) : new Response(null, { status: 206, headers: { "content-type": "image/png" } });
    }) as unknown as typeof fetch;
    expect(await mediaLoads("https://cdn.example.com/a.png", "image")).toBe(true);
    expect(methods).toEqual(["HEAD", "GET"]);
  });
});
