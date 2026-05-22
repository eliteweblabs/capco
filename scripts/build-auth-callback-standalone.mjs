#!/usr/bin/env node
/**
 * Bundle auth-callback-client.ts into public/scripts/auth-callback.js for production OAuth callback.
 * Same approach as auth-google.js — Astro page chunks can 404; this loads from stable /scripts/ URL.
 */
import * as esbuild from "esbuild";
import { mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "scripts");
const outFile = join(outDir, "auth-callback.js");
const entry = join(root, "src", "lib", "auth-callback-client.ts");

const loaded = loadEnv(process.env.NODE_ENV || "production", root, "");
const env = { ...process.env, ...loaded };
const supabaseUrl = (env.PUBLIC_SUPABASE_URL || "").trim();
const supabasePublishable =
  (env.PUBLIC_SUPABASE_PUBLISHABLE || env.PUBLIC_SUPABASE_ANON_KEY || "").trim();

const requireSupabaseKeys =
  Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID || process.env.CI);
if (requireSupabaseKeys && (!supabaseUrl || !supabasePublishable)) {
  console.error(
    "[build-auth-callback] Missing PUBLIC_SUPABASE_URL and/or PUBLIC_SUPABASE_PUBLISHABLE (or legacy PUBLIC_SUPABASE_ANON_KEY). " +
      "These must be present at build time on Railway/CI so public/scripts/auth-callback.js embeds the correct Auth host."
  );
  process.exit(1);
}
if (!supabaseUrl || !supabasePublishable) {
  console.warn(
    "[build-auth-callback] Missing Supabase public env vars; auth-callback.js will embed empty strings (local dev only)."
  );
}

console.log("[build-auth-callback] Embedding Supabase URL:", supabaseUrl);

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

await esbuild
  .build({
    entryPoints: [entry],
    bundle: true,
    platform: "browser",
    format: "iife",
    outfile: outFile,
    minify: true,
    sourcemap: false,
    target: "es2020",
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
      "import.meta.env.PUBLIC_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE": JSON.stringify(supabasePublishable),
    },
  })
  .catch((err) => {
    console.error("[build-auth-callback]", err);
    process.exit(1);
  });

console.log("[build-auth-callback] Wrote", outFile);
