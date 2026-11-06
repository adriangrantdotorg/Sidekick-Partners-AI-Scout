// Every moving part Engine draws is answered by every firm's look (src/firm/effects.ts). On 11-02-26 Sidekick's brass
// Live tab hid Engine's white glow and nothing asked anyone to look at it; user: "How do we avoid this in the
// future, especially as we build for other firms?" These tests make a new moving part, or a new firm, answer first.
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { FIRMS, REPO_ROOT, profilePath } from "../../firm.config.mjs";
import { EFFECTS, NOT_DRAWN, type EffectKey } from "@/firm/effects";
import type { FirmProfile } from "@/firm";

const ENGINE = join(REPO_ROOT, "Engine");
const ENGINE_CSS = ["globals.css", "v2.css", "progress.css"].map((f) => join(ENGINE, "src/app", f));
const ids = Object.keys(FIRMS) as (keyof typeof FIRMS)[];
const load = async (id: keyof typeof FIRMS) => (await import(pathToFileURL(profilePath(id)).href)).default as FirmProfile;

function tsx(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) tsx(p, out);
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}
/** Every class token a component writes in a className string. */
const classTokens = () => {
  const out = new Set<string>();
  for (const f of tsx(join(ENGINE, "src"))) {
    for (const m of readFileSync(f, "utf8").matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
      for (const t of (m[1] ?? m[2]).split(/\s+/)) if (/^[a-z][\w-]*$/.test(t)) out.add(t);
    }
  }
  return out;
};

describe("Engine's moving parts", () => {
  it("every @keyframes in Engine's CSS is a listed moving part, or listed as drawn by no page", () => {
    const names = ENGINE_CSS.flatMap((f) => [...readFileSync(f, "utf8").matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]));
    const listed = new Set([...Object.values(EFFECTS).flatMap((e) => e.keyframes as readonly string[]), ...Object.keys(NOT_DRAWN)]);
    const missing = names.filter((n) => !listed.has(n));
    expect(missing, `add ${missing.join(", ")} to EFFECTS in src/firm/effects.ts (what it is, where it shows): every firm then answers it`).toEqual([]);
  });

  it("a part listed as drawn by no page really is: no component uses its class", () => {
    const used = classTokens();
    const drawn = Object.entries(NOT_DRAWN).filter(([, cls]) => used.has(cls));
    expect(drawn.map(([k, cls]) => `${k} (.${cls})`), "a page now draws these: move them into EFFECTS").toEqual([]);
  });

  it("every listed part's class is drawn by a component, so a design page can show it", () => {
    const used = classTokens();
    const gone = Object.entries(EFFECTS).filter(([, e]) => !e.el.split(" ").every((c) => used.has(c)));
    expect(gone.map(([k]) => k), "no component draws these any more: move them to NOT_DRAWN").toEqual([]);
  });
});

describe("every firm's look answers every moving part", () => {
  for (const id of ids) {
    it(`${FIRMS[id]}: each part is Engine's, its own, off with why, or unseen; a seen page exists and draws it`, async () => {
      const p = await load(id);
      const missing = (Object.keys(EFFECTS) as EffectKey[]).filter((k) => !p.effects?.[k]);
      expect(missing, `${FIRMS[id]}/profile.ts: answer ${missing.join(", ")} in effects`).toEqual([]);
      const unknown = Object.keys(p.effects).filter((k) => !(k in EFFECTS));
      expect(unknown, `${FIRMS[id]}/profile.ts: not in Engine/src/firm/effects.ts`).toEqual([]);
      const pages = join(REPO_ROOT, FIRMS[id], "design/pages");
      for (const [k, a] of Object.entries(p.effects) as [EffectKey, FirmProfile["effects"][EffectKey]][]) {
        if (a.look === "off") expect(a.why.length, `${FIRMS[id]}: ${k} is off: say why`).toBeGreaterThan(12);
        if (a.look !== "engine" && a.look !== "own") continue;
        if (p.liveElsewhere) continue; // a frozen profile whose look lives on its own site
        const page = join(pages, a.seen);
        expect(existsSync(page), `${FIRMS[id]}: ${k} was seen on ${a.seen}, which is not in ${FIRMS[id]}/design/pages`).toBe(true);
        const html = readFileSync(page, "utf8");
        const el = EFFECTS[k].el;
        expect(html.includes(`class="${el}`) || html.includes(` ${el}"`) || html.includes(` ${el} `), `${FIRMS[id]}: ${a.seen} has no .${el}, so it never showed ${EFFECTS[k].what}`).toBe(true);
      }
    });
  }

  it("Example Firm, the template, starts with every part unseen, so a copied firm must show each one", async () => {
    const p = await load("example-firm" as keyof typeof FIRMS);
    expect(Object.values(p.effects).every((a) => a.look === "unseen")).toBe(true);
  });
});
