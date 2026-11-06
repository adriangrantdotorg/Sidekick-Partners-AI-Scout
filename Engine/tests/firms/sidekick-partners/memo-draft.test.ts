// Gaps Become Questions (11-04-26): the memo states only what Scout knows, every gap is a numbered question to the
// founder, grouped by section, and nothing unsourced or unfinished reaches the page. Checked on the sample of record.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { MAX_QUESTIONS, QUESTIONS_HEADING, draftProblems, memoPrompt, scrubDraft, tidyDraft } from "@/lib/memo-draft";

const sample = readFileSync(new URL("../../../../Sidekick Partners/design/memo/Rebuy memo (Gaps Become Questions).md", import.meta.url), "utf8")
  .split("\n")
  .filter((l) => !l.startsWith(">")) // Claude's note above the sample, not the AI's words
  .join("\n");
// the links Scout handed the AI for Rebuy (the sample's Sources)
const outline = `## 1. Recommendation\n[TBD]\n\nWebsite: https://rebuyengine.com
- Seed: https://www.rebuyengine.com/news-room/rebuy-raises-4m-series-seed-investment-led-by-peterson-ventures
- Series A: https://www.rebuyengine.com/news-room/series-a-announcement
- Portfolio: https://www.sidekickpartners.com/pages/portfolio-list
- Instacart: https://www.grocerydive.com/news/instacart-buys-smart-cart-maker-caper-ai-for-350m/608438/`;
const questions = (md: string) => md.slice(md.indexOf(`## ${QUESTIONS_HEADING}`)).split("\n## Sources")[0];

describe("Gaps Become Questions", () => {
  it("the request asks for questions, not gaps, and quotes what the last draft broke", () => {
    const p = memoPrompt({ firm: "Sidekick Partners'", title: "Investment Memo", voice: "clear", outline, fix: ["a gap was written into a section"] });
    expect(p).toContain(`## ${QUESTIONS_HEADING}`);
    expect(p).toContain(`at most ${MAX_QUESTIONS} questions`);
    expect(p).toContain("Use only the links in the outline");
    expect(p).toContain("Your last draft broke these rules");
    expect(p).toContain("Sidekick Partners' \"Investment Memo\" voice");
  });

  it("catches the gap that slipped into the sample's section 6, and nothing else", () => {
    const p = draftProblems(sample, outline);
    expect(p).toHaveLength(1);
    expect(p[0]).toMatch(/gap was written into a section/);
    expect(p[0]).toMatch(/to confirm/);
  });

  it("catches a link the outline never gave", () => {
    const p = draftProblems(sample.replace("https://rebuyengine.com)", "https://made-up.example.com/stats)"), outline);
    expect(p.some((x) => x.includes("made-up.example.com"))).toBe(true);
  });

  it("catches a draft with no questions, and one with too many", () => {
    expect(draftProblems("## 1. Recommendation\nTake the meeting.", outline)).toContain(`no "## ${QUESTIONS_HEADING}" section`);
    const many = `## 1. Recommendation\nTake the meeting.\n\n## ${QUESTIONS_HEADING}\n### Traction\n${Array.from({ length: 18 }, (_, i) => `${i + 1}. Q${i + 1}?`).join("\n")}`;
    expect(draftProblems(many, outline)).toContain(`18 questions: ask at most ${MAX_QUESTIONS}`);
    expect(questions(tidyDraft(many)).match(/^\d+\. /gm)).toHaveLength(MAX_QUESTIONS);
  });

  it("drops the Recommendation group (no gap the founder fills) and numbers the rest straight through", () => {
    const q = questions(tidyDraft(sample));
    expect(q).not.toMatch(/### Recommendation/);
    expect(q).not.toMatch(/metrics you hold the team accountable/);
    expect(q).toMatch(/^### Market and timing\n1\. What market size/m);
    const nums = [...q.matchAll(/^(\d+)\. /gm)].map((m) => Number(m[1]));
    expect(nums).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
    expect(tidyDraft(sample)).toMatch(/## Sources\nhttps:\/\/rebuyengine\.com/);
  });

  it("knows a group by its section's name, numbered or not (GPT-5 wrote \"### 1. Recommendation\", 11-04-26)", () => {
    const md = `## 1. Recommendation\nTake the meeting.\n\n## ${QUESTIONS_HEADING}\n\n### 1. Recommendation\n1. What metric proves value?\n\n### 5. Traction\n2. What is ARR?\n\n## Sources\nhttps://rebuyengine.com`;
    expect(questions(tidyDraft(md))).toBe(`## ${QUESTIONS_HEADING}\n\n### Traction\n1. What is ARR?\n`);
  });

  it("the last resort takes out only the sentences with a gap, keeping the rest of the section", () => {
    const s = scrubDraft(sample, outline);
    expect(draftProblems(s, outline)).toEqual([]);
    expect(s).toContain("Gross margin, retention, and the cost to win a customer: from the founder.");
    expect(s).not.toMatch(/to be confirmed|to confirm/);
    expect(s).toContain("## 6. Business model and path to profit");
  });
});
