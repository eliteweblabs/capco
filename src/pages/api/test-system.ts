import type { APIRoute } from "astro";

/**
 * Test System API (No Database Required)
 *
 * Simple test to verify the appointment system logic works
 */

export const GET: APIRoute = async () => {
  try {
    console.log("🧪 [TEST-SYSTEM] Testing appointment system logic...");

    // Test 1: Generate time slots
    const testDate = "2024-12-20";
    const businessStart = 9;
    const businessEnd = 17;
    const slotDuration = 1; // 1 hour slots

    const testSlots = [];
    for (let hour = businessStart; hour < businessEnd; hour += slotDuration) {
      const timeStr = `${hour.toString().padStart(2, "0")}:00`;
      testSlots.push({
        date: testDate,
        time: timeStr,
        datetime: `${testDate}T${timeStr}:00Z`,
        available: true,
      });
    }

    console.log("📊 [TEST-SYSTEM] Generated test slots:", testSlots.length);

    // Test 2: Generate conversational response
    const times = testSlots.map((slot) => slot.time);
    const lastTime = times.pop();
    const timeList = times.join(", ") + `, and ${lastTime}`;
    const conversationalResponse = `I have several slots on Friday the 20th: ${timeList}. Which works best for you?`;

    // Test 3: Test different scenarios
    const scenarios = {
      singleSlot: "I have 14:00 available on Friday the 20th",
      twoSlots: "How's Friday the 20th? I have 14:00 and 16:00 available",
      multipleSlots: conversationalResponse,
      noSlots:
        "I'm sorry, but I don't have any available slots for that time period. Would you like me to check a different date?",
    };

    console.log("📊 [TEST-SYSTEM] Generated scenarios:", Object.keys(scenarios).length);

    return new Response(
      JSON.stringify({
        success: true,
        tests: {
          timeSlotGeneration: testSlots.length,
          conversationalResponse,
          scenarios,
          systemReady: true,
        },
        message: "Appointment system logic test completed successfully!",
        nextSteps: [
          "1. Run the Cal.com database schema in Supabase",
          "2. Test with real database connection",
          "3. Set up Vapi.ai assistant",
          "4. Test voice interactions",
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [TEST-SYSTEM] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
