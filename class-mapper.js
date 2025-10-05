#!/usr/bin/env node

/**
 * Class Mapper - Convert obfuscated CSS classes to Tailwind equivalents
 *
 * This script helps you map obfuscated classes from app.css to proper Tailwind classes
 * Usage: node class-mapper.js [obfuscated-class-name]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common CSS property to Tailwind class mappings
const propertyMappings = {
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
  "align-items: center": "items-center",
  "align-items: flex-start": "items-start",
  "align-items: flex-end": "items-end",

  // Spacing
  "margin: 0": "m-0",
  "margin: 0.25rem": "m-1",
  "margin: 0.5rem": "m-2",
  "margin: 1rem": "m-4",
  "padding: 0": "p-0",
  "padding: 0.25rem": "p-1",
  "padding: 0.5rem": "p-2",
  "padding: 1rem": "p-4",

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

function findClassInAppCSS(className) {
  try {
    const appCSSPath = path.join(__dirname, "src/styles/app.css");
    const content = fs.readFileSync(appCSSPath, "utf8");

    // Find the class definition
    const classRegex = new RegExp(`\\.${className}\\s*\\{[^}]*\\}`, "g");
    const matches = content.match(classRegex);

    if (!matches || matches.length === 0) {
      console.log(`❌ Class "${className}" not found in app.css`);
      return null;
    }

    const classDefinition = matches[0];
    console.log(`\n📋 Found class definition:`);
    console.log(classDefinition);

    // Extract CSS properties
    const properties = extractCSSProperties(classDefinition);
    console.log(`\n🎯 CSS Properties:`);
    properties.forEach((prop) => console.log(`  ${prop}`));

    // Map to Tailwind classes
    const tailwindClasses = mapToTailwind(properties);
    console.log(`\n✨ Suggested Tailwind classes:`);
    tailwindClasses.forEach((cls) => console.log(`  ${cls}`));

    return {
      className,
      definition: classDefinition,
      properties,
      tailwindClasses,
    };
  } catch (error) {
    console.error("Error reading app.css:", error.message);
    return null;
  }
}

function extractCSSProperties(cssDefinition) {
  // Extract properties from CSS definition
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

function mapToTailwind(properties) {
  const tailwindClasses = [];

  properties.forEach((prop) => {
    // Direct mapping
    if (propertyMappings[prop]) {
      tailwindClasses.push(propertyMappings[prop]);
      return;
    }

    // Pattern matching for common cases
    if (prop.includes("position: fixed")) {
      tailwindClasses.push("fixed");
    } else if (prop.includes("position: absolute")) {
      tailwindClasses.push("absolute");
    } else if (prop.includes("position: relative")) {
      tailwindClasses.push("relative");
    } else if (prop.includes("position: static")) {
      tailwindClasses.push("static");
    } else if (prop.includes("display: flex")) {
      tailwindClasses.push("flex");
    } else if (prop.includes("justify-content: center")) {
      tailwindClasses.push("justify-center");
    } else if (prop.includes("align-items: center")) {
      tailwindClasses.push("items-center");
    } else if (prop.includes("margin: 0")) {
      tailwindClasses.push("m-0");
    } else if (prop.includes("padding: 0")) {
      tailwindClasses.push("p-0");
    } else if (prop.includes("background-color: #ffffff")) {
      tailwindClasses.push("bg-white");
    } else if (prop.includes("color: #ffffff")) {
      tailwindClasses.push("text-white");
    } else if (prop.includes("font-weight: bold")) {
      tailwindClasses.push("font-bold");
    } else if (prop.includes("text-align: center")) {
      tailwindClasses.push("text-center");
    } else if (prop.includes("border: 1px solid")) {
      tailwindClasses.push("border");
    } else if (prop.includes("border-radius: 0.25rem")) {
      tailwindClasses.push("rounded");
    } else if (prop.includes("box-shadow: 0 1px 3px")) {
      tailwindClasses.push("shadow-sm");
    } else {
      // Manual mapping needed
      tailwindClasses.push(`❓ ${prop} (needs manual mapping)`);
    }
  });

  return tailwindClasses;
}

// Main execution
const className = process.argv[2];

if (!className) {
  console.log(`
🎨 Class Mapper - Convert obfuscated CSS to Tailwind

Usage: node class-mapper.js [obfuscated-class-name]

Examples:
  node class-mapper.js _LPVUrp9Uina5fcERqWC
  node class-mapper.js smkr9JarUQxXDNNOXpIs
  node class-mapper.js pq2JRWtiWcwYnw3xueNl

This tool will:
1. Find the obfuscated class in app.css
2. Extract its CSS properties
3. Suggest equivalent Tailwind classes
4. Help you replace them in your components
`);
  process.exit(1);
}

console.log(`🔍 Looking up class: ${className}`);
const result = findClassInAppCSS(className);

if (result) {
  console.log(`\n📝 Replacement suggestion:`);
  console.log(`Replace "${className}" with: "${result.tailwindClasses.join(" ")}"`);
}
