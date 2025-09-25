#!/usr/bin/env node

/**
 * Test script for the PDF generation system
 * This script tests the PDF API endpoints
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4321";

async function testPdfSystem() {
  console.log("🧪 Testing PDF Generation System\n");

  try {
    // Test 1: Check if templates endpoint works
    console.log("1. Testing templates endpoint...");
    const templatesResponse = await fetch(`${BASE_URL}/api/pdf/templates`);
    const templatesResult = await templatesResponse.json();
    console.log("   Templates Response:", templatesResult);

    if (templatesResult.success) {
      console.log(`   ✅ Found ${templatesResult.templates.length} templates`);

      if (templatesResult.templates.length > 0) {
        const firstTemplate = templatesResult.templates[0];
        console.log(`   📄 First template: ${firstTemplate.name}`);

        // Test 2: Check components for first template
        console.log("\n2. Testing components endpoint...");
        const componentsResponse = await fetch(
          `${BASE_URL}/api/pdf/components?templateId=${firstTemplate.id}`
        );
        const componentsResult = await componentsResponse.json();
        console.log("   Components Response:", componentsResult);

        if (componentsResult.success) {
          console.log(
            `   ✅ Found ${componentsResult.components.length} components for template ${firstTemplate.name}`
          );
        } else {
          console.log("   ❌ Failed to fetch components");
        }
      } else {
        console.log("   ⚠️  No templates found - database migration may be needed");
        console.log("   💡 Run: ./run-pdf-migration.sh");
      }
    } else {
      console.log("   ❌ Failed to fetch templates");
      if (
        templatesResult.message &&
        templatesResult.message.includes('relation "pdf_templates" does not exist')
      ) {
        console.log("   💡 Database migration needed! Run: ./run-pdf-migration.sh");
      }
    }
  } catch (error) {
    console.error("❌ Error testing PDF system:", error);
  }
}

// Run the test
testPdfSystem();
