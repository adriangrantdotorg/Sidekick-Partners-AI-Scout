// npm run step -- <n> "<name>" [--note "<text>"] [--live <url>] [--jobs <json>] [--restart] [--done]
// Writes the build state to: the local progress page (~/.vc-scout/<firm>), the
// database (settings.build_progress, once DATABASE_URL exists), and prints the chat block.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { config } from "dotenv";
import { STEPS, BUDGETS, LIVE_FROM, clock, minutesToGo, currentJob, type Job } from "../src/lib/progress-core.mjs";
import { firm } from "../src/firm";
import { progressDir, launchLook } from "../firm.config.mjs";

config({ path: ".env.local", quiet: true });

type State = {
  step: number;
  name: string;
  startedAt: number;
  stepStartedAt: number;
  updatedAt: number;
  note: string;
  waiting: boolean;
  waitingSince?: number;
  liveUrl: string;
  done: boolean;
  durations: Record<number, number>;
  /** the current step's jobs (Fill the Site), written by scripts/pipeline-all.ts */
  jobs?: Job[];
};

const DIR = progressDir(undefined, homedir());
const STATE = join(DIR, "progress-state.json");
const PAGE = join(DIR, "progress.html");
const JS = join(DIR, "progress.js");
const PAGE_VERSION = "v7"; // v7 (11-03-26): six steps, Fill the Site lists its jobs, the time to go counts down

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const pos = process.argv.slice(2).filter((a, i, all) => !a.startsWith("--") && !(all[i - 1] || "").startsWith("--"));
let n = Number(pos[0]);
let name = pos[1] || STEPS[n - 1];
if (n === 0 || isNaN(n)) n = -1;
if (n !== -1 && (n < 1 || n > STEPS.length)) {
  console.error(`usage: npm run step -- <1-${STEPS.length}> "<name>" [--note "<text>"] [--live <url>] [--done]`);
  process.exit(2);
}

mkdirSync(DIR, { recursive: true });
const now = Date.now();
let s: State | null = null;
if (existsSync(STATE)) {
  try {
    s = JSON.parse(readFileSync(STATE, "utf8"));
    if (!s || (s as State & { build?: string }).build !== PAGE_VERSION) s = null;
  } catch {
    s = null;
  }
}
// a background task reporting from an earlier step (or step 0) only updates the note
const restart = process.argv.includes("--restart"); // launch.sh --from N: back to step N
if (s && !restart && (n === -1 || n < s.step)) {
  n = s.step;
  name = s.name;
}
if (n === -1) n = 1;
if (!s || n === 1 && !arg("--note") && s.step !== 1) {
  // The clock starts when the launch did, not when this page took over from the plain one (scripts/prestart.sh)
  const startedAt = Number(process.env.SCOUT_STARTED_AT) || now;
  s = { step: 1, name: STEPS[0], startedAt, stepStartedAt: now, updatedAt: now, note: "", waiting: false, liveUrl: "", done: false, durations: {} };
}
// the plain page from second zero marks the tab as open (".opened-pre"), so no second tab is opened here
const firstCallOfStep1 = n === 1 && !existsSync(PAGE + ".opened-" + PAGE_VERSION) && !existsSync(PAGE + ".opened-pre");

if (n !== s.step) {
  if (n > s.step) {
    // close every step between the old one and this one
    s.durations[s.step] = Math.round((now - s.stepStartedAt) / 1000);
    for (let k = s.step + 1; k < n; k++) s.durations[k] = s.durations[k] ?? 0;
  } else for (const k of Object.keys(s.durations)) if (Number(k) >= n) delete s.durations[Number(k)];
  s.step = n;
  s.stepStartedAt = now;
  delete s.jobs;
  s.note = "";
  s.waiting = false;
  delete s.waitingSince;
}
s.name = name;
if (restart) s.done = false;
const note = arg("--note");
if (note !== undefined) {
  s.note = note;
  const waiting = /^waiting for you/i.test(note);
  if (waiting && !s.waiting) s.waitingSince = now;
  if (!waiting && s.waiting && s.waitingSince) s.stepStartedAt += now - s.waitingSince; // the wait does not count against the budget
  if (!waiting) delete s.waitingSince;
  s.waiting = waiting;
}
const jobs = arg("--jobs");
if (jobs !== undefined) {
  try {
    s.jobs = JSON.parse(jobs);
  } catch {
    /* a bad list leaves the last one */
  }
}
const live = arg("--live");
if (live) s.liveUrl = live.replace(/\/$/, "");
if (n === STEPS.length && process.argv.includes("--done")) {
  s.durations[STEPS.length] = Math.round((now - s.stepStartedAt) / 1000);
  s.done = true;
}
s.updatedAt = now;
writeFileSync(STATE, JSON.stringify({ ...s, build: PAGE_VERSION }, null, 2));

// progress.html: written once per build version; never reloads itself. Written BEFORE progress.js, so when the
// plain page from second zero (scripts/prestart.sh) sees the rich state and reloads once, this page is already there.
// The page is also rewritten when the shared progress code changes (its hash in data-core), so a wording fix reaches a
// running launch without a new PAGE_VERSION, which would start the record over (11-03-26).
const CORE_HASH = createHash("sha1").update(readFileSync(join(process.cwd(), "src/lib/progress-core.mjs"))).digest("hex").slice(0, 10);
if (!existsSync(PAGE) || !readFileSync(PAGE, "utf8").includes(`data-build="${PAGE_VERSION}" data-core="${CORE_HASH}"`)) {
  writeFileSync(PAGE, renderPage());
}

// progress.js: the state, re-read by the page every 5 s (a script tag works on file://)
writeFileSync(JS, "window.__progress = " + JSON.stringify(s) + ";\n");

// database (optional until the schema exists)
async function writeDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    // From Fill the Site on, the site is deployed: switch its Building page off, so the live checks see the real site
    // (they ran before --done and failed on every fresh launch, 10-14-26)
    const site = n >= LIVE_FROM ? { ...s, done: true } : s;
    await sql`insert into settings (key, value, updated_at) values ('build_progress', ${JSON.stringify(site)}::jsonb, now())
      on conflict (key) do update set value = excluded.value, updated_at = now()`;
  } catch {
    /* table not there yet: the local page still updates */
  }
}

function block(st: State) {
  const bar = STEPS.map((_, i) => (i < st.step - (st.done ? 0 : 1) || st.done ? "▰" : i === st.step - 1 ? "▰" : "▱")).join("");
  const since = clock((now - st.startedAt) / 1000);
  const done = STEPS.slice(0, st.step - 1)
    .map((nm, i) => `✓ ${i + 1} ${nm}${i === STEPS.indexOf("Deploy") && st.done && st.liveUrl ? ` (live: ${st.liveUrl})` : ""}`)
    .join("   ");
  const later = STEPS.map((nm, i) => ({ nm, i }))
    .filter(({ i }) => i > st.step - 1)
    .map(({ nm, i }) => `${i + 1} ${nm}`)
    .join(" · ");
  const lines = [`${bar}  Step ${st.step} of ${STEPS.length} · ${st.name} · ${since} since start`];
  if (done) lines.push(done);
  const j = currentJob(st);
  const jobLine = j && st.jobs ? `job ${st.jobs.indexOf(j) + 1} of ${st.jobs.length}: ${j.label}${j.total ? ` (${j.done} of ${j.total})` : ""}` : "";
  lines.push(st.done ? `✓ ${STEPS.length} ${st.name}: done` : `→ ${st.step} ${st.name}${jobLine ? ": " + jobLine : st.note ? ": " + st.note : ""}`);
  if (later && !st.done) lines.push("  " + later);
  lines.push(st.done ? "" : `  roughly ${minutesToGo(st, now)} min to go`);
  return lines.filter(Boolean).join("\n");
}

function renderPage() {
  const core = readFileSync(join(process.cwd(), "src/lib/progress-core.mjs"), "utf8").replace(/^export /gm, "");
  return `<!doctype html><html lang="en" data-build="${PAGE_VERSION}" data-core="${CORE_HASH}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${firm.product} · launching</title>
${launchLook()}
<style>.pg-open{display:inline-flex;align-items:center;min-height:64px;padding:0 36px;border-radius:14px;background:var(--pg-open);color:var(--pg-on-open);font:700 22px/1 var(--font-body);text-decoration:none;box-shadow:0 10px 30px rgba(0,0,0,.35)}.pg-open:hover{filter:brightness(1.12)}
.pg-done{margin:22px 0 0;padding:34px 36px 30px;border-radius:18px;background:var(--pg-done);color:var(--pg-on-done);box-shadow:0 0 0 1px rgba(255,255,255,.25) inset,0 20px 60px var(--pg-done-glow)}
.pg-done[hidden]{display:none}
.pg-done-k{font:700 15px/1 var(--font-body);letter-spacing:.2em;text-transform:uppercase;margin:0 0 10px;opacity:.95}
.pg-done-t{margin:0 0 12px;font:700 clamp(34px,5vw,52px)/1.05 var(--font-head);letter-spacing:.03em;color:inherit}
.pg-done-u{margin:0 0 20px;font:600 20px/1.4 var(--font-mono);overflow-wrap:anywhere}
.pg-done-s{margin:18px 0 0;font:500 15px/1.5 var(--font-body);opacity:.95}
.pg.is-done .pg-title{opacity:.55}
.pg-jobs{margin:0;padding:4px 0 10px}.pg-jobs[hidden]{display:none}
.pg-jobs .pg-row{padding-top:9px;padding-bottom:9px;font-size:.9em}.pg-jobs .pg-row .k{opacity:0}</style></head>
<body><div class="building"><main class="pg" id="pg">
<div class="pg-eyebrow">${firm.product}</div>
<h1 class="pg-title">Scout Is Launching</h1>
<div class="pg-note" id="note"><i></i><span id="noteText">Starting</span></div>
<div class="pg-note pg-stale" id="stale" hidden><i></i><span>No update for <b class="pg-live" style="min-width:5ch" id="staleFor">0:00</b></span></div>
<div class="pg-stats">
 <div class="pg-stat now"><b class="pg-live" style="min-width:7ch;text-align:left" id="since">0:00</b><span>Since Start</span><small>step <em id="stepNo">1</em> began <em class="pg-live" style="min-width:5ch;text-align:left" id="stepSince">0:00</em> ago</small></div>
 <div class="pg-stat" id="togoCard"><b>~<em class="pg-live" id="togo">11</em> min</b><span>Roughly to Go</span><small id="togoSub">learns from the steps so far</small></div>
</div>
<div class="pg-bar" id="bar">${STEPS.map(() => "<i></i>").join("")}</div>
<div class="pg-list" id="list">${STEPS.map((nm, i) => `<div class="pg-row todo" data-n="${i + 1}"><span class="mk">·</span><span class="k">${String(i + 1).padStart(2, "0")}</span><span class="n">${nm}</span><span class="t">about ${BUDGETS[i]} min</span></div>${i + 1 === LIVE_FROM ? '<div class="pg-jobs" id="jobs" hidden></div>' : ""}`).join("")}</div>
<section class="pg-done" id="doneCard" hidden>
  <div class="pg-done-k">🎉 It is live</div>
  <h2 class="pg-done-t">Scout is ready for you</h2>
  <p class="pg-done-u" id="doneUrl"></p>
  <p><a class="pg-open" id="openBtn" href="#" target="_blank" rel="noopener">Open Scout</a></p>
  <p class="pg-done-s">Finished in <b class="pg-live" id="doneIn">0:00</b>. The daily jobs keep it fresh from tomorrow.</p>
</section>
</main></div>
<script>
${core}
var P = null;
function set(el, txt){ if (el && el.textContent !== txt) el.textContent = txt; }
function render(){
  var p = window.__progress; if (!p) return; P = p;
  var now = Date.now();
  set(document.getElementById("noteText"), p.done ? "Done · Scout is live" : noteLine(p));
  document.getElementById("note").classList.toggle("wait", !!p.waiting);
  var stale = isStale(p, now); var st = document.getElementById("stale");
  if (st.hidden === stale) st.hidden = !stale;
  set(document.getElementById("staleFor"), clock((now - p.updatedAt)/1000));
  set(document.getElementById("since"), clock(((p.done ? p.updatedAt : now) - p.startedAt)/1000));
  set(document.getElementById("stepNo"), String(p.step));
  set(document.getElementById("stepSince"), clock((now - p.stepStartedAt)/1000));
  set(document.getElementById("togo"), String(minutesToGo(p, now)));
  var togo = document.getElementById("togoCard"); if (togo.hidden !== !!p.done) togo.hidden = !!p.done; // nothing to go once it is done
  set(document.getElementById("togoSub"), togoNote(p, now));
  var bars = document.getElementById("bar").children;
  for (var i=0;i<bars.length;i++){ var c = p.done || i < p.step-1 ? "done" : i === p.step-1 ? "now" : ""; if (bars[i].className !== c) bars[i].className = c; }
  var rows = stepRows(p), els = document.querySelectorAll("#list > .pg-row");
  for (var j=0;j<rows.length;j++){ var r = rows[j], e = els[j], cls = "pg-row " + r.state; if (e.className !== cls) e.className = cls;
    set(e.children[0], r.mark); set(e.children[2], r.name); set(e.children[3], r.time); }
  /* Fill the Site's jobs, one row each, under its step (11-03-26) */
  var jr = jobRows(p, now), box = document.getElementById("jobs");
  if (box.hidden === !!jr.length) box.hidden = !jr.length;
  if (box.children.length !== jr.length){ box.innerHTML = jr.map(function(){ return '<div class="pg-row todo"><span class="mk"></span><span class="k"></span><span class="n"></span><span class="t"></span></div>'; }).join(""); }
  for (var q=0;q<jr.length;q++){ var x = jr[q], el = box.children[q], c2 = "pg-row " + x.state; if (el.className !== c2) el.className = c2;
    set(el.children[0], x.mark); set(el.children[2], x.name); set(el.children[3], x.time); }
  /* the address shows only with the Open Scout button, once the launch is done (user, 10-14-26): before that it is not a site yet */
  var card = document.getElementById("doneCard"), btn = document.getElementById("openBtn");
  var ready = !!(p.done && p.liveUrl);
  if (card.hidden === ready) card.hidden = !ready;
  document.getElementById("pg").classList.toggle("is-done", ready);
  if (ready){ if (btn.getAttribute("href") !== p.liveUrl) btn.setAttribute("href", p.liveUrl); set(document.getElementById("doneUrl"), p.liveUrl.replace(/^https?:\\/\\//, "")); set(document.getElementById("doneIn"), clock((p.updatedAt - p.startedAt)/1000)); }
}
function pull(){ var s = document.createElement("script"); s.src = "progress.js?t=" + Date.now(); s.onload = s.onerror = function(){ s.remove(); render(); }; document.head.appendChild(s); }
pull(); setInterval(pull, 5000); setInterval(render, 1000);
</script></body></html>`;
}

await writeDb();
console.log(block(s));

if (firstCallOfStep1) {
  writeFileSync(PAGE + ".opened-" + PAGE_VERSION, String(now));
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  try {
    execFileSync(opener, [PAGE], { stdio: "ignore" });
  } catch {
    /* no opener: the chat block still carries the state */
  }
}
