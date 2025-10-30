/**
 * Test Script for Internal Appointment System
 *
 * Tests the internal appointment system without external Cal.com API
 */

import fetch from "node-fetch";

// Configuration
const RAILWAY_PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN || "http://localhost:4321";

// Test data
const testAppointment = {
  title: "Test Appointment",
  description: "This is a test appointment",
  startTime: "2024-12-20T10:00:00Z",
  endTime: "2024-12-20T11:00:00Z",
  location: "Test Location",
  attendees: [
    {
      email: "test@example.com",
      name: "Test User",
      timeZone: "UTC",
    },
  ],
};

async function testInternalAppointments() {
  console.log("🧪 Testing Internal Appointment System...");

  try {
    // Test creating an appointment
    console.log("📝 Creating test appointment...");
    const createResponse = await fetch(`${RAILWAY_PUBLIC_DOMAIN}/api/appointments/upsert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Note: You'll need to add authentication cookies here
      },
      body: JSON.stringify(testAppointment),
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log("✅ Appointment created:", createData.appointment?.id);

      // Test reading appointments
      console.log("📖 Reading appointments...");
      const readResponse = await fetch(`${RAILWAY_PUBLIC_DOMAIN}/api/appointments/get`, {
        headers: {
          // Note: You'll need to add authentication cookies here
        },
      });

      if (readResponse.ok) {
        const readData = await readResponse.json();
        console.log("✅ Appointments read:", readData.appointments?.length || 0);
      } else {
        console.log("❌ Failed to read appointments:", readResponse.status);
      }
    } else {
      console.log("❌ Failed to create appointment:", createResponse.status);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

async function testVapiAppointments() {
  console.log("🤖 Testing Vapi.ai Appointments Integration...");

  try {
    // Test Vapi.ai appointment read
    const vapiResponse = await fetch(`${RAILWAY_PUBLIC_DOMAIN}/api/vapi/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Note: You'll need to add authentication cookies here
      },
      body: JSON.stringify({
        type: "appointment",
        action: "read",
      }),
    });

    if (vapiResponse.ok) {
      const vapiData = await vapiResponse.json();
      console.log("✅ Vapi.ai appointments integration working");
    } else {
      console.log("❌ Vapi.ai integration failed:", vapiResponse.status);
    }
  } catch (error) {
    console.error("❌ Vapi.ai test failed:", error.message);
  }
}

async function testAvailability() {
  console.log("📅 Testing Appointment Availability...");

  try {
    // Test availability API
    const availabilityResponse = await fetch(
      `${RAILWAY_PUBLIC_DOMAIN}/api/appointments/availability`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Note: You'll need to add authentication cookies here
        },
        body: JSON.stringify({
          date: "2024-12-20", // Test specific date
          duration: 60,
        }),
      }
    );

    if (availabilityResponse.ok) {
      const availabilityData = await availabilityResponse.json();
      console.log("✅ Availability API working");
      console.log("📝 Conversational response:", availabilityData.conversationalResponse);
      console.log("⏰ Available slots:", availabilityData.availableSlots?.length || 0);
    } else {
      console.log("❌ Availability API failed:", availabilityResponse.status);
    }
  } catch (error) {
    console.error("❌ Availability test failed:", error.message);
  }
}

async function runAllTests() {
  console.log("🚀 Starting Internal Appointment System Tests");
  console.log("=".repeat(50));

  await testInternalAppointments();
  await testVapiAppointments();
  await testAvailability();

  console.log("=".repeat(50));
  console.log("✅ Internal appointment system tests completed!");
  console.log("");
  console.log("📋 Next steps:");
  console.log("1. Add authentication cookies to the test requests");
  console.log("2. Run the Cal.com database schema in Supabase");
  console.log("3. Test with real Vapi.ai webhook calls");
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(() => {
    process.exit(0);
  });
}

export { testInternalAppointments, testVapiAppointments, testAvailability, runAllTests };
