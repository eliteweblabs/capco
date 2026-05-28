#!/usr/bin/env node
/**
 * Bundle toggle-sidebar-init.ts for production (avoids Astro 5 empty component script chunks).
 */
import * as esbuild from "esbuild";
import { mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "scripts");
const outFile = join(outDir, "toggle-sidebar-init.js");
const entry = join(root, "src", "scripts", "toggle-sidebar-init.ts");

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
    console.error("[build-toggle-sidebar-init]", err);
    process.exit(1);
  });

console.log("[build-toggle-sidebar-init] Wrote", outFile);
