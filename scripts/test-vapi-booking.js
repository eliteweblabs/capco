/**
 * Test script for VAPI booking integration
 *
 * This script tests the Cal.com integration endpoints directly
 */

import fetch from "node-fetch";

const SITE_URL = process.env.SITE_URL || "http://localhost:4321";

async function testAvailability() {
  console.log("\n🧪 Testing availability check...");

  const dateFrom = new Date().toISOString();
  const dateTo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  console.log("📅 Date range:", { dateFrom, dateTo });

  const response = await fetch(`${SITE_URL}/api/vapi/cal-integration`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "get_availability",
      dateFrom,
      dateTo,
    }),
  });

  const result = await response.json();
  console.log("✅ Availability response:", JSON.stringify(result, null, 2));

  if (!result.result) {
    throw new Error("No result message in response");
  }

  return result;
}

async function testBooking(startTime) {
  console.log("\n🧪 Testing booking creation...");

  const response = await fetch(`${SITE_URL}/api/vapi/cal-integration`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "create_booking",
      start: startTime,
      name: "Test User",
      email: "test@example.com",
    }),
  });

  const result = await response.json();
  console.log("✅ Booking response:", JSON.stringify(result, null, 2));

  if (!result.result) {
    throw new Error("No result message in response");
  }

  return result;
}

async function main() {
  try {
    console.log("🚀 Starting VAPI booking integration tests...");
    console.log("🌐 Testing against:", SITE_URL);

    // Test availability
    const availabilityResult = await testAvailability();

    // Get the first available slot
    const nextSlot = availabilityResult.nextAvailable;

    if (!nextSlot) {
      console.error("❌ No available slots found");
      process.exit(1);
    }

    console.log("\n📍 Next available slot:", nextSlot);

    // Test booking with that slot
    const bookingResult = await testBooking(nextSlot);

    console.log("\n✅ All tests passed!");
    console.log("\n📋 Summary:");
    console.log("- Availability check: ✅");
    console.log("- Booking creation: ✅");
    console.log("\n🎉 Integration is working correctly!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

main();
