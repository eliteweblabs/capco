import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Newsletter Schedule API
 * Schedules a newsletter to be sent at a specific time
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { currentUser } = await checkAuth(cookies);

    // Check if user is admin
    if (!currentUser || currentUser.profile?.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id, scheduledFor } = await request.json();

    if (!id || !scheduledFor) {
      return new Response(
        JSON.stringify({ error: "Newsletter ID and scheduled time are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate scheduledFor is in the future
    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return new Response(JSON.stringify({ error: "Scheduled time must be in the future" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch newsletter to validate it exists and is sendable
    const { data: newsletter, error: fetchError } = await supabaseAdmin
      .from("newsletters")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !newsletter) {
      return new Response(JSON.stringify({ error: "Newsletter not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if newsletter is active and not draft
    if (!newsletter.isActive) {
      return new Response(JSON.stringify({ error: "Newsletter is not active" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (newsletter.isDraft) {
      return new Response(JSON.stringify({ error: "Cannot schedule draft newsletter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update newsletter with schedule
    const { data: updatedNewsletter, error: updateError } = await supabaseAdmin
      .from("newsletters")
      .update({
        isScheduled: true,
        scheduledFor: scheduledDate.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ [NEWSLETTER-SCHEDULE] Error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to schedule newsletter", details: updateError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Newsletter scheduled for ${scheduledDate.toLocaleString()}`,
        data: updatedNewsletter,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [NEWSLETTER-SCHEDULE] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
