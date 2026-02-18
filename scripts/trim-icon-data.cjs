#!/usr/bin/env node
/**
 * Trim icon-data.json to only used icons; move unused to icon-data-unused-backup.json
 * Run: node scripts/trim-icon-data.js
 */

const fs = require("fs");
const path = require("path");

const ICON_DATA_PATH = path.join(__dirname, "../src/lib/icon-data.json");
const BACKUP_PATH = path.join(__dirname, "../src/lib/icon-data-unused-backup.json");

// Icons from hardcoded maps in source (getActivityIcon, getActionIcon, detectSocialNetwork, getFileIcon)
// Also: MultiStepForm button.validIcon default "return"/"enter"; WhatSetsUsApartBlock item1Icon/item4Icon (file-check, hospital)
const HARDCODED_ICONS = new Set([
  "plus-circle", "edit", "arrow-right-left", "user-check", "edit-3", "settings", "upload",
  "message-circle", "receipt", "dollar-sign", "user-plus", "info",
  "facebook", "github", "google", "youtube", "linkedin", "slack", "x-twitter", "mail", "phone", "link-external",
  "image", "file-pdf", "file-word", "spreadsheet", "video", "music", "archive", "file",
  "file-check", "hospital", "return", "enter",
]);

// Extract icon values from JSON (config.json etc) - only key "icon" with string value
function extractIconsFromJson(obj, found = new Set()) {
  if (!obj) return found;
  if (Array.isArray(obj)) {
    obj.forEach((item) => extractIconsFromJson(item, found));
    return found;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if ((k === "icon" || k.endsWith("Icon")) && typeof v === "string") {
        const trimmed = v.trim();
        if (trimmed) found.add(trimmed);
      } else if (v !== null && typeof v === "object") {
        extractIconsFromJson(v, found);
      }
    }
  }
  return found;
}

// Extract from source via regex
function extractIconsFromSource(dir, found = new Set()) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!e.name.startsWith(".") && e.name !== "node_modules") {
        extractIconsFromSource(full, found);
      }
      continue;
    }
    if (!/\.(astro|ts|tsx|js|jsx|vue|svelte)$/.test(e.name)) continue;
    const content = fs.readFileSync(full, "utf8");
    function addIcon(name) {
      if (name && !name.includes("${") && !name.includes("}") && name.length < 50 && !/^[\/\s]/.test(name)) found.add(name);
    }
    // SimpleIcon name="..."
    const m1 = content.matchAll(/SimpleIcon\s+name=["']([^"']+)["']/g);
    for (const x of m1) addIcon(x[1]);
    // name={...} for icon - skip, too dynamic
    // getIcon("...", getIcon(iconName
    const m2 = content.matchAll(/getIcon\s*\(\s*["']([^"']+)["']/g);
    for (const x of m2) addIcon(x[1]);
    const m3 = content.matchAll(/\.getIcon\s*\(\s*["']([^"']+)["']/g);
    for (const x of m3) addIcon(x[1]);
    // icon="..." (word boundary to avoid iconPosition, iconClasses)
    const m4 = content.matchAll(/\bicon\s*=\s*["']([^"']+)["']/g);
    for (const x of m4) addIcon(x[1]);
    // icon: "..."
    const m5 = content.matchAll(/icon:\s*["']([^"']+)["']/g);
    for (const x of m5) addIcon(x[1]);
    // item1Icon="...", item2Icon="...", validIcon="..." (CMS blocks, MultiStepForm)
    const m6 = content.matchAll(/\b(?:item\dIcon|validIcon)\s*=\s*["']([^"']+)["']/g);
    for (const x of m6) addIcon(x[1]);
  }
  return found;
}

function main() {
  const iconData = JSON.parse(fs.readFileSync(ICON_DATA_PATH, "utf8"));
  const allIcons = Object.keys(iconData);

  const used = new Set([...HARDCODED_ICONS, "logo"]); // logo is special (company icon)

  // Config
  const configPath = path.join(__dirname, "../public/data/config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    extractIconsFromJson(config, used);
  }

  // Source
  const srcDir = path.join(__dirname, "../src");
  extractIconsFromSource(srcDir, used);

  // Only keep icons that exist in icon-data and are used
  const usedAndExist = [...used].filter((name) => allIcons.includes(name));
  const missing = [...used].filter((name) => !allIcons.includes(name));
  const unused = allIcons.filter((name) => !used.has(name));

  const kept = {};
  const backedUp = {};
  for (const k of allIcons) {
    if (used.has(k)) {
      kept[k] = iconData[k];
    } else {
      backedUp[k] = iconData[k];
    }
  }

  fs.writeFileSync(ICON_DATA_PATH, JSON.stringify(kept, null, 2) + "\n", "utf8");
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(backedUp, null, 2) + "\n", "utf8");

  const keptKb = (JSON.stringify(kept).length / 1024).toFixed(1);
  const backupKb = (JSON.stringify(backedUp).length / 1024).toFixed(1);

  console.log("Trimmed icon-data.json");
  console.log("  Kept:", Object.keys(kept).length, "icons (~" + keptKb + " KB)");
  console.log("  Backed up:", Object.keys(backedUp).length, "unused icons to icon-data-unused-backup.json (~" + backupKb + " KB)");
  if (missing.length) {
    console.log("  Missing (referenced but not in icon-data):", missing.join(", "));
  }
}

main();
