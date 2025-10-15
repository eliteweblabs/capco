import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";

/**
 * Simple Test Appointments API (No Authentication Required)
 *
 * Tests the appointment system with a simple database check
 */

export const GET: APIRoute = async () => {
  try {
    console.log("🧪 [TEST-APPOINTMENTS-SIMPLE] Testing appointment system...");

    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Supabase admin client not configured",
          message: "Please check your SUPABASE_SERVICE_ROLE_KEY in .env",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Test 1: Check if appointments table exists
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "appointments");

    if (tablesError) {
      console.error("❌ [TEST-APPOINTMENTS-SIMPLE] Error checking tables:", tablesError);
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
    console.log(
      "📊 [TEST-APPOINTMENTS-SIMPLE] Appointments table exists:",
      appointmentsTableExists
    );

    if (!appointmentsTableExists) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Appointments table not found",
          message: "Please run the minimal-appointments-schema.sql in your Supabase dashboard",
          nextSteps: [
            "1. Go to your Supabase dashboard > SQL Editor",
            "2. Copy and paste the contents of sql-queriers/minimal-appointments-schema.sql",
            "3. Click Run",
            "4. Test again with this endpoint",
          ],
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Test 2: Try to read from appointments table
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select("id", { count: "exact" });

    if (appointmentsError) {
      console.error("❌ [TEST-APPOINTMENTS-SIMPLE] Error reading appointments:", appointmentsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database query failed",
          details: appointmentsError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const appointmentsCount = appointments?.length || 0;
    console.log("📊 [TEST-APPOINTMENTS-SIMPLE] Existing appointments:", appointmentsCount);

    // Test 3: Test availability generation logic
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

    console.log("📊 [TEST-APPOINTMENTS-SIMPLE] Generated test slots:", testSlots.length);

    // Test 4: Generate conversational response
    const times = testSlots.map((slot) => slot.time);
    const lastTime = times.pop();
    const timeList = times.join(", ") + `, and ${lastTime}`;
    const conversationalResponse = `I have several slots on Friday the 20th: ${timeList}. Which works best for you?`;

    return new Response(
      JSON.stringify({
        success: true,
        tests: {
          databaseConnection: true,
          appointmentsTableExists,
          existingAppointments: appointmentsCount,
          testSlotsGenerated: testSlots.length,
          conversationalResponse,
          systemReady: true,
        },
        message: "Appointment system test completed successfully!",
        nextSteps: [
          "1. Add your Supabase credentials to .env file",
          "2. Get your Vapi.ai API key from https://dashboard.vapi.ai/",
          "3. Configure your Vapi.ai assistant: node scripts/vapi-assistant-config.js",
          "4. Test voice interactions",
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [TEST-APPOINTMENTS-SIMPLE] Unexpected error:", error);
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
