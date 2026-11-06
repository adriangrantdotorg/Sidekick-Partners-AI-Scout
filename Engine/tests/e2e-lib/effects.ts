// The browser half of the moving-parts guard (src/firm/effects.ts), shared by every firm's browser tests. On each page
// it lists what moves, checks every Engine part against the firm's answer, and checks every moving thing really changes
// the screen: it pauses the animation at nine moments and compares the pixels around it. On 11-02-26 Sidekick's
// brass Live tab hid Engine's white glow; a theme that switches a glow off, or paints it over, fails here.
import { expect, type Page } from "@playwright/test";
import sharp from "sharp";
import { EFFECTS, NOT_DRAWN, type EffectKey } from "../../src/firm/effects";
import type { FirmProfile } from "../../src/firm/types";

const owner = (name: string) => (name.endsWith("s") ? `${name}'` : `${name}'s`);
const ENGINE = new Map<string, EffectKey>(
  Object.entries(EFFECTS).flatMap(([k, e]) => e.keyframes.map((n) => [n, k as EffectKey] as const)),
);
/** A colour channel moving by more than this counts as a change; this many changed pixels counts as visible. The
 *  page draws the same pixels every time it is paused at the same moment, so a part switched off scores 0; Engine's
 *  soft clouds (a blurred 18% white drifting 12%) move each pixel only a few steps, so the step is small. */
const STEP = 2;
const VISIBLE = 30;

type Running = { i: number; name: string; where: string; inEl: string[]; dur: number };

const list = (page: Page, classes: string[]) =>
  page.evaluate((classes) => {
    const all = document.getAnimations() as CSSAnimation[];
    (window as unknown as { __a: Animation[] }).__a = all;
    return all.map((a, i) => {
      const eff = a.effect as KeyframeEffect;
      const t = eff.target as Element;
      const d = Number(eff.getComputedTiming().duration) || 0;
      return {
        i,
        name: a.animationName,
        where: `${[t.tagName.toLowerCase(), ...String(t.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean)].join(".")}${eff.pseudoElement || ""}`,
        inEl: classes.filter((c) => t.closest("." + c.split(" ").join("."))),
        dur: d,
      };
    });
  }, classes);

/** The most pixels around the animation's element that differ from its first moment, over nine paused moments. */
async function change(page: Page, i: number, dur: number): Promise<number | null> {
  const box = await page.evaluate((i) => {
    const all = (window as unknown as { __a: Animation[] }).__a;
    for (const a of all) a.pause();
    const t = (all[i].effect as KeyframeEffect).target as Element;
    if (t !== document.body) t.scrollIntoView({ block: "center", inline: "nearest" });
    const r = t.getBoundingClientRect();
    const x = Math.max(0, r.x - 24), y = Math.max(0, r.y - 24);
    return { x, y, width: Math.min(innerWidth, r.right + 24) - x, height: Math.min(innerHeight, r.bottom + 24) - y };
  }, i);
  if (box.width < 2 || box.height < 2) return null; // this copy isn't on screen (a phone-only layout, a closed panel)
  const shots: Buffer[] = [];
  // nine moments across one run: a breath peaks halfway, a drift is furthest at its end, and a thin streak behind the
  // cards shows only while it crosses a gap
  for (const f of [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 0.99]) {
    await page.evaluate(([i, t]) => { (window as unknown as { __a: Animation[] }).__a[i].currentTime = t; }, [i, dur * f] as const);
    shots.push(await sharp(await page.screenshot({ clip: box, animations: "allow" })).raw().toBuffer());
  }
  let most = 0;
  for (const [a, b] of shots.slice(1).map((_, j) => [0, j + 1])) {
    let n = 0;
    for (let p = 0; p < shots[a].length; p += 4) {
      if (Math.abs(shots[a][p] - shots[b][p]) > STEP || Math.abs(shots[a][p + 1] - shots[b][p + 1]) > STEP || Math.abs(shots[a][p + 2] - shots[b][p + 2]) > STEP) n++;
    }
    most = Math.max(most, n);
  }
  return most;
}

/** Every moving thing on these pages matches the firm's answers and visibly moves. Returns what moved where. */
export async function checkMovingParts(page: Page, profile: FirmProfile, paths: string[]) {
  const classes = Object.values(EFFECTS).map((e) => e.el);
  const moved = new Map<string, string>();
  for (const path of paths) {
    const best = new Map<string, number>();
    const seen = new Map<string, string>();
    await page.goto(path);
    await page.waitForSelector("html[data-hydrated='1']");
    await page.waitForTimeout(400);
    for (const r of (await list(page, classes)) as Running[]) {
      const k = ENGINE.get(r.name);
      if (r.name in NOT_DRAWN) throw new Error(`${path}: ${r.name} (${r.where}) moves, but effects.ts lists it as drawn by no page`);
      if (k) {
        const a = profile.effects[k];
        expect(a.look, `${path}: Engine's "${EFFECTS[k].what}" (${r.where}) moves on ${owner(profile.name)} page, but its profile says ${a.look}`).toBe("engine");
      }
      if (moved.has(r.name)) continue;
      // every copy on screen is measured until one moves; a part the theme hides fails on all of them
      const n = await change(page, r.i, r.dur);
      if (n === null) continue;
      best.set(r.name, Math.max(best.get(r.name) ?? 0, n));
      if (n < VISIBLE) { seen.set(r.name, r.where); continue; }
      moved.set(r.name, path);
      // a part the firm draws its own way: its own animation runs inside the part's element
      for (const [kk, e] of Object.entries(EFFECTS) as [EffectKey, (typeof EFFECTS)[EffectKey]][]) {
        if (profile.effects[kk].look === "own" && !k && r.inEl.includes(e.el)) moved.set(`own:${kk}`, r.name);
      }
    }
    for (const [name, where] of seen) {
      expect(moved.has(name), `${path}: ${name} (${where}) runs but changes ${best.get(name)} pixels: something in the firm's look hides it`).toBe(true);
    }
    for (const [kk, e] of Object.entries(EFFECTS) as [EffectKey, (typeof EFFECTS)[EffectKey]][]) {
      if (profile.effects[kk].look !== "own" || moved.has(`own:${kk}`)) continue;
      const here = await page.locator("." + e.el.split(" ").join(".")).count();
      expect(here, `${path}: ${profile.name} draws "${e.what}" its own way, but nothing of its own moves there`).toBe(0);
    }
  }
  return moved;
}
