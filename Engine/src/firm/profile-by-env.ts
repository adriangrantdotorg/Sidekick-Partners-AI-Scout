// The firm for code that runs outside Next.js and vitest: the scripts (run with tsx) and the typecheck. tsconfig points
// "@firm-profile" here, and this loads the folder NEXT_PUBLIC_SCOUT_FIRM names (firm.config.mjs, its .env.local read
// first), so `NEXT_PUBLIC_SCOUT_FIRM=<id> npx tsx scripts/<x>.ts` works on that firm. Next.js and vitest point
// "@firm-profile" straight at one firm's profile.ts instead, so a site's bundle never holds another firm.
import { config } from "dotenv";
import { fileURLToPath, pathToFileURL } from "node:url";
import { profilePath } from "../../firm.config.mjs";
import type { FirmProfile } from "./types";

config({ path: fileURLToPath(new URL("../../.env.local", import.meta.url)), quiet: true });
const profile: FirmProfile = (await import(pathToFileURL(profilePath()).href)).default;
export default profile;
