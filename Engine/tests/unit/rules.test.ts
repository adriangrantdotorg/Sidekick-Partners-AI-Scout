import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ago, until, fmtMoney, fmtDate, stageLabel, titleCase } from "@/lib/format";
import { buildIndex, linkify } from "@/lib/linkify";
import { classify } from "@/lib/thesis";
import { cleanName, isGenericName, moneyOf, stageOf, subjectOf } from "@/lib/companies";
import { whyFitsLine, portfolioCheck, scoreCompany } from "@/lib/score";
import { cleanCopy } from "@/lib/copy";
import { cleanEvidence } from "@/lib/seed";
import { isSubject, decodeGoogleNews } from "@/lib/backtest";
import { minutesToGo } from "@/lib/progress-core.mjs";

describe("format", () => {
  it("relative time at every age", () => {
    const now = Date.parse("2026-10-14T12:00:00Z");
    expect(ago(now - 10_000, now)).toBe("just now");
    expect(ago(now - 5 * 60_000, now)).toBe("5m ago");
    expect(ago(now - 3 * 3600_000, now)).toBe("3h ago");
    expect(ago(now - 2 * 86400_000, now)).toBe("2d ago");
    expect(ago(now - 21 * 86400_000, now)).toBe("3w ago");
    expect(ago(now - 120 * 86400_000, now)).toBe("4mo ago");
    expect(ago(now - 400 * 86400_000, now)).toBe("1y ago");
    expect(until(now + (6 * 60 + 12) * 60_000, now)).toBe("in 6h 12m");
  });
  it("money keeps its currency", () => {
    expect(fmtMoney(2e6, "EUR")).toBe("€2.0M");
    expect(fmtMoney(10e6, "GBP")).toBe("£10.0M");
    expect(fmtMoney(5.5e6, "$")).toBe("$5.5M");
  });
  it("dates are MM-DD-YY and stages are Title Case", () => {
    expect(fmtDate("2025-04-29")).toBe("04-29-25");
    expect(stageLabel("pre-seed")).toBe("Pre-Seed");
    expect(titleCase("all in the pipeline")).toBe("All in the Pipeline");
    // a part after " · " starts like a label of its own (Settings' notes, 11-03-26)
    expect(titleCase("Shared · the record")).toBe("Shared · The Record");
    expect(titleCase("AI Drafting · on · optional")).toBe("AI Drafting · On · Optional");
  });
});

describe("name hygiene", () => {
  it("strips backed and possessive prefixes", () => {
    expect(cleanName("Lightspeed-backed Acme")).toBe("Acme");
    expect(cleanName("India's TailBlaze")).toBe("TailBlaze");
  });
  it("keeps short real names, drops generic words and job titles", () => {
    expect(isGenericName("1club")).toBe(false);
    expect(isGenericName("Ro")).toBe(false);
    expect(isGenericName("Jump")).toBe(false);
    expect(isGenericName("Head of Innovation")).toBe(true);
    expect(isGenericName("Startup")).toBe(true);
  });
  it("valuation is not the round; sports seeding is not a round", () => {
    expect(moneyOf("Rebel Audio Raises Series A at $50 Million Valuation")).toBeNull();
    expect(moneyOf("Spash raises €2M Series A")).toEqual({ amount: 2e6, currency: "EUR" });
    expect(stageOf("Park boys soccer secures No. 2 seed in sections")).toBe("unknown");
    expect(subjectOf("Noise raises $5.5M seed to pay creators")).toBe("Noise");
  });
});

describe("why it fits and the portfolio check", () => {
  it("no portfolio tie in prose: never \"near X in the portfolio\" (10-30-26)", () => {
    // only real competitors get a tie, as the Overlaps With tag; 305 cards read "near Religion of Sports in the portfolio"
    const l = whyFitsLine({ name: "Chaos", description: "", thesisArea: "media", stage: "pre-seed", amount: 1_000_000, currency: "£", lastSignal: null });
    const line = /^A new Media company, inside .+'s thesis; raised £1\.0M pre-seed\.$/; // the firm's own name
    expect(l).toMatch(line);
    expect(cleanCopy("A new Media company in the Media area of the thesis, near Religion of Sports in the portfolio; raised £1.0M pre-seed.")).toMatch(line);
    expect(cleanCopy("An AI that runs creators' social content, close to Wizard and Stay Tuned in the portfolio; in Y Combinator.")).toBe("An AI that runs creators' social content; in Y Combinator.");
    expect(cleanCopy("An investment platform for sports and trading cards, next to Rare Candy and Kolex in the portfolio; in Y Combinator.")).toBe("An investment platform for sports and trading cards; in Y Combinator.");
  });
  it("VideoDB overlaps Graphon AI", () => {
    const c = portfolioCheck(
      { name: "VideoDB", description: "VideoDB is the video database for AI agents: search, memory and context across video and audio.", thesisArea: "media" },
      [{ name: "Graphon AI", sector: "Sports", description: "Graphon AI is an AI infrastructure company building the memory layer beneath LLMs and agents, converting messy enterprise data across video, audio, documents, and sensors into persistent, searchable context." }, { name: "Veo", sector: "Sports", description: "Veo is a camera for recording youth sports." }],
    );
    expect(c?.with).toBe("Graphon AI");
  });
  it("past Series A is penalized and the score stays 0-100", () => {
    const base = { name: "X", description: "A sports fan engagement app for fantasy leagues", thesisArea: "sports", amount: null, currency: "$", signals: [], voiceMentions: 0, sponsorShows: 0, relatedPersons: 0, yc: false, geoText: "", learned: 99, competes: false, checkRange: { minCheck: 5e5, maxCheck: 4e6 } };
    const w = { thesis: 30, stage: 20, signal: 20, culture: 15, unitEconomics: 0, team: 10, geo: 5 };
    const a = scoreCompany({ ...base, stage: "seed" }, w);
    const b = scoreCompany({ ...base, stage: "series-b" }, w);
    expect(b.score).toBeLessThan(a.score);
    expect(a.breakdown.learned).toBe(15);
    expect(a.score).toBeLessThanOrEqual(100);
  });
});

describe("words on screen", () => {
  it("cleanCopy keeps a company's own words: only Scout's \"the X pattern\" is rewritten (10-27-26)", () => {
    expect(cleanCopy("Helps users understand their nightly sleep patterns")).toBe("Helps users understand their nightly sleep patterns");
    expect(cleanCopy("the specialized-marketplace pattern behind StockX")).toBe("the specialized-marketplace play behind StockX");
  });
  it("cleanCopy removes lanes, patterns and Context only", () => {
    const s = cleanCopy("Media lane: anime, the Camb AI pattern; Context only: a domain can be older. Pre-seed");
    expect(s).not.toMatch(/\blanes?\b|pattern|Context only|Pre-seed/);
  });
  it("rejected evidence always says why; Google News redirects are dropped", () => {
    const ev = cleanEvidence([
      { url: "https://news.google.com/rss/articles/x", date: "2021-01-01", kind: "News", note: "Funding news", title: "t", counts: true },
      { url: "https://rdap.org/domain/a.com", date: "2020-01-01", kind: "Domain", note: "Context only: a domain can be older than the company", title: "t", counts: false },
    ]);
    expect(ev.length).toBe(1);
    expect(ev[0].note.startsWith("Rejected because")).toBe(true);
  });
});

describe("linkifier", () => {
  const idx = buildIndex([
    { name: "Baller League", aliases: [], href: "/company/1", ext: false },
    { name: "Camb AI", aliases: [], href: "https://camb.ai", ext: true },
  ]);
  it("links whole names once, longest first", () => {
    const segs = linkify("Like Baller League and Baller League again, plus Camb AI.", idx);
    expect(segs.filter((s) => typeof s !== "string").length).toBe(2);
  });
  it("never inside another word", () => expect(linkify("BallerLeagues", idx).every((s) => typeof s === "string")).toBe(true));
});

describe("backtest truth rules", () => {
  it("the company must be the headline's subject", () => {
    expect(isSubject("Eternal", "Doom Eternal gets a new expansion")).toBe(false);
    expect(isSubject("Eternal", "Eternal raises $13M seed for longevity")).toBe(true);
    expect(isSubject("Baller League", "Rival league takes aim at Baller League")).toBe(false);
  });
  it("never keeps a Google News redirect it cannot decode", () => expect(decodeGoogleNews("https://news.google.com/rss/articles/AU_yqLzz?oc=5")).toBeNull());
  // 11-04-26: Google's links hold only an id since 2024, so a story the backtest only decoded was always dropped (Rebuy
  // and Lantern came back "none"). The backtest and the co-investor watch open each link instead (src/lib/sources/gnews.ts).
  it("opens Google News links rather than only decoding them, in the backtest and the co-investor watch", () => {
    const bt = readFileSync(join(__dirname, "../../src/lib/backtest.ts"), "utf8");
    const fw = readFileSync(join(__dirname, "../../src/lib/jobs/funds.ts"), "utf8");
    expect(bt).toMatch(/await articleUrl\(n\.url\)/);
    expect(bt).not.toMatch(/decodeGoogleNews\(n\.url\)/);
    expect(fw).toMatch(/articleUrl\(url\)/);
  });
});

describe("news links (user, 11-04-26: \"open each link once\")", () => {
  it("every job opens the links it saved as it finishes, and Refresh Now right after its answer", () => {
    const idx = readFileSync(join(__dirname, "../../src/lib/jobs/index.ts"), "utf8");
    const run = idx.slice(idx.indexOf("export async function runNamed"));
    expect(run).toMatch(/const before = [^\n]*shownLinks\(\)/);
    expect(run).toMatch(/openSaved\(before,/);
    expect(readFileSync(join(__dirname, "../../src/app/api/refresh/route.ts"), "utf8")).toMatch(/after\([\s\S]*openNewLinks\(/);
    expect(readFileSync(join(__dirname, "../../src/lib/sources/fetchers.ts"), "utf8")).toMatch(/ownAddresses\(P\.parseGoogleNews/);
  });
  it("a deploy never starts the backtest of the firm's deals: the weekly job waits for the first full run", () => {
    const other = readFileSync(join(__dirname, "../../src/lib/jobs/other.ts"), "utf8");
    expect(other).toMatch(/if \(await getSetting<string \| null>\(BACKTESTED, null\)\) await portfolioBacktest\(ctx\)/);
    expect(readFileSync(join(__dirname, "../../src/lib/jobs/backtest-portfolio.ts"), "utf8")).toMatch(/if \(all\) await setSetting\(BACKTESTED/);
  });
  it("a run's page counts the whole job, not each round", async () => {
    const { wholeCount } = await import("@/lib/progress-core.mjs");
    const j = { key: "links-all", label: "x", state: "now" as const };
    expect(wholeCount(j, { stage: "news links, opened once", done: 15, total: 391 })).toEqual({ done: 15, total: 391 });
    expect(wholeCount(j, { stage: "news links, opened once", done: 5, total: 326 })).toEqual({ done: 70, total: 391 }); // round 2
    expect(wholeCount(j, { stage: "another stage", done: 2, total: 9 })).toEqual({ done: 2, total: 9 });
  });
  // 11-04-26: an older live-runs.sh ignored an unknown "--where" and started the live runs by mistake
  it("the live runs start only with --go, and an unknown word starts nothing", async () => {
    const { spawnSync } = await import("node:child_process");
    const run = (...a: string[]) => spawnSync("bash", ["scripts/live-runs.sh", ...a], { encoding: "utf8", env: { ...process.env, SCOUT_PGLITE: "/no/such/copy.tar.gz" } });
    const dry = run();
    expect(dry.status).toBe(0);
    expect(dry.stdout).toMatch(/Nothing started/);
    for (const w of ["--where", "--help", "go"]) {
      const r = run(w);
      expect(r.status, w).toBe(2);
      expect(r.stdout + r.stderr, w).not.toMatch(/Log:|\[pipeline\]/);
    }
  });
  // the project hook lives in the private repo's .claude/ (Open Source Maker leaves it out of the public copy)
  it.skipIf(!existsSync(join(__dirname, "../../../.claude/hooks/live-run-gate.py")))("no session starts a live run without user's words: the project hook's own test passes", async () => {
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync("python3", [join(__dirname, "../../../.claude/hooks/live-run-gate.py"), "--test"], { encoding: "utf8" });
    expect(r.stdout + r.stderr).toMatch(/self-test: ok/);
    expect(JSON.parse(readFileSync(join(__dirname, "../../../.claude/settings.json"), "utf8")).hooks.PreToolUse.some((e: { hooks: { command: string }[] }) => e.hooks.some((h) => h.command.includes("live-run-gate.py")))).toBe(true);
  });
  // 11-04-26: vitest read this worktree's .env.local, so a test reached Sidekick's live database and wrote its
  // Settings › Sources rows; vitest.config.ts now drops every database address
  it("unit tests never reach a real database", () => {
    for (const k of ["DATABASE_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL", "PGHOST"]) expect(process.env[k], k).toBeUndefined();
  });
});

describe("build progress estimate", () => {
  it("rounds to 5 minutes and pauses while waiting", () => {
    const now = Date.now();
    const p = { step: 4, name: "x", startedAt: now - 1e6, stepStartedAt: now - 60_000, updatedAt: now, note: "", waiting: false, liveUrl: "", done: false, durations: { 1: 240, 2: 360, 3: 240 } };
    expect(minutesToGo(p, now)).toBeGreaterThanOrEqual(1);
    const w = { ...p, waiting: true, waitingSince: now - 600_000 };
    expect(minutesToGo(w, now)).toBe(minutesToGo(w, now + 3_600_000));
  });
});

/* ---------- source guards ---------- */
function files(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) files(p, out);
    else if (/\.(tsx?|css|mjs)$/.test(f)) out.push(p);
  }
  return out;
}
const SRC = files("src").map((f) => ({ f, s: readFileSync(f, "utf8") }));

describe("guards on the source", () => {
  it("only a startup takes a vote: every vote button is that startup's own vote (user, 11-05-26: \"startup votes only\")", () => {
    // a vote on a deal, filing, trend, founder, alert hit or sponsor was saved and counted, and nothing read it; only a
    // startup's vote moves its fit score (src/lib/jobs/score.ts). A row tied to a startup votes for that startup.
    const bad: string[] = [];
    for (const { f, s } of SRC)
      for (const m of s.matchAll(/<Vote\s+k=\{`([a-z_]+):/g)) if (m[1] !== "company") bad.push(`${f}: a "${m[1]}" vote (vote for the row's startup, k={\`company:\${id}\`}, or show none)`);
    expect(bad).toEqual([]);
    const api = readFileSync("src/app/api/vote/route.ts", "utf8");
    expect(api).toMatch(/const TYPES = new Set\(\["company"\]\)/);
  });
  it("no native confirm() or alert(), and no error through toast()", () => {
    for (const { f, s } of SRC) {
      expect(s, f).not.toMatch(/(^|[^.\w])(window\.)?(confirm|alert)\(/);
      expect(s, f).not.toMatch(/toast\([^)]*(error|failed|didn't)/i);
    }
  });
  it("every Undo is ready the moment its action starts: ui.undoable, never an Undo added after the save (10-26-26)", () => {
    // a ⌘Z pressed before a save landed did nothing, or undid the action before it
    for (const { f, s } of SRC) if (!f.endsWith("ui.tsx")) expect(s, f).not.toMatch(/pushUndo/);
    expect(SRC.filter(({ s }) => /ui\.undoable\(/.test(s)).length).toBeGreaterThanOrEqual(5);
  });
  it("a picture with a fallback is an <Img onFail>, never a bare <img onError> (10-30-26)", () => {
    // a server-rendered picture that failed before React attached onError stayed broken instead of falling back
    for (const { f, s } of SRC) for (const m of s.matchAll(/<img\b[^>]*onError=/g)) expect(m.index === s.indexOf("<img ref={ref} alt={alt} {...p} onError={onFail} onLoad=") ? "Img" : m[0], f).toBe("Img");
  });
  it("nothing truncates text", () => {
    for (const { f, s } of SRC) expect(s, f).not.toMatch(/text-overflow:\s*ellipsis|line-clamp/);
  });
  it("no page reloads itself", () => {
    for (const { f, s } of SRC) expect(s, f).not.toMatch(/http-equiv=["']refresh|location\.reload\(|window\.location\s*=[^=]|setInterval\([^)]*router\.refresh/);
  });
  it("a grid's smallest column fits a phone: a minimum past 260px is written min(<px>, 100%) (11-03-26)", () => {
    // the Deck Screen's benchmark boxes (320px) and reading steps (360px) ran past a 390px phone inside a card's padding
    const themes = readdirSync(join("..")).map((d) => join("..", d, "brand", "theme.css")).filter((p) => { try { return statSync(p).isFile(); } catch { return false; } });
    for (const { f, s } of [...SRC.filter((x) => x.f.endsWith(".css")), ...themes.map((f) => ({ f, s: readFileSync(f, "utf8") }))])
      for (const m of s.matchAll(/minmax\((\d+)px/g)) expect(Number(m[1]) <= 260 ? "fits" : m[0], f).toBe("fits");
  });
  // Courtside's rule, 10-14-26: "The whole site sat still on a Mac with Reduce Motion on" → the OS switch is ignored and
  // motion is Settings › Appearance › Motion. It held only in Courtside's browser suite, which never runs in VC Scout,
  // so later Engine parts and Sidekick's theme obeyed Reduce Motion again (11-03-26: "they are not glowing").
  it("motion never follows the Mac's Reduce Motion: Scout's own Motion switch (html[data-motion=off]) turns it off", () => {
    const themes = readdirSync(join("..")).map((d) => join("..", d, "brand", "theme.css")).filter((p) => { try { return statSync(p).isFile(); } catch { return false; } });
    const scripts = readdirSync("scripts").map((f) => join("scripts", f)).filter((f) => statSync(f).isFile());
    for (const { f, s } of [...SRC, ...[...themes, ...scripts].map((f) => ({ f, s: readFileSync(f, "utf8") }))])
      expect(/prefers-reduced-motion|reducedMotion/.test(s) ? `${f}: write html[data-motion="off"] <selector> instead` : "ok", f).toBe("ok");
  });
  it("no :visited rule", () => {
    for (const { f, s } of SRC.filter((x) => x.f.endsWith(".css"))) expect(s, f).not.toMatch(/:visited/);
  });
  it("cron jobs run at most once a day, at most 100", () => {
    const v = JSON.parse(readFileSync("vercel.json", "utf8"));
    expect(v.crons.length).toBeLessThanOrEqual(100);
    for (const c of v.crons) expect(c.schedule).toMatch(/^\d+ \d+ \* \* (\*|\d)$/);
  });
});

describe("round 1 fixes (10-14-26)", () => {
  it("double-encoded entities never reach the screen", async () => {
    const { unescapeTwice, cleanCopy } = await import("@/lib/copy");
    expect(unescapeTwice("You&amp;#8217;ll &amp;amp; me")).toBe("You’ll & me");
    expect(cleanCopy("won&#8217;t")).toBe("won’t");
  });
  it("a why-it-fits line never starts with punctuation", () => {
    for (const description of ["Tailblaze Longevity.", "Park Boys Soccer", "", "Mochi is."]) {
      const l = whyFitsLine({ name: "X", description, thesisArea: "health", stage: "pre-seed", amount: 300000, currency: "$", lastSignal: null });
      expect(l, description).toMatch(/^[A-Z]/);
    }
  });
  it("the portfolio check never calls an adjective shared ground", () => {
    const r = portfolioCheck({ name: "Alpha", description: "A focused mobile sleep tracking app for athletes", thesisArea: "health" }, [{ name: "Beta", sector: "health", description: "A focused mobile recovery tracking app for athletes" }]);
    expect(r?.reason || "").not.toMatch(/focused|mobile/);
  });
  it("the six weights always add up to 100 after one moves", async () => {
    const { rebalance, WLABEL } = await import("@/components/settings/SettingsView");
    const parts = WLABEL.map(([k]) => k); // the firm's own score parts (Sidekick has no Culture)
    const even = Math.floor(100 / parts.length);
    const w: Record<string, number> = Object.fromEntries(parts.map((k, i) => [k, i ? even : 100 - even * (parts.length - 1)]));
    for (const n of [0, 12, 45, 60]) {
      const r = rebalance(w, "thesis", n);
      expect(parts.reduce((a, k) => a + r[k], 0)).toBe(100);
      expect(r.thesis).toBe(n);
      expect(Object.values(r).every((v) => v >= 0 && v <= 60)).toBe(true);
    }
  });
  it("no live slot is followed by punctuation (the period would float)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const bad: string[] = [];
    const walk = (d: string) => {
      for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (/\.tsx$/.test(f) && /<(Until|Ago|Clock)\b[^>]*\/>\s*[.,;:)]/.test(fs.readFileSync(p, "utf8"))) bad.push(p);
      }
    };
    walk("src");
    expect(bad).toEqual([]);
  });
});

describe("round 3 fixes (10-14-26)", () => {
  it("a mention keeps the first letter of its sentence", async () => {
    const { extractMentions } = await import("@/lib/extract");
    const m = extractMentions("Scott Galloway: This is Where Nike Went Wrong.\nWith Nike's stock down, Scott breaks it down.", "Pivot", ["Nike"]);
    expect(m[0]?.quote.startsWith("Scott")).toBe(true);
  });
});

describe("labels never start with an exclamation mark (user, 11-02-26: \"no where in the app should be things like '! A Claim'\")", () => {
  it("no JSX text or string on screen opens with '! '", () => {
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
    const files = [...walk("src/components"), ...walk("src/app")].filter((f) => /\.tsx?$/.test(f));
    const hits = files.flatMap((f) =>
      readFileSync(f, "utf8")
        .split("\n")
        .map((line, i) => ({ line, i }))
        .filter(({ line }) => /(>|["'`])\s*!\s+[A-Z]/.test(line))
        .map(({ i }) => `${f}:${i + 1}`),
    );
    expect(hits, "say the state in words or a mark, never '! Word'").toEqual([]);
  });
});

// user, 11-03-26: "I tracked a company, then went to the tracking page. I had to hit refresh to see that company".
// The browser keeps its own copies of pages it has loaded; only a save through src/lib/client.ts (postJSON / sendJSON)
// tells the Shell to drop them. A save with a bare fetch would bring the stale page back.
describe("every save goes through the shared helper, so the next page shows it", () => {
  it("no component saves with a bare fetch", () => {
    const rf = readFileSync;
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(`${d}/${f}`).isDirectory() ? walk(`${d}/${f}`) : [`${d}/${f}`]));
    const READS = /"\/api\/deck"/; // reading a deck saves nothing
    // the code that runs in the browser: every "use client" file (server code, such as the Slack post, is not a page save)
    const bad = walk("src")
      .filter((f) => /\.(tsx?|mjs)$/.test(f) && !f.endsWith("src/lib/client.ts") && /^["']use client["']/m.test(rf(f, "utf8")))
      .flatMap((f) => rf(f, "utf8").split("\n").map((l, i) => ({ f, i: i + 1, l })))
      .filter(({ l }) => /fetch\(/.test(l) && /method:\s*"(POST|PATCH|PUT|DELETE)"/.test(l) && !READS.test(l))
      .map(({ f, i }) => `${f}:${i}`);
    expect(bad, "save through postJSON / sendJSON from @/lib/client").toEqual([]);
  });
  it("a POST that only reads never announces a save (it made every page refresh itself forever)", () => {
    const [rd, st, rf] = [readdirSync, statSync, readFileSync];
    const walk = (d: string): string[] => rd(d).flatMap((f) => (st(`${d}/${f}`).isDirectory() ? walk(`${d}/${f}`) : [`${d}/${f}`]));
    const READ_ROUTES = /(postJSON|sendJSON)[^(]*\(\s*(?:"POST",\s*)?"\/api\/(votes|backtest|slack\/test)"/;
    const bad = walk("src").filter((f) => /\.tsx?$/.test(f)).flatMap((f) => rf(f, "utf8").split("\n").map((l, i) => ({ f, i: i + 1, l }))).filter(({ l }) => READ_ROUTES.test(l)).map(({ f, i }) => `${f}:${i}`);
    expect(bad, "read the live counts, a backtest step and Slack's test through readJSON").toEqual([]);
  });
  it("the shared helper announces a save and the Shell refreshes on it", () => {
    expect(readFileSync("src/lib/client.ts", "utf8")).toMatch(/if \(!opts\.read\) changed\(\);\n\s+return \{ ok: true/);
    // a Server Action, not router.refresh alone: refresh clears only the page on screen (Next.js 16 docs, use-router)
    const shell = readFileSync("src/components/Shell.tsx", "utf8");
    expect(shell).toMatch(/pagesChanged\(\)/);
    // drawn by Shell for every firm, never inside a part a firm can switch off (it first sat in DeckCatch)
    expect(shell).toMatch(/\n      <SaveRefresh \/>\n/);
    expect(readFileSync("src/app/actions.ts", "utf8")).toMatch(/^"use server";[\s\S]*revalidatePath\("\/", "layout"\)/);
  });
});


// 11-04-26 (user: "broken design", Today's masthead in Light): since Sidekick got Light and Dark looks, Engine's
// `html[data-theme="light"] X` rules outranked the firm's own `X` in its theme.css, so the masthead became a dark band
// with Courtside's red glow and the sparklines lost their mint glow. Engine's Light rules sit inside :where(), so the
// firm's look, read last, always wins on the same element.
describe("a save purges twice: once at once, once after any page rebuilt from before it has landed (11-05-26)", () => {
  // the Tracking test's trace: the save at 13.41 s, the purge at 14.1 s, then Tracking's cached copy was a HIT built
  // from before the save (another test's visit had started rebuilding it), and the old list stayed on screen
  it("SaveRefresh schedules a second purge and redraw after the last save", () => {
    const shell = readFileSync(join(__dirname, "..", "..", "src", "components", "Shell.tsx"), "utf8");
    const fn = shell.slice(shell.indexOf("function SaveRefresh() {"), shell.indexOf("export function Shell("));
    expect(fn).toMatch(/again = setTimeout\(\(\) => void pagesChanged\(\)\.catch\(\(\) => undefined\)\.then\(\(\) => router\.refresh\(\)\), SECOND_PURGE_MS\)/);
    expect(fn).toMatch(/clearTimeout\(again\)/);
    expect(shell).toMatch(/export const SECOND_PURGE_MS = 2500;/);
  });
});

describe("browser tests never change data another test reads at the same time (11-05-26)", () => {
  // The browser tests run three at a time on one server. "Press every button" untracked Cartwise while round4's
  // Tracking test was checking for it: 2 of 6 side-by-side runs failed, 0 of 3 alone (the "needs a refresh" sightings
  // of 11-04 and 11-05 were this). A button that changes shared data is pressed only by its own test, which puts it back.
  const read = (f: string) => readFileSync(join(__dirname, "..", "e2e", f), "utf8");
  it("press-every-button skips Track, the votes and Add, locally too", () => {
    const s = read("clicks.spec.ts");
    expect(s).toMatch(/const SHARED = \["track", "up", "down", "add"\]/);
    expect(s).toMatch(/^\s*if \(await b\.evaluate\(\(el, s\) => s\.includes\(el\.getAttribute\("data-act"\) \|\| ""\), SHARED\)\) continue;/m);
  });
  it("a browser test that tracks a startup untracks it before it ends", () => {
    for (const f of readdirSync(join(__dirname, "..", "e2e")).filter((x) => x.endsWith(".spec.ts"))) {
      const s = read(f);
      const tracks = (s.match(/data-act="track"\]\[aria-pressed="false"\]/g) || []).length;
      const undoes = (s.match(/\/api\/track", \{ data: \{[^}]*on: false/g) || []).length;
      expect(undoes, `${f}: tracks ${tracks} startup(s); post on: false to /api/track at the end of each test`).toBeGreaterThanOrEqual(tracks);
    }
  });
});

describe("a firm's own look always wins over Engine's Light rules", () => {
  it("Engine's CSS never weighs a rule by the Light look", () => {
    const bad: string[] = [];
    for (const f of ["src/app/globals.css", "src/app/v2.css", "src/app/progress.css"])
      readFileSync(f, "utf8").split("\n").forEach((l, i) => {
        if (/(?<!:where\()html\[data-theme="light"\]/.test(l)) bad.push(`${f}:${i + 1}`);
      });
    expect(bad, 'write it as :where(html[data-theme="light"]) .x').toEqual([]);
  });
});

// Neon's free plan allows 5 GB of network transfer a month per Scout; Courtside's was at 85% by 11-06-26, and one browser
// run on its live database read 243 MB. Browser tests run on a copy; long runs on GitHub start only by user's button.
describe("a live database's free transfer (11-06-26)", () => {
  it("the browser tests refuse to start on a live database", () => {
    expect(readFileSync("playwright.config.ts", "utf8")).toMatch(/if \(!LIVE && !process\.env\.SCOUT_PGLITE\)\s*throw/);
  });
  it("Live Runs starts only from the Run workflow button, and offers only firms and runs the engine has", async () => {
    const y = readFileSync("../.github/workflows/live-runs.yml", "utf8");
    const on = y.slice(y.indexOf("\non:"), y.indexOf("\nconcurrency:"));
    expect(on).toMatch(/workflow_dispatch:/);
    expect(on).not.toMatch(/\b(push|pull_request|schedule|workflow_run):/);
    expect(y).not.toMatch(/\$\{\{\s*inputs\.[^}]*\}\}[^\n]*\bnpx\b/); // inputs reach the shell as env, never pasted in
    const block = (name: string) => [...(on.split(new RegExp(`\\n\\s+${name}:\\n`))[1] || "").split(/\n\s+default:/)[0].matchAll(/^\s+- ([\w-]+)$/gm)].map((m) => m[1]);
    const { JOBS, ON_DEMAND } = await import("@/lib/jobs");
    const runs = block("run");
    expect(runs.length).toBeGreaterThan(0);
    for (const r of runs.filter((r) => r !== "ship-day-fill")) expect(r in JOBS || r in ON_DEMAND, r).toBe(true);
    // ship-day-fill runs a launch's fill on GitHub (11-06-26): every job it names must exist
    expect(runs).toContain("ship-day-fill");
    const fill = y.slice(y.indexOf("ship-day-fill)"), y.indexOf(";;", y.indexOf("ship-day-fill)")));
    const jobs = [...fill.matchAll(/pipeline-all\.ts ([\w -]+?) "--rounds/g)].flatMap((m) => m[1].split(" "));
    expect(jobs).toEqual(["backfill", "library", "score", "enrich", "thesis-check-all"]);
    for (const j of jobs) expect(j in JOBS || j in ON_DEMAND, j).toBe(true);
    // the AI runs can't use the Mac's Vercel token on GitHub
    expect(y).toMatch(/AI_GATEWAY_API_KEY: \$\{\{ secrets\.AI_GATEWAY_API_KEY \}\}/);
    const firms = block("firm");
    expect(firms.length).toBeGreaterThan(0);
    for (const f of firms) {
      const key = f.toUpperCase().replace(/-/g, "_");
      expect(y, `a database secret line for ${f}`).toContain(`inputs.firm == '${f}' && secrets.DATABASE_URL_${key}`);
      expect(y, `a site address for ${f}`).toMatch(new RegExp(`inputs\\.firm == '${f}' && 'https://`));
    }
  });
});
