#!/usr/bin/env node

/**
 * Practical Class Mapper - Focuses on the real problem: responsive prefixes
 *
 * The key insight: obfuscated classes often represent Tailwind utilities
 * that need responsive prefixes (sm:, md:, lg:, etc.)
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

    // Find all instances of this class (base + media queries)
    const allInstances = findAllClassInstances(content, className);

    if (allInstances.length === 0) {
      console.log(`❌ Class "${className}" not found in app.css`);
      return null;
    }

    console.log(`📊 Found ${allInstances.length} instance(s) of this class\n`);

    // Analyze each instance
    const analysis = analyzeInstances(allInstances);

    // Generate the most practical replacement
    const replacement = generateReplacement(analysis);

    console.log(`\n✨ Practical Tailwind replacement:`);
    console.log(`Replace "${className}" with: "${replacement}"`);

    console.log(`\n📝 Explanation:`);
    console.log(`  This class represents: ${analysis.description}`);
    console.log(`  Responsive behavior: ${analysis.hasResponsive ? "Yes" : "No"}`);

    if (analysis.hasResponsive) {
      console.log(`  Breakpoints: ${analysis.breakpoints.join(", ")}`);
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

function findAllClassInstances(content, className) {
  const instances = [];

  // Find base class definition
  const baseRegex = new RegExp(`^\\s*\\.${className}\\s*\\{[^}]*\\}`, "gm");
  const baseMatch = content.match(baseRegex);
  if (baseMatch) {
    instances.push({
      type: "base",
      definition: baseMatch[0],
      properties: extractProperties(baseMatch[0]),
    });
  }

  // Find media query instances
  const mediaRegex = /@media\s+([^{]+)\s*\{[^}]*\.${className}[^}]*\}/g;
  let match;

  while ((match = mediaRegex.exec(content)) !== null) {
    const mediaCondition = match[1].trim();
    const mediaBlock = match[0];

    // Extract the class definition from the media block
    const classMatch = mediaBlock.match(new RegExp(`\\.${className}\\s*\\{[^}]*\\}`));
    if (classMatch) {
      instances.push({
        type: "media",
        condition: mediaCondition,
        definition: classMatch[0],
        properties: extractProperties(classMatch[0]),
        breakpoint: mapMediaQueryToBreakpoint(mediaCondition),
      });
    }
  }

  return instances;
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

function mapMediaQueryToBreakpoint(condition) {
  if (condition.includes("640px")) return "sm";
  if (condition.includes("768px")) return "md";
  if (condition.includes("1024px")) return "lg";
  if (condition.includes("1280px")) return "xl";
  if (condition.includes("1536px")) return "2xl";
  return "unknown";
}

function analyzeInstances(instances) {
  const analysis = {
    hasBase: false,
    hasResponsive: false,
    breakpoints: [],
    baseProperties: [],
    responsiveProperties: [],
    description: "",
  };

  instances.forEach((instance) => {
    if (instance.type === "base") {
      analysis.hasBase = true;
      analysis.baseProperties = instance.properties;
    } else if (instance.type === "media") {
      analysis.hasResponsive = true;
      analysis.breakpoints.push(instance.breakpoint);
      analysis.responsiveProperties.push(...instance.properties);
    }
  });

  // Determine the type of utility this represents
  analysis.description = determineUtilityType(analysis);

  return analysis;
}

function determineUtilityType(analysis) {
  const allProperties = [...analysis.baseProperties, ...analysis.responsiveProperties];

  // Check for container pattern
  if (
    allProperties.some((prop) => prop.includes("width: 100%")) &&
    allProperties.some((prop) => prop.includes("max-width"))
  ) {
    return "Responsive container with progressive max-widths";
  }

  // Check for flex pattern
  if (allProperties.some((prop) => prop.includes("display: flex"))) {
    return "Flex utility with alignment properties";
  }

  // Check for spacing pattern
  if (allProperties.some((prop) => prop.includes("padding:") || prop.includes("margin:"))) {
    return "Spacing utility (padding/margin)";
  }

  // Check for positioning
  if (allProperties.some((prop) => prop.includes("position:"))) {
    return "Positioning utility";
  }

  return "Generic utility";
}

function generateReplacement(analysis) {
  const classes = [];

  // Handle base properties
  if (analysis.hasBase) {
    const baseClasses = mapPropertiesToTailwind(analysis.baseProperties);
    classes.push(...baseClasses);
  }

  // Handle responsive properties
  if (analysis.hasResponsive) {
    // Group responsive properties by breakpoint
    const responsiveClasses = mapResponsivePropertiesToTailwind(analysis);
    classes.push(...responsiveClasses);
  }

  return classes.join(" ");
}

function mapPropertiesToTailwind(properties) {
  const classes = [];

  properties.forEach((prop) => {
    if (prop.includes("width: 100%")) classes.push("w-full");
    if (prop.includes("display: flex")) classes.push("flex");
    if (prop.includes("justify-content: center")) classes.push("justify-center");
    if (prop.includes("align-items: center")) classes.push("items-center");
    if (prop.includes("justify-content: space-between")) classes.push("justify-between");
    if (prop.includes("position: fixed")) classes.push("fixed");
    if (prop.includes("position: absolute")) classes.push("absolute");
    if (prop.includes("position: relative")) classes.push("relative");
    if (prop.includes("position: static")) classes.push("static");
    if (prop.includes("padding: 0")) classes.push("p-0");
    if (prop.includes("padding: 0.25rem")) classes.push("p-1");
    if (prop.includes("padding: 0.5rem")) classes.push("p-2");
    if (prop.includes("padding: 1rem")) classes.push("p-4");
    if (prop.includes("margin: 0")) classes.push("m-0");
    if (prop.includes("margin: 0.25rem")) classes.push("m-1");
    if (prop.includes("margin: 0.5rem")) classes.push("m-2");
    if (prop.includes("margin: 1rem")) classes.push("m-4");
    if (prop.includes("background-color: #ffffff")) classes.push("bg-white");
    if (prop.includes("color: #ffffff")) classes.push("text-white");
    if (prop.includes("font-weight: bold")) classes.push("font-bold");
    if (prop.includes("text-align: center")) classes.push("text-center");
    if (prop.includes("border: 1px solid")) classes.push("border");
    if (prop.includes("border-radius: 0.25rem")) classes.push("rounded");
    if (prop.includes("box-shadow: 0 1px 3px")) classes.push("shadow-sm");
  });

  return classes;
}

function mapResponsivePropertiesToTailwind(analysis) {
  const classes = [];

  // For responsive containers, use the standard Tailwind approach
  if (analysis.description.includes("Responsive container")) {
    classes.push("sm:max-w-sm", "md:max-w-md", "lg:max-w-lg", "xl:max-w-xl", "2xl:max-w-2xl");
  }

  // For other responsive properties, we'd need more complex logic
  // This is where the manual mapping becomes necessary

  return classes;
}

// Main execution
const className = process.argv[2];

if (!className) {
  console.log(`
🎯 Practical Class Mapper - Focuses on responsive prefixes

Usage: node practical-class-mapper.js [obfuscated-class-name]

This tool understands that obfuscated classes often represent:
- Responsive containers (w-full + max-w-* at different breakpoints)
- Flex utilities with responsive behavior
- Spacing utilities with responsive behavior
- And other common patterns

Examples:
  node practical-class-mapper.js fE3pmEmw8F30VPtAqcha
  node practical-class-mapper.js Q_jg_EPdNf9eDMn1mLI2
`);
  process.exit(1);
}

console.log(`🔍 Practical analysis for class: ${className}`);
const result = analyzeClass(className);

if (result) {
  console.log(`\n✅ Analysis complete!`);
  console.log(`\n💡 Key insight: This class represents a responsive utility`);
  console.log(`   The obfuscated class includes @media queries that correspond`);
  console.log(`   to Tailwind's responsive prefixes (sm:, md:, lg:, etc.)`);
}
