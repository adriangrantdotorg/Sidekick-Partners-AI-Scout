// The page as the browser draws it (the Pipeline renders in the browser), for build_round5.py.
// Run from Engine/ (it borrows Engine's Playwright): node "../Sidekick Partners/design/pages/render_dom.mjs" <url>
import { createRequire } from "node:module";
const require = createRequire(process.cwd() + "/");
const { chromium } = require("@playwright/test");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(process.argv[2], { waitUntil: "networkidle" });
await page.waitForSelector("html[data-hydrated='1']");
await page.waitForTimeout(600);
process.stdout.write(await page.content());
await browser.close();
