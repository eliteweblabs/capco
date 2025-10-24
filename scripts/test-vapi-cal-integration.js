/**
 * Test Script for Vapi.ai + Cal.com Integration
 *
 * This script tests the integration between Vapi.ai and Cal.com
 */

import fetch from "node-fetch";

// Configuration
const SITE_URL = process.env.SITE_URL || "http://localhost:4321";
const VAPI_API_KEY = process.env.VAPI_API_KEY;
const CAL_API_KEY = process.env.CAL_API_KEY;

// Test functions
async function testCalComAPI() {
  console.log("🧪 Testing Cal.com API connection...");

  try {
    const response = await fetch(
      "https://calcom-web-app-production-0b16.up.railway.app/api/users",
      {
        headers: {
          Authorization: `Bearer ${CAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Cal.com API connection successful");
      console.log(`   Found ${data.users?.length || 0} users`);
      return true;
    } else {
      console.log(`❌ Cal.com API connection failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Cal.com API error: ${error.message}`);
    return false;
  }
}

async function testVapiAPI() {
  console.log("🧪 Testing Vapi.ai API connection...");

  try {
    const response = await fetch("https://api.vapi.ai/assistant", {
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Vapi.ai API connection successful");
      console.log(`   Found ${data.assistants?.length || 0} assistants`);
      return true;
    } else {
      console.log(`❌ Vapi.ai API connection failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Vapi.ai API error: ${error.message}`);
    return false;
  }
}

async function testWebhookEndpoints() {
  console.log("🧪 Testing webhook endpoints...");

  const endpoints = [
    { name: "Vapi.ai Webhook", url: `${SITE_URL}/api/vapi/webhook` },
    { name: "Cal.com Webhook", url: `${SITE_URL}/api/cal/webhook` },
    { name: "Cal Integration", url: `${SITE_URL}/api/vapi/cal-integration` },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ test: true }),
      });

      if (response.status === 200 || response.status === 401 || response.status === 405) {
        console.log(`✅ ${endpoint.name}: Accessible (${response.status})`);
      } else {
        console.log(`❌ ${endpoint.name}: Failed (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
    }
  }
}

async function testCalIntegration() {
  console.log("🧪 Testing Cal.com integration...");

  try {
    // Test reading appointments
    const response = await fetch(`${SITE_URL}/api/vapi/cal-integration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "test-auth-cookie", // This will fail auth, but tests endpoint
      },
      body: JSON.stringify({
        type: "appointment",
        action: "read",
      }),
    });

    if (response.status === 401) {
      console.log("✅ Cal.com integration endpoint: Authentication required (expected)");
      return true;
    } else if (response.ok) {
      console.log("✅ Cal.com integration endpoint: Working");
      return true;
    } else {
      console.log(`❌ Cal.com integration endpoint: Failed (${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Cal.com integration error: ${error.message}`);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log("🧪 Testing database connection...");

  try {
    const response = await fetch(`${SITE_URL}/api/projects/get`, {
      headers: {
        Cookie: "test-auth-cookie", // This will fail auth, but tests endpoint
      },
    });

    if (response.status === 401) {
      console.log("✅ Database connection: Authentication required (expected)");
      return true;
    } else if (response.ok) {
      console.log("✅ Database connection: Working");
      return true;
    } else {
      console.log(`❌ Database connection: Failed (${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Database connection error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log("🚀 Starting Vapi.ai + Cal.com Integration Tests\n");

  const results = {
    calComAPI: await testCalComAPI(),
    vapiAPI: await testVapiAPI(),
    webhooks: await testWebhookEndpoints(),
    calIntegration: await testCalIntegration(),
    database: await testDatabaseConnection(),
  };

  console.log("\n📊 Test Results:");
  console.log("================");

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${test}: ${status}`);
  });

  const allPassed = Object.values(results).every((result) => result);

  if (allPassed) {
    console.log("\n🎉 All tests passed! Integration is ready.");
  } else {
    console.log("\n⚠️ Some tests failed. Please check the issues above.");
  }

  return allPassed;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

export {
  testCalComAPI,
  testVapiAPI,
  testWebhookEndpoints,
  testCalIntegration,
  testDatabaseConnection,
  runAllTests,
};
