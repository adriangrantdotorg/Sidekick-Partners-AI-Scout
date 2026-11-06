// npm run pipeline:all [-- job[:rounds] ... --rounds=N --skip-fresh=<minutes>]: runs every job locally, in order, until
// each one is done (up to N 270 s rounds each, 3 by default; `backfill:40` gives one job its own limit). The launch's
// Fill the Site step runs it, and the progress page lists each job: ✓ with its time, → with its own count ("45 of
// 144") read from its job_runs row every 15 s, · with its usual time (user, 11-03-26: the page showed "(5 of 9)" in
// a note and "~1 min" for half an hour). --skip-fresh skips a job that finished ok within that many minutes, so a
// resumed launch picks up where it stopped (only runs that ended before this one began: score runs twice in a fill).
import { config } from "dotenv";
config({ path: process.env.SCOUT_ENV_FILE || ".env.local", quiet: true }); // live-runs.sh: the keys may sit in the main folder (scripts/keys.sh)
const { runNamed, JOBS: SCHEDULED, ON_DEMAND } = await import("../src/lib/jobs");
const JOBS = { ...SCHEDULED, ...ON_DEMAND };
const { db, schema: S, saveLocalDb } = await import("../src/db"); // SCOUT_PGLITE: the local copy keeps what each job found
const { and, desc, eq, gte, lte } = await import("drizzle-orm");
const { execFile } = await import("node:child_process");
const { LIVE_FROM, wholeCount } = await import("../src/lib/progress-core.mjs");
const { titleCase } = await import("../src/lib/format"); // the page's rows are labels: Title Case (his standard)
const START = new Date();

const args = process.argv.slice(2);
const flag = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const maxRounds = Number(flag("rounds")) || 3;
const skipFresh = Number(flag("skip-fresh")) || 0;
// --page="<title>": the progress page for a run user starts himself on a live site (scripts/runs-page.ts), not the
// launch page, and nothing written to the site's database (the launch page writes its build state there)
const pageTitle = args.find((a) => a.startsWith("--page="))?.slice("--page=".length) || "";
const named = args.filter((a) => !a.startsWith("--"));
// the default run skips the jobs whose feature this firm turned off (JOBS holds only the firm's own)
const DEFAULT = ["collect-media", "collect-signals", "culture", "sponsors", "trends", "funds-neighborhood", "funds-synergistic", "score", "enrich", "alerts", "monday-brief", "links"];
const order = (named.length ? named : DEFAULT)
  .map((a) => ({ key: a.split(":")[0], rounds: Number(a.split(":")[1]) || maxRounds }))
  .filter((j) => j.key in JOBS);

// ---------- the progress page (scripts/step.ts): the job list, written in order, one write at a time ----------
const quiet = !!(process.env.SCOUT_PGLITE || process.env.SCOUT_NO_PROGRESS); // a local copy, or the launch's step 2 portfolio load
const STEP = String(Number(process.env.SCOUT_PROGRESS_STEP) || LIVE_FROM);
type Job = import("../src/lib/progress-core.mjs").Job;
const jobs: Job[] = order.map((j) => ({ key: j.key, label: titleCase(JOBS[j.key as keyof typeof JOBS].label), state: "todo" }));
let writing: Promise<void> = Promise.resolve();
const { runsState, writeRunsPage, runsPage } = await import("./runs-page");
let finished = false;
const report = () => {
  if (pageTitle) {
    writeRunsPage({ ...runsState(pageTitle, jobs, START.getTime()), done: finished });
    return writing;
  }
  if (quiet) return writing;
  const list = JSON.stringify(jobs);
  writing = writing.then(
    () => new Promise<void>((res) => execFile("npx", ["tsx", "scripts/step.ts", STEP, "--jobs", list], () => res())),
  );
  return writing;
};

async function freshlyDone(key: string) {
  if (!skipFresh) return null;
  const [r] = await db()
    .select({ startedAt: S.jobRuns.startedAt, finishedAt: S.jobRuns.finishedAt })
    .from(S.jobRuns)
    .where(and(eq(S.jobRuns.job, key), eq(S.jobRuns.status, "ok"), gte(S.jobRuns.finishedAt, new Date(Date.now() - skipFresh * 60_000)), lte(S.jobRuns.finishedAt, START)))
    .orderBy(desc(S.jobRuns.id))
    .limit(1);
  return r || null;
}

// while a job runs, its own count ("45 of 144") comes from its job_runs row
let watching: ReturnType<typeof setInterval> | null = null;
function watch(j: Job) {
  if (quiet && !pageTitle) return;
  watching = setInterval(async () => {
    try {
      const [r] = await db().select({ done: S.jobRuns.done, total: S.jobRuns.total, stage: S.jobRuns.stage }).from(S.jobRuns).where(eq(S.jobRuns.job, j.key)).orderBy(desc(S.jobRuns.id)).limit(1);
      if (r && r.total > 0) {
        Object.assign(j, wholeCount(j, { ...r, stage: r.stage || "" })); // "9 of 86" for the whole job, not "3 of 80" for this round
        j.countAt = Date.now();
        await report();
      }
    } catch {
      /* the count is a nicety; the job runs on */
    }
  }, 15_000);
}

await report();
if (pageTitle) console.log(`[pipeline] progress page: ${runsPage()}`);
for (const [i, o] of order.entries()) {
  const j = jobs[i];
  // a job's second turn in one run (score after the backfill) always runs: it is there to see what came before it
  const earlier = order.findIndex((x) => x.key === o.key) === i ? await freshlyDone(o.key) : null;
  if (earlier) {
    Object.assign(j, { state: "done", earlier: true, secs: earlier.finishedAt ? Math.round((+earlier.finishedAt - +earlier.startedAt) / 1000) : 0 });
    console.log(`[pipeline] ${o.key}: done earlier, skipped`);
    await report();
    continue;
  }
  const t0 = Date.now();
  Object.assign(j, { state: "now", startedAt: t0 });
  await report();
  watch(j);
  let rounds = 0;
  for (;;) {
    rounds++;
    console.log(`[pipeline] ${o.key} round ${rounds}`);
    const r = await runNamed(o.key, 270_000);
    console.log(`[pipeline] ${o.key}: ${r.status}, ${r.items} items, ${r.errors} errors, ${Math.round((Date.now() - t0) / 1000)}s`);
    await saveLocalDb();
    if (!(r.timedOut || r.more) || rounds >= o.rounds) break;
  }
  if (watching) clearInterval(watching);
  Object.assign(j, { state: "done", secs: Math.round((Date.now() - t0) / 1000) });
  await report();
}
finished = true;
await report();
await writing;
console.log("[pipeline] done");
process.exit(0); // open sockets (and a local copy) would keep the process alive
