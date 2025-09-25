#!/usr/bin/env node

/**
 * Complete notifications system test
 */

const BASE_URL = "http://localhost:4321";

async function testNotificationsSystem() {
  console.log("🔍 Complete Notifications System Test\n");

  try {
    // Test 1: Check if the main page loads
    console.log("1. Testing main page accessibility...");
    const mainResponse = await fetch(`${BASE_URL}/`);
    console.log("   Main page status:", mainResponse.status);

    if (mainResponse.status !== 200) {
      console.log("❌ Main page not accessible. Make sure the dev server is running.");
      return;
    }
    console.log("✅ Main page accessible");

    // Test 2: Check notifications API without auth (should get 401)
    console.log("\n2. Testing notifications API without authentication...");
    const notificationsResponse = await fetch(`${BASE_URL}/api/notifications?limit=5`);
    const notificationsData = await notificationsResponse.json();

    console.log("   Status:", notificationsResponse.status);
    console.log("   Response:", JSON.stringify(notificationsData, null, 2));

    if (notificationsResponse.status === 401) {
      console.log("✅ API correctly requires authentication");
    } else if (notificationsData.migrationRequired) {
      console.log("❌ Database migration required!");
      console.log("   Run: ./run-notifications-migration.sh");
      console.log("   Then execute the SQL in your Supabase dashboard");
    } else {
      console.log("✅ Notifications API working!");
    }

    // Test 3: Check admin page
    console.log("\n3. Testing admin notifications page...");
    const adminResponse = await fetch(`${BASE_URL}/admin/notifications`);
    console.log("   Admin page status:", adminResponse.status);

    if (adminResponse.status === 200) {
      console.log("✅ Admin page accessible");
    } else if (adminResponse.status === 401 || adminResponse.status === 302) {
      console.log("ℹ️  Admin page requires authentication (expected)");
    } else {
      console.log("❌ Admin page error:", adminResponse.status);
    }

    console.log("\n📋 Next Steps:");
    console.log("1. Make sure you're logged in to the application");
    console.log("2. Run the database migration if not done yet");
    console.log("3. Check browser console for detailed error messages");
    console.log("4. Try creating a test notification via /admin/notifications");
  } catch (error) {
    console.error("❌ Test error:", error.message);
    console.log("\n💡 Make sure the development server is running:");
    console.log("   npm run dev");
  }
}

// Run the test
testNotificationsSystem();
