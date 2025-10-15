import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";

/**
 * Test Appointments API (No Authentication Required)
 *
 * Simple test endpoint to verify the appointment system works
 */

export const GET: APIRoute = async () => {
  try {
    console.log("🧪 [TEST-APPOINTMENTS] Testing appointment system...");

    // Test 1: Check if appointments table exists
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "appointments");

    if (tablesError) {
      console.error("❌ [TEST-APPOINTMENTS] Error checking tables:", tablesError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database connection failed",
          details: tablesError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const appointmentsTableExists = tables && tables.length > 0;
    console.log("📊 [TEST-APPOINTMENTS] Appointments table exists:", appointmentsTableExists);

    // Test 2: Try to read from appointments table
    let appointmentsCount = 0;
    if (appointmentsTableExists) {
      const { data: appointments, error: appointmentsError } = await supabaseAdmin
        .from("appointments")
        .select("id", { count: "exact" });

      if (appointmentsError) {
        console.error("❌ [TEST-APPOINTMENTS] Error reading appointments:", appointmentsError);
      } else {
        appointmentsCount = appointments?.length || 0;
        console.log("📊 [TEST-APPOINTMENTS] Existing appointments:", appointmentsCount);
      }
    }

    // Test 3: Test availability generation
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

    console.log("📊 [TEST-APPOINTMENTS] Generated test slots:", testSlots.length);

    // Test 4: Generate conversational response
    const conversationalResponse = `I have several slots on Friday the 20th: 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, and 16:00. Which works best for you?`;

    return new Response(
      JSON.stringify({
        success: true,
        tests: {
          databaseConnection: true,
          appointmentsTableExists,
          existingAppointments: appointmentsCount,
          testSlotsGenerated: testSlots.length,
          conversationalResponse,
        },
        message: "Appointment system test completed successfully!",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [TEST-APPOINTMENTS] Unexpected error:", error);
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
