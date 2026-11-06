// The screen review (11-03-26): Scout had no error or missing page of its own, so a failed page showed Next.js's bare
// "Application error" and a missing address its plain 404. The browser test presses the missing page; a failed page
// can't be caused on purpose there, so this checks the error page is wired to Next.js 16's retry and the shared look.
import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (f: string) => readFileSync(new URL(`../../src/app/${f}`, import.meta.url), "utf8");

describe("Scout's own error and missing pages", () => {
  it("the error page is a client component on the shared look, and Try Again calls retry", () => {
    const s = read("error.tsx");
    expect(s.startsWith('"use client"')).toBe(true);
    expect(s).toMatch(/<Miss\b/);
    expect(s).toMatch(/onClick=\{\(\) => retry\(\)\}/);
    expect(s).toContain("Try Again");
  });
  it("the missing page uses the same look", () => {
    expect(existsSync(new URL("../../src/app/not-found.tsx", import.meta.url))).toBe(true);
    expect(read("not-found.tsx")).toMatch(/<Miss title="Page Not Found"/);
  });
});
