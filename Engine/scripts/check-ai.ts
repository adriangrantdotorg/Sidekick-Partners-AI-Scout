// npm run check:ai: a real call to each model Scout uses, through AI Gateway, with the settings the app uses.
// Writes nothing. Needs a fresh .env.local (`npx vercel@latest env pull .env.local`): the local OIDC token expires.
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
import { generateText } from "ai";
import { MODELS, TIMEOUTS, thesisPrompt, parseThesisAnswer, readDeck } from "../src/lib/ai";
import { toResult, type DeckAnswer } from "../src/lib/deck-read";
import { DECK_STATUS, MOAT } from "../src/lib/deck";
import { firm, on } from "../src/firm";

type Check = { what: string; model: string; run: () => Promise<{ ok: boolean; note: string }> };
const checks: Check[] = [
  {
    what: "Daily AI check (turns the AI features on)",
    model: MODELS.worker,
    run: async () => {
      const r = await generateText({ model: MODELS.worker, prompt: "Reply with OK.", maxOutputTokens: 5, timeout: TIMEOUTS.dailyCheckMs });
      return { ok: /ok/i.test(r.text), note: JSON.stringify(r.text.trim()) };
    },
  },
  {
    what: "AI Thesis Check",
    model: MODELS.checker,
    run: async () => {
      // the same prompt and settings as thesisCheck(), on a known case: a DJ is a person, never a startup card
      const r = await generateText({ model: MODELS.checker, reasoning: "low", maxOutputTokens: 2000, timeout: TIMEOUTS.checkMs, prompt: thesisPrompt({ name: "DJ Reinier Zonneveld", area: "media", description: null, headlines: ["DJ Reinier Zonneveld launches AI music startup GasLab with $1M pre-seed funding"] }) });
      const a = parseThesisAnswer(r.text);
      return { ok: a?.ok === false, note: JSON.stringify(r.text.trim()) };
    },
  },
  {
    what: "Draft the Memo",
    model: MODELS.writer,
    run: async () => {
      // the same thinking setting and room as draftMemo(): a short brief, so the check costs a fraction of a cent
      const r = await generateText({ model: MODELS.writer, reasoning: "low", maxOutputTokens: 8000, timeout: TIMEOUTS.memoMs, prompt: "In three sentences, in a venture firm's voice, say why a real-time multiplayer skill-gaming startup that raised a $2.5M seed is interesting. Never invent a number." });
      return { ok: r.text.trim().length >= 150, note: `${r.text.trim().length} characters, ${r.usage.outputTokens ?? "?"} output tokens` };
    },
  },
];

// A real Deck Screen read through its real schema, whenever a firm has the Deck Screen on (user, 11-03-26: "ensure
// that we do this when it comes to this step"): the browser tests only ever see a stand-in answer. A made-up three-page
// deck; the read must come back as the Status Table, every check with one of the four words.
if (on("deckScreen") && firm.deck) {
  checks.push({
    what: "Deck Screen read (the Status Table)",
    model: MODELS.checker,
    run: async () => {
      const pages = ["Cartwise Seed Deck: AI upsell offers for Shopify brands", "Traction: $1.2M ARR from 140 merchants, 71% gross margin, 3.1x growth in 12 months", "Raising $2.5M Seed. Lifts average order value 18%."];
      const run = await readDeck({ file: "check-deck.pdf · 3 pages", pages: pages.map((text, i) => ({ n: i + 1, text })), images: [] });
      const r = toResult((await run.output) as DeckAnswer, "check-deck.pdf · 3 pages");
      const bad = [
        ...r.screen.filter((s) => !(s.status in DECK_STATUS) || !s.text.trim()).map((s) => `${s.key} has no status or line`),
        ...(r.moat.strength in MOAT ? [] : ["the moat has no strength"]),
        ...(r.vaguestClaim.quote.trim() && r.vaguestClaim.status in DECK_STATUS ? [] : ["the vaguest claim has no quote or status"]),
      ];
      return { ok: !bad.length && r.screen.length === firm.deck!.screen.length, note: bad.join("; ") || r.screen.map((s) => `${s.key} ${s.status}`).join(", ") };
    },
  });
} else console.log(`⏸️ Deck Screen read · off for ${firm.short}${on("deckScreen") ? "" : " (features.deckScreen)"}`);

let bad = 0;
for (const c of checks) {
  const t0 = Date.now();
  try {
    const r = await c.run();
    if (!r.ok) bad++;
    console.log(`${r.ok ? "✅" : "❌"} ${c.what} · ${c.model} · ${((Date.now() - t0) / 1000).toFixed(1)}s · ${r.note}`);
  } catch (e) {
    bad++;
    const err = e as { statusCode?: number; message?: string };
    console.log(`❌ ${c.what} · ${c.model} · ${err.statusCode || ""} ${(err.message || String(e)).slice(0, 200)}`);
  }
}
process.exit(bad ? 1 : 0);
