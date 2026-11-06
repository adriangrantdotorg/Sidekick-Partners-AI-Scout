// The live address shows only with the Open Scout button, once the launch is done (user, 10-14-26): during
// Deploy and Open it is not a site yet. Guards the step rows (local page and the site's Building page), the
// terminal block and the page markup.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { stepRows, jobRows, minutesToGo, noteLine, togoNote, STEPS, LIVE_FROM } from "../../src/lib/progress-core.mjs";

const ROOT = join(__dirname, "..", "..");
const url = "https://example-firm-scout-2.vercel.app";
const base = { step: 5, name: "Open", startedAt: 0, stepStartedAt: 0, updatedAt: 0, note: "", waiting: false, liveUrl: url, durations: {} };

describe("the live address waits for the Open Scout button", () => {
  it("step rows name the address only when done", () => {
    const deploy = STEPS.indexOf("Deploy");
    expect(stepRows({ ...base, done: false })[deploy].name).toBe("Deploy");
    expect(stepRows({ ...base, done: true })[deploy].name).toContain("live at example-firm-scout-2.vercel.app");
  });

  it("the page has no footer address and shows the address only inside the done card", () => {
    const step = readFileSync(join(ROOT, "scripts", "step.ts"), "utf8");
    expect(step).not.toContain('id="foot"');
    expect(step).not.toContain("Live site:");
    expect(step).toContain('id="doneCard" hidden');
    expect(step).toMatch(/var ready = !!\(p\.done && p\.liveUrl\)/);
    // the terminal block shows "(live: …)" only once done
    expect(step).toContain("st.done && st.liveUrl ? ` (live:");
    // the site's Building page goes off as soon as the last step starts, so the live checks see the real site
    expect(step).toContain("n >= LIVE_FROM ? { ...s, done: true } : s");
    expect(STEPS[LIVE_FROM - 1]).toBe("Fill the Site");
  });

  it("the launch asks Vercel about each project name instead of parsing the listing", () => {
    const launch = readFileSync(join(ROOT, "scripts", "launch.sh"), "utf8");
    expect(launch).not.toMatch(/V project ls/); // the parsed listing is gone; only the comment names it
    expect(launch).toContain('V project inspect "$1"');
    expect(launch).toContain("project_not_found");
    expect(launch).toContain("there is no project for"); // Vercel CLI 65's wording for a free name (11-03-26)
  });

  // 11-03-26, Sidekick's first launch: the live checks ran on an empty database, the cron check sent an empty secret,
  // and a resumed run's progress page stayed on an earlier run's step 5
  it("a first launch with no startups pulls its sources before the live checks", () => {
    const launch = readFileSync(join(ROOT, "scripts", "launch.sh"), "utf8");
    const pull = launch.indexOf('npx tsx scripts/pipeline-all.ts $FILL_JOBS --skip-fresh=360');
    expect(pull).toBeGreaterThan(-1);
    expect(pull).toBeLessThan(launch.indexOf("scripts/verify-live.ts"));
    expect(launch).toContain('[ -n "$CS" ] && CRON=');
    expect(launch).toContain('step "$FROM" --restart');
    expect(readFileSync(join(ROOT, "scripts", "step.ts"), "utf8")).toContain('process.argv.includes("--restart")');
  });

  // user, 11-03-26, on the page: "it appears that we're on the final step, which is step 5, but at the top of the
  // page it says 7 of 9 … stating that something is 1 minute to go for several minutes is a poor user experience"
  describe("Fill the Site tells the truth", () => {
    const t0 = 1_000_000_000;
    const fill = (jobs: object[], now = t0) => ({ ...base, step: 5, name: "Fill the Site", stepStartedAt: t0, updatedAt: now, done: false, durations: { 1: 10, 2: 8, 3: 257, 4: 20 }, jobs });
    const four = (state: string, extra = {}) => [
      { key: "collect-signals", label: "Startup Signals", state: "done", secs: 60 },
      { key: "backfill", label: "Funding News, Last 12 Months", state, startedAt: t0, ...extra },
      { key: "thesis-check-all", label: "AI Thesis Check, Every Card", state: "todo" },
      { key: "library", label: "Library Backfill", state: "todo" },
    ];

    it("one count: the step and the job, never two numbers that read alike", () => {
      expect(noteLine(fill(four("now")) as never)).toBe("Step 5 of 6 · Fill the Site · job 2 of 4: Funding News, Last 12 Months");
      expect(stepRows(fill(four("now")) as never)[4].time).toBe("1 of 4 jobs");
    });

    it("the time to go counts down as the job runs, from its own pace once it reports one", () => {
      // 36 of 144 searches read at minute 10 → 30 min left for the backfill; between reads it counts down, never up
      const p = fill(four("now", { done: 36, total: 144, countAt: t0 + 600_000 }));
      const at = (min: number) => minutesToGo(p as never, t0 + min * 60_000);
      expect(at(10)).toBe(at(10.25) + 0); // whole minutes: 15 s moves nothing up
      expect(at(10)).toBeGreaterThan(at(11));
      expect(at(10) - at(20)).toBe(10);
      expect(togoNote(p as never, t0 + 600_000)).toBe("at this job's pace: 36 of 144 done");
    });

    it("a job past its usual time says so instead of holding a number", () => {
      const p = fill(four("now"));
      expect(togoNote(p as never, t0 + 60 * 60_000)).toMatch(/^Funding News, Last 12 Months is taking longer than usual: 1:00:00 so far$/);
    });

    it("each job has its row: ✓ with its time, → with its count, · with its usual time", () => {
      const rows = jobRows(fill(four("now", { done: 36, total: 144 })) as never, t0 + 600_000);
      expect(rows.map((r) => r.mark)).toEqual(["✓", "→", "·", "·"]);
      expect(rows[0].time).toBe("1:00");
      expect(rows[1].time).toBe("36 of 144 · 10:00");
      expect(rows[2].time).toMatch(/^about \d+ min$/);
    });

    it("the page draws the job rows under Fill the Site", () => {
      const step = readFileSync(join(ROOT, "scripts", "step.ts"), "utf8");
      expect(step).toContain('<div class="pg-jobs" id="jobs" hidden></div>');
      expect(step).toContain("togoNote(p, now)");
    });
  });
});
