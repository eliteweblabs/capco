#!/usr/bin/env node

/**
 * Test script for the new internal messaging system
 * This script demonstrates how to use the conditional messaging features
 */

const testCases = [
  {
    name: "Default Behavior - Send Emails to Everyone",
    payload: {
      usersToNotify: ["admin@example.com", "client@example.com"],
      emailType: "proposal_submitted",
      emailSubject: "New Proposal Submitted",
      emailContent: "A new proposal has been submitted for your project.",
      projectId: 123,
    },
  },
  {
    name: "Internal Messages to Everyone",
    payload: {
      usersToNotify: ["admin@example.com", "client@example.com"],
      emailType: "proposal_submitted",
      emailSubject: "New Proposal Submitted",
      emailContent: "A new proposal has been submitted for your project.",
      projectId: 123,
      internalMessages: true,
    },
  },
  {
    name: "System Alert - Internal to Everyone",
    payload: {
      usersToNotify: ["admin@example.com", "client@example.com"],
      emailType: "system_alert",
      emailSubject: "System Maintenance",
      emailContent: "System will be down for maintenance from 2-4 AM EST.",
      projectId: 0,
      internalMessages: true,
    },
  },
];

async function testInternalMessaging() {
  console.log("🧪 Testing Internal Messaging System");
  console.log("=====================================");

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log("Payload:", JSON.stringify(testCase.payload, null, 2));

    try {
      const response = await fetch("http://localhost:4321/api/email-delivery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testCase.payload),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Success:", result);
      } else {
        console.log("❌ Error:", result);
      }
    } catch (error) {
      console.log("❌ Network Error:", error.message);
    }

    console.log("---");
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testInternalMessaging().catch(console.error);
}

module.exports = { testInternalMessaging, testCases };
