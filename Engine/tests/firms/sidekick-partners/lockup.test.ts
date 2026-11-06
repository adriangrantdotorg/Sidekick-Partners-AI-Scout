// The logo of record's one sizing rule (After Hours E1): Sidekick Partners/design/logo/lockup.py. Every place that
// draws Sidekick's logo with AI SCOUT beside it follows it: AI SCOUT's capitals as tall as Sidekick's letters, on
// Sidekick's line. 11-03-26: the share image redid the math on its own, left out Bodoni's 0.77 and drew AI SCOUT 23%
// short and off the line, while the site's header was right. user: "how will you avoid this in the future".
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const FIRM = path.resolve(__dirname, "../../../../Sidekick Partners");
const read = (p: string) => readFileSync(path.join(FIRM, p), "utf8");
const rule = read("design/logo/lockup.py");
const num = (name: string) => Number(rule.match(new RegExp(`${name}\\s*=\\s*([\\d.]+)`))?.[1]);
const [LOGO_H, LETTERS_H, CAP, SPACING] = ["LOGO_H", "LETTERS_H", "CAP", "LETTER_SPACING_EM"].map(num);
const fontSize = (h: number) => (LETTERS_H * h) / LOGO_H / CAP;

describe("the logo lockup follows its one rule", () => {
  it("lockup.py holds the measured numbers", () => {
    expect([LOGO_H, LETTERS_H, CAP, SPACING]).toEqual([463, 300, 0.77, 0.05]);
  });

  it("the site's header: AI SCOUT as tall as Sidekick's letters, with the rule's spacing", () => {
    const css = read("brand/theme.css");
    const h = Number(css.match(/\.brand\.own img\.brand-logo\s*\{[^}]*height:\s*([\d.]+)px/)?.[1]);
    const word = css.match(/\.brand-word\s*\{([^}]*)\}/)?.[1] || "";
    const fs = Number(word.match(/font:\s*\d+\s+([\d.]+)px/)?.[1]);
    expect(h).toBeGreaterThan(0);
    expect(Math.abs(fs - fontSize(h))).toBeLessThan(0.1);
    expect(word).toContain(`letter-spacing:${String(SPACING).replace(/^0/, "")}em`);
  });

  it("the share image draws the lockup from lockup.py, never its own math", () => {
    const share = read("design/share-image/build.py");
    expect(share).toMatch(/import lockup as LOCKUP/);
    expect(share).not.toMatch(/300\s*\/\s*463|\/\s*0\.77|LETTERS_H\s*\*/);
  });
});
