// A real Gaps Become Questions draft on a throwaway database (Rebuy's public facts), written to a file: nothing on any
// site. `npx tsx scripts/memo-try.ts <out.md>` with the AI key in the environment. Costs one or two memo drafts (~$0.03).
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { writeFileSync } from "node:fs";
import * as schema from "@/db/schema";
import { firm } from "@/firm";

async function main() {
  const d = drizzle(new PGlite(), { schema });
  await migrate(d, { migrationsFolder: "./drizzle" });
  (globalThis as { __scoutTestDb?: unknown }).__scoutTestDb = d;
  const outline = firm.memo.outline({
    name: "Rebuy",
    area: "E-Commerce Software",
    round: "$17M Series A",
    play: null,
    description: "AI personalization and upsell platform for Shopify merchants.",
    descriptionUrl: "https://rebuyengine.com",
    domain: "rebuyengine.com",
    founders: "[TBD: founders and their track record]",
    whyFits: "",
    portfolio: "",
    investors: "M13, Dynamism Capital, R-Squared Ventures and Salt VC (https://www.rebuyengine.com/news-room/series-a-announcement)",
    signals: "2 stories from 1 source, newest 02-24-23 (listed at the end)",
    buyers: "- Instacart: bought Caper AI (10-19-21), about $350M in cash and stock: https://www.grocerydive.com/news/instacart-buys-smart-cart-maker-caper-ai-for-350m/608438/",
  });
  const md = `# ${firm.memo.title}: Rebuy\n\n${outline}\n\n---\n## Everything Scout has on Rebuy\n- Industry: E-Commerce Software · Stage: Series A\n- Rebuy raises $4M seed led by Peterson Ventures (rebuyengine.com, 12-15-21): https://www.rebuyengine.com/news-room/rebuy-raises-4m-series-seed-investment-led-by-peterson-ventures\n- Rebuy raises $17M Series A (rebuyengine.com, 02-24-23): https://www.rebuyengine.com/news-room/series-a-announcement\n`;
  const { draftMemo } = await import("@/lib/ai");
  const { draftProblems } = await import("@/lib/memo-draft");
  const t0 = Date.now();
  const text = await draftMemo(1, md);
  const r = (await d.execute("select calls from ai_usage")) as unknown as { rows: { calls: number }[] };
  if (typeof text !== "string" || text === "cap") throw new Error(`no draft: ${text}`);
  writeFileSync(process.argv[2], text);
  console.log(JSON.stringify({ seconds: Math.round((Date.now() - t0) / 1000), drafts: r.rows[0]?.calls, words: text.split(/\s+/).length, questions: (text.match(/^\d+\. /gm) || []).length, problems: draftProblems(text, md) }));
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
