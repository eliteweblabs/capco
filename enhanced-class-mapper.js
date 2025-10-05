#!/usr/bin/env node

/**
 * Enhanced Class Mapper - Handles responsive prefixes and theme variants
 *
 * This script maps obfuscated classes that include @media queries and theme variants
 * to their proper Tailwind equivalents with responsive prefixes
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Media query breakpoints mapping
const breakpointMapping = {
  "(min-width: 640px)": "sm:",
  "(min-width: 768px)": "md:",
  "(min-width: 1024px)": "lg:",
  "(min-width: 1280px)": "xl:",
  "(min-width: 1536px)": "2xl:",
};

// Theme variants mapping
const themeMapping = {
  "(prefers-color-scheme: dark)": "dark:",
  "(prefers-color-scheme: light)": "light:",
};

function findClassWithMediaQueries(className) {
  try {
    const appCSSPath = path.join(__dirname, "src/styles/app.css");
    const content = fs.readFileSync(appCSSPath, "utf8");

    // Find all instances of the class (including media queries)
    const classRegex = new RegExp(`\\.${className}\\s*\\{[^}]*\\}`, "g");
    const matches = content.match(classRegex);

    if (!matches || matches.length === 0) {
      console.log(`❌ Class "${className}" not found in app.css`);
      return null;
    }

    console.log(`\n📋 Found ${matches.length} class definition(s):`);
    matches.forEach((match, index) => {
      console.log(`\n${index + 1}. ${match}`);
    });

    // Find media queries that contain this class
    const mediaQueries = findMediaQueriesForClass(content, className);

    if (mediaQueries.length > 0) {
      console.log(`\n📱 Found ${mediaQueries.length} media query definition(s):`);
      mediaQueries.forEach((mq, index) => {
        console.log(`\n${index + 1}. ${mq.mediaQuery}`);
        console.log(`   Class: ${mq.classDefinition}`);
      });
    }

    // Extract CSS properties from all definitions
    const allProperties = [];
    matches.forEach((match) => {
      const properties = extractCSSProperties(match);
      allProperties.push(...properties);
    });

    // Extract properties from media queries
    mediaQueries.forEach((mq) => {
      const properties = extractCSSProperties(mq.classDefinition);
      allProperties.push(...properties);
    });

    console.log(`\n🎯 All CSS Properties:`);
    allProperties.forEach((prop) => console.log(`  ${prop}`));

    // Map to Tailwind classes with responsive prefixes
    const tailwindMappings = mapToTailwindWithPrefixes(className, allProperties, mediaQueries);

    console.log(`\n✨ Suggested Tailwind classes:`);
    tailwindMappings.forEach((mapping) => {
      console.log(`  ${mapping.prefix}${mapping.class}`);
    });

    return {
      className,
      definitions: matches,
      mediaQueries,
      properties: allProperties,
      tailwindMappings,
    };
  } catch (error) {
    console.error("Error reading app.css:", error.message);
    return null;
  }
}

function findMediaQueriesForClass(content, className) {
  const mediaQueries = [];

  // Find all @media blocks
  const mediaRegex = /@media\s+[^{]+\{[^}]*\}/g;
  const mediaBlocks = content.match(mediaRegex);

  if (mediaBlocks) {
    mediaBlocks.forEach((block) => {
      if (block.includes(`.${className}`)) {
        // Extract media query condition
        const mediaMatch = block.match(/@media\s+([^{]+)/);
        const classMatch = block.match(new RegExp(`\\.${className}\\s*\\{[^}]*\\}`));

        if (mediaMatch && classMatch) {
          mediaQueries.push({
            mediaQuery: mediaMatch[1].trim(),
            classDefinition: classMatch[0],
          });
        }
      }
    });
  }

  return mediaQueries;
}

function extractCSSProperties(cssDefinition) {
  const propertyRegex = /([^:]+):\s*([^;]+);/g;
  const properties = [];
  let match;

  while ((match = propertyRegex.exec(cssDefinition)) !== null) {
    const property = match[1].trim();
    const value = match[2].trim();
    properties.push(`${property}: ${value}`);
  }

  return properties;
}

function mapToTailwindWithPrefixes(className, properties, mediaQueries) {
  const mappings = [];

  // Map base properties (no prefix)
  properties.forEach((prop) => {
    const tailwindClass = mapPropertyToTailwind(prop);
    if (tailwindClass) {
      mappings.push({
        prefix: "",
        class: tailwindClass,
        source: "base",
      });
    }
  });

  // Map media query properties with responsive prefixes
  mediaQueries.forEach((mq) => {
    const mqProperties = extractCSSProperties(mq.classDefinition);
    const responsivePrefix = breakpointMapping[mq.mediaQuery] || "";

    mqProperties.forEach((prop) => {
      const tailwindClass = mapPropertyToTailwind(prop);
      if (tailwindClass) {
        mappings.push({
          prefix: responsivePrefix,
          class: tailwindClass,
          source: "media",
          mediaQuery: mq.mediaQuery,
        });
      }
    });
  });

  return mappings;
}

function mapPropertyToTailwind(property) {
  // Enhanced property mappings
  const mappings = {
    // Position
    "position: fixed": "fixed",
    "position: absolute": "absolute",
    "position: relative": "relative",
    "position: static": "static",
    "position: sticky": "sticky",

    // Display
    "display: flex": "flex",
    "display: block": "block",
    "display: inline": "inline",
    "display: inline-block": "inline-block",
    "display: grid": "grid",
    "display: none": "hidden",

    // Flexbox
    "flex-direction: row": "flex-row",
    "flex-direction: column": "flex-col",
    "justify-content: center": "justify-center",
    "justify-content: space-between": "justify-between",
    "justify-content: space-around": "justify-around",
    "align-items: center": "items-center",
    "align-items: flex-start": "items-start",
    "align-items: flex-end": "items-end",

    // Spacing
    "margin: 0": "m-0",
    "margin: 0.25rem": "m-1",
    "margin: 0.5rem": "m-2",
    "margin: 1rem": "m-4",
    "margin: 1.5rem": "m-6",
    "margin: 2rem": "m-8",
    "padding: 0": "p-0",
    "padding: 0.25rem": "p-1",
    "padding: 0.5rem": "p-2",
    "padding: 1rem": "p-4",
    "padding: 1.5rem": "p-6",
    "padding: 2rem": "p-8",

    // Width/Height
    "max-width: 640px": "max-w-sm",
    "max-width: 768px": "max-w-md",
    "max-width: 1024px": "max-w-lg",
    "max-width: 1280px": "max-w-xl",
    "max-width: 1536px": "max-w-2xl",
    "width: 100%": "w-full",
    "height: 100%": "h-full",

    // Colors
    "background-color: #ffffff": "bg-white",
    "background-color: #000000": "bg-black",
    "color: #ffffff": "text-white",
    "color: #000000": "text-black",

    // Typography
    "font-weight: bold": "font-bold",
    "font-weight: 600": "font-semibold",
    "text-align: center": "text-center",
    "text-align: left": "text-left",
    "text-align: right": "text-right",

    // Borders
    "border: 1px solid": "border",
    "border-radius: 0.25rem": "rounded",
    "border-radius: 0.5rem": "rounded-lg",
    "border-radius: 9999px": "rounded-full",

    // Shadows
    "box-shadow: 0 1px 3px": "shadow-sm",
    "box-shadow: 0 4px 6px": "shadow",
    "box-shadow: 0 10px 15px": "shadow-lg",
  };

  // Direct mapping
  if (mappings[property]) {
    return mappings[property];
  }

  // Pattern matching for common cases
  if (property.includes("position: fixed")) return "fixed";
  if (property.includes("position: absolute")) return "absolute";
  if (property.includes("position: relative")) return "relative";
  if (property.includes("position: static")) return "static";
  if (property.includes("display: flex")) return "flex";
  if (property.includes("justify-content: center")) return "justify-center";
  if (property.includes("align-items: center")) return "items-center";
  if (property.includes("margin: 0")) return "m-0";
  if (property.includes("padding: 0")) return "p-0";
  if (property.includes("background-color: #ffffff")) return "bg-white";
  if (property.includes("color: #ffffff")) return "text-white";
  if (property.includes("font-weight: bold")) return "font-bold";
  if (property.includes("text-align: center")) return "text-center";
  if (property.includes("border: 1px solid")) return "border";
  if (property.includes("border-radius: 0.25rem")) return "rounded";
  if (property.includes("box-shadow: 0 1px 3px")) return "shadow-sm";

  // Handle max-width with specific pixel values
  if (property.includes("max-width: 640px")) return "max-w-sm";
  if (property.includes("max-width: 768px")) return "max-w-md";
  if (property.includes("max-width: 1024px")) return "max-w-lg";
  if (property.includes("max-width: 1280px")) return "max-w-xl";
  if (property.includes("max-width: 1536px")) return "max-w-2xl";

  return null;
}

// Main execution
const className = process.argv[2];

if (!className) {
  console.log(`
🎨 Enhanced Class Mapper - Handles responsive prefixes and theme variants

Usage: node enhanced-class-mapper.js [obfuscated-class-name]

This tool handles:
- Base classes (no prefix)
- Responsive prefixes (sm:, md:, lg:, xl:, 2xl:)
- Theme variants (dark:, light:)
- Complex @media query mappings

Examples:
  node enhanced-class-mapper.js fE3pmEmw8F30VPtAqcha
  node enhanced-class-mapper.js Q_jg_EPdNf9eDMn1mLI2
`);
  process.exit(1);
}

console.log(`🔍 Enhanced lookup for class: ${className}`);
const result = findClassWithMediaQueries(className);

if (result) {
  console.log(`\n📝 Complete replacement suggestion:`);
  console.log(`Replace "${className}" with:`);

  // Group by prefix
  const groupedMappings = {};
  result.tailwindMappings.forEach((mapping) => {
    if (!groupedMappings[mapping.prefix]) {
      groupedMappings[mapping.prefix] = [];
    }
    groupedMappings[mapping.prefix].push(mapping.class);
  });

  Object.entries(groupedMappings).forEach(([prefix, classes]) => {
    const prefixLabel = prefix ? `${prefix}` : "base";
    console.log(`  ${prefixLabel}: "${classes.join(" ")}"`);
  });
}
