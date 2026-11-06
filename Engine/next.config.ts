import type { NextConfig } from "next";
import { REPO_ROOT, profileImport, syncBrand } from "./firm.config.mjs";

syncBrand();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // One Engine, a folder per firm at the repo root (VC Scout Plan, section 0): the build reads the chosen firm's
  // profile.ts from outside Engine/, so Turbopack and file tracing start at the repo root.
  turbopack: { root: REPO_ROOT, resolveAlias: { "@firm-profile": profileImport() } },
  outputFileTracingRoot: REPO_ROOT,
  images: { unoptimized: true },
  // the local copy of the data (SCOUT_PGLITE) is a development tool: never bundled, never shipped
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingExcludes: { "*": ["node_modules/@electric-sql/**"] },
  // a local data copy is one per server, and so is its page cache: written to .next on disk, a page one test server drew
  // (Engine's Not a Fit hiding Crownwell) was served by the other server and by the next run (11-03-26)
  experimental: { isrFlushToDisk: !process.env.SCOUT_PGLITE },
  // Brand Sky measures images with sharp. The build runs on a Mac, so sharp's Mac engine is what ships; on Vercel's
  // Linux it falls back to its WebAssembly engine, which must ride in the cron function (tested with the Mac engine
  // blocked: SVG, PNG and JPEG all measure, 10-30-26)
  outputFileTracingIncludes: { "/api/cron/[job]": ["./node_modules/@img/sharp-wasm32/**/*", "./node_modules/@img/colour/**/*"] },
};

export default nextConfig;
