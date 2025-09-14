import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { date } = body;

    if (!date) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Date is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!supabaseAdmin) {
      console.error("Supabase admin client not initialized");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get bookings for the specified date
    const { data: bookings, error } = await supabaseAdmin
      .from("demo_bookings")
      .select("preferred_time, status")
      .eq("preferred_date", date)
      .in("status", ["pending", "confirmed"]); // Only get active bookings

    if (error) {
      console.error("Error fetching demo bookings:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch bookings",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Extract booked time slots
    const bookedTimes = bookings?.map((booking) => booking.preferred_time) || [];

    return new Response(
      JSON.stringify({
        success: true,
        bookedTimes,
        count: bookedTimes.length,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Get demo bookings API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

// Handle OPTIONS request for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
