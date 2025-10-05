#!/usr/bin/env node

/**
 * Responsive Class Mapper - Handles obfuscated classes with responsive behavior
 *
 * This tool understands that obfuscated classes often represent Tailwind utilities
 * with responsive prefixes and maps them correctly
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeResponsiveClass(className) {
  try {
    const appCSSPath = path.join(__dirname, "src/styles/app.css");
    const content = fs.readFileSync(appCSSPath, "utf8");

    console.log(`\n🔍 Analyzing responsive class: ${className}`);

    // Find base class
    const baseClassRegex = new RegExp(`^\\s*\\.${className}\\s*\\{[^}]*\\}`, "gm");
    const baseClassMatch = content.match(baseClassRegex);

    // Find all media queries that contain this class
    const mediaQueries = findMediaQueriesForClass(content, className);

    console.log(`📊 Found ${mediaQueries.length} responsive variants\n`);

    // Analyze the pattern
    const analysis = {
      className,
      baseClass: baseClassMatch ? baseClassMatch[0] : null,
      mediaQueries,
      hasResponsive: mediaQueries.length > 0,
      pattern: determinePattern(baseClassMatch, mediaQueries),
    };

    // Generate the correct Tailwind replacement
    const replacement = generateResponsiveReplacement(analysis);

    console.log(`\n✨ Responsive Tailwind replacement:`);
    console.log(`Replace "${className}" with: "${replacement}"`);

    console.log(`\n📝 Pattern analysis:`);
    console.log(`  Type: ${analysis.pattern.type}`);
    console.log(`  Description: ${analysis.pattern.description}`);
    console.log(`  Responsive: ${analysis.hasResponsive ? "Yes" : "No"}`);

    if (analysis.hasResponsive) {
      console.log(`  Breakpoints: ${mediaQueries.map((mq) => mq.breakpoint).join(", ")}`);
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

function findMediaQueriesForClass(content, className) {
  const mediaQueries = [];

  // Find all @media blocks that contain this class
  const mediaRegex = /@media\s+([^{]+)\s*\{[^}]*\.${className}[^}]*\}/g;
  let match;

  while ((match = mediaRegex.exec(content)) !== null) {
    const mediaCondition = match[1].trim();
    const mediaBlock = match[0];

    // Extract the class definition from the media block
    const classMatch = mediaBlock.match(new RegExp(`\\.${className}\\s*\\{[^}]*\\}`));
    if (classMatch) {
      const breakpoint = mapMediaQueryToBreakpoint(mediaCondition);
      const properties = extractProperties(classMatch[0]);

      mediaQueries.push({
        condition: mediaCondition,
        breakpoint: breakpoint,
        classDefinition: classMatch[0],
        properties: properties,
      });
    }
  }

  return mediaQueries;
}

function mapMediaQueryToBreakpoint(condition) {
  if (condition.includes("640px")) return "sm";
  if (condition.includes("768px")) return "md";
  if (condition.includes("1024px")) return "lg";
  if (condition.includes("1280px")) return "xl";
  if (condition.includes("1536px")) return "2xl";
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

function determinePattern(baseClass, mediaQueries) {
  const allProperties = [];

  if (baseClass) {
    allProperties.push(...extractProperties(baseClass));
  }

  mediaQueries.forEach((mq) => {
    allProperties.push(...mq.properties);
  });

  // Check for container pattern
  if (
    allProperties.some((prop) => prop.includes("width: 100%")) &&
    allProperties.some((prop) => prop.includes("max-width"))
  ) {
    return {
      type: "responsive-container",
      description: "Responsive container with progressive max-widths",
    };
  }

  // Check for flex pattern
  if (allProperties.some((prop) => prop.includes("display: flex"))) {
    return {
      type: "flex-utility",
      description: "Flex utility with responsive alignment",
    };
  }

  // Check for positioning
  if (allProperties.some((prop) => prop.includes("position:"))) {
    return {
      type: "positioning-utility",
      description: "Positioning utility with responsive behavior",
    };
  }

  // Check for spacing
  if (allProperties.some((prop) => prop.includes("padding:") || prop.includes("margin:"))) {
    return {
      type: "spacing-utility",
      description: "Spacing utility with responsive behavior",
    };
  }

  return {
    type: "generic-utility",
    description: "Generic utility with responsive behavior",
  };
}

function generateResponsiveReplacement(analysis) {
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
🎯 Responsive Class Mapper - Handles obfuscated classes with responsive behavior

Usage: node responsive-class-mapper.js [obfuscated-class-name]

This tool understands that obfuscated classes often represent Tailwind utilities
with responsive prefixes and maps them correctly.

Examples:
  node responsive-class-mapper.js fE3pmEmw8F30VPtAqcha
  node responsive-class-mapper.js Q_jg_EPdNf9eDMn1mLI2
`);
  process.exit(1);
}

console.log(`🔍 Responsive analysis for class: ${className}`);
const result = analyzeResponsiveClass(className);

if (result) {
  console.log(`\n✅ Analysis complete!`);
  console.log(`\n💡 Key insight: This class represents a responsive utility`);
  console.log(`   The obfuscated class includes @media queries that correspond`);
  console.log(`   to Tailwind's responsive prefixes (sm:, md:, lg:, etc.)`);
  console.log(`\n🔄 Next step: Use the replacement in your components:`);
  console.log(`   node replace-class.js "${className}" "${result.replacement}"`);
}
