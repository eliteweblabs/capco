#!/usr/bin/env node
/**
 * Bundle accordion scripts to public/scripts/ so they load reliably.
 * Avoids 404 for accordion-data-table-resizable-columns and accordion-reorder-init.
 * Run via: npm run build:accordion-scripts
 */
import * as esbuild from "esbuild";
import { mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "scripts");

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

const builds = [
  {
    entry: join(root, "src", "scripts", "accordion-data-table-resizable-columns.ts"),
    out: join(outDir, "accordion-data-table-resizable-columns.js"),
    name: "accordion-data-table-resizable-columns",
  },
  {
    entry: join(root, "src", "scripts", "accordion-reorder-init.ts"),
    out: join(outDir, "accordion-reorder-init.js"),
    name: "accordion-reorder-init",
  },
];

for (const { entry, out, name } of builds) {
  await esbuild
    .build({
      entryPoints: [entry],
      bundle: true,
      platform: "browser",
      format: "iife",
      outfile: out,
      minify: true,
      sourcemap: false,
      target: "es2020",
    })
    .catch((err) => {
      console.error(`[build-accordion-scripts] ${name}:`, err);
      process.exit(1);
    });
  console.log(`[build-accordion-scripts] Wrote ${out}`);
}
