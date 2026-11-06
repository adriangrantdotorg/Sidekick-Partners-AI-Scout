import { describe, it, expect } from "vitest";

// Two local test servers (npm run e2e:sidekick) run from one build. Next.js wrote each page it re-drew into .next on
// disk, so a page drawn while Engine's Not a Fit test had Crownwell hidden was served by Sidekick's own server, and
// by the next run (11-03-26). On a local data copy each server keeps its pages in its own memory.
describe("local test servers", () => {
  it("on a local data copy (SCOUT_PGLITE), a server never writes the pages it draws to disk", async () => {
    process.env.SCOUT_PGLITE = ".local-db/any.tar.gz";
    try {
      const cfg = (await import("../../next.config")).default;
      expect(cfg.experimental?.isrFlushToDisk).toBe(false);
    } finally {
      delete process.env.SCOUT_PGLITE;
    }
  });
});
