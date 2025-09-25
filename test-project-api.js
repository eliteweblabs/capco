#!/usr/bin/env node

/**
 * Test script for the project API endpoint
 * This script tests if the get-project API is working
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4321";

async function testProjectAPI() {
  console.log("🧪 Testing Project API\n");

  try {
    // Test 1: Check if the API endpoint exists
    console.log("1. Testing project API endpoint...");
    const response = await fetch(`${BASE_URL}/api/get-project?id=1`);
    console.log("   Response status:", response.status);
    console.log("   Response headers:", Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log("   API Response:", data);

      if (data.success) {
        console.log("   ✅ Project API is working");
        console.log("   📄 Project title:", data.project?.title);
        console.log("   👤 Author:", data.projectAuthor?.company_name);
      } else {
        console.log("   ❌ API returned error:", data.error);
      }
    } else {
      console.log("   ❌ API request failed");
      const errorText = await response.text();
      console.log("   Error response:", errorText);
    }
  } catch (error) {
    console.error("❌ Error testing project API:", error);
  }
}

// Run the test
testProjectAPI();
