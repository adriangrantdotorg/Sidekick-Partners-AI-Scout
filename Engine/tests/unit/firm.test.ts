// The Firm Template's guards (VC Scout Plan, section 0): every firm answers every switch, every firm folder is known,
// and Engine's own code never spells a firm's name (a firm's words live in its folder and reach Engine through "@/firm").
import { describe, it, expect, vi } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { FIRMS, REPO_ROOT, profilePath } from "../../firm.config.mjs";
import { FEATURES, NEEDS, JOB_FEATURE, INCOMPLETE } from "@/firm";
import type { FirmProfile } from "@/firm";
import { DEFAULT_PATHS } from "@/firm/defaults";

const ids = Object.keys(FIRMS) as (keyof typeof FIRMS)[];
const load = async (id: keyof typeof FIRMS) => (await import(pathToFileURL(profilePath(id)).href)).default as FirmProfile;

describe("every firm answers every switch", () => {
  for (const id of ids)
    it(`${FIRMS[id]} says on or off for every feature and source`, async () => {
      const p = await load(id);
      expect(p.id).toBe(id);
      const missing = Object.keys(FEATURES).filter((k) => typeof (p.features as Record<string, unknown>)[k] !== "boolean");
      const unknown = Object.keys(p.features).filter((k) => !(k in FEATURES));
      expect(missing, `${FIRMS[id]}/profile.ts: add ${missing.map((k) => `${k}: true | false`).join(", ")} to features`).toEqual([]);
      expect(unknown, `${FIRMS[id]}/profile.ts: ${unknown.join(", ")} is not a feature in Engine/src/firm/features.ts`).toEqual([]);
    });
});

// user, 11-03-26: the Deck Screen came off Sidekick "as incomplete … if in the future we decide to 'activate' that
// plugin, we'll know from this note". Turning on an incomplete feature fails here, with its note as the message.
describe("an incomplete feature stays off until it is finished (src/firm/features.ts, INCOMPLETE)", () => {
  for (const id of ids)
    it(`${FIRMS[id]} turns on no incomplete feature`, async () => {
      const p = await load(id);
      const on = Object.keys(INCOMPLETE).filter((k) => p.features[k as keyof typeof FEATURES]);
      expect(on.map((k) => `${FIRMS[id]}/profile.ts turns on ${k}. ${INCOMPLETE[k as keyof typeof FEATURES]} Then delete its line in INCOMPLETE.`)).toEqual([]);
    });
  it("every incomplete feature is a real switch with its note", () => {
    for (const [k, why] of Object.entries(INCOMPLETE)) {
      expect(k in FEATURES, k).toBe(true);
      expect(why!.length, k).toBeGreaterThan(40);
    }
  });
});

describe("a feature that reads another one's data is on only with it (Plan step 9)", () => {
  for (const id of ids)
    it(`${FIRMS[id]}: Culture and Sponsor Radar only with the creator feeds`, async () => {
      const p = await load(id);
      const broken = Object.entries(NEEDS).filter(([k, need]) => p.features[k as keyof typeof FEATURES] && !p.features[need]);
      expect(broken.map(([k, need]) => `${k} needs ${need}`)).toEqual([]);
    });
  it("every job a feature owns is a real job", async () => {
    const { ALL_JOBS } = await import("@/lib/jobs");
    for (const [job, key] of Object.entries(JOB_FEATURE)) {
      expect(ALL_JOBS[job], job).toBeTruthy();
      expect(key in FEATURES, key).toBe(true);
    }
  });
});

describe("every firm's page addresses (Plan step 9)", () => {
  const appFolders = readdirSync(join(REPO_ROOT, "Engine", "src", "app")).filter((f) => !f.startsWith("[") && statSync(join(REPO_ROOT, "Engine", "src", "app", f)).isDirectory());
  for (const id of ids)
    it(`${FIRMS[id]}: one segment each, all different, never another page's address`, async () => {
      const p = await load(id);
      const paths = Object.values({ ...DEFAULT_PATHS, ...p.paths });
      for (const x of paths) {
        expect(x, `${FIRMS[id]}/profile.ts paths`).toMatch(/^\/[a-z0-9]+(-[a-z0-9]+)*$/);
        expect(appFolders, `${x} is already a page in src/app`).not.toContain(x.slice(1));
      }
      expect(new Set(paths).size).toBe(paths.length);
    });
  it("Engine's code links those pages only through PATHS, never by an address", async () => {
    const all = new Set<string>(Object.values(DEFAULT_PATHS));
    for (const id of ids) for (const x of Object.values((await load(id)).paths || {})) all.add(x);
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx|mjs)$/.test(f)) files.push(p);
      }
    };
    walk(join(REPO_ROOT, "Engine", "src"));
    walk(join(REPO_ROOT, "Engine", "scripts"));
    const hits: string[] = [];
    for (const f of files)
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/^\s*(\/\/|\*|\/\*)/.test(line) || f.endsWith(join("firm", "defaults.ts"))) return;
          for (const x of all) if (new RegExp(`["'\`]${x}(?=["'\`#?])`).test(line)) hits.push(`${f.slice(REPO_ROOT.length + 1)}:${i + 1}: ${x}`);
        });
    expect(hits, "link through PATHS or fundPath() from @/firm").toEqual([]);
  });
});


describe("every firm folder is known", () => {
  it("a folder at the repo root with a profile.ts is listed in FIRMS (Engine/firm.config.mjs)", () => {
    const folders = readdirSync(REPO_ROOT).filter((f) => !f.startsWith(".") && existsSync(join(REPO_ROOT, f, "profile.ts")));
    const listed = Object.values(FIRMS) as string[];
    expect(folders.filter((f) => !listed.includes(f)), "add these folders to FIRMS").toEqual([]);
    expect(listed.filter((f) => !folders.includes(f)), "these FIRMS have no profile.ts").toEqual([]);
  });
});

describe("Engine names no firm", () => {
  it("no firm's name, short name or product appears in Engine's code outside comments", async () => {
    const names = new Set<string>();
    for (const id of ids) {
      const p = await load(id);
      // in capitals too: the top bar once spelled "COURTSIDE" over "VENTURES SCOUT" in Engine (found in Plan step 9)
      for (const n of [p.name, p.short, p.product]) if (n) for (const v of [n, n.toUpperCase()]) names.add(v);
    }
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx|mjs|sh)$/.test(f)) files.push(p);
      }
    };
    // the shell scripts too: the launch pages said "Courtside Ventures Scout" for every firm until 11-02-26
    walk(join(REPO_ROOT, "Engine", "src"));
    walk(join(REPO_ROOT, "Engine", "scripts"));
    const hits: string[] = [];
    for (const f of files) {
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/^\s*(\/\/|\*|\/\*|#)/.test(line)) return; // a comment line may say where a rule came from
          // drop a trailing comment (not a URL's //), and read "\\n" as a break: "…\\nCourtside Ventures" once slipped past a letter check
          const code = line.replace(/(^|\s)\/\/.*$/, "$1").replace(/\\[ntr]/g, " ");
          for (const n of names) if (new RegExp(`(?<![A-Za-z])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z])`).test(code)) hits.push(`${f.slice(REPO_ROOT.length + 1)}:${i + 1}: ${n}`);
        });
    }
    expect(hits, "use firm.name, firm.short, firm.product or NAMES from @/firm instead").toEqual([]);
  });
});

describe("Scout never speaks to an outside party as someone it is not (user, 10-31-26)", () => {
  // no real address sits in the code (it is public): the SEC contact is the installer's own deploy setting; only the
  // reserved example domains appear, in a hint
  const APPROVED = (e: string) => /@example\.(com|org|net)$/.test(e);
  const EMAIL = /[A-Za-z0-9._+-]+@[A-Za-z0-9-]+\.[A-Za-z.]{2,}/g;
  it("the SEC contact is a deploy setting the installer types, never in a firm's profile (11-05-26)", async () => {
    for (const id of ids) expect(Object.keys(await load(id)), `${FIRMS[id]}/profile.ts: the SEC contact is SEC_CONTACT_EMAIL on Vercel`).not.toContain("contactEmail");
    const http = readFileSync(join(REPO_ROOT, "Engine/src/lib/sources/http.ts"), "utf8");
    expect(http).toMatch(/SEC_CONTACT = \(\) => \(process\.env\.SEC_CONTACT_EMAIL \|\| ""\)\.trim\(\)/);
    // the launch takes it only from what the person typed (or passed), never from an account: on 10-31-26 a launch
    // script filled it with the Vercel account's email, unasked
    const launch = readFileSync(join(REPO_ROOT, "Engine/scripts/launch.sh"), "utf8");
    const block = launch.slice(launch.indexOf("SEC_CONTACT_EMAIL"), launch.indexOf("pre walk"));
    expect(block).toMatch(/read -r SEC/);
    expect(block).not.toMatch(/whoami|user\.email|git config|vercel.*teams|ACCOUNT/);
  });
  it("no other address sits in Engine's code or a firm's folder, no User-Agent names a firm, no script fills the SEC contact", () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx|mjs|sh)$/.test(f)) files.push(p);
      }
    };
    for (const d of ["Engine/src", "Engine/scripts", ...Object.values(FIRMS)]) walk(join(REPO_ROOT, d));
    const hits = files.flatMap((f) => (readFileSync(f, "utf8").match(EMAIL) || []).filter((e) => !APPROVED(e)).map((e) => `${f.slice(REPO_ROOT.length + 1)}: ${e}`));
    expect(hits, "no real email address in the code: an address an outside site sees is a deploy setting").toEqual([]);
    const named = files.filter((f) => /\b(?!VCScout)\w+Scout\/\d/.test(readFileSync(f, "utf8"))).map((f) => f.slice(REPO_ROOT.length + 1));
    expect(named, "a User-Agent names the project (UA_NAME in src/lib/sources/http.ts), never a firm").toEqual([]);
    const fills = files.filter((f) => /SEC_CONTACT_EMAIL/.test(readFileSync(f, "utf8"))).map((f) => f.slice(REPO_ROOT.length + 1));
    expect(fills.sort(), "only the launch writes the SEC contact, only http.ts and the live check read it").toEqual(["Engine/scripts/launch.sh", "Engine/scripts/verify-live.ts", "Engine/src/lib/sources/http.ts"]);
  });
});

describe("a firm whose live site deploys elsewhere", () => {
  it("never opens that firm's real database from here (Courtside: its old repo owns it for good)", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://user:pw@example.neon.tech/db");
    vi.stubEnv("SCOUT_PGLITE", "");
    vi.stubEnv("VERCEL", "");
    const { db } = await import("@/db");
    const { firm } = await import("@/firm");
    if (firm.liveElsewhere) expect(() => db()).toThrow(/live database belongs to .*, never to VC Scout/);
    else expect(() => db()).not.toThrow();
    vi.unstubAllEnvs();
  });
});

describe("VC Scout stays apart from the old Courtside repo on this Mac (user, 10-31-26)", () => {
  it("its scripts never use the old repo's progress folder or ports, and launch refuses a firm whose site lives elsewhere", async () => {
    const { progressDir, PORTS, liveElsewhere } = await import("../../firm.config.mjs");
    expect(progressDir("x", "/h")).toBe("/h/.vc-scout/x");
    expect([PORTS.app, PORTS.alt]).not.toContain(4601);
    expect([PORTS.app, PORTS.alt]).not.toContain(4602);
    const eng = join(REPO_ROOT, "Engine");
    const files = [...readdirSync(join(eng, "scripts")).map((f) => join(eng, "scripts", f)), join(eng, "playwright.config.ts")];
    const hits = files.filter((f) => /\.example-firm-scout|\b460[12]\b/.test(readFileSync(f, "utf8"))).map((f) => f.slice(eng.length + 1));
    expect(hits, "the old Courtside repo owns ~/.example-firm-scout and ports 4601-4602: use firm.config.mjs").toEqual([]);
    for (const id of ids) {
      const p = await load(id);
      expect(liveElsewhere(id)).toBe(p.liveElsewhere ?? "");
    }
    const launch = readFileSync(join(eng, "scripts", "launch.sh"), "utf8");
    expect(launch.indexOf("live-elsewhere")).toBeGreaterThan(0);
    expect(launch.indexOf("live-elsewhere"), "launch must refuse before it stops any server").toBeLessThan(launch.indexOf("kill "));
  });
});

// user, 11-03-26: "ensure that light and dark modes also ship with new firms". A firm with a theme of its own draws
// both looks: rules for html[data-theme="dark"] of its own (Engine's defaults cover a firm with no theme.css).
describe("every firm ships a light and a dark look", () => {
  for (const id of ids) {
    it(`${FIRMS[id]} draws both looks`, async () => {
      const p = await load(id);
      expect((p.brand as Record<string, unknown> | undefined)?.oneLook, `${FIRMS[id]}/profile.ts: one look is gone; every firm ships Light and Dark`).toBeUndefined();
      const theme = join(REPO_ROOT, FIRMS[id], "brand", "theme.css");
      if (!existsSync(theme)) return;
      const css = readFileSync(theme, "utf8");
      // a rule that draws the dark look and not the light one (a selector list naming both is one look for both)
      const rules = (css.replace(/\/\*[\s\S]*?\*\//g, "").match(/[^{}]+\{/g) || []).map((r) => r.slice(0, -1));
      const darkOnly = rules.filter((r) => r.includes('data-theme="dark"') && !r.includes('data-theme="light"'));
      expect(darkOnly.length, `${FIRMS[id]}/brand/theme.css has no dark look of its own: add html[data-theme="dark"] rules (Sidekick's: the block at its end)`).toBeGreaterThan(0);
    });
  }
});
