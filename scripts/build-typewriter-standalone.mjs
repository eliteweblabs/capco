#!/usr/bin/env node
/**
 * Bundle typewriter effect into public/scripts/typewriter.js so intro animation
 * runs when Astro module scripts don't load (e.g. on form pages in prod).
 */
import * as esbuild from "esbuild";
import { mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "scripts");
const outFile = join(outDir, "typewriter.js");
const entry = join(root, "src", "scripts", "typewriter-text.ts");

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

console.log("[build-typewriter] Wrote", outFile);
