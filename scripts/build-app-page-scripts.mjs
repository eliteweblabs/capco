#!/usr/bin/env node
/**
 * Bundle hold-progress, scroll-animations, lazy-load-images, project-item-handlers into
 * public/scripts/app-page-scripts.js to avoid Astro chunk 500 and import errors.
 */
import * as esbuild from "esbuild";
import { mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "scripts");
const outFile = join(outDir, "app-page-scripts.js");
const entry = join(root, "src", "scripts", "app-page-scripts-standalone.ts");

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
    target: "es2018",
  })
  .catch((err) => {
    console.error("[build-app-page-scripts]", err);
    process.exit(1);
  });

console.log("[build-app-page-scripts] Wrote", outFile);
