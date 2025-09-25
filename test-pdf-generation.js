#!/usr/bin/env node

// Test script for PDF generation API
// Using built-in fetch (Node.js 18+)

const BASE_URL = "http://localhost:4321";

async function testPDFGeneration() {
  console.log("🧪 Testing PDF Generation API\n");

  try {
    // Test 1: Check if templates API works
    console.log("1. Testing templates API...");
    const templatesResponse = await fetch(`${BASE_URL}/api/pdf/templates`);
    const templatesData = await templatesResponse.json();

    if (templatesData.success) {
      console.log(`   ✅ Found ${templatesData.templates.length} templates`);
      templatesData.templates.forEach((template) => {
        console.log(`      - ${template.name} (${template.id})`);
      });
    } else {
      console.log(`   ❌ Templates API failed: ${templatesData.message}`);
      return;
    }

    // Test 2: Check if components API works
    console.log("\n2. Testing components API...");
    const componentsResponse = await fetch(
      `${BASE_URL}/api/pdf/components?templateId=fire-protection-plan`
    );
    const componentsData = await componentsResponse.json();

    if (componentsData.success) {
      console.log(`   ✅ Found ${componentsData.components.length} components for template`);
      componentsData.components.forEach((component) => {
        console.log(`      - ${component.name} (${component.component_type})`);
      });
    } else {
      console.log(`   ❌ Components API failed: ${componentsData.message}`);
      return;
    }

    // Test 3: Test PDF generation with mock data
    console.log("\n3. Testing PDF generation...");
    const generateData = {
      projectId: "386",
      templateId: "fire-protection-plan",
      documentName: "Test Fire Protection Plan",
      selectedComponents: ["header-company-logo", "content-project-summary", "footer-contact-info"],
      customPlaceholders: {},
    };

    const generateResponse = await fetch(`${BASE_URL}/api/pdf/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(generateData),
    });

    const generateResult = await generateResponse.json();

    if (generateResult.success) {
      console.log(`   ✅ PDF generation successful`);
      console.log(`      Document ID: ${generateResult.document.id}`);
      console.log(`      Document Name: ${generateResult.document.name}`);
      console.log(`      File Size: ${generateResult.document.fileSize} bytes`);
      console.log(`      Components: ${generateResult.document.components.length}`);
    } else {
      console.log(`   ❌ PDF generation failed: ${generateResult.message}`);
      if (generateResult.error) {
        console.log(`      Error: ${generateResult.error}`);
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/pdf/templates`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log("Checking if development server is running...");
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log("❌ Development server is not running!");
    console.log("Please start your development server first:");
    console.log("   npm run dev");
    console.log("   # or");
    console.log("   yarn dev");
    process.exit(1);
  }

  console.log("✅ Development server is running\n");
  await testPDFGeneration();
}

main().catch(console.error);
