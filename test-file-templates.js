#!/usr/bin/env node

// Test script for file-based PDF templates
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🧪 Testing File-Based PDF Templates System\n");

// Test 1: Check if template files exist
console.log("1. Checking template files...");
const templateFiles = [
  "src/templates/pdf/templates.json",
  "src/templates/pdf/fire-protection-plan.html",
  "src/templates/pdf/components/header-company-logo.html",
  "src/templates/pdf/components/content-project-summary.html",
  "src/templates/pdf/components/footer-contact-info.html",
];

let allFilesExist = true;
templateFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log("\n❌ Some template files are missing!");
  process.exit(1);
}

// Test 2: Check templates.json structure
console.log("\n2. Checking templates.json structure...");
try {
  const configPath = path.join(__dirname, "src/templates/pdf/templates.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  if (config.templates && Array.isArray(config.templates)) {
    console.log(`   ✅ Found ${config.templates.length} templates`);
    config.templates.forEach((template) => {
      console.log(`      - ${template.name} (${template.id})`);
    });
  } else {
    console.log("   ❌ Invalid templates structure");
    allFilesExist = false;
  }

  if (config.components && Array.isArray(config.components)) {
    console.log(`   ✅ Found ${config.components.length} components`);
    config.components.forEach((component) => {
      console.log(`      - ${component.name} (${component.type})`);
    });
  } else {
    console.log("   ❌ Invalid components structure");
    allFilesExist = false;
  }
} catch (error) {
  console.log(`   ❌ Error reading templates.json: ${error.message}`);
  allFilesExist = false;
}

// Test 3: Check HTML content
console.log("\n3. Checking HTML content...");
try {
  const templatePath = path.join(__dirname, "src/templates/pdf/fire-protection-plan.html");
  const templateContent = fs.readFileSync(templatePath, "utf-8");

  if (templateContent.includes("{{PROJECT_TITLE}}")) {
    console.log("   ✅ Template contains placeholders");
  } else {
    console.log("   ❌ Template missing placeholders");
    allFilesExist = false;
  }

  if (templateContent.includes("[HEADER COMPONENTS]")) {
    console.log("   ✅ Template contains component placeholders");
  } else {
    console.log("   ❌ Template missing component placeholders");
    allFilesExist = false;
  }

  if (templateContent.includes("<style>")) {
    console.log("   ✅ Template contains inline CSS");
  } else {
    console.log("   ❌ Template missing inline CSS");
    allFilesExist = false;
  }
} catch (error) {
  console.log(`   ❌ Error reading template: ${error.message}`);
  allFilesExist = false;
}

// Test 4: Check components
console.log("\n4. Checking components...");
const componentFiles = [
  "src/templates/pdf/components/header-company-logo.html",
  "src/templates/pdf/components/content-project-summary.html",
  "src/templates/pdf/components/footer-contact-info.html",
];

componentFiles.forEach((file) => {
  try {
    const content = fs.readFileSync(file, "utf-8");
    if (content.includes("{{") && content.includes("}}")) {
      console.log(`   ✅ ${path.basename(file)} contains placeholders`);
    } else {
      console.log(`   ⚠️  ${path.basename(file)} has no placeholders`);
    }
  } catch (error) {
    console.log(`   ❌ Error reading ${file}: ${error.message}`);
    allFilesExist = false;
  }
});

// Summary
console.log("\n" + "=".repeat(50));
if (allFilesExist) {
  console.log("✅ All tests passed! File-based template system is ready.");
  console.log("\nNext steps:");
  console.log("1. Start your development server");
  console.log("2. Navigate to a project page");
  console.log('3. Click "Generate PDF" tab');
  console.log("4. Test template selection and component loading");
} else {
  console.log("❌ Some tests failed. Please check the errors above.");
  process.exit(1);
}
