#!/usr/bin/env node

/**
 * Test script for the standalone notification system
 * This script tests the notification API endpoints
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4321";

async function testNotificationSystem() {
  console.log("🧪 Testing Standalone Notification System\n");

  try {
    // Test 1: Create a notification with userEmail
    console.log("1. Testing notification creation with userEmail...");
    const createResponse = await fetch(`${BASE_URL}/api/notifications/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userEmail: "test@example.com", // Replace with a real email from your database
        title: "Test Notification",
        message: "This is a test notification from the standalone system",
        type: "info",
        priority: "normal",
        actionUrl: "/dashboard",
        actionText: "Go to Dashboard",
      }),
    });

    const createResult = await createResponse.json();
    console.log("   Create Response:", createResult);

    if (createResult.success) {
      console.log("   ✅ Notification created successfully");

      // Test 2: Fetch notifications
      console.log("\n2. Testing notification fetching...");
      const fetchResponse = await fetch(
        `${BASE_URL}/api/notifications/fetch?userId=${createResult.notification.user_id}&limit=10`
      );
      const fetchResult = await fetchResponse.json();
      console.log("   Fetch Response:", fetchResult);

      if (fetchResult.success) {
        console.log("   ✅ Notifications fetched successfully");

        // Test 3: Mark notifications as viewed
        if (fetchResult.notifications.length > 0) {
          console.log("\n3. Testing mark as viewed...");
          const markViewedResponse = await fetch(`${BASE_URL}/api/notifications/mark-viewed`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: createResult.notification.user_id,
              notificationIds: [createResult.notification.id],
            }),
          });

          const markViewedResult = await markViewedResponse.json();
          console.log("   Mark Viewed Response:", markViewedResult);

          if (markViewedResult.success) {
            console.log("   ✅ Notifications marked as viewed successfully");
          } else {
            console.log("   ❌ Failed to mark notifications as viewed");
          }
        }
      } else {
        console.log("   ❌ Failed to fetch notifications");
      }
    } else {
      console.log("   ❌ Failed to create notification");
    }
  } catch (error) {
    console.error("❌ Error testing notification system:", error);
  }
}

// Run the test
testNotificationSystem();
