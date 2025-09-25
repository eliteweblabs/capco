#!/usr/bin/env node

/**
 * Test script for the enhanced get-project API with document data
 * Tests both single project and multiple projects endpoints
 */

import fetch from "node-fetch";

const BASE_URL = process.env.BASE_URL || "http://localhost:4321";

async function testProjectDocuments() {
  console.log("🧪 Testing Get Project API with Document Data");
  console.log("=".repeat(50));

  try {
    // Test 1: Single project with document data
    console.log("1️⃣ Testing single project with document data...");
    const singleProjectResponse = await fetch(`${BASE_URL}/api/get-project?id=1`);

    if (singleProjectResponse.ok) {
      const data = await singleProjectResponse.json();
      console.log("✅ Single project API works");
      console.log(`   Project: ${data.project?.title || "N/A"}`);
      console.log(`   Files: ${data.projectFiles?.length || 0} files`);
      console.log(`   Generated Documents: ${data.generatedDocuments?.length || 0} documents`);

      if (data.projectFiles && data.projectFiles.length > 0) {
        console.log("   Sample file:", {
          name: data.projectFiles[0].file_name,
          type: data.projectFiles[0].file_type,
          size: data.projectFiles[0].file_size,
        });
      }
    } else {
      console.log(`❌ Single project API returned ${singleProjectResponse.status}`);
    }

    // Test 2: Multiple projects with full document data
    console.log("\n2️⃣ Testing multiple projects with full document data...");
    const multipleProjectsResponse = await fetch(`${BASE_URL}/api/get-project?limit=5`);

    if (multipleProjectsResponse.ok) {
      const data = await multipleProjectsResponse.json();
      console.log("✅ Multiple projects API works");
      console.log(`   Projects returned: ${data.projects?.length || 0}`);

      if (data.projects && data.projects.length > 0) {
        const sampleProject = data.projects[0];
        console.log("   Sample project with full document data:", {
          title: sampleProject.title,
          files: sampleProject.projectFiles?.length || 0,
          generated_documents: sampleProject.generatedDocuments?.length || 0,
        });

        if (sampleProject.projectFiles && sampleProject.projectFiles.length > 0) {
          console.log("   Sample file:", {
            name: sampleProject.projectFiles[0].file_name,
            type: sampleProject.projectFiles[0].file_type,
            size: sampleProject.projectFiles[0].file_size,
          });
        }
      }
    } else {
      console.log(`❌ Multiple projects API returned ${multipleProjectsResponse.status}`);
    }

    // Test 3: Test with specific project ID
    console.log("\n3️⃣ Testing with specific project ID...");
    const specificProjectResponse = await fetch(`${BASE_URL}/api/get-project?id=2`);

    if (specificProjectResponse.ok) {
      const data = await specificProjectResponse.json();
      console.log("✅ Specific project API works");
      console.log(`   Project ID: ${data.project?.id}`);
      console.log(`   Files: ${data.projectFiles?.length || 0}`);
      console.log(`   Generated Documents: ${data.generatedDocuments?.length || 0}`);
    } else {
      console.log(`❌ Specific project API returned ${specificProjectResponse.status}`);
    }

    console.log("\n🎉 Project documents API test completed!");
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

// Run the test
testProjectDocuments();
