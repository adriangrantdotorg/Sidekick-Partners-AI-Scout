// The Proof Finder on named startups, read-only: prints each round a reputable page puts the firm in, and the source
// that found it. Writes nothing (no database is opened). Plan step 13b.
//   npx tsx scripts/proofs.ts "Rebuy=rebuyengine.com" "Lantern Platform=lantern.is"
export {};
delete process.env.DATABASE_URL;
delete process.env.SCOUT_PGLITE;
const { findProofs, earliest, listedBy } = await import("../src/lib/proof");
for (const arg of process.argv.slice(2)) {
  const [name, domain] = arg.split("=");
  const t0 = Date.now();
  const proofs = await findProofs({ name, domain: domain || null }, { onRung: (r, ms, n) => console.log(`    ${r}: ${Math.round(ms / 1000)} s, ${n} found`) });
  const first = earliest(proofs);
  console.log(`\n${name}: ${proofs.length} proof${proofs.length === 1 ? "" : "s"} in ${Math.round((Date.now() - t0) / 1000)} s`);
  for (const p of proofs) console.log(`  ${p === first ? "★" : "·"} ${p.date || "no date"} · ${p.round || "round"} · ${p.via} · ${p.url}\n      “${p.quote.slice(0, 160)}”`);
  if (!first) {
    const l = await listedBy(name);
    console.log(l ? `  on the firm's portfolio page by ${l.date} (${l.url})` : "  not on any archived copy of the firm's portfolio page");
  }
}
