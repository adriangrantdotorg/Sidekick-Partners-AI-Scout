// Every moving part Engine draws, as this firm's look answers it (src/firm/effects.ts). launch.sh runs it before
// anything else: a part nobody has shown user moving in the firm's look stops the launch (user, 11-02-26, after
// Sidekick's brass Live tab hid Engine's white glow: "How do we avoid this in the future?").
// npx tsx scripts/effects.ts          prints each part and its answer; exits 1 while any is unseen
import { EFFECTS, type EffectKey } from "../src/firm/effects";
import { firm, possessive } from "../src/firm";

const unseen: EffectKey[] = [];
for (const k of Object.keys(EFFECTS) as EffectKey[]) {
  const a = firm.effects[k];
  const say = a.look === "off" ? `off: ${a.why}` : a.look === "unseen" ? "not shown to user yet" : `${a.look === "own" ? "its own" : "Engine's"}, seen on ${a.seen}`;
  console.log(`${a.look === "unseen" ? "❌" : "✅"} ${EFFECTS[k].what} (${EFFECTS[k].where}): ${say}`);
  if (a.look === "unseen") unseen.push(k);
}
if (unseen.length) {
  console.log(`\n${possessive(firm.name)} look has ${unseen.length} moving part${unseen.length > 1 ? "s" : ""} user hasn't seen: show each on a design page in ${firm.name}/design/pages, then answer it in effects in profile.ts.`);
  process.exit(1);
}
