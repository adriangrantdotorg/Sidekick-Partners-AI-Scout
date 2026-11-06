// The screen review (user, 11-02-26: "let me see this"): the moving parts nobody had shown him, each on the real page
// in a state the browser tests never reach. It drives the test site on the review copy of the data
// (Engine/tests/firms/sidekick-partners/e2e/review-fixture.ts) and saves each page as the browser drew it, bare, with
// the site's own stylesheet beside it: review-trends.html (the sparklines draw in, again every 4 s), review-deck-reading.html
// (a deck halfway through its read), review-launch.html (the launch progress page).
// Scout ignores the Mac's Reduce Motion (Courtside's rule, 10-14-26; user's Mac has it on), so these pages move for
// him as the site does. The sparkline's glow was his call (11-03-26: "mint glow"): review-trends-glow.html is the one he
// picked, review-trends-clean.html the one he passed on, review-trends.html as it was (a dark shadow, faint on cream).
// The Deck Screen's reading step is captured only while the Deck Screen is on (off for Sidekick since 11-03-26).
// Run from Engine/, with the test site on the review copy on :4702:
//   node "../Sidekick Partners/design/pages/capture_states.mjs"
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const require = createRequire(process.cwd() + "/");
const { chromium } = require("@playwright/test");

const SITE = "http://localhost:4702";
const HERE = fileURLToPath(new URL(".", import.meta.url));

// a one-shot animation replays, so the drawing-in can be watched more than once (taste-profile: one-shots replay)
const REPLAY = `<script>setInterval(() => { for (const a of document.getAnimations()) if (a.animationName === "draw") { a.cancel(); a.play(); } }, 4000);</script>`;

async function bare(page, name, extra = "") {
  const css = [];
  for (const href of await page.$$eval('link[rel="stylesheet"]', (ls) => ls.map((l) => l.getAttribute("href")).filter((h) => h.startsWith("/_next/")))) {
    css.push(await (await fetch(SITE + href)).text());
  }
  writeFileSync(HERE + "assets/live-scout.css", css.join("\n"));
  let html = await page.content();
  html = html
    .replace(/<script\b[\s\S]*?<\/script>/g, "")
    .replace(/<link rel="(?:stylesheet|preload)"[^>]*href="\/_next\/[^"]*"[^>]*>/g, "")
    .replace("</head>", '<link rel="stylesheet" href="assets/live-scout.css"></head>')
    .replace(/src="\/_next\/static\/media\/brand-logo[^"]*"/g, 'src="assets/sk-logo.svg"')
    .replace(/(src|href)="\/(?!\/)/g, `$1="${SITE}/`)
    .replace(/<!-- -->/g, "")
    .replace("</body>", `${extra}</body>`);
  writeFileSync(HERE + name, html);
  console.log("wrote", name);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const open = async (path) => {
  await page.goto(SITE + path, { waitUntil: "networkidle" });
  await page.waitForSelector("html[data-hydrated='1']");
  await page.waitForTimeout(600);
};

await open("/trends");
if (!(await page.locator("svg.spark").count())) throw new Error("Trends drew no sparklines: is the test site on the review copy?");
await bare(page, "review-trends.html", REPLAY);
// the sparkline's two answers, the same page with one rule each
const SPARK = { glow: "filter:drop-shadow(0 0 5px rgba(48,225,174,.95)) drop-shadow(0 0 1px rgba(48,225,174,.8))", clean: "filter:none" };
for (const [k, rule] of Object.entries(SPARK)) await bare(page, `review-trends-${k}.html`, `<style>.spark polyline{${rule}}</style>${REPLAY}`);

// the read never finishes: the AI's answer is held, so the page stays on its steps (only while the Deck Screen is on)
if ((await page.request.get(SITE + "/deck")).ok()) {
  await page.route("**/api/deck", () => {});
  await open("/deck");
  await page.getByTestId("deck-file").setInputFiles(fileURLToPath(new URL("../../../Engine/.local-db/test-deck.pdf", import.meta.url)));
  await page.waitForSelector(".x-steps .now");
  await page.waitForTimeout(1500);
  await bare(page, "review-deck-reading.html");
  await page.unroute("**/api/deck");
}

await open("/");
if (!(await page.locator(".pg").count())) throw new Error("Today shows no launch progress: is the test site on the review copy?");
await bare(page, "review-launch.html");

await browser.close();
