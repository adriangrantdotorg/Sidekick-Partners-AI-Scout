// A stranger's copy credits no one (user, 11-05-26: "credit only my site"). The builder lives in the firm's
// brand/builder.json, which the public copy leaves out; here that file is empty, as in the public copy, and nothing
// on the pages may name a person or link to one. Sidekick's own site, with the file, is checked in remove-rename.test.ts.
import { describe, it, expect, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

vi.mock("../../../src/firm/builder.json", () => ({ default: { name: "", url: "" } }));

const render = async (tree: ReactNode) => {
  const { UIProvider } = await import("@/components/ui");
  const Wrap = UIProvider as unknown as (p: { palette: () => null; sheet: () => null; children?: ReactNode }) => ReactNode;
  return renderToStaticMarkup(createElement(Wrap, { palette: () => null, sheet: () => null }, tree)).replace(/<!-- -->/g, "").replace(/&#x27;/g, "'");
};

describe("a copy whose firm names no builder", () => {
  it("the not-affiliated line names no one", async () => {
    const { DISCLAIMER, BUILDER } = await import("@/firm");
    expect(BUILDER).toEqual({ name: "", url: "" });
    expect(DISCLAIMER).toBe("An independent demo. Not affiliated with or endorsed by Sidekick Partners.");
  });
  it("About has no Talk to button, no builder and no LinkedIn", async () => {
    const About = (await import("@/app/about/page")).default;
    const html = await render(await About());
    expect(html).not.toMatch(/data-talk|Talk to|built by|linkedin\.com|user/i);
    expect(html).toContain("Phase I is this demo: built on free public sources.");
  });
  it("the Talk link draws nothing, a locked chip names no one, the site's description names no one", async () => {
    const { TalkLink } = await import("@/components/talk");
    expect(renderToStaticMarkup(createElement(TalkLink))).toBe("");
    const { phase2Tip } = await import("@/lib/phase2");
    expect(phase2Tip()).toBe("Phase II: the production version");
    const { metadata } = await import("@/app/layout");
    expect(String(metadata.description)).not.toMatch(/demo by/);
  });
  it("no page's code spells a person's name or link: only brand/builder.json does", () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(f)) files.push(p);
      }
    };
    walk(join(__dirname, "..", "..", "..", "src"));
    const hits: string[] = [];
    for (const f of files)
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((line, i) => {
          const t = line.trim();
          if (/^(\/\/|\*|\/\*|\{\/\*)/.test(t)) return; // a comment line
          const code = line.replace(/\{?\/\*.*?\*\/\}?/g, "").replace(/\s\/\/\s.*$/, "");
          if (/\bAdrian\b|example-builder/.test(code)) hits.push(`${f.split("/src/")[1]}:${i + 1}`);
        });
    expect(hits, "a builder's name or link in the code: move it to the firm's brand/builder.json").toEqual([]);
  });
});
