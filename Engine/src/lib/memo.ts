// The firm's memo outline (its profile's memo.outline), filled with every fact and link Scout has.
import { desc, eq } from "drizzle-orm";
import { db, schema as S } from "@/db";
import { areaLabel, fmtDate, fmtMoney, stageLabel } from "./format";
import { playOf } from "./score";
import { cleanCopy } from "./copy";
import { investorsOf } from "./enrich";
import { dealDate, likelyAcquirers } from "./acquirers";
import { firm, on } from "@/firm";

export async function memoOutline(id: number): Promise<{ name: string; markdown: string } | null> {
  const [c] = await db().select().from(S.companies).where(eq(S.companies.id, id));
  if (!c) return null;
  const sigs = await db().select().from(S.signals).where(eq(S.signals.companyId, id)).orderBy(desc(S.signals.date));
  const filing = (await db().select().from(S.filings).where(eq(S.filings.companyId, id)).limit(1))[0];
  const play = playOf(`${c.name}. ${c.description || ""}`, c.thesisArea);
  const area = areaLabel(c.thesisArea) || null;
  const round = c.amount ? `${fmtMoney(c.amount, c.currency)} ${stageLabel(c.stage)}` : c.stage !== "unknown" ? stageLabel(c.stage) : "[TBD: round size]";
  const src = sigs.map((s) => `- ${s.title} (${s.source}${s.date ? `, ${fmtDate(s.date)}` : ""}): ${s.url}`).join("\n");
  const founders = filing?.related?.length ? filing.related.join(", ") + ` (named in the Form D: ${filing.url})` : "[TBD: founders and their track record]";
  const portfolio = c.portfolioCheck ? `; portfolio check: ${c.portfolioCheck.kind === "competes" ? "competes with" : "adjacent to"} ${c.portfolioCheck.with} (${cleanCopy(c.portfolioCheck.reason)})` : "";
  // what the public record already answers, so the outline needs no deck (user, 11-04-26: the download "appears that
  // this is also optimized for the deck to be screened"): who backed it, its signals, and the likely buyers
  const backing = sigs.map((s) => ({ who: investorsOf(s.title), url: s.url })).find((x) => x.who);
  const investors = backing ? `${backing.who} (${backing.url})` : null;
  const outlets = new Set(sigs.map((s) => s.source)).size;
  const signals = sigs.length ? `${sigs.length} ${sigs.length === 1 ? "story" : "stories"} from ${outlets} ${outlets === 1 ? "source" : "sources"}, newest ${fmtDate(sigs[0].date)} (listed at the end)` : "none yet";
  const acq = on("likelyAcquirers") ? likelyAcquirers(c.thesisArea, [...sigs.map((s) => s.title), investors || ""]) : null;
  const buyers = (acq?.buyers || [])
    .slice(0, 4)
    .map((b) => {
      const d = b.deals[0];
      return `- ${b.name}${b.invested ? " (its venture arm already backed it)" : ""}${d ? `: bought ${d.company} (${dealDate(d.date)}), ${d.price}${d.multiple ? `, ${d.multiple}` : ""}: ${d.url}` : ""}`;
    })
    .join("\n");
  const outline = firm.memo.outline({ name: c.name, area, round, play, description: cleanCopy(c.description), descriptionUrl: c.descriptionUrl, domain: c.domain, founders, whyFits: cleanCopy(c.whyFits), portfolio, fit: c.score, found: fmtDate(c.firstSeen), investors, signals, buyers });
  // the outline only: how to write it lives in the AI's request (draftMemo), never in the text it copies (11-04-26: the
  // first local draft repeated "Write this in Sidekick's voice … 600 to 900 words" word for word)
  const md = `# ${firm.memo.title}: ${c.name}

${outline}

---
## Everything Scout has on ${c.name}
- Industry: ${area || "Unknown"} · Stage: ${stageLabel(c.stage)} · Thesis fit: ${c.score}%
- First seen by Scout: ${fmtDate(c.firstSeen)}
${src || "- [TBD: sources]"}
`;
  return { name: c.name, markdown: md };
}
