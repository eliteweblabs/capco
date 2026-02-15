#!/usr/bin/env node
/**
 * Split site-config.json into chunks for Railway env vars (32KB limit per var).
 * Outputs SITE_CONFIG_1, SITE_CONFIG_2, ... that you can paste into Railway.
 *
 * Usage: node scripts/split-site-config-for-railway.cjs [site-config.json]
 */

const fs = require("fs");
const path = require("path");

const CHUNK_SIZE = 30000; // Leave margin under Railway's 32768 limit
const configPath = process.argv[2] || path.join(process.cwd(), "site-config.json");

if (!fs.existsSync(configPath)) {
  console.error("File not found:", configPath);
  process.exit(1);
}

const json = fs.readFileSync(configPath, "utf-8");
// Minify to reduce size
const minified = JSON.stringify(JSON.parse(json));

const chunks = [];
for (let i = 0; i < minified.length; i += CHUNK_SIZE) {
  chunks.push(minified.slice(i, i + CHUNK_SIZE));
}

console.log(`Split into ${chunks.length} chunks (${minified.length} chars total)\n`);
console.log("Add these to Railway (Settings → Variables):\n");

chunks.forEach((chunk, i) => {
  const varName = `SITE_CONFIG_${i + 1}`;
  console.log(`--- ${varName} (${chunk.length} chars) ---`);
  console.log(chunk);
  console.log("");
});
