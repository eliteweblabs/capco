#!/usr/bin/env node
/**
 * Fix hardcoded absolute paths in dist/server/entry.mjs so the build is portable.
 * Astro embeds paths from the build machine (e.g. /Users/foo/project/dist/...).
 * On Railway/Docker the app runs at a different path, so static assets (/_astro/*.js)
 * return 404. This script rewrites entry.mjs to resolve paths at runtime relative
 * to the entry file location.
 */
const fs = require("fs");
const path = require("path");

const entryPath = path.join(process.cwd(), "dist", "server", "entry.mjs");
if (!fs.existsSync(entryPath)) {
  console.error("[fix-entry-paths] dist/server/entry.mjs not found - run build first");
  process.exit(1);
}

let content = fs.readFileSync(entryPath, "utf8");

// Replace the hardcoded _args client/server paths with runtime resolution
// Astro embeds absolute paths from build machine; we need paths relative to entry.mjs
const argsRegex =
  /const _args = \{\s*\n\s*"mode":\s*"standalone",\s*\n\s*"client":\s*"file:\/\/[^"]+",\s*\n\s*"server":\s*"file:\/\/[^"]+",/;

const replacement = `import { fileURLToPath as _fileURLToPath } from "node:url";
import path from "node:path";
const __entryDir = path.dirname(_fileURLToPath(import.meta.url));
const _args = {
  "mode": "standalone",
  "client": "file://" + path.join(__entryDir, "..", "client").replace(/\\\\/g, "/") + "/",
  "server": "file://" + __entryDir.replace(/\\\\/g, "/") + "/",`;

if (!argsRegex.test(content)) {
  console.warn("[fix-entry-paths] Could not find _args pattern - entry.mjs may have changed");
  process.exit(0);
}

content = content.replace(argsRegex, replacement);
fs.writeFileSync(entryPath, content);
console.log("[fix-entry-paths] Patched entry.mjs for portable deployment");
