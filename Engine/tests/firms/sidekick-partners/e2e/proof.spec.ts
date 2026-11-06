// The Backtest page (round 1's C, user 11-04-26; the proof from Plan step 13b; then his live review, 11-04-26: the
// firm's proven deals first, Backtest Any Startup below them, no "Waiting for a Report", no sub line): each deal Scout would have found first is a tile with one sentence whose links prove it (the signal, then the
// announcement, whose tooltip quotes the page that puts the firm in the round); no rejected signals, no "no earlier
// signal" list, no votes; the deals no page dates yet are not named. The sample rows are in
// fixture.ts (Fieldnote, Tidewell, Brightcap).
import { test, expect } from "@playwright/test";

test("the Backtest: the proven deals first, each win a linked sentence, the tool below, the undated deals unnamed", async ({ page }) => {
  await page.goto("/backtest");
  const any = page.locator("#any");
  const tile = page.locator("#firm-deals article#fieldnote");
  await expect(tile).toBeVisible();
  // Proven on Sidekick's Deals, then Backtest Any Startup (user, 11-04-26: "move 'Backtest Any Startup' below")
  expect((await page.locator("#firm-deals").boundingBox())!.y).toBeLessThan((await any.boundingBox())!.y);
  await expect(page.locator("#firm-deals .sub")).toHaveCount(0);
  await expect(any).not.toContainText("no AI");
  await expect(page.locator(".pgh .lede2")).toHaveText("How early Scout would have sourced a startup.");
  // "Scout would have flagged this on 12-19-19 through its Form D. That's 868 days before its public announcement."
  await expect(tile.locator(".bt-line")).toHaveText(/^Scout would have flagged this on \d\d-\d\d-\d\d through a news story\. That's 61 days before its public announcement\.$/);
  await expect(tile.getByRole("link", { name: "a news story" })).toHaveAttribute("href", "https://news.example.com/fieldnote-launch");
  const ann = tile.getByRole("link", { name: "its public announcement" });
  await expect(ann).toHaveAttribute("href", "https://news.example.com/fieldnote-seed");
  await expect(ann).toHaveAttribute("title", /with participation from Sidekick Partners/);
  // removed on 11-04-26: the rejected signals, the "no earlier signal" list, the report link, the votes
  for (const gone of ["Rejected", "No Earlier Signal", "The Report That Dates the Round"]) await expect(page.locator("main")).not.toContainText(gone);
  await expect(page.locator("main [data-vote]")).toHaveCount(0);
  // the deals no reputable page dates yet are not shown at all (user, 11-04-26: "remove 'Waiting for a Report'")
  for (const gone of ["Waiting for a Report", "The same check", "Brightcap", "Tidewell"]) await expect(page.locator("main")).not.toContainText(gone);
  await expect(page.locator("#waiting, article#tidewell, article#brightcap")).toHaveCount(0);
  await expect(page.locator(".rail .toc a")).toHaveText(["Proven on Sidekick's Deals", "Backtest Any Startup"]);
});
