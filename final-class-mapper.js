#!/usr/bin/env node

/**
 * Final Class Mapper - Correctly handles obfuscated classes with responsive behavior
 *
 * This tool properly detects @media queries and maps them to Tailwind responsive prefixes
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeClass(className) {
  try {
    const appCSSPath = path.join(__dirname, "src/styles/app.css");
    const content = fs.readFileSync(appCSSPath, "utf8");

    console.log(`\n🔍 Analyzing class: ${className}`);

    // Find base class definition
    const baseClassRegex = new RegExp(`^\\s*\\.${className}\\s*\\{[^}]*\\}`, "gm");
    const baseClassMatch = content.match(baseClassRegex);

    // Find media queries - use a more specific approach
    const mediaQueries = findMediaQueries(content, className);

    console.log(`📊 Found ${mediaQueries.length} responsive variants\n`);

    // Analyze the pattern
    const analysis = {
      className,
      baseClass: baseClassMatch ? baseClassMatch[0] : null,
      mediaQueries,
      hasResponsive: mediaQueries.length > 0,
    };

    // Generate the correct Tailwind replacement
    const replacement = generateTailwindReplacement(analysis);

    console.log(`\n✨ Tailwind replacement:`);
    console.log(`Replace "${className}" with: "${replacement}"`);

    console.log(`\n📝 Breakdown:`);
    if (analysis.baseClass) {
      const baseProps = extractProperties(analysis.baseClass);
      console.log(`  Base: ${baseProps.join(", ")}`);
    }

    if (analysis.hasResponsive) {
      analysis.mediaQueries.forEach((mq) => {
        const props = extractProperties(mq.classDefinition);
        console.log(`  ${mq.breakpoint}: ${props.join(", ")}`);
      });
    }

    return {
      className,
      replacement,
      analysis,
    };
  } catch (error) {
    console.error("Error analyzing class:", error.message);
    return null;
  }
}

function findMediaQueries(content, className) {
  const mediaQueries = [];

  // Split content into lines for easier processing
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for @media lines
    if (line.includes("@media") && line.includes("min-width")) {
      // Extract the breakpoint
      const breakpoint = extractBreakpoint(line);

      // Look for the class definition in the next few lines
      for (let j = i + 1; j < i + 10 && j < lines.length; j++) {
        const nextLine = lines[j];

        if (nextLine.includes(`.${className}`)) {
          // Found the class in this media query
          const classDefinition = nextLine.trim();
          const properties = extractProperties(classDefinition);

          mediaQueries.push({
            breakpoint: breakpoint,
            classDefinition: classDefinition,
            properties: properties,
          });
          break;
        }
      }
    }
  }

  return mediaQueries;
}

function extractBreakpoint(mediaLine) {
  if (mediaLine.includes("640px")) return "sm";
  if (mediaLine.includes("768px")) return "md";
  if (mediaLine.includes("1024px")) return "lg";
  if (mediaLine.includes("1280px")) return "xl";
  if (mediaLine.includes("1536px")) return "2xl";
  return "unknown";
}

function extractProperties(cssDefinition) {
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

function generateTailwindReplacement(analysis) {
  const classes = [];

  // Handle base class
  if (analysis.baseClass) {
    const baseProperties = extractProperties(analysis.baseClass);
    const baseClasses = mapPropertiesToTailwind(baseProperties);
    classes.push(...baseClasses);
  }

  // Handle responsive classes
  if (analysis.hasResponsive) {
    analysis.mediaQueries.forEach((mq) => {
      const responsiveClasses = mapPropertiesToTailwind(mq.properties);
      responsiveClasses.forEach((cls) => {
        if (mq.breakpoint !== "unknown") {
          classes.push(`${mq.breakpoint}:${cls}`);
        }
      });
    });
  }

  return classes.join(" ");
}

function mapPropertiesToTailwind(properties) {
  const classes = [];

  properties.forEach((prop) => {
    // Position
    if (prop.includes("position: fixed")) classes.push("fixed");
    if (prop.includes("position: absolute")) classes.push("absolute");
    if (prop.includes("position: relative")) classes.push("relative");
    if (prop.includes("position: static")) classes.push("static");
    if (prop.includes("position: sticky")) classes.push("sticky");

    // Display
    if (prop.includes("display: flex")) classes.push("flex");
    if (prop.includes("display: block")) classes.push("block");
    if (prop.includes("display: inline")) classes.push("inline");
    if (prop.includes("display: inline-block")) classes.push("inline-block");
    if (prop.includes("display: grid")) classes.push("grid");
    if (prop.includes("display: none")) classes.push("hidden");

    // Flexbox
    if (prop.includes("flex-direction: row")) classes.push("flex-row");
    if (prop.includes("flex-direction: column")) classes.push("flex-col");
    if (prop.includes("justify-content: center")) classes.push("justify-center");
    if (prop.includes("justify-content: space-between")) classes.push("justify-between");
    if (prop.includes("justify-content: space-around")) classes.push("justify-around");
    if (prop.includes("align-items: center")) classes.push("items-center");
    if (prop.includes("align-items: flex-start")) classes.push("items-start");
    if (prop.includes("align-items: flex-end")) classes.push("items-end");

    // Width/Height
    if (prop.includes("width: 100%")) classes.push("w-full");
    if (prop.includes("height: 100%")) classes.push("h-full");

    // Max-width (responsive containers)
    if (prop.includes("max-width: 640px")) classes.push("max-w-sm");
    if (prop.includes("max-width: 768px")) classes.push("max-w-md");
    if (prop.includes("max-width: 1024px")) classes.push("max-w-lg");
    if (prop.includes("max-width: 1280px")) classes.push("max-w-xl");
    if (prop.includes("max-width: 1536px")) classes.push("max-w-2xl");

    // Spacing
    if (prop.includes("padding: 0")) classes.push("p-0");
    if (prop.includes("padding: 0.25rem")) classes.push("p-1");
    if (prop.includes("padding: 0.5rem")) classes.push("p-2");
    if (prop.includes("padding: 1rem")) classes.push("p-4");
    if (prop.includes("margin: 0")) classes.push("m-0");
    if (prop.includes("margin: 0.25rem")) classes.push("m-1");
    if (prop.includes("margin: 0.5rem")) classes.push("m-2");
    if (prop.includes("margin: 1rem")) classes.push("m-4");

    // Colors
    if (prop.includes("background-color: #ffffff")) classes.push("bg-white");
    if (prop.includes("background-color: #000000")) classes.push("bg-black");
    if (prop.includes("color: #ffffff")) classes.push("text-white");
    if (prop.includes("color: #000000")) classes.push("text-black");

    // Typography
    if (prop.includes("font-weight: bold")) classes.push("font-bold");
    if (prop.includes("font-weight: 600")) classes.push("font-semibold");
    if (prop.includes("text-align: center")) classes.push("text-center");
    if (prop.includes("text-align: left")) classes.push("text-left");
    if (prop.includes("text-align: right")) classes.push("text-right");

    // Borders
    if (prop.includes("border: 1px solid")) classes.push("border");
    if (prop.includes("border-radius: 0.25rem")) classes.push("rounded");
    if (prop.includes("border-radius: 0.5rem")) classes.push("rounded-lg");
    if (prop.includes("border-radius: 9999px")) classes.push("rounded-full");

    // Shadows
    if (prop.includes("box-shadow: 0 1px 3px")) classes.push("shadow-sm");
    if (prop.includes("box-shadow: 0 4px 6px")) classes.push("shadow");
    if (prop.includes("box-shadow: 0 10px 15px")) classes.push("shadow-lg");
  });

  return classes;
}

// Main execution
const className = process.argv[2];

if (!className) {
  console.log(`
🎯 Final Class Mapper - Correctly handles obfuscated classes with responsive behavior

Usage: node final-class-mapper.js [obfuscated-class-name]

This tool properly detects @media queries and maps them to Tailwind responsive prefixes.

Examples:
  node final-class-mapper.js fE3pmEmw8F30VPtAqcha
  node final-class-mapper.js Q_jg_EPdNf9eDMn1mLI2
`);
  process.exit(1);
}

console.log(`🔍 Final analysis for class: ${className}`);
const result = analyzeClass(className);

if (result) {
  console.log(`\n✅ Analysis complete!`);
  console.log(`\n💡 This class represents a responsive utility`);
  console.log(`   The obfuscated class includes @media queries that correspond`);
  console.log(`   to Tailwind's responsive prefixes (sm:, md:, lg:, etc.)`);
  console.log(`\n🔄 Next step: Use the replacement in your components:`);
  console.log(`   node replace-class.js "${className}" "${result.replacement}"`);
}
