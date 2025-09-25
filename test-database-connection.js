#!/usr/bin/env node

/**
 * Test script to verify database connection and notifications table
 */

async function testDatabaseConnection() {
  console.log("🧪 Testing Database Connection");
  console.log("==============================");

  try {
    // Test if we can reach the notifications API
    const response = await fetch("http://localhost:4321/api/notifications?limit=1", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    console.log("📊 Response Status:", response.status);
    console.log("📊 Response Data:", result);

    if (response.status === 401) {
      console.log("ℹ️  API requires authentication - this is expected");
    } else if (response.status === 503) {
      console.log("⚠️  Database migration required - run the SQL script");
    } else if (response.status === 200) {
      console.log("✅ Database connection successful");
    } else {
      console.log("❌ Unexpected response:", result);
    }
  } catch (error) {
    console.log("❌ Network Error:", error.message);
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabaseConnection().catch(console.error);
}

export { testDatabaseConnection };
