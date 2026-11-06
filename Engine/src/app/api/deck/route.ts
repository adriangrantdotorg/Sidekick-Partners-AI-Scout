import { NextResponse } from "next/server";
import { and, isNull, sql } from "drizzle-orm";
import { db, schema as S } from "@/db";
import { on } from "@/firm";
import { fieldOrder, reached } from "@/lib/deck";
import { deckFit, parseDeck, toResult, type DeckAnswer } from "@/lib/deck-read";
import { getWeights } from "@/lib/settings";

export const dynamic = "force-dynamic";
// a read takes about a minute; the AI's own limit (TIMEOUTS.deckMs) stops it well inside this
export const maxDuration = 300;

/** Deck Screen: the deck goes to the AI and the answer streams back as lines of JSON: `{ at }` as each answer starts,
 *  then `{ done, fit, match }`, or `{ error }`. Nothing of the deck is stored or logged (Plan section 5, "Show once"). */
export async function POST(req: Request) {
  if (!on("deckScreen")) return NextResponse.json({ error: "Deck Screen is off for this site." }, { status: 404 });
  const input = parseDeck(await req.json().catch(() => null));
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });
  const { aiAvailable, screenDeck, DECK_CAP_MESSAGE } = await import("@/lib/ai");
  if (!(await aiAvailable())) return NextResponse.json({ error: "Deck Screen reads decks with AI, which is off today. The sample result shows what a read looks like." }, { status: 409 });
  const run = await screenDeck(input);
  if (run === "cap") return NextResponse.json({ error: DECK_CAP_MESSAGE }, { status: 429 });
  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(ctrl) {
      const send = (x: unknown) => ctrl.enqueue(enc.encode(JSON.stringify(x) + "\n"));
      try {
        let at = -1;
        for await (const p of run.partialOutputStream) {
          const now = reached(p);
          if (now > at) {
            at = now;
            const company = (p as { company?: string }).company;
            send({ at, of: fieldOrder().length, company: now > 0 ? company : undefined });
          }
        }
        const result = toResult((await run.output) as DeckAnswer, input.file);
        const [fit, match] = await Promise.all([getWeights().then((w) => deckFit(result, w)), findCompany(result.company)]);
        send({ done: result, fit, match });
      } catch {
        send({ error: "The read didn't come back. Drop the deck again in a minute." });
      }
      ctrl.close();
    },
  });
  return new Response(body, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}

/** The company Scout already knows by this name, for a link from the result. */
async function findCompany(name: string): Promise<{ id: number; name: string } | null> {
  if (!name.trim()) return null;
  const [c] = await db()
    .select({ id: S.companies.id, name: S.companies.name })
    .from(S.companies)
    .where(and(sql`lower(${S.companies.name}) = ${name.trim().toLowerCase()}`, isNull(S.companies.mergedInto)))
    .limit(1)
    .catch(() => []);
  return c || null;
}
