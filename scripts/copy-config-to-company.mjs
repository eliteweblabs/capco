#!/usr/bin/env node
/**
 * Copy config.json to config-[company-name].json for per-site settings.
 * Run after build or when public/data/config.json exists.
 *
 * Usage: node scripts/copy-config-to-company.mjs [company-slug]
 *   company-slug: e.g. rothco-built-llc, capco-design-group
 *   Or run without args to generate BOTH rothco-built-llc and capco-design-group
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const singleSlug = process.argv[2];
const companySlugs = singleSlug ? [singleSlug] : ["rothco-built-llc", "capco-design-group"];

const candidates = [
  join(root, "public", "data", "config.json"),
  join(root, "dist", "client", "data", "config.json"),
];

let src = null;
for (const p of candidates) {
  if (existsSync(p)) {
    src = p;
    break;
  }
}

if (!src) {
  console.error("No config.json found. Run build first or add public/data/config.json");
  process.exit(1);
}

const destDir = join(root, "public", "data");
const content = readFileSync(src, "utf-8");
for (const slug of companySlugs) {
  const dest = join(destDir, `config-${slug}.json`);
  writeFileSync(dest, content, "utf-8");
  console.log(`Created ${dest} from ${src}`);
}
