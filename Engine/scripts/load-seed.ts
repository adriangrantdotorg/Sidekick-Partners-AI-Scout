// npm run seed: load this firm's launch seed (<Firm Folder>/seed/launch-seed.json, firm.config.mjs seedPath; Plan step
// 16). A seed is one firm's (seedFirmError): a firm with none of its own yet (Sidekick's first launch, Plan step 13)
// starts from its profile, which still loads its co-investors and peer funds (loadSeed's fund lists); the launch then
// loads its portfolio. The seed lives in the repo, so there is no download (Courtside's old gist served its old repo).
import { config } from "dotenv";
import { readFileSync, existsSync } from "node:fs";
import { seedPath } from "../firm.config.mjs";
config({ path: ".env.local", quiet: true });

const FILE = seedPath();

const { loadSeed, seedFirmError } = await import("../src/lib/seed");
const { firm } = await import("../src/firm");

function getSeed(): Record<string, unknown> | null {
  if (!existsSync(FILE)) return null;
  const s = JSON.parse(readFileSync(FILE, "utf8"));
  const wrong = seedFirmError(s);
  if (wrong) throw new Error(`${FILE}: ${wrong}`);
  const days = Math.round((Date.now() - Date.parse(String(s.exportedAt))) / 86_400_000);
  console.log(`${firm.product} launch seed, exported ${String(s.exportedAt).slice(0, 10)} (${days} days ago)`);
  return s;
}

let seed = getSeed();
if (!seed) {
  console.log(`first launch: no ${firm.product} launch seed, so the database starts from the firm's profile`);
  seed = { name: `${firm.product} launch seed` };
}
const t = Date.now();
await loadSeed(seed, (s) => console.log("loaded", s));
console.log(`seed loaded in ${Math.round((Date.now() - t) / 1000)}s`);
process.exit(0);
