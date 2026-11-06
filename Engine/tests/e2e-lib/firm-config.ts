// A firm's browser tests on its made-up local Scout, before its database exists (Plan step 13): its own tests
// (tests/firms/<id>/e2e/) and Engine's (tests/e2e/, Courtside's lessons, which every firm keeps: Plan step 12,
// 11-03-26). Each suite gets its own server on VC Scout's two ports, built once from the same data copy: a server keeps
// one copy in memory, so Engine's clicks (votes, Not a Fit, a tracked name) never change what the firm's tests read.
import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { PORTS } from "../../firm.config.mjs";

const ENGINE = fileURLToPath(new URL("../../", import.meta.url));

export function firmE2E(id: string, data: string, dir: string) {
  process.env.NEXT_PUBLIC_SCOUT_FIRM = id; // the test workers read the same firm (tests/e2e/pages.ts)
  const server = (port: number) => ({
    command: `npx next start -p ${port}`,
    cwd: ENGINE,
    env: { SCOUT_PGLITE: data, NEXT_PUBLIC_SCOUT_FIRM: id },
    url: `http://localhost:${port}/api/build-progress`,
    reuseExistingServer: false,
    timeout: 60_000,
  });
  const chrome = { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } };
  return defineConfig({
    timeout: 60_000,
    expect: { timeout: 8_000 },
    workers: 3, // two servers share the Mac: 4 timed pages out while an app updated in the background (11-03-26)
    reporter: "line",
    // a failed test keeps its trace (every request, its timing and the page at each step): a failure that won't repeat
    // on demand carries its own evidence (11-05-26, the Tracking test's third sighting). npx playwright show-trace <zip>
    use: { actionTimeout: 5_000, navigationTimeout: 20_000, permissions: ["clipboard-read", "clipboard-write"], trace: "retain-on-failure" },
    projects: [
      { name: id, testDir: dir, use: { ...chrome, baseURL: `http://localhost:${PORTS.alt}` } },
      { name: "engine", testDir: fileURLToPath(new URL("../e2e", import.meta.url)), fullyParallel: true, use: { ...chrome, baseURL: `http://localhost:${PORTS.app}` } },
    ],
    webServer: [server(PORTS.alt), server(PORTS.app)],
  });
}
