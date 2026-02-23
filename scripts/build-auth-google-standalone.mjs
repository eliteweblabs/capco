#!/usr/bin/env node
/**
 * Bundle auth-google.ts into public/scripts/auth-google.js so Google OAuth works in production.
 * Fixes 404 / chunk resolution for Astro dynamic import.
 */
import * as esbuild from "esbuild";
import { mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "scripts");
const outFile = join(outDir, "auth-google.js");
const entry = join(root, "src", "lib", "auth-google.ts");

const loaded = loadEnv(process.env.NODE_ENV || "production", root, "");
const env = { ...process.env, ...loaded };

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
      "import.meta.env.PUBLIC_SUPABASE_URL": JSON.stringify(env.PUBLIC_SUPABASE_URL || ""),
      "import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE": JSON.stringify(
        env.PUBLIC_SUPABASE_PUBLISHABLE || env.PUBLIC_SUPABASE_ANON_KEY || ""
      ),
    },
  })
  .catch((err) => {
    console.error("[build-auth-google]", err);
    process.exit(1);
  });

console.log("[build-auth-google] Wrote", outFile);
