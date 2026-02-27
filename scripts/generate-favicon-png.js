/**
 * Generate favicon.png and apple-touch-icon.png from favicon.svg using sharp.
 * Run after favicon.svg is finalized (by prepare-favicons or process-manifest).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");
const SVG_PATH = path.join(root, "public", "favicon.svg");
const PNG_PATH = path.join(root, "public", "favicon.png");
const APPLE_TOUCH_PATH = path.join(root, "public", "apple-touch-icon.png");
const SIZE = 512;
const APPLE_TOUCH_SIZE = 180;

export async function generateFaviconPng() {
  if (!fs.existsSync(SVG_PATH)) return false;
  const svg = fs.readFileSync(SVG_PATH);
  await sharp(svg).resize(SIZE, SIZE).png().toFile(PNG_PATH);
  await sharp(svg).resize(APPLE_TOUCH_SIZE, APPLE_TOUCH_SIZE).png().toFile(APPLE_TOUCH_PATH);
  return true;
}

