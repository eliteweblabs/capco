import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request }): Promise<Response> => {
  try {
    const body = await request.json();
    const { notificationIds, userId } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return new Response(JSON.stringify({ error: "notificationIds array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mark notifications as viewed
    const { data, error } = await supabase
      .from("notifications")
      .update({ viewed: true })
      .in("id", notificationIds)
      .eq("user_id", userId)
      .select();

    if (error) {
      console.error("❌ [NOTIFICATIONS] Error marking notifications as viewed:", error);
      return new Response(JSON.stringify({ error: "Failed to mark notifications as viewed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `✅ [NOTIFICATIONS] Marked ${data?.length || 0} notifications as viewed for user ${userId}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        updatedCount: data?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [NOTIFICATIONS] Error in mark viewed API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
