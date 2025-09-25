#!/usr/bin/env node

/**
 * Test script to create a notification and verify it appears
 */

async function testNotificationCreation() {
  console.log("🧪 Testing Notification Creation");
  console.log("=================================");

  // Test data
  const testPayload = {
    usersToNotify: ["test@example.com"], // Replace with a real email from your system
    emailType: "system_alert",
    emailSubject: "Test Notification",
    emailContent: "This is a test notification to verify the system is working.",
    projectId: 0,
    internalMessages: true, // Send as internal notification instead of email
  };

  console.log("📋 Test Payload:", JSON.stringify(testPayload, null, 2));

  try {
    const response = await fetch("http://localhost:4321/api/email-delivery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Notification creation successful:", result);
    } else {
      console.log("❌ Error creating notification:", result);
    }
  } catch (error) {
    console.log("❌ Network Error:", error.message);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testNotificationCreation().catch(console.error);
}

module.exports = { testNotificationCreation };
