#!/usr/bin/env node

/**
 * Complete Theme Mapper - Handles obfuscated classes with responsive AND theme variants
 *
 * This tool correctly maps obfuscated classes that include:
 * - Responsive prefixes (sm:, md:, lg:, xl:, 2xl:)
 * - Theme variants (dark:, light:)
 * - Both combined (dark:sm:, light:md:, etc.)
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

    // Find all instances of this class
    const instances = findAllInstances(content, className);

    console.log(`📊 Found ${instances.length} instance(s)\n`);

    // Generate the correct Tailwind replacement
    const replacement = generateTailwindReplacement(instances);

    console.log(`\n✨ Complete Tailwind replacement:`);
    console.log(`Replace "${className}" with: "${replacement}"`);

    console.log(`\n📝 Breakdown:`);
    instances.forEach((instance) => {
      if (instance.type === "base") {
        console.log(`  Base: ${instance.properties.join(", ")}`);
      } else if (instance.type === "media") {
        console.log(`  ${instance.breakpoint}: ${instance.properties.join(", ")}`);
      } else if (instance.type === "theme") {
        console.log(`  ${instance.theme}: ${instance.properties.join(", ")}`);
      } else if (instance.type === "responsive-theme") {
        console.log(
          `  ${instance.theme}:${instance.breakpoint}: ${instance.properties.join(", ")}`
        );
      }
    });

    return {
      className,
      replacement,
      instances,
    };
  } catch (error) {
    console.error("Error analyzing class:", error.message);
    return null;
  }
}

function findAllInstances(content, className) {
  const instances = [];

  // Find base class
  const baseClassRegex = new RegExp(`^\\s*\\.${className}\\s*\\{[^}]*\\}`, "gm");
  const baseClassMatch = content.match(baseClassRegex);

  if (baseClassMatch) {
    const properties = extractProperties(baseClassMatch[0]);
    instances.push({
      type: "base",
      properties: properties,
    });
  }

  // Find media queries (responsive)
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes("@media") && line.includes("min-width")) {
      // Found a media query, look for our class in the next few lines
      for (let j = i + 1; j < i + 10 && j < lines.length; j++) {
        const nextLine = lines[j];

        if (nextLine.includes(`.${className}`)) {
          // Extract breakpoint
          const breakpoint = extractBreakpoint(line);

          // Extract properties
          const properties = extractPropertiesFromLine(nextLine);

          instances.push({
            type: "media",
            breakpoint: breakpoint,
            properties: properties,
          });
          break;
        }
      }
    }
  }

  // Find theme variants (.dark, .light)
  const themeRegex = new RegExp(`\\.(dark|light)\\s+\\.${className}\\s*\\{[^}]*\\}`, "g");
  let themeMatch;

  while ((themeMatch = themeRegex.exec(content)) !== null) {
    const theme = themeMatch[1];
    const classDefinition = themeMatch[0];
    const properties = extractProperties(classDefinition);

    instances.push({
      type: "theme",
      theme: theme,
      properties: properties,
    });
  }

  // Find responsive theme variants (.dark .class in @media)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes("@media") && line.includes("min-width")) {
      const breakpoint = extractBreakpoint(line);

      // Look for theme variants in this media query
      for (let j = i + 1; j < i + 10 && j < lines.length; j++) {
        const nextLine = lines[j];

        if (nextLine.includes(`.dark .${className}`) || nextLine.includes(`.light .${className}`)) {
          const theme = nextLine.includes(".dark") ? "dark" : "light";
          const properties = extractPropertiesFromLine(nextLine);

          instances.push({
            type: "responsive-theme",
            theme: theme,
            breakpoint: breakpoint,
            properties: properties,
          });
          break;
        }
      }
    }
  }

  return instances;
}

function extractBreakpoint(mediaLine) {
  if (mediaLine.includes("640px")) return "sm";
  if (mediaLine.includes("768px")) return "md";
  if (mediaLine.includes("1024px")) return "lg";
  if (mediaLine.includes("1280px")) return "xl";
  if (mediaLine.includes("1536px")) return "2xl";
  return "unknown";
}

function extractPropertiesFromLine(line) {
  const properties = [];

  // Extract max-width values
  if (line.includes("max-width: 640px")) properties.push("max-width: 640px");
  if (line.includes("max-width: 768px")) properties.push("max-width: 768px");
  if (line.includes("max-width: 1024px")) properties.push("max-width: 1024px");
  if (line.includes("max-width: 1280px")) properties.push("max-width: 1280px");
  if (line.includes("max-width: 1536px")) properties.push("max-width: 1536px");

  // Extract width values
  if (line.includes("width: 100%")) properties.push("width: 100%");

  // Extract background colors (common in theme variants)
  if (line.includes("background-color: #ffffff")) properties.push("background-color: #ffffff");
  if (line.includes("background-color: #000000")) properties.push("background-color: #000000");
  if (line.includes("background-color: #374151")) properties.push("background-color: #374151");
  if (line.includes("background-color: #1f2937")) properties.push("background-color: #1f2937");
  if (line.includes("background-color: #4b5563")) properties.push("background-color: #4b5563");

  // Extract text colors
  if (line.includes("color: #ffffff")) properties.push("color: #ffffff");
  if (line.includes("color: #000000")) properties.push("color: #000000");
  if (line.includes("color: #374151")) properties.push("color: #374151");

  // Extract other common properties
  if (line.includes("display: flex")) properties.push("display: flex");
  if (line.includes("justify-content: center")) properties.push("justify-content: center");
  if (line.includes("align-items: center")) properties.push("align-items: center");
  if (line.includes("position: fixed")) properties.push("position: fixed");
  if (line.includes("position: absolute")) properties.push("position: absolute");
  if (line.includes("position: relative")) properties.push("position: relative");

  return properties;
}

function extractProperties(cssDefinition) {
  const properties = [];

  // Extract common properties
  if (cssDefinition.includes("width: 100%")) properties.push("width: 100%");
  if (cssDefinition.includes("max-width: 640px")) properties.push("max-width: 640px");
  if (cssDefinition.includes("max-width: 768px")) properties.push("max-width: 768px");
  if (cssDefinition.includes("max-width: 1024px")) properties.push("max-width: 1024px");
  if (cssDefinition.includes("max-width: 1280px")) properties.push("max-width: 1280px");
  if (cssDefinition.includes("max-width: 1536px")) properties.push("max-width: 1536px");
  if (cssDefinition.includes("display: flex")) properties.push("display: flex");
  if (cssDefinition.includes("justify-content: center")) properties.push("justify-content: center");
  if (cssDefinition.includes("align-items: center")) properties.push("align-items: center");
  if (cssDefinition.includes("position: fixed")) properties.push("position: fixed");
  if (cssDefinition.includes("position: absolute")) properties.push("position: absolute");
  if (cssDefinition.includes("position: relative")) properties.push("position: relative");

  // Extract background colors
  if (cssDefinition.includes("background-color: #ffffff"))
    properties.push("background-color: #ffffff");
  if (cssDefinition.includes("background-color: #000000"))
    properties.push("background-color: #000000");
  if (cssDefinition.includes("background-color: #374151"))
    properties.push("background-color: #374151");
  if (cssDefinition.includes("background-color: #1f2937"))
    properties.push("background-color: #1f2937");
  if (cssDefinition.includes("background-color: #4b5563"))
    properties.push("background-color: #4b5563");

  // Extract text colors
  if (cssDefinition.includes("color: #ffffff")) properties.push("color: #ffffff");
  if (cssDefinition.includes("color: #000000")) properties.push("color: #000000");
  if (cssDefinition.includes("color: #374151")) properties.push("color: #374151");

  return properties;
}

function generateTailwindReplacement(instances) {
  const classes = [];

  instances.forEach((instance) => {
    const tailwindClasses = mapPropertiesToTailwind(instance.properties);

    if (instance.type === "base") {
      classes.push(...tailwindClasses);
    } else if (instance.type === "media" && instance.breakpoint !== "unknown") {
      tailwindClasses.forEach((cls) => {
        classes.push(`${instance.breakpoint}:${cls}`);
      });
    } else if (instance.type === "theme") {
      tailwindClasses.forEach((cls) => {
        classes.push(`${instance.theme}:${cls}`);
      });
    } else if (instance.type === "responsive-theme" && instance.breakpoint !== "unknown") {
      tailwindClasses.forEach((cls) => {
        classes.push(`${instance.theme}:${instance.breakpoint}:${cls}`);
      });
    }
  });

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

    // Colors - Enhanced for theme variants
    if (prop.includes("background-color: #ffffff")) classes.push("bg-white");
    if (prop.includes("background-color: #000000")) classes.push("bg-black");
    if (prop.includes("background-color: #374151")) classes.push("bg-gray-700");
    if (prop.includes("background-color: #1f2937")) classes.push("bg-gray-800");
    if (prop.includes("background-color: #4b5563")) classes.push("bg-gray-600");

    if (prop.includes("color: #ffffff")) classes.push("text-white");
    if (prop.includes("color: #000000")) classes.push("text-black");
    if (prop.includes("color: #374151")) classes.push("text-gray-700");

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
🎯 Complete Theme Mapper - Handles responsive AND theme variants

Usage: node complete-theme-mapper.js [obfuscated-class-name]

This tool handles:
- Base classes (no prefix)
- Responsive prefixes (sm:, md:, lg:, xl:, 2xl:)
- Theme variants (dark:, light:)
- Combined responsive + theme (dark:sm:, light:md:, etc.)

Examples:
  node complete-theme-mapper.js fE3pmEmw8F30VPtAqcha
  node complete-theme-mapper.js _P8DBug7KEIklz642p36
`);
  process.exit(1);
}

console.log(`🔍 Complete theme analysis for class: ${className}`);
const result = analyzeClass(className);

if (result) {
  console.log(`\n✅ Analysis complete!`);
  console.log(`\n💡 This class represents a responsive utility with theme variants`);
  console.log(`   The obfuscated class includes @media queries AND theme selectors`);
  console.log(`   that correspond to Tailwind's responsive prefixes and theme variants`);
  console.log(`\n🔄 Next step: Use the replacement in your components:`);
  console.log(`   node replace-class.js "${className}" "${result.replacement}"`);
}
