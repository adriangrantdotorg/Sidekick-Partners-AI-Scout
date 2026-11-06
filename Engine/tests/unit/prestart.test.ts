// The progress page from second zero (scripts/prestart.sh): opens before npm ci, says whose turn it is, hands over
// to the full page at step 1 without a second tab, and never reloads itself except for that one handoff (10-14-26).
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { progressDir, launchLook, FIRMS, REPO_ROOT, firmId } from "../../firm.config.mjs";

const ROOT = join(__dirname, "..", "..");
const SH = join(ROOT, "scripts", "prestart.sh");

function run(home: string, ...args: string[]) {
  return execFileSync("bash", [SH, ...args], { env: { ...process.env, HOME: home, PRESTART_NO_OPEN: "1" }, encoding: "utf8" });
}
function state(home: string) {
  const js = readFileSync(join(progressDir(undefined, home), "progress.js"), "utf8");
  return JSON.parse(js.replace(/^window\.__progress = /, "").replace(/;\s*$/, ""));
}

describe("prestart.sh: the page from second zero", () => {
  const home = mkdtempSync(join(tmpdir(), "scout-pre-"));
  const dir = progressDir(undefined, home); // VC Scout's own folder, never ~/.example-firm-scout

  it("open writes the page, the first state, the start time and the opened marker", () => {
    run(home, "open");
    expect(existsSync(join(dir, "progress.html"))).toBe(true);
    expect(existsSync(join(dir, "progress.html.opened-pre"))).toBe(true);
    expect(Number(readFileSync(join(dir, "started-at"), "utf8"))).toBeGreaterThan(0);
    expect(state(home).pre).toBe("start");
  });

  it("each moment is a state the page can show: sign-in with link and code, terms with link, walk away", () => {
    run(home, "state", "signin", "https://vercel.com/device?code=ABCD-EFGH", "ABCD-EFGH");
    expect(state(home)).toMatchObject({ pre: "signin", url: "https://vercel.com/device?code=ABCD-EFGH", code: "ABCD-EFGH" });
    run(home, "state", "terms", "https://vercel.com/t/~/integrations/accept-terms/neon?source=cli");
    expect(state(home)).toMatchObject({ pre: "terms", url: "https://vercel.com/t/~/integrations/accept-terms/neon?source=cli" });
    run(home, "state", "walk");
    expect(state(home).pre).toBe("walk");
    const started = Number(readFileSync(join(dir, "started-at"), "utf8"));
    expect(state(home).startedAt).toBe(started); // the clock never restarts between moments
  });

  it("the page never reloads itself (polls progress.js and patches in place); the one handoff is a replace, not a refresh", () => {
    const html = readFileSync(join(dir, "progress.html"), "utf8");
    expect(html).not.toMatch(/http-equiv="refresh"|location\.reload|window\.location *=/);
    expect(html).toMatch(/progress\.js\?t=/);
    expect(html).toMatch(/location\.replace\(/); // once, when the rich state appears
    for (const id of ["start", "signin", "terms", "walk"]) expect(html).toContain(`id="${id}"`);
    // Engine's page and its progress.css never cut words; a firm's theme may keep its brand word on one line
    const theme = existsSync(join(REPO_ROOT, FIRMS[firmId()], "brand", "theme.css")) ? readFileSync(join(REPO_ROOT, FIRMS[firmId()], "brand", "theme.css"), "utf8") : "";
    expect(html.replace(theme, "")).not.toMatch(/text-overflow|white-space: *nowrap|line-clamp/);
  });

  it("the full page honors the plain page's marker (no second tab) and the launch start time", () => {
    const step = readFileSync(join(ROOT, "scripts", "step.ts"), "utf8");
    expect(step).toContain('".opened-pre"');
    expect(step).toContain("SCOUT_STARTED_AT");
    // and writes the page before the state, so the handoff reload lands on the rich page
    expect(step.indexOf("writeFileSync(PAGE, renderPage())")).toBeLessThan(step.indexOf('writeFileSync(JS, "window.__progress'));
  });

  // The screen review (11-02-26): both local launch pages were Courtside's gray, red and fonts for every firm, while the
  // site's own launch page wore the firm's look. Both now take launchLook(): Engine's tokens, the progress view, the
  // firm's theme.css and fonts.
  it("the launch pages wear the firm's look and spell no color or font of their own", () => {
    for (const id of Object.keys(FIRMS)) {
      const look = launchLook(id);
      const theme = join(REPO_ROOT, FIRMS[id as keyof typeof FIRMS], "brand", "theme.css");
      if (existsSync(theme)) expect(look, id).toContain(readFileSync(theme, "utf8"));
      const fonts = readFileSync(join(REPO_ROOT, FIRMS[id as keyof typeof FIRMS], "profile.ts"), "utf8").match(/^\s*fonts:\s*"([^"]+)"/m)?.[1];
      if (fonts) expect(look, id).toContain(fonts);
    }
    const page = readFileSync(join(dir, "progress.html"), "utf8");
    expect(page).not.toMatch(/__LOOK__|__PRODUCT__/);
    expect(page).toContain('<div class="building">'); // the theme's `.building .pg` rules reach it
    expect(page).toContain(launchLook(firmId()));
    const own = [
      ["prestart.sh", readFileSync(SH, "utf8").split("<<'HTML'")[1].split("\nHTML\n")[0]],
      ["step.ts", readFileSync(join(ROOT, "scripts", "step.ts"), "utf8").split("function renderPage")[1]],
    ];
    for (const [file, html] of own) {
      expect(html, `${file} draws its own colors: use the --pg-* tokens (progress.css), which the firm's theme sets`).not.toMatch(/#[0-9a-fA-F]{3,8}\b|linear-gradient\(1|rgba\((?!0,0,0|255,255,255)/);
      expect(html, `${file} names a font: use var(--font-head) / --font-body / --font-mono`).not.toMatch(/Oswald|Montserrat|Plex|Cormorant|Source Sans|fonts\.googleapis/);
      expect(html, file).toContain('class="building"');
    }
  });

  it("launch.sh drives every moment", () => {
    const launch = readFileSync(join(ROOT, "scripts", "launch.sh"), "utf8");
    expect(launch).toContain("prestart.sh open");
    for (const m of ["pre signin", "pre terms", "pre walk", "pre start"]) expect(launch).toContain(m);
  });
});
