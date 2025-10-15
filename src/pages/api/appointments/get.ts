import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Get Appointments API
 *
 * Retrieves appointments from your database
 * Works without external Cal.com API
 */

export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const startDate = url.searchParams.get("start");
    const endDate = url.searchParams.get("end");
    const status = url.searchParams.get("status");

    // Build query
    let query = supabaseAdmin!.from("appointments").select("*");

    if (startDate) {
      query = query.gte("startTime", startDate);
    }
    if (endDate) {
      query = query.lte("startTime", endDate);
    }
    if (status) {
      query = query.eq("status", status);
    }

    // Add user filtering based on role
    const { data: profile } = await supabaseAdmin!
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (profile?.role === "Client") {
      // Clients can only see their own appointments
      query = query.eq("organizerId", currentUser.id);
    }

    const { data: appointments, error } = await query.order("startTime", { ascending: true });

    if (error) {
      console.error("❌ [APPOINTMENTS-GET] Database error:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        appointments: appointments || [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [APPOINTMENTS-GET] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
