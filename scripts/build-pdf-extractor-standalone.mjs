#!/usr/bin/env node
/**
 * Bundle pdf-extractor-init.ts to public/scripts/pdf-extractor-init.js
 * so the PDF extractor runs without requesting /src/ scripts (avoids 500 in dev).
 * Run via: npm run build:pdf-extractor
 */
import * as esbuild from "esbuild";
import { mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "scripts");
const outFile = join(outDir, "pdf-extractor-init.js");
const entry = join(root, "src", "scripts", "pdf-extractor-init.ts");

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
    minify: false,
    sourcemap: false,
    target: "es2020",
  })
  .catch((err) => {
    console.error("[build-pdf-extractor]", err);
    process.exit(1);
  });

console.log("[build-pdf-extractor] Wrote", outFile);
