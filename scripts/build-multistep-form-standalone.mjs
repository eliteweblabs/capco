#!/usr/bin/env node
/**
 * Bundle multi-step form init into public/scripts/init-multistep-form.js
 * so the form works when Astro module chunks don't load (e.g. prod 404).
 * Run: node scripts/build-multistep-form-standalone.mjs (or npm run build:multistep-form)
 */
import * as esbuild from "esbuild";
import { mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "scripts");
const outFile = join(outDir, "init-multistep-form.js");
const entry = join(root, "src", "scripts", "init-multistep-form-standalone.ts");

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  platform: "browser",
  format: "iife",
  outfile: outFile,
  minify: true,
  sourcemap: false,
  target: "es2018",
}).catch(() => process.exit(1));

console.log("[build-multistep-form] Wrote", outFile);
