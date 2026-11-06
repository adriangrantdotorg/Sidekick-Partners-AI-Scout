// The progress page for long runs user starts himself on a live site (Plan step 13b, 11-04-26: "how will I be kept
// up to date to know where I am in the process?"): scripts/pipeline-all.ts --page="<title>" writes it instead of the
// launch page, and writes nothing to the site's database. ~/.vc-scout/<firm>/runs.html, in the firm's launch look:
// each job with its count ("45 of 86") and time, the time to go, and when it is done, buttons to the pages that show
// the result. The page re-reads runs.js every 5 s (a script tag works on file://); it never reloads itself.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { Job } from "../src/lib/progress-core.mjs";
import { firm } from "../src/firm";
import { launchLook, progressDir, projectName } from "../firm.config.mjs";

export type RunsState = { title: string; startedAt: number; updatedAt: number; done: boolean; liveUrl: string; jobs: Job[]; pages: [string, string][] };

/** The pages that show each job's result, as buttons on the finished card. */
const JOB_PAGES: Record<string, [string, string][]> = {
  "portfolio-backtest": [["Open the Backtest", "/backtest"], ["Open Funding Proof", "/settings?s=sources"]],
  "links-all": [["Open the Pipeline", "/pipeline"]],
};

export const runsDir = () => progressDir(undefined, homedir());
export const runsPage = () => join(runsDir(), "runs.html");

export function runsState(title: string, jobs: Job[], startedAt: number): RunsState {
  const pages = jobs.flatMap((j) => JOB_PAGES[j.key] || []);
  return { title, startedAt, updatedAt: Date.now(), done: false, liveUrl: `https://${projectName()}.vercel.app`, jobs, pages };
}

export function writeRunsPage(s: RunsState) {
  mkdirSync(runsDir(), { recursive: true });
  const core = readFileSync(join(process.cwd(), "src/lib/progress-core.mjs"), "utf8");
  const hash = createHash("sha1").update(core + readFileSync(new URL(import.meta.url))).digest("hex").slice(0, 10);
  const page = runsPage();
  if (!existsSync(page) || !readFileSync(page, "utf8").includes(`data-core="${hash}"`)) writeFileSync(page, render(s.title, core.replace(/^export /gm, ""), hash));
  writeFileSync(join(runsDir(), "runs.js"), "window.__runs = " + JSON.stringify({ ...s, updatedAt: Date.now() }) + ";\n");
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function render(title: string, core: string, hash: string) {
  return `<!doctype html><html lang="en" data-core="${hash}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(firm.product)} · ${esc(title)}</title>
${launchLook()}
<style>.pg-open{display:inline-flex;align-items:center;min-height:64px;padding:0 30px;margin:0 12px 12px 0;border-radius:14px;background:var(--pg-open);color:var(--pg-on-open);font:700 20px/1 var(--font-body);text-decoration:none;box-shadow:0 10px 30px rgba(0,0,0,.35)}.pg-open:hover{filter:brightness(1.12)}
.pg-done{margin:22px 0 0;padding:34px 36px 24px;border-radius:18px;background:var(--pg-done);color:var(--pg-on-done);box-shadow:0 0 0 1px rgba(255,255,255,.25) inset,0 20px 60px var(--pg-done-glow)}
.pg-done[hidden]{display:none}
.pg-done-k{font:700 15px/1 var(--font-body);letter-spacing:.2em;text-transform:uppercase;margin:0 0 10px;opacity:.95}
.pg-done-t{margin:0 0 18px;font:700 clamp(34px,5vw,52px)/1.05 var(--font-head);letter-spacing:.03em;color:inherit}
.pg-done-s{margin:8px 0 0;font:500 15px/1.5 var(--font-body);opacity:.95}
.pg.is-done .pg-title{opacity:.55}</style></head>
<body><div class="building"><main class="pg" id="pg">
<div class="pg-eyebrow">${esc(firm.product)} · the live site</div>
<h1 class="pg-title">${esc(title)}</h1>
<div class="pg-note" id="note"><i></i><span id="noteText">Starting</span></div>
<div class="pg-note pg-stale" id="stale" hidden><i></i><span>No update for <b class="pg-live" style="min-width:5ch" id="staleFor">0:00</b></span></div>
<div class="pg-stats">
 <div class="pg-stat now"><b class="pg-live" style="min-width:7ch;text-align:left" id="since">0:00</b><span>Since Start</span><small id="sinceSub">job <em id="jobNo">1</em> of <em id="jobOf">1</em></small></div>
 <div class="pg-stat" id="togoCard"><b>~<em class="pg-live" id="togo">1</em> min</b><span>Roughly to Go</span><small id="togoSub">from each job's usual time</small></div>
</div>
<div class="pg-list" id="list"></div>
<section class="pg-done" id="doneCard" hidden>
  <div class="pg-done-k">✅ Finished</div>
  <h2 class="pg-done-t">Both runs are done</h2>
  <p id="pages"></p>
  <p class="pg-done-s">Finished in <b class="pg-live" id="doneIn">0:00</b>. From now on the daily jobs keep them current.</p>
</section>
</main></div>
<script>
${core}
function set(el, txt){ if (el && el.textContent !== txt) el.textContent = txt; }
function render(){
  var r = window.__runs; if (!r) return;
  var now = Date.now(), p = { step: STEPS.length, stepStartedAt: r.startedAt, updatedAt: r.updatedAt, done: r.done, jobs: r.jobs };
  var cur = currentJob(p), idx = cur ? r.jobs.indexOf(cur) : r.jobs.filter(function(j){ return j.state === "done"; }).length - 1;
  set(document.getElementById("noteText"), r.done ? "Done" : cur ? cur.label + (cur.total > 0 ? ": " + cur.done + " of " + cur.total : "") : "Starting");
  var stale = isStale(p, now), st = document.getElementById("stale");
  if (st.hidden === stale) st.hidden = !stale;
  set(document.getElementById("staleFor"), clock((now - r.updatedAt)/1000));
  set(document.getElementById("since"), clock(((r.done ? r.updatedAt : now) - r.startedAt)/1000));
  set(document.getElementById("jobNo"), String(Math.max(1, idx + 1)));
  set(document.getElementById("jobOf"), String(r.jobs.length));
  var togo = document.getElementById("togoCard"); if (togo.hidden !== !!r.done) togo.hidden = !!r.done;
  set(document.getElementById("togo"), String(minutesToGo(p, now)));
  set(document.getElementById("togoSub"), togoNote(p, now));
  var rows = jobRows(Object.assign({}, p, { done: false }), now), box = document.getElementById("list");
  if (box.children.length !== rows.length){ box.innerHTML = rows.map(function(){ return '<div class="pg-row todo"><span class="mk"></span><span class="k"></span><span class="n"></span><span class="t"></span></div>'; }).join(""); }
  for (var i=0;i<rows.length;i++){ var x = rows[i], el = box.children[i], c = "pg-row " + x.state; if (el.className !== c) el.className = c;
    set(el.children[0], x.mark); set(el.children[1], String(i + 1).padStart(2, "0")); set(el.children[2], x.name); set(el.children[3], x.time); }
  var card = document.getElementById("doneCard");
  if (card.hidden === !!r.done) card.hidden = !r.done;
  document.getElementById("pg").classList.toggle("is-done", !!r.done);
  var links = document.getElementById("pages");
  if (r.done && !links.children.length) links.innerHTML = r.pages.map(function(pg){ return '<a class="pg-open" target="_blank" rel="noopener" href="' + r.liveUrl + pg[1] + '">' + pg[0] + '</a>'; }).join("");
  if (r.done) set(document.getElementById("doneIn"), clock((r.updatedAt - r.startedAt)/1000));
}
function pull(){ var s = document.createElement("script"); s.src = "runs.js?t=" + Date.now(); s.onload = s.onerror = function(){ s.remove(); render(); }; document.head.appendChild(s); }
pull(); setInterval(pull, 5000); setInterval(render, 1000);
</script></body></html>`;
}

