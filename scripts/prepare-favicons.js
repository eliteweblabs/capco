/**
 * Prepare Favicons for Build
 *
 * Ensures public/favicon.svg and public/favicon.png exist so each install can
 * have a different favicon. Favicons are gitignored; this script creates them
 * at build time.
 *
 * SVG from (priority): content/favicon.svg → favicon-default.svg
 * PNG: generated from the SVG at build time (512×512).
 *
 * process-manifest may overwrite favicon.svg from DB icon; it then regenerates
 * the PNG. Must run before process-manifest and astro build.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateFaviconPng } from "./generate-favicon-png.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");

const CONTENT_SVG = path.join(root, "content", "favicon.svg");
const DEFAULT_SVG = path.join(root, "public", "favicon-default.svg");
const OUT_SVG = path.join(root, "public", "favicon.svg");

function copyIfExists(src, dest) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

async function prepareFavicons() {
  let svgSource = "default";

  if (copyIfExists(CONTENT_SVG, OUT_SVG)) svgSource = "content";
  else if (fs.existsSync(DEFAULT_SVG)) {
    fs.copyFileSync(DEFAULT_SVG, OUT_SVG);
  } else {
    console.warn("⚠️  No favicon-default.svg found; public/favicon.svg may be missing");
  }

  const ok = await generateFaviconPng();
  if (ok) {
    console.log(`🖼️  Favicons: svg from ${svgSource}, png generated from svg`);
  } else {
    console.warn("⚠️  Could not generate favicon.png (favicon.svg missing?)");
  }
}

prepareFavicons().catch((err) => {
  console.error("❌ prepare-favicons failed:", err.message);
  process.exit(1);
});
