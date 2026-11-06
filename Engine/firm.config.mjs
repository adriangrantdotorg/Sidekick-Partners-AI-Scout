// Which firm a build is for (VC Scout Plan, section 0). NEXT_PUBLIC_SCOUT_FIRM picks a folder at the repo root;
// Sidekick is the default (Plan step 8). next.config.ts and vitest.config.ts point the "@firm-profile" import at that
// folder's profile.ts, so a site's bundle holds its own firm and no other; scripts run with tsx load it through
// src/firm/profile-by-env.ts, which tsconfig points "@firm-profile" at.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_FONTS } from "./src/lib/fonts.mjs";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** Every firm this checkout holds: its id (the build's NEXT_PUBLIC_SCOUT_FIRM) and its folder at the repo root. A firm
 *  whose folder isn't here drops out, so the public copy (Sidekick only, Plan's open-source step, 11-05-26) builds and
 *  tests with no Courtside folder. */
const ALL_FIRMS = { "sidekick-partners": "Sidekick Partners", "courtside-ventures": "Courtside Ventures (draft)", "example-firm": "Example Firm" };
/** @type {Record<string, string>} */
export const FIRMS = Object.fromEntries(Object.entries(ALL_FIRMS).filter(([, folder]) => fs.existsSync(path.join(REPO_ROOT, folder, "profile.ts"))));
export const DEFAULT_FIRM = "sidekick-partners";
/** The firm Engine's unit tests (tests/unit) check: Sidekick since 11-05-26 (Courtside's own checks moved to
 *  tests/firms/courtside-ventures/). Engine's browser tests (tests/e2e) run on each firm's made-up Scout since Plan step
 *  12 (tests/e2e-lib/firm-config.ts). A firm's own tests live in tests/firms/<id>/ and run on that firm. */
export const TEST_FIRM = "sidekick-partners";

export function firmId() {
  const id = process.env.NEXT_PUBLIC_SCOUT_FIRM || DEFAULT_FIRM;
  if (!FIRMS[id]) throw new Error(`Unknown NEXT_PUBLIC_SCOUT_FIRM "${id}". Known: ${Object.keys(FIRMS).join(", ")}`);
  return id;
}

export const profilePath = (id = firmId()) => path.join(REPO_ROOT, FIRMS[id], "profile.ts");
/** The same file for Turbopack, which reads an absolute alias as relative to its project folder: "../Courtside Ventures (draft)/profile.ts". */
export const profileImport = (id = firmId()) => `./${path.relative(path.join(REPO_ROOT, "Engine"), profilePath(id))}`;
/** A firm's launch seed (Plan step 16): its own data for a fresh database, kept in its folder, so one firm's seed
 *  never sits where another firm's launch reads. Written by `npm run seed:export`, read by `npm run seed`. */
export const seedPath = (id = firmId()) => path.join(REPO_ROOT, FIRMS[id], "seed", "launch-seed.json");

/** VC Scout keeps its own things on this Mac, apart from the old Courtside repo (~/Development/Courtside Ventures -
 *  Scout), which uses ~/.courtside-ventures-scout and ports 4601-4602 (user, 10-31-26: "independent and distinct"). */
/** The launch progress page's folder for a firm: ~/.vc-scout/<id>. */
export const progressDir = (id = firmId(), home = os.homedir()) => path.join(home, ".vc-scout", id);
/** The Vercel project a launch creates for a firm: "sidekick-partners-scout". */
export const projectName = (id = firmId()) => `${id}-scout`;
/** VC Scout's local server ports. */
export const PORTS = { app: 4701, alt: 4702 };
/** The folder a firm's live site deploys from when it isn't VC Scout (the profile's liveElsewhere), else "". Read from
 *  the file, so the shell scripts can ask before npm ci has run. */
export function liveElsewhere(id = firmId()) {
  const m = fs.readFileSync(profilePath(id), "utf8").match(/^\s*liveElsewhere:\s*"([^"]+)"/m);
  return m ? m[1] : "";
}

/** The firm's brand files (its folder's brand/), and where Next.js and the share preview read them in Engine. The
 *  copies are gitignored; a firm without one of these files gets none, so one firm's icon never ships in another's site. */
export const BRAND_FILES = [
  ["icon.png", "src/app/icon.png"],
  ["apple-icon.png", "src/app/apple-icon.png"],
  ["opengraph-image.jpg", "src/app/opengraph-image.jpg"],
  ["opengraph-image.alt.txt", "src/app/opengraph-image.alt.txt"],
  ["share-preview.md", "content/share-preview.md"],
  ["theme.css", "src/app/firm-theme.css"],
  // bundled into the build (Shell imports it), never read from public/ at run time: a test run that switches firms
  // rewrites these copies, and a running site lost its logo that way (11-02-26)
  ["logo.svg", "src/firm/brand-logo.svg"],
  // who built the site (src/firm/builder.ts); the public copy leaves Sidekick's out, so a stranger's site credits no one
  ["builder.json", "src/firm/builder.json"],
];

/** Copies the firm's brand files into Engine; next.config.ts and vitest.config.ts run it, so every build and test sees
 *  the right firm. A file is only written when it changed, so a running dev server doesn't reload for nothing. */
export function syncBrand(id = firmId()) {
  const engine = path.join(REPO_ROOT, "Engine");
  for (const [from, to] of BRAND_FILES) {
    const src = path.join(REPO_ROOT, FIRMS[id], "brand", from);
    const dst = path.join(engine, to);
    // the layout always imports the theme and the header the logo: a firm without one gets an empty stand-in
    const blank = { "theme.css": "", "logo.svg": '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>', "builder.json": '{ "name": "", "url": "" }\n' }[from];
    const data = fs.existsSync(src) ? fs.readFileSync(src) : blank !== undefined ? Buffer.from(blank) : null;
    if (!data) {
      if (fs.existsSync(dst)) fs.rmSync(dst);
      continue;
    }
    if (fs.existsSync(dst) && data.equals(fs.readFileSync(dst))) continue;
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, data);
  }
}

/** The firm's product name ("Sidekick Partners AI Scout"), read from the file like liveElsewhere: the launch pages and
 *  the last line of a launch say it, so no shell script spells a firm. */
export function productName(id = firmId()) {
  const m = fs.readFileSync(profilePath(id), "utf8").match(/^\s*product:\s*"([^"]+)"/m);
  return m ? m[1] : "Scout";
}

/** The launch pages' look (prestart.sh's plain page, step.ts's full page): what the site's own launch page (Building.tsx)
 *  wears, so a firm's launch is drawn in its colors and fonts, never Engine's defaults (the screen review, 11-02-26:
 *  Sidekick's local pages were Courtside's gray and red). Engine's tokens, the progress view, then the firm's
 *  theme.css, all read from the files: the plain page opens before npm ci. Put the page inside <div class="building">
 *  so the theme's `.building .pg` rules reach it. */
export function launchLook(id = firmId()) {
  const read = (...p) => fs.readFileSync(path.join(REPO_ROOT, ...p), "utf8");
  const tokens = read("Engine", "src", "app", "globals.css").match(/^:root[^{]*\{[^}]*\}/m)?.[0] || "";
  const theme = path.join(REPO_ROOT, FIRMS[id], "brand", "theme.css");
  const fonts = fs.readFileSync(profilePath(id), "utf8").match(/^\s*fonts:\s*"([^"]+)"/m)?.[1] || DEFAULT_FONTS;
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="${fonts}" rel="stylesheet">
<style>${tokens}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font-body);padding:40px 16px 100px}
${read("Engine", "src", "app", "progress.css")}
${fs.existsSync(theme) ? fs.readFileSync(theme, "utf8") : ""}</style>`;
}

/** prestart.sh's page: its __PRODUCT__ and __LOOK__ filled in for the firm. */
export function fillLaunchPage(file, id = firmId()) {
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replaceAll("__PRODUCT__", esc(productName(id))).replace("__LOOK__", () => launchLook(id)));
  return file;
}

/** Each firm's browser suite on its made-up local Scout (an npm script). The launch runs it, never Engine's suite
 *  against the firm's real database: on a first launch that database is new and empty, and the suites click (11-03-26). */
export const E2E_SCRIPTS = { "sidekick-partners": "e2e:sidekick" };
const e2eScript = (id = firmId()) => E2E_SCRIPTS[id] || "";
/** What a firm's brand/ folder still lacks before a deploy: the share image (and its alt text) and the tab icons. */
const SHIP_BRAND = ["opengraph-image.jpg", "opengraph-image.alt.txt", "icon.png", "apple-icon.png"];
const brandMissing = (id = firmId()) => SHIP_BRAND.filter((f) => !fs.existsSync(path.join(REPO_ROOT, FIRMS[id], "brand", f))).join(", ");

// The shell scripts ask here: node firm.config.mjs progress-dir | project-name | port | live-elsewhere | product |
// e2e-script | brand-missing | seed-path | fill-launch-page <file>
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ask = { "progress-dir": progressDir, "project-name": projectName, port: () => PORTS.app, "live-elsewhere": liveElsewhere, product: productName, "e2e-script": e2eScript, "brand-missing": brandMissing, "seed-path": seedPath, "fill-launch-page": () => fillLaunchPage(process.argv[3]) }[process.argv[2]];
  if (!ask || (process.argv[2] === "fill-launch-page" && !process.argv[3])) {
    console.error("usage: node firm.config.mjs progress-dir|project-name|port|live-elsewhere|product|e2e-script|brand-missing|seed-path|fill-launch-page <file>");
    process.exit(2);
  }
  console.log(ask());
}
