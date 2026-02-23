#!/usr/bin/env node
/**
 * Bundle app-init (theme, notification, typewriter, app-globals, auth-google)
 * into public/scripts/app-init.js so scripts run when Astro module chunks are empty.
 * Run via: npm run build:app-init (or build:railway which includes it)
 */
import * as esbuild from "esbuild";
import { mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "scripts");
const outFile = join(outDir, "app-init.js");
const entry = join(root, "src", "scripts", "app-init.ts");

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
    },
  })
  .catch((err) => {
    console.error("[build-app-init]", err);
    process.exit(1);
  });

console.log("[build-app-init] Wrote", outFile);
