/**
 * Prepare Favicons for Build
 *
 * Ensures public/favicon.svg and public/favicon.png exist so each install can
 * have a different favicon. Favicons are gitignored; this script creates them
 * at build time from (in priority order):
 *   1. content/favicon.svg, content/favicon.png (client-specific, gitignored)
 *   2. public/favicon-default.svg, public/favicon-default.png (committed fallback)
 *
 * Must run before process-manifest and astro build.
 * process-manifest may overwrite favicon.svg from DB icon when available.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");

const CONTENT_SVG = path.join(root, "content", "favicon.svg");
const CONTENT_PNG = path.join(root, "content", "favicon.png");
const DEFAULT_SVG = path.join(root, "public", "favicon-default.svg");
const DEFAULT_PNG = path.join(root, "public", "favicon-default.png");
const OUT_SVG = path.join(root, "public", "favicon.svg");
const OUT_PNG = path.join(root, "public", "favicon.png");

function copyIfExists(src, dest) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

function prepareFavicons() {
  let svgSource = "default";
  let pngSource = "default";

  if (copyIfExists(CONTENT_SVG, OUT_SVG)) svgSource = "content";
  else if (fs.existsSync(DEFAULT_SVG)) {
    fs.copyFileSync(DEFAULT_SVG, OUT_SVG);
  } else {
    console.warn("⚠️  No favicon-default.svg found; public/favicon.svg may be missing");
  }

  if (copyIfExists(CONTENT_PNG, OUT_PNG)) pngSource = "content";
  else if (fs.existsSync(DEFAULT_PNG)) {
    fs.copyFileSync(DEFAULT_PNG, OUT_PNG);
  } else {
    console.warn("⚠️  No favicon-default.png found; public/favicon.png may be missing");
  }

  console.log(`🖼️  Favicons: svg from ${svgSource}, png from ${pngSource}`);
}

prepareFavicons();
