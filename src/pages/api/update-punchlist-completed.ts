import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { currentUser, currentRole } = await checkAuth(cookies);
    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { punchlistId, mark_completed } = body;

    // Validate required fields
    if (!punchlistId || mark_completed === undefined) {
      return new Response(
        JSON.stringify({ error: "Punchlist ID and completion status are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔔 [UPDATE-PUNCHLIST-COMPLETED] Updating punchlist completion status:", {
      punchlistId,
      mark_completed,
      userId: currentUser.id,
      userRole: currentRole,
    });

    // First, check if user has permission to update this punchlist item
    const { data: punchlistItem, error: fetchError } = await supabase
      .from("punchlist")
      .select("author_id, project_id, message")
      .eq("id", punchlistId)
      .single();

    if (fetchError) {
      console.error("❌ [UPDATE-PUNCHLIST-COMPLETED] Error fetching punchlist item:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Punchlist item not found",
          details: fetchError.message,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check permissions - Admin/Staff can update any, Clients can only update their own
    const canUpdate =
      currentRole === "Admin" ||
      currentRole === "Staff" ||
      punchlistItem.author_id === currentUser.id;

    if (!canUpdate) {
      return new Response(
        JSON.stringify({
          error: "Permission denied - you can only update your own punchlist items",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update the punchlist item completion status
    const { data: updatedPunchlist, error: updateError } = await supabase
      .from("punchlist")
      .update({
        mark_completed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", punchlistId)
      .select("*")
      .single();

    if (updateError) {
      console.error("❌ [UPDATE-PUNCHLIST-COMPLETED] Database update error:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update punchlist completion status",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ [UPDATE-PUNCHLIST-COMPLETED] Punchlist completion status updated successfully");

    // Note: SimpleProjectLogger is client-side only, logging handled in frontend

    try {
      // Get discussion data from the local discussions array instead of querying Supabase
      const punchlistMessage = punchlistItem.message;

      if (!punchlistMessage) {
        console.error("Punchlist message not found:", punchlistMessage);
        // Continue with the response instead of returning
      }

      const adminContent = ` ${punchlistMessage} marked complete by ${currentUser.company_name}:<br><br>`;

      // THIS IS TO THE ADMINS EMAIL
      // Send email using the email delivery API
      const emailResponse = await fetch("/api/email-delivery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          usersToNotify: ["jk@capcofire.com", "capco@eliteweblabs.com"], // Use resolved user email
          emailSubject: `Punchlist Item Completed → ${punchlistMessage.message} → ${currentUser.company_name}`,
          emailContent: adminContent,
          buttonText: "Access Your Dashboard",
          buttonLink: "/dashboard",
        }),
      });

      if (emailResponse.ok) {
      } else {
        console.error(await emailResponse.text());
      }
    } catch (emailError) {
      console.error(emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        punchlist: updatedPunchlist,
        message: `Punchlist item marked as ${mark_completed ? "completed" : "incomplete"}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [UPDATE-PUNCHLIST-COMPLETED] Unexpected error:", error);
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
