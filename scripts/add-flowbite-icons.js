#!/usr/bin/env node
/**
 * Script to fetch Flowbite icons from GitHub and add them to icon-data.json
 * Flowbite Icons: https://github.com/themesberg/flowbite-icons
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICON_DATA_PATH = path.join(__dirname, '../src/lib/icon-data.json');
const FLOWBITE_ICONS_REPO = 'themesberg/flowbite-icons';
const FLOWBITE_ICONS_BRANCH = 'main';

// Fetch icon list from GitHub API
async function fetchIconList(category) {
  const url = `https://api.github.com/repos/${FLOWBITE_ICONS_REPO}/contents/src/outline/${category}?ref=${FLOWBITE_ICONS_BRANCH}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch ${category}: ${response.statusText}`);
      return [];
    }
    const files = await response.json();
    return files.filter(file => file.type === 'file' && file.name.endsWith('.svg'));
  } catch (error) {
    console.error(`Error fetching ${category}:`, error.message);
    return [];
  }
}

// Fetch SVG content from GitHub
async function fetchSVGContent(downloadUrl) {
  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching SVG:`, error.message);
    return null;
  }
}

// Normalize SVG to match our format (width="16" height="16")
function normalizeSVG(svgContent, iconName) {
  // Remove any existing width/height attributes
  let normalized = svgContent
    .replace(/width="[^"]*"/g, 'width="16"')
    .replace(/height="[^"]*"/g, 'height="16"')
    .replace(/class="[^"]*"/g, 'class=""')
    .replace(/style="[^"]*"/g, '')
    // Fix Flowbite's stroke-width="16" to standard "2"
    .replace(/stroke-width="16"/g, 'stroke-width="2"')
    .replace(/stroke-width="1\.5"/g, 'stroke-width="2"')
    // Remove newlines and extra whitespace
    .replace(/\n\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Ensure it starts with <svg
  if (!normalized.startsWith('<svg')) {
    console.warn(`Invalid SVG format for ${iconName}`);
    return null;
  }

  return normalized;
}

// Get icon name from filename (e.g., "user.svg" -> "user")
function getIconName(filename) {
  return filename.replace('.svg', '').toLowerCase();
}

// Main function
async function main() {
  console.log('🔄 Fetching Flowbite icons...\n');

  // Load existing icons
  const existingIcons = JSON.parse(fs.readFileSync(ICON_DATA_PATH, 'utf-8'));
  const existingIconNames = new Set(Object.keys(existingIcons));
  console.log(`📊 Found ${existingIconNames.size} existing icons\n`);

  // Get list of categories
  const categoriesUrl = `https://api.github.com/repos/${FLOWBITE_ICONS_REPO}/contents/src/outline?ref=${FLOWBITE_ICONS_BRANCH}`;
  const categoriesResponse = await fetch(categoriesUrl);
  const categories = await categoriesResponse.json();
  const categoryDirs = categories.filter(item => item.type === 'dir').map(item => item.name);

  console.log(`📁 Found ${categoryDirs.length} icon categories\n`);

  let addedCount = 0;
  let skippedCount = 0;
  const newIcons = { ...existingIcons };

  // Process each category
  for (const category of categoryDirs) {
    console.log(`📂 Processing category: ${category}`);
    const iconFiles = await fetchIconList(category);

    for (const iconFile of iconFiles) {
      const iconName = getIconName(iconFile.name);

      // Skip if already exists
      if (existingIconNames.has(iconName)) {
        skippedCount++;
        continue;
      }

      // Fetch SVG content
      const svgContent = await fetchSVGContent(iconFile.download_url);
      if (!svgContent) {
        console.warn(`  ⚠️  Failed to fetch ${iconName}`);
        continue;
      }

      // Normalize SVG
      const normalizedSVG = normalizeSVG(svgContent, iconName);
      if (!normalizedSVG) {
        console.warn(`  ⚠️  Failed to normalize ${iconName}`);
        continue;
      }

      // Add to icons object
      newIcons[iconName] = normalizedSVG;
      addedCount++;
      console.log(`  ✅ Added: ${iconName}`);
    }
  }

  // Write updated icon data
  fs.writeFileSync(ICON_DATA_PATH, JSON.stringify(newIcons, null, 2));
  
  console.log(`\n✨ Done!`);
  console.log(`   Added: ${addedCount} new icons`);
  console.log(`   Skipped: ${skippedCount} existing icons`);
  console.log(`   Total: ${Object.keys(newIcons).length} icons`);
}

main().catch(console.error);

