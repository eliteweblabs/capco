// Test script for PDF generation system
// Run this with: node test-pdf-generation.js

const testPDFGeneration = async () => {
  const baseUrl = "http://localhost:4321";

  console.log("🧪 Testing PDF Generation System...\n");

  try {
    // Test 1: Fetch templates
    console.log("1. Testing template fetching...");
    const templatesResponse = await fetch(`${baseUrl}/api/pdf/templates`);
    const templatesResult = await templatesResponse.json();

    if (templatesResult.success) {
      console.log(`✅ Found ${templatesResult.templates.length} templates`);
      templatesResult.templates.forEach((template) => {
        console.log(`   - ${template.name} (ID: ${template.id})`);
      });
    } else {
      console.log("❌ Failed to fetch templates:", templatesResult.message);
    }

    // Test 2: Fetch components
    console.log("\n2. Testing component fetching...");
    const componentsResponse = await fetch(`${baseUrl}/api/pdf/components`);
    const componentsResult = await componentsResponse.json();

    if (componentsResult.success) {
      console.log(`✅ Found ${componentsResult.components.length} components`);
      componentsResult.components.forEach((component) => {
        console.log(`   - ${component.name} (${component.component_type})`);
      });
    } else {
      console.log("❌ Failed to fetch components:", componentsResult.message);
    }

    // Test 3: Fetch project data (assuming project ID 1 exists)
    console.log("\n3. Testing project data fetching...");
    const dataResponse = await fetch(`${baseUrl}/api/pdf/data?projectId=1`);
    const dataResult = await dataResponse.json();

    if (dataResult.success) {
      console.log("✅ Successfully fetched project data");
      console.log(`   - Project: ${dataResult.data.project.title}`);
      console.log(`   - Client: ${dataResult.data.placeholders.CLIENT_NAME}`);
      console.log(`   - Address: ${dataResult.data.placeholders.PROJECT_ADDRESS}`);
      console.log(`   - Status: ${dataResult.data.placeholders.STATUS_NAME}`);
    } else {
      console.log("❌ Failed to fetch project data:", dataResult.message);
    }

    // Test 4: Test PDF generation (if we have templates and project data)
    if (templatesResult.success && templatesResult.templates.length > 0 && dataResult.success) {
      console.log("\n4. Testing PDF generation...");

      const generateResponse = await fetch(`${baseUrl}/api/pdf/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: "1",
          templateId: templatesResult.templates[0].id,
          documentName: "Test Document",
          selectedComponents: componentsResult.success
            ? componentsResult.components.slice(0, 2).map((c) => c.id)
            : [],
        }),
      });

      const generateResult = await generateResponse.json();

      if (generateResult.success) {
        console.log("✅ Successfully generated PDF document");
        console.log(`   - Document ID: ${generateResult.document.id}`);
        console.log(`   - Document Name: ${generateResult.document.name}`);
        console.log(`   - File Path: ${generateResult.document.filePath}`);
        console.log(`   - Components Used: ${generateResult.document.components.length}`);
      } else {
        console.log("❌ Failed to generate PDF:", generateResult.message);
      }
    } else {
      console.log("\n4. Skipping PDF generation test (missing templates or project data)");
    }

    console.log("\n🎉 PDF Generation System Test Complete!");
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
};

// Run the test
testPDFGeneration();
