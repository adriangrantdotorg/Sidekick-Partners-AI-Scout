import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { firm, on } from "@/firm";
import { aiAvailable } from "@/lib/ai";
import { getWeights } from "@/lib/settings";
import { deckFit } from "@/lib/deck-read";
import { DeckScreen } from "@/components/DeckScreen";

export const revalidate = 300;
export const metadata: Metadata = { title: "Deck Screen" };

/** Deck Screen (Plan section 5): drop a pitch deck, get a first pass on the firm's screen, shown once, never saved. */
export default async function Page() {
  if (!on("deckScreen") || !firm.deck) notFound(); // a firm without Deck Screen has no page (switch: deckScreen)
  const [ai, w] = await Promise.all([aiAvailable().catch(() => false), getWeights()]);
  return <DeckScreen ai={ai} ueMax={w.unitEconomics} sampleFit={deckFit(firm.deck.sample, w)} />;
}
