import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_NAMES, RETIRED_NAMES } from "@/firm/defaults";
import { FIRMS, profilePath } from "../../firm.config.mjs";
import type { FirmProfile } from "@/firm/types";

// Plan step 12: a retired coined name (Sidekick's first drafts, Courtside's own branding) never shows for a firm that
// doesn't brand it as its own. The browser half reads every page as drawn (tests/e2e/labels.spec.ts).

/** Every string in a profile, with where it sits; `names` is the firm's own branding, read apart. */
function strings(v: unknown, at = "", out: [string, string][] = []): [string, string][] {
  if (typeof v === "string") out.push([at, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, `${at}[${i}]`, out));
  else if (v && typeof v === "object" && !(v instanceof RegExp)) for (const [k, x] of Object.entries(v)) if (!(at === "" && k === "names")) strings(x, at ? `${at}.${k}` : k, out);
  return out;
}

/** Engine's own words: its source with the comments taken out (a comment may tell Courtside's history). */
function engineWords(dir: string, out: [string, string][] = []): [string, string][] {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) engineWords(p, out);
    else if (/\.(ts|tsx|mjs)$/.test(f.name)) out.push([p, readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1")]);
  }
  return out;
}

describe("retired coined names", () => {
  it("the standard names are none of them", () => {
    for (const [k, v] of Object.entries(DEFAULT_NAMES)) for (const r of RETIRED_NAMES) expect(r.re.test(v), `${k}: "${v}" is ${r.name}`).toBe(false);
  });

  it("Engine's own words never spell one (a firm's branded name comes from its profile)", () => {
    const bad: string[] = [];
    for (const [file, text] of [...engineWords("src"), ...engineWords("scripts")].filter(([f]) => f !== path.join("src", "firm", "defaults.ts"))) // the list itself
      for (const r of RETIRED_NAMES) {
        if (r.name === "lanes") continue; // class names (.lanes, .lane-chip) are not words on the screen; the browser test reads those
        const m = text.match(r.re);
        if (m) bad.push(`${file}: ${m[0]}`);
      }
    expect(bad).toEqual([]);
  });

  for (const id of Object.keys(FIRMS) as (keyof typeof FIRMS)[])
    it(`${FIRMS[id]}: none outside the names it brands as its own`, async () => {
      const mod = (await import(pathToFileURL(profilePath(id)).href)) as { default: FirmProfile };
      const own = Object.values(mod.default.names ?? {});
      const bad: string[] = [];
      for (const [at, s] of strings(mod.default))
        for (const r of RETIRED_NAMES) if (r.re.test(s) && !own.some((n) => r.re.test(n))) bad.push(`${at}: ${r.name} in "${s.slice(0, 90)}"`);
      expect(bad).toEqual([]);
    });

  it("the list catches each name and lets the industry of record through", () => {
    for (const r of RETIRED_NAMES) expect(r.re.test(r.name), r.name).toBe(true);
    expect(RETIRED_NAMES.some((r) => r.re.test("Tech-Enabled Roll-Ups + AI Services"))).toBe(false);
    expect(RETIRED_NAMES.some((r) => r.re.test("the rails money moves on"))).toBe(false);
    expect(RETIRED_NAMES.some((r) => r.re.test("Acquired by West Lane Capital (2024)"))).toBe(false);
    for (const t of ["the five lanes", "Lanes", "Sports lane"]) expect(RETIRED_NAMES.some((r) => r.re.test(t)), t).toBe(true);
  });
});
