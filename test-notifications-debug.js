#!/usr/bin/env node

/**
 * Debug script to test notifications system
 */

const BASE_URL = "http://localhost:4321";

async function testNotificationsAPI() {
  console.log("🔍 Testing Notifications API...\n");

  try {
    // Test the main notifications endpoint
    console.log("1. Testing /api/notifications endpoint...");
    const response = await fetch(`${BASE_URL}/api/notifications?limit=5`);
    const data = await response.json();

    console.log("   Status:", response.status);
    console.log("   Response:", JSON.stringify(data, null, 2));

    if (data.migrationRequired) {
      console.log("\n❌ Database migration required!");
      console.log("   Run: ./run-notifications-migration.sh");
      console.log("   Then execute the SQL in your Supabase dashboard");
    } else if (data.success) {
      console.log("✅ Notifications API working!");
      console.log(`   Found ${data.notifications?.length || 0} notifications`);
    } else {
      console.log("❌ API Error:", data.error);
    }
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

// Run the test
testNotificationsAPI();
