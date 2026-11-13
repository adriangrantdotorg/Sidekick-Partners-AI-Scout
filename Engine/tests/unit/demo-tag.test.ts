// The Demo tag (user, 11-12-26; Sidekick's pick: Sidekick Partners/design/demo-signal, A1): a site with a builder says
// it is a demo beside its logo, at every width; the public copy (no builder) draws none.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("the header's Demo tag", () => {
  it("shows only when the site has a builder", () => {
    const shell = readFileSync("src/components/Shell.tsx", "utf8");
    expect(shell).toMatch(/function DemoTag\(\)[\s\S]{0,80}BUILDER\.name \?/);
    expect(shell).toMatch(/<span className="brand-word">\{own\.word\}<\/span>\s*<DemoTag \/>/);
  });
  it("stays on screen when the logo's word hides below 1320px", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toMatch(/@media \(max-width:1320px\) \{ \.brand \.demo-tag \{ display:inline-flex/);
  });
});
