#!/usr/bin/env node

/**
 * Test script for the admin notifications system
 * Tests the admin page functionality and API endpoints
 */

import fetch from "node-fetch";

const BASE_URL = process.env.BASE_URL || "http://localhost:4321";

async function testAdminNotifications() {
  console.log("🧪 Testing Admin Notifications System");
  console.log("=".repeat(50));

  try {
    // Test 1: Check if admin page is accessible
    console.log("1️⃣ Testing admin notifications page accessibility...");
    const pageResponse = await fetch(`${BASE_URL}/admin/notifications`);

    if (pageResponse.ok) {
      console.log("✅ Admin notifications page is accessible");
    } else {
      console.log(`❌ Admin notifications page returned ${pageResponse.status}`);
      return;
    }

    // Test 2: Test notification creation API
    console.log("\n2️⃣ Testing notification creation API...");

    const testNotification = {
      userId: "test-user-id",
      title: "Test Notification",
      message: "This is a test notification from the admin system",
      type: "info",
      priority: "normal",
    };

    const createResponse = await fetch(`${BASE_URL}/api/notifications/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testNotification),
    });

    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log("✅ Notification creation API works");
      console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
    } else {
      const error = await createResponse.text();
      console.log(`❌ Notification creation failed: ${error}`);
    }

    // Test 3: Test "all users" functionality
    console.log("\n3️⃣ Testing 'all users' notification...");

    const allUsersNotification = {
      allUsers: true,
      title: "System Announcement",
      message: "This is a system-wide notification",
      type: "info",
      priority: "normal",
    };

    const allUsersResponse = await fetch(`${BASE_URL}/api/notifications/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(allUsersNotification),
    });

    if (allUsersResponse.ok) {
      const result = await allUsersResponse.json();
      console.log("✅ 'All users' notification works");
      console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
    } else {
      const error = await allUsersResponse.text();
      console.log(`❌ 'All users' notification failed: ${error}`);
    }

    console.log("\n🎉 Admin notifications system test completed!");
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

// Run the test
testAdminNotifications();
