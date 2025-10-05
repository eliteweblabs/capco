#!/usr/bin/env node

/**
 * Smart Class Mapper - Intelligently maps obfuscated classes with responsive behavior
 *
 * This tool understands that obfuscated classes often represent responsive utilities
 * and maps them to the most appropriate Tailwind equivalent
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common responsive patterns and their Tailwind equivalents
const responsivePatterns = {
  // Container patterns
  "responsive-container": {
    pattern: /max-width:\s*(\d+)px/,
    base: "w-full",
    responsive: {
      640: "sm:max-w-sm",
      768: "md:max-w-md",
      1024: "lg:max-w-lg",
      1280: "xl:max-w-xl",
      1536: "2xl:max-w-2xl",
    },
  },

  // Flex patterns
  "flex-center": {
    pattern: /display:\s*flex.*justify-content:\s*center.*align-items:\s*center/,
    base: "flex justify-center items-center",
  },

  "flex-between": {
    pattern: /display:\s*flex.*justify-content:\s*space-between/,
    base: "flex justify-between",
  },

  // Spacing patterns
  "padding-responsive": {
    pattern: /padding:\s*(\d+(?:\.\d+)?)rem/,
    responsive: {
      0.25: "p-1",
      0.5: "p-2",
      1: "p-4",
      1.5: "p-6",
      2: "p-8",
    },
  },
};

function analyzeClass(className) {
  try {
    const appCSSPath = path.join(__dirname, "src/styles/app.css");
    const content = fs.readFileSync(appCSSPath, "utf8");

    // Find base class definition
    const baseClassRegex = new RegExp(`^\\s*\\.${className}\\s*\\{[^}]*\\}`, "gm");
    const baseClassMatch = content.match(baseClassRegex);

    // Find media queries for this class
    const mediaQueries = findMediaQueries(content, className);

    console.log(`\n🔍 Analyzing class: ${className}`);
    console.log(`📊 Found ${mediaQueries.length} responsive variants\n`);

    // Analyze the pattern
    const analysis = analyzeResponsivePattern(className, baseClassMatch, mediaQueries);

    if (analysis.type === "responsive-container") {
      return suggestContainerReplacement(analysis);
    } else if (analysis.type === "flex-utility") {
      return suggestFlexReplacement(analysis);
    } else if (analysis.type === "spacing-utility") {
      return suggestSpacingReplacement(analysis);
    } else {
      return suggestGenericReplacement(analysis);
    }
  } catch (error) {
    console.error("Error analyzing class:", error.message);
    return null;
  }
}

function findMediaQueries(content, className) {
  const mediaQueries = [];
  const mediaRegex = /@media\s+([^{]+)\s*\{[^}]*\.${className}[^}]*\}/g;
  let match;

  while ((match = mediaRegex.exec(content)) !== null) {
    const mediaCondition = match[1].trim();
    const mediaBlock = match[0];

    // Extract the class definition from the media block
    const classMatch = mediaBlock.match(new RegExp(`\\.${className}\\s*\\{[^}]*\\}`));
    if (classMatch) {
      mediaQueries.push({
        condition: mediaCondition,
        classDefinition: classMatch[0],
        mediaBlock: mediaBlock,
      });
    }
  }

  return mediaQueries;
}

function analyzeResponsivePattern(className, baseClass, mediaQueries) {
  const analysis = {
    className,
    type: "unknown",
    baseProperties: [],
    responsiveProperties: [],
    breakpoints: [],
  };

  // Extract base properties
  if (baseClass) {
    analysis.baseProperties = extractProperties(baseClass[0]);
  }

  // Extract responsive properties
  mediaQueries.forEach((mq) => {
    const properties = extractProperties(mq.classDefinition);
    const breakpoint = mapMediaQueryToBreakpoint(mq.condition);

    analysis.responsiveProperties.push(...properties);
    analysis.breakpoints.push({
      condition: mq.condition,
      breakpoint: breakpoint,
      properties: properties,
    });
  });

  // Determine the type
  if (isContainerPattern(analysis)) {
    analysis.type = "responsive-container";
  } else if (isFlexPattern(analysis)) {
    analysis.type = "flex-utility";
  } else if (isSpacingPattern(analysis)) {
    analysis.type = "spacing-utility";
  }

  return analysis;
}

function isContainerPattern(analysis) {
  // Check if this looks like a responsive container
  const hasMaxWidth = analysis.responsiveProperties.some(
    (prop) => prop.includes("max-width") && prop.includes("px")
  );
  const hasWidth = analysis.baseProperties.some((prop) => prop.includes("width: 100%"));

  return hasMaxWidth && hasWidth;
}

function isFlexPattern(analysis) {
  const allProperties = [...analysis.baseProperties, ...analysis.responsiveProperties];
  return allProperties.some((prop) => prop.includes("display: flex"));
}

function isSpacingPattern(analysis) {
  const allProperties = [...analysis.baseProperties, ...analysis.responsiveProperties];
  return allProperties.some((prop) => prop.includes("padding:") || prop.includes("margin:"));
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

function suggestContainerReplacement(analysis) {
  console.log("🎯 Pattern detected: Responsive Container");
  console.log("📱 This class creates a responsive container with different max-widths");

  const breakpoints = analysis.breakpoints
    .map((bp) => bp.breakpoint)
    .filter((bp) => bp !== "unknown");

  console.log(`\n✨ Recommended Tailwind replacement:`);
  console.log(
    `Replace "${analysis.className}" with: "w-full ${breakpoints.map((bp) => `${bp}:max-w-${bp}`).join(" ")}"`
  );

  console.log(`\n📝 Detailed breakdown:`);
  console.log(`  Base: w-full (width: 100%)`);
  analysis.breakpoints.forEach((bp) => {
    if (bp.breakpoint !== "unknown") {
      console.log(`  ${bp.breakpoint}: max-w-${bp.breakpoint} (${bp.properties.join(", ")})`);
    }
  });

  return {
    type: "responsive-container",
    replacement: `w-full ${breakpoints.map((bp) => `${bp}:max-w-${bp}`).join(" ")}`,
    explanation: "Responsive container with progressive max-widths",
  };
}

function suggestFlexReplacement(analysis) {
  console.log("🎯 Pattern detected: Flex Utility");

  const allProperties = [...analysis.baseProperties, ...analysis.responsiveProperties];
  const classes = [];

  if (allProperties.some((prop) => prop.includes("display: flex"))) {
    classes.push("flex");
  }
  if (allProperties.some((prop) => prop.includes("justify-content: center"))) {
    classes.push("justify-center");
  }
  if (allProperties.some((prop) => prop.includes("align-items: center"))) {
    classes.push("items-center");
  }
  if (allProperties.some((prop) => prop.includes("justify-content: space-between"))) {
    classes.push("justify-between");
  }

  console.log(`\n✨ Recommended Tailwind replacement:`);
  console.log(`Replace "${analysis.className}" with: "${classes.join(" ")}"`);

  return {
    type: "flex-utility",
    replacement: classes.join(" "),
    explanation: "Flex utility with alignment properties",
  };
}

function suggestSpacingReplacement(analysis) {
  console.log("🎯 Pattern detected: Spacing Utility");

  const allProperties = [...analysis.baseProperties, ...analysis.responsiveProperties];
  const classes = [];

  allProperties.forEach((prop) => {
    if (prop.includes("padding: 0")) classes.push("p-0");
    if (prop.includes("padding: 0.25rem")) classes.push("p-1");
    if (prop.includes("padding: 0.5rem")) classes.push("p-2");
    if (prop.includes("padding: 1rem")) classes.push("p-4");
    if (prop.includes("margin: 0")) classes.push("m-0");
    if (prop.includes("margin: 0.25rem")) classes.push("m-1");
    if (prop.includes("margin: 0.5rem")) classes.push("m-2");
    if (prop.includes("margin: 1rem")) classes.push("m-4");
  });

  console.log(`\n✨ Recommended Tailwind replacement:`);
  console.log(`Replace "${analysis.className}" with: "${classes.join(" ")}"`);

  return {
    type: "spacing-utility",
    replacement: classes.join(" "),
    explanation: "Spacing utility with padding/margin",
  };
}

function suggestGenericReplacement(analysis) {
  console.log("🎯 Pattern detected: Generic Utility");
  console.log("⚠️  Manual mapping required - this class doesn't match common patterns");

  console.log(`\n📋 Base properties: ${analysis.baseProperties.join(", ")}`);
  console.log(`📱 Responsive properties: ${analysis.responsiveProperties.join(", ")}`);

  return {
    type: "generic",
    replacement: "❓ Manual mapping required",
    explanation: "Complex pattern requiring manual analysis",
  };
}

// Main execution
const className = process.argv[2];

if (!className) {
  console.log(`
🧠 Smart Class Mapper - Intelligently maps obfuscated classes

Usage: node smart-class-mapper.js [obfuscated-class-name]

This tool understands common responsive patterns:
- Responsive containers (max-width at different breakpoints)
- Flex utilities (display, justify, align)
- Spacing utilities (padding, margin)
- And more...

Examples:
  node smart-class-mapper.js fE3pmEmw8F30VPtAqcha
  node smart-class-mapper.js Q_jg_EPdNf9eDMn1mLI2
`);
  process.exit(1);
}

console.log(`🔍 Smart analysis for class: ${className}`);
const result = analyzeClass(className);

if (result) {
  console.log(`\n✅ Analysis complete!`);
  console.log(`Type: ${result.type}`);
  console.log(`Replacement: ${result.replacement}`);
  console.log(`Explanation: ${result.explanation}`);
}
