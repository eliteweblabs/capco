import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async ({ request, cookies }): Promise<Response> => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("❌ [NOTIFICATIONS] Error fetching notifications:", error);

      // Check if the error is due to table not existing
      if (error.message && error.message.includes('relation "notifications" does not exist')) {
        return new Response(
          JSON.stringify({
            error: "Notifications table not found. Please run the database migration.",
            migrationRequired: true,
            instructions: [
              "1. Go to your Supabase dashboard",
              "2. Navigate to SQL Editor",
              "3. Run the SQL script from: sql-queriers/create-notifications-table.sql",
            ],
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ error: "Failed to fetch notifications" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications: data || [],
        count: data?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [NOTIFICATIONS] Error in fetch notifications API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
