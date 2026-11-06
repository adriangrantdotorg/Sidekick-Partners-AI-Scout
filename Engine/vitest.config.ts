import { config } from "dotenv";
// Unit tests read the same .env.local the app does (SITE_URL for the User-Agent); the shell no longer has to export it.
config({ path: ".env.local", quiet: true });
// …but never its database: a test that reached it wrote Settings › Sources rows on Sidekick's live site (11-04-26).
// Tests that need a database get their own (PGlite, globalThis.__scoutTestDb); rules.test.ts fails if one is set.
for (const k of Object.keys(process.env)) if (/^(DATABASE_URL|POSTGRES_|PG(HOST|USER|PASSWORD|DATABASE)|NEON_)/.test(k)) delete process.env[k];
import { defineConfig } from "vitest/config";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FIRMS, TEST_FIRM, profilePath, syncBrand } from "./firm.config.mjs";

// Engine's own tests check Courtside's frozen profile until Plan step 12 (firm.config.mjs, TEST_FIRM)
process.env.NEXT_PUBLIC_SCOUT_FIRM ||= TEST_FIRM;
syncBrand();

const src = fileURLToPath(new URL("./src", import.meta.url));
const base = { environment: "node" as const, testTimeout: 30_000, pool: "forks" as const };
// one project per firm with its own tests (tests/firms/<id>/), each built on that firm's profile
const firmProjects = Object.keys(FIRMS)
  .filter((id) => existsSync(`tests/firms/${id}`))
  .map((id) => ({ resolve: { alias: { "@": src, "@firm-profile": profilePath(id as keyof typeof FIRMS) } }, test: { ...base, name: id, include: [`tests/firms/${id}/**/*.test.ts`] } }));

export default defineConfig({
  test: {
    projects: [{ resolve: { alias: { "@": src, "@firm-profile": profilePath() } }, test: { ...base, name: "engine", include: ["tests/unit/**/*.test.ts"] } }, ...firmProjects],
  },
});
