// npm run verify:live -- <url>: the live checks with AI off, then the read-only browser suite, then the residue query.
import { firmNames, namesIn, pageText } from "../src/lib/proof";
import { UA_NAME } from "../src/lib/sources/http";
import { config } from "dotenv";
import { execFileSync } from "node:child_process";
import { SHARE_LIMITS } from "../src/lib/share";
import { BUILDER, DISCLAIMER, NAMES, PATHS, firm, on } from "../src/firm";
config({ path: ".env.local", quiet: true });

const LIGHT = process.argv.includes("--light"); // the launch's check: pages and sources only; the browser suite and residue run in `npm run release`
const url = (process.argv.slice(2).find((a) => !a.startsWith("--")) || process.env.SITE_URL || "").replace(/\/$/, "");
if (!url) throw new Error("usage: npm run verify:live -- <url>");
const fails: string[] = [];
const ok = (c: boolean, m: string) => (c ? console.log("✓ " + m) : (fails.push(m), console.log("✗ " + m)));
const get = async (p: string) => {
  const r = await fetch(url + p, { headers: { "user-agent": "VCScout/1.0 verify" } });
  return { status: r.status, html: await r.text(), landed: r.url };
};
const count = (html: string, re: RegExp) => (html.match(re) || []).length;
const warn = (m: string) => console.log("⚠️ " + m);
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL!);
// a site's age, from its first job: a new firm with no seed has no trends for its first two weeks (Sidekick, 11-03-26)
const [age] = (await sql`select coalesce(extract(epoch from now() - min(started_at)) / 86400, 0)::int as days, (select count(*) from backtests where courtside and verdict = 'win')::int as backtests from job_runs`) as { days: number; backtests: number }[];

const home = await get("/");
// A per-deploy address (project-xxxxxxxxx.vercel.app) is behind Vercel Authentication and lands on vercel.com's login
// page; every content check would then fail for no reason of the site's (third dry run, 10-14-26). Say it once and stop.
if (/^https:\/\/vercel\.com\//.test(home.landed)) {
  console.log(`✗ ${url} is behind Vercel's login wall (it landed on ${home.landed.split("?")[0]}); check the public address, https://<project>.vercel.app`);
  process.exit(1);
}
ok(home.status === 200, "home answers 200");
ok(!home.html.includes('data-testid="building"'), "the Building page is switched off");
// V2's Today (10-27-26): Must See, The Combine, On the Radar. V1's Spotlight, top picks, Velocity and Courtside post are gone.
ok(count(home.html, /class="x-tile hero/g) === 1, "Must See shows one startup");
const combine = count(home.html, /class="x-rr"/g);
ok(combine >= 5 && combine <= 10, `${NAMES.shortlist} ranks the top startups (${combine} of 10)`);
ok(count(home.html, /class="x-tile link"/g) >= 10, "On the Radar shows at least 10 startups");
const pl = await get("/pipeline");
ok(pl.status === 200 && count(pl.html, /stageText/g) >= 5, "pipeline cards render");
const tr = await get("/trends");
const trends = count(tr.html, /class="rowcard tcard"/g);
if (trends < 5 && age.days < 14) warn(`${trends} trends so far: a new site builds them from two weeks of signals (day ${age.days + 1} of 14)`);
else ok(trends >= 5, "at least 5 trends");
// Sponsor Radar and Culture only for a firm with them; without, their pages answer 404 (switches: sponsorRadar, culture)
const sp = await get("/sponsors");
if (on("sponsorRadar")) {
  const brands = Number((sp.html.match(/(\d+)(?:<!-- -->)? brands/) || [])[1] || 0);
  ok(brands >= 30, `at least 30 Sponsor Radar brands (${brands})`);
} else ok(sp.status === 404, "no Sponsor Radar page");
const cu = await get("/culture");
if (on("culture")) ok(count(cu.html, /<blockquote/g) >= 10, "at least 10 Culture entries with sources");
else ok(cu.status === 404, "no Culture page");
const fd = await get(PATHS.filings);
// no SEC contact (the installer skipped it at launch): Scout never asks the SEC, so no Form D rows yet
if (process.env.SEC_CONTACT_EMAIL) ok(count(fd.html, /data-act="source"[^>]*>SEC EDGAR|>SEC EDGAR</g) >= 1, "Form D rows");
else warn("no SEC_CONTACT_EMAIL in the project's environment, so Scout reads no SEC filings: add one on vercel.com");
const nb = await get(PATHS.coInvestors);
ok(nb.status === 200, `${NAMES.coInvestors} answers`);
const sy = await get(PATHS.peerFunds);
ok(sy.status === 200, `${NAMES.peerFunds} answers`);
const bt = await get("/backtest");
if (!age.backtests) warn("the Backtest page has no deal Scout would have found first yet (npm run pipeline:all -- portfolio-backtest)");
else {
  // round 1's C, Try It First (11-04-26): each deal found first is a tile, and no "no earlier signal" list is shown
  ok(count(bt.html, /class="bt-tile"/g) >= age.backtests && !/No Earlier Signal|class="card2 none"/.test(bt.html), "backtest shows only the deals found first");
  // every deal's date comes from a reputable page that names the firm (the Proof Finder, Plan step 13b)
  const wins = (await sql`select company, announce_url from backtests where courtside and verdict = 'win' and announce_url is not null`) as { company: string; announce_url: string }[];
  const named: string[] = [];
  const unread: string[] = [];
  for (const w of wins) {
    const r = await fetch(w.announce_url, { headers: { "user-agent": `${UA_NAME}/1.0` } }).catch(() => null);
    const t = r?.ok ? await r.text() : "";
    if (!t) unread.push(w.company); // a site that turns scripts away (403) is read by hand, not failed
    else if (!firmNames().some((n) => namesIn(pageText(t), n))) named.push(w.company);
  }
  ok(!named.length, `each backtest's round is a page that names ${firm.name}${named.length ? ` (not: ${named.join(", ")})` : ""}`);
  if (unread.length) warn(`couldn't read the round's page for ${unread.join(", ")}: open it and check it names ${firm.name}`);
}
// every news link a company page shows is the outlet's own within a day (News Links, src/lib/jobs/links.ts); a link
// Google refused keeps Google's address and is tried again weekly, so this warns, never fails
const [gl] = (await sql`select count(*)::int n from signals where url like '%news.google.com/%articles/%' and created_at < now() - interval '2 days'`) as { n: number }[];
if (gl.n) warn(`${gl.n} company news links older than 2 days still go through Google News: npm run pipeline:all -- links-all:10 (a link Google refused stays, tried again after 7 days)`);
const ab = await get("/about");
// the builder's link only when the firm's folder names a builder (brand/builder.json; a stranger's copy has none)
ok((!BUILDER.url || ab.html.includes(BUILDER.url)) && ab.html.replace(/&#x27;|&#39;/g, "'").includes(DISCLAIMER), BUILDER.url ? "About: Talk to the builder and the not-affiliated line" : "About: the not-affiliated line");
for (const p of ["/icon.png", "/favicon.ico"]) ok((await fetch(url + p)).status === 200, `${p} answers`);
// View on GitHub opens for anyone: GitHub answers a private repo with its 404 page (Sidekick's, 11-03-26). A warning, not
// a stop: user keeps Sidekick's on the private repo until the Plan's final step, then it switches to the public one
// ("Leave as is for now", 11-03-26)
if (firm.repoUrl && (await fetch(firm.repoUrl, { redirect: "follow" }).catch(() => null))?.status !== 200)
  console.log(`⚠️ View on GitHub opens a private or missing repo (${firm.repoUrl}): switch it to the public repo at the Plan's final step`);
// The share image (10-31-26): a link to Scout on LinkedIn showed a grey box with a cut-off description.
const tag = (k: string) => (home.html.match(new RegExp(`<meta[^>]+(?:property|name)="${k}"[^>]+content="([^"]*)"`)) || [])[1] || "";
const ogImage = tag("og:image").replace(/&amp;/g, "&");
const ogImg = ogImage ? await fetch(ogImage) : null;
ok(/^https:\/\//.test(ogImage) && ogImg?.status === 200 && /^image\/(jpeg|png)/.test(ogImg.headers.get("content-type") || ""), `the share image loads (${ogImage || "none"})`);
const shareDesc = tag("og:description").replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
ok(shareDesc.length > 0 && shareDesc.length <= SHARE_LIMITS.description, `the share description fits LinkedIn's one line (${shareDesc.length} of ${SHARE_LIMITS.description} characters)`);
ok(tag("twitter:card") === "summary_large_image", "X shows the large share image");
// the official websites on Today's cards answer (V2's Visit Website)
const links = [...home.html.matchAll(/class="x-web w1 known" href="(https?:[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&")).slice(0, 5);
ok(links.length >= 1, `Today's cards link official websites (${links.length})`);
for (const l of links) {
  const r = await fetch(l, { method: "GET", redirect: "follow", headers: { "user-agent": "Mozilla/5.0" } }).catch(() => null);
  ok(!!r && (r.ok || [401, 403, 429].includes(r.status)), `website answers: ${l.slice(0, 70)}`);
}
if (!LIGHT) {
// residue is measured as rows the browser suite ADDS, never against zero: the team's own clicks
// (a status change, a tracked trend) are real use, not residue (10-14-26, user's review left three rows).
const counts = async () => ((await sql`select (select count(*) from votes)::int v, (select count(*) from companies where tracked)::int t, (select count(*) from trends where tracked)::int tt, (select count(*) from change_log)::int c`) as { v: number; t: number; tt: number; c: number }[])[0];
const before = await counts();
// the browser suite, read-only
try {
  execFileSync("npx", ["playwright", "test", "tests/e2e/site.spec.ts", "tests/e2e/clicks.spec.ts", "tests/e2e/smoke.spec.ts"], { stdio: "inherit", env: { ...process.env, LIVE_URL: url } });
  ok(true, "browser suite on the live URL");
} catch {
  ok(false, "browser suite on the live URL");
}
// residue
const after = await counts();
const d = { v: after.v - before.v, t: after.t - before.t, tt: after.tt - before.tt, c: after.c - before.c };
ok(d.v === 0 && d.t === 0 && d.tt === 0 && d.c === 0, `residue left by the suite: votes ${d.v}, trackers ${d.t}, tracked trends ${d.tt}, change_log ${d.c}`);
}
console.log(fails.length ? `\n${fails.length} live check(s) failed` : "\nall live checks green");
process.exit(fails.length ? 1 : 0);
