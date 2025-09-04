#!/usr/bin/env node

/**
 * Test script for the email webhook endpoint
 * This script sends test data to your email webhook to verify it's working
 */

const fetch = require("node-fetch");

// Configuration
const WEBHOOK_URL = "http://localhost:4321/api/email-webhook";

// Test emails in different webhook formats
// The webhook endpoint automatically detects and parses these formats
const TEST_EMAILS = [
  {
    name: "Basic Project Request (SendGrid Format)",
    data: {
      from: "client@example.com",
      to: "projects@capcofire.com",
      subject: "New Fire Protection Project - 123 Main Street",
      text: `Address: 123 Main Street, Anytown, CA 90210
Square Footage: 5,000 sq ft
New Construction: Yes

Project Description:
We need a complete fire protection system for our new office building. The project includes retail space on the first floor and offices on the second floor.

Please let us know what documents you need from us to get started.`,
      body_plain: `Address: 123 Main Street, Anytown, CA 90210
Square Footage: 5,000 sq ft
New Construction: Yes

Project Description:
We need a complete fire protection system for our new office building. The project includes retail space on the first floor and offices on the second floor.

Please let us know what documents you need from us to get started.`,
      attachments: [],
    },
  },
  {
    name: "Complex Project with Attachments",
    data: {
      from: "architect@designfirm.com",
      to: "projects@capcofire.com",
      subject: "Fire Protection System Design - Downtown Office Complex",
      text: `Address: 456 Business Blvd, Downtown, CA 90211
Square Footage: 25,000 sq ft
New Construction: No (Renovation)
Building Type: Commercial Office
Project Type: Sprinkler System Upgrade

We are renovating an existing office building and need to upgrade the fire protection system to meet current code requirements. The building currently has a basic sprinkler system that needs to be enhanced.

Please review the attached architectural drawings and let us know if you need any additional information.`,
      attachments: [
        {
          filename: "architectural-drawings.pdf",
          content: "JVBERi0xLjQKJcOkw7zDtsO...", // Base64 encoded PDF content
          contentType: "application/pdf",
        },
        {
          filename: "project-specs.docx",
          content: "UEsDBBQAAAAIAA...", // Base64 encoded DOCX content
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      ],
    },
  },
  {
    name: "Minimal Information",
    data: {
      from: "simple@client.com",
      to: "projects@capcofire.com",
      subject: "Need Fire Protection",
      text: "We need fire protection for our building. Please contact us.",
      attachments: [],
    },
  },
  {
    name: "Structured Placeholders (Recommended Format)",
    data: {
      from: "admin@company.com",
      to: "projects@capcofire.com",
      subject: "New Construction Project",
      text: `{{PROJECT_ADDRESS: 789 Innovation Drive, Tech City, CA 90212}}
{{PROJECT_SQFT: 15000}}
{{PROJECT_TYPE: New Construction}}

Additional project details:
This is a new office building with multiple floors. We need a comprehensive fire protection system including sprinklers, alarms, and emergency lighting.

Please review and let us know what additional information you need.`,
      attachments: [
        {
          filename: "building-plans.pdf",
          content: "JVBERi0xLjQKJcOkw7zDtsO...", // Base64 encoded PDF content
          contentType: "application/pdf",
        },
      ],
    },
  },
];

async function testWebhook(testName, testData) {
  try {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log("📧 Sending data to webhook...");

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Email-Webhook-Test/1.0",
      },
      body: JSON.stringify(testData),
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText };
    }

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      console.log("✅ Success!");
      if (responseData.projectId) {
        console.log(`🏗️ Project created with ID: ${responseData.projectId}`);
      }
      if (responseData.message) {
        console.log(`💬 Message: ${responseData.message}`);
      }
    } else {
      console.log("❌ Failed!");
      if (responseData.error) {
        console.log(`🚨 Error: ${responseData.error}`);
      }
      if (responseData.raw) {
        console.log(`📝 Raw response: ${responseData.raw}`);
      }
    }

    return { success: response.ok, data: responseData };
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log("🚀 Starting Email Webhook Tests");
  console.log("=".repeat(50));

  const results = [];

  for (const test of TEST_EMAILS) {
    const result = await testWebhook(test.name, test.data);
    results.push({ name: test.name, ...result });

    // Wait a bit between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log("\n📊 Test Summary");
  console.log("=".repeat(50));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / results.length) * 100)}%`);

  if (failed > 0) {
    console.log("\n🚨 Failed Tests:");
    results
      .filter((r) => !r.success)
      .forEach((result) => {
        console.log(`   • ${result.name}: ${result.error || "Unknown error"}`);
      });
  }

  if (passed === results.length) {
    console.log("\n🎉 All tests passed! Your email webhook is working correctly.");
  } else {
    console.log("\n⚠️  Some tests failed. Check the logs above for details.");
  }
}

// Check if webhook URL is accessible
async function checkWebhookHealth() {
  try {
    console.log("🏥 Checking webhook health...");
    const response = await fetch(WEBHOOK_URL, { method: "GET" });
    console.log(`📡 Webhook endpoint status: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ Cannot reach webhook endpoint: ${error.message}`);
    console.log("💡 Make sure your Astro dev server is running on port 4321");
    return false;
  }
}

// Main execution
async function main() {
  const isHealthy = await checkWebhookHealth();

  if (!isHealthy) {
    console.log("\n💡 To fix this:");
    console.log("   1. Start your Astro dev server: npm run dev");
    console.log("   2. Make sure the email-webhook.ts file is in src/pages/api/");
    console.log("   3. Run this test script again");
    process.exit(1);
  }

  await runAllTests();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testWebhook, runAllTests };
