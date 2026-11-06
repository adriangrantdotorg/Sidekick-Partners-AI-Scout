// One producer for the build-progress view. Used by scripts/step.ts (inlined into the
// local file:// page) and by the live Building page. Plain JS so both can load it.

// The six steps of `npm run launch` (v7, 11-03-26). Fill the Site holds the jobs that fill a new database (the first
// pull, and on a first launch with no seed the 12-month backfill, the AI Thesis Check and the Library), each listed
// on the page. Before v7 they ran unseen inside step 5 "Open" and the page said "Step 5 of 5 · (5 of 9) · ~1 min" for
// half an hour (user, 11-03-26: "stating that something is 1 minute to go for several minutes is a poor user
// experience").
export const STEPS = ["Setup", "Database", "Build and Tests", "Deploy", "Fill the Site", "Open"];
// minutes; measured 11-03-26 on Sidekick's launch: 0:10 · 0:08 · 4:17 · 0:20, Open about a minute. Fill the Site's
// own minutes come from its jobs (JOB_SECONDS); its budget here is for a launch whose first pull runs behind the site.
export const BUDGETS = [2, 1, 5, 1, 1, 1];
// From this step on the deployed site is the real one: its Building page switches off (scripts/step.ts).
export const LIVE_FROM = 5;

// Seconds each job took on Sidekick's first pull (11-03-26), the starting estimate for a job that has no count of its
// own yet; a job that reports "N of M" is estimated from its own pace instead.
export const JOB_SECONDS = {
  "collect-media": 15, "collect-signals": 60, trends: 5, "funds-neighborhood": 100, "funds-synergistic": 60,
  score: 10, enrich: 480, alerts: 30, "monday-brief": 30, backfill: 1800, "thesis-check-all": 900, library: 600,
  // Sidekick's 86 portfolio companies, measured on a copy of the live data (11-04-26: 2,625 s, the Proof Finder)
  "portfolio-backtest": 2700,
  // every stored news link a page shows, opened once: Sidekick's 391, measured on a copy of the live data (11-04-26:
  // 1,564 s). A launch's leftovers are fewer (each job opens its own); the job's own count corrects the estimate
  "links-all": 1560,
};
const jobGuess = (j) => JOB_SECONDS[j.key] ?? 120;

export function clock(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(sec % 60).padStart(2, "0");
  return h ? h + ":" + String(m).padStart(2, "0") + ":" + s : m + ":" + s;
}

/** The running job's seconds left: from its own pace once it reports "N of M", else from its usual time. */
function jobLeft(j, now) {
  const ran = Math.max(0, (now - (j.startedAt || now)) / 1000);
  if (j.total > 0 && j.done > 0) {
    // the pace when the count was read (countAt), minus the time since: it counts down between reads, never up
    const at = j.countAt || now;
    const pace = Math.max(1, (at - (j.startedAt || at)) / 1000) / j.done;
    return Math.max(0, pace * (j.total - j.done) - Math.max(0, (now - at) / 1000));
  }
  return Math.max(0, jobGuess(j) - ran);
}

/** True while the running job has gone past its usual time with no count to say how far it is. */
export function jobLate(j, now) {
  if (!j || j.state !== "now" || (j.total > 0 && j.done > 0)) return false;
  return (now - (j.startedAt || now)) / 1000 > jobGuess(j) * 1.25;
}

/** The jobs' seconds still to go, the finished jobs teaching the rest how fast this machine is. */
function jobsLeft(jobs, now) {
  let actual = 0;
  let guessed = 0;
  for (const j of jobs) if (j.state === "done" && typeof j.secs === "number" && !j.earlier) { actual += j.secs; guessed += jobGuess(j); }
  const ratio = guessed > 0 ? Math.min(1.6, Math.max(0.5, actual / guessed)) : 1;
  let left = 0;
  for (const j of jobs) {
    if (j.state === "now") left += jobLeft(j, now);
    else if (j.state === "todo") left += jobGuess(j) * ratio;
  }
  return left;
}

// "Roughly to go", in whole minutes. Pauses while a "Waiting for you" note is up. Counts down every second.
/** A job's count for the page from its latest job_runs row. A job that runs in rounds counts what is left each round
 *  ("3 of 80"), so the page shows the whole job ("9 of 86") from the first round's total while the stage is the same
 *  one; a job with several stages shows each stage's own count. Sets j.stage and j.first on the first read. */
export function wholeCount(j, row) {
  if (!j.stage) Object.assign(j, { stage: row.stage, first: row.total });
  const whole = row.stage === j.stage && (j.first || 0) >= row.total;
  return whole ? { done: j.first - (row.total - row.done), total: j.first } : { done: row.done, total: row.total };
}

export function minutesToGo(p, now) {
  if (!p || p.done) return 0;
  const cur = p.step - 1;
  const durations = p.durations || {};
  let actual = 0;
  let budgeted = 0;
  for (let i = 0; i < cur; i++) {
    const d = durations[i + 1];
    if (typeof d === "number" && i + 1 !== LIVE_FROM) {
      actual += d / 60;
      budgeted += BUDGETS[i];
    }
  }
  let ratio = budgeted > 0 ? actual / budgeted : 1;
  ratio = Math.min(1.6, Math.max(0.7, ratio));
  const effectiveNow = p.waiting && p.waitingSince ? p.waitingSince : now;
  const inStep = Math.max(0, (effectiveNow - (p.stepStartedAt || now)) / 60000);
  const jobs = Array.isArray(p.jobs) && p.jobs.length ? p.jobs : null;
  let left = jobs ? jobsLeft(jobs, effectiveNow) / 60 : Math.max(0, BUDGETS[cur] * ratio - inStep);
  for (let i = cur + 1; i < BUDGETS.length; i++) left += BUDGETS[i] * ratio;
  return Math.max(1, Math.ceil(left));
}

/** The line under "Roughly to Go": what the estimate rests on, said plainly. */
export function togoNote(p, now) {
  if (!p) return "";
  if (p.waiting) return "paused while it waits for you";
  const j = currentJob(p);
  if (j && jobLate(j, now)) return j.label + " is taking longer than usual: " + clock((now - j.startedAt) / 1000) + " so far";
  if (j && j.total > 0 && j.done > 0) return "at this job's pace: " + j.done + " of " + j.total + " done";
  if (j) return "from each job's usual time";
  return "learns from the steps so far";
}

export function currentJob(p) {
  return p && Array.isArray(p.jobs) ? p.jobs.find((j) => j.state === "now") || null : null;
}

export function isStale(p, now) {
  return !!p && !p.done && now - (p.updatedAt || now) > 10 * 60 * 1000;
}

export function stepRows(p) {
  const cur = p ? p.step : 1;
  return STEPS.map((name, i) => {
    const n = i + 1;
    const state = p && p.done ? "done" : n < cur ? "done" : n === cur ? "now" : "todo";
    const d = p && p.durations ? p.durations[n] : undefined;
    let label = name;
    // the address appears only once the launch is done, together with the Open Scout button (user, 10-14-26)
    if (name === "Deploy" && p && p.done && p.liveUrl) label = name + " · live at " + p.liveUrl.replace(/^https?:\/\//, "");
    const jobs = n === cur && p && Array.isArray(p.jobs) ? p.jobs : [];
    const time = state === "done" && typeof d === "number" ? clock(d) : state === "now" && jobs.length
      ? jobs.filter((j) => j.state === "done").length + " of " + jobs.length + " jobs"
      : "about " + BUDGETS[i] + " min";
    return { n, num: String(n).padStart(2, "0"), name: label, state, time, mark: state === "done" ? "✓" : state === "now" ? "→" : "·" };
  });
}

/** The current step's jobs, one row each: ✓ with its time, → with its count or time so far, · with its usual time. */
export function jobRows(p, now) {
  const jobs = p && !p.done && Array.isArray(p.jobs) ? p.jobs : [];
  return jobs.map((j) => {
    const ran = (now - (j.startedAt || now)) / 1000;
    const time = j.state === "done" ? (j.earlier ? "done earlier" : clock(j.secs || 0))
      : j.state === "now" ? (j.total > 0 ? j.done + " of " + j.total + " · " : "") + clock(ran)
      : "about " + Math.max(1, Math.round(jobGuess(j) / 60)) + " min";
    return { key: j.key, name: j.label, state: j.state, time, mark: j.state === "done" ? "✓" : j.state === "now" ? "→" : "·" };
  });
}

export function noteLine(p) {
  if (!p) return "Starting";
  const base = "Step " + p.step + " of " + STEPS.length + " · " + p.name;
  const jobs = Array.isArray(p.jobs) ? p.jobs : [];
  const j = currentJob(p);
  if (j && !p.waiting) return base + " · job " + (jobs.indexOf(j) + 1) + " of " + jobs.length + ": " + j.label;
  return p.note ? (p.waiting ? p.note : base + " · " + p.note) : base;
}
