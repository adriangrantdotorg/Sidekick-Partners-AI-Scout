// The Co-Investors timeline (user, 11-03-26, round 1's C: "use that version"): newest first, a shared round once with
// every fund in it, This Week then each month.
import { describe, it, expect } from "vitest";
import { timeline, byMonth, fundsLine, money } from "@/lib/timeline";

const now = new Date("2026-11-03T15:00:00Z");
const news = (fundName: string, company: string, date: string, extra = {}) => ({ title: `${company} raises`, url: `https://n.example/${company}`, source: "citybiz", date, company, round: "seed", amount: 12.5e6, currency: "$", role: null, possible: false, thesisArea: "vertical-saas", kind: "deal", fundName, ...extra });
const funds = [
  { name: "Nyca Partners", shared: [{ company: "CoverForce", round: "$13M Series A", date: "2025-03-05", url: "https://www.alleywatch.com/x" }] },
  { name: "Gaingels", shared: [{ company: "CoverForce", round: "$13M Series A", date: "2025-03-05", url: "https://www.alleywatch.com/x" }] },
];

describe("the Co-Investors timeline", () => {
  const t = timeline([news("Acrew Capital", "Guava", "2026-11-03", { role: "lead" }), news("Y Combinator", "Broccoli", "2026-10-30", { possible: true }), news("X", "Ignored", "2026-10-01", { kind: "newfund" })], funds);
  it("newest first; a shared round once, with every fund in it", () => {
    expect(t.map((e) => e.company)).toEqual(["Guava", "Broccoli", "CoverForce"]);
    expect(t[2]).toMatchObject({ shared: true, funds: ["Nyca Partners", "Gaingels"], outlet: "alleywatch.com", round: "$13M Series A" });
  });
  it("a news deal keeps its headline, its round, whether the fund led, and whether the headline names the fund", () => {
    expect(t[0]).toMatchObject({ headline: "Guava raises", round: "$12.5M Seed", lead: true, unnamed: false });
    expect(t[1]).toMatchObject({ unnamed: true });
  });
  it("This Week first, then each month", () => {
    expect(byMonth(t, now).map((g) => [g.heading, g.entries.length])).toEqual([["This Week", 2], ["March 2025", 1]]);
  });
  it("names up to three funds, then how many more", () => {
    expect(fundsLine(["A", "B", "C", "D", "E"])).toBe("A, B, C and 2 more");
    expect(fundsLine(["A", "B"])).toBe("A and B");
    expect(money(189000)).toBe("$189K");
  });
});
