// The screen review's copy of the test Scout (user, 11-02-26: "let me see this", the moving parts nobody had shown
// him): the browser-test startups and a launch halfway through, so Today shows the launch progress page (the made-up
// trends joined the shared test data on 11-03-26, fixture.ts TRENDS). Since 11-03-26 ("add sample data here so i can see what it looks
// like": Co-Investors and Tracking) the funds, deals, Tracking items and filings come with the shared test data
// (fixture.ts sampleWorld()), so the browser tests read those pages with data too. Never used by the browser tests (a launch in progress replaces
// Today). Writes .local-db/sidekick-review.tar.gz; Sidekick Partners/design/pages/capture_states.mjs reads it.
// npx tsx tests/firms/sidekick-partners/e2e/review-fixture.ts
import * as S from "../../../../src/db/schema";
import { writeFixture } from "./fixture";

export const REVIEW_DB = ".local-db/sidekick-review.tar.gz";

await writeFixture(REVIEW_DB, async (d) => {
  const now = Date.now();
  await d.insert(S.settings).values({
    key: "build_progress",
    value: { step: 3, name: "Build and Tests", startedAt: now - 4 * 60000, stepStartedAt: now - 70000, updatedAt: now, note: "one production build (about a minute)", waiting: false, liveUrl: "", done: false, durations: { 1: 95, 2: 52 } },
  });
});
