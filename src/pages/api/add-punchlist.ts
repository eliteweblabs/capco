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
    const { projectId, message, internal = false, parentId = null } = body;

    // Validate required fields
    if (!projectId || !message) {
      return new Response(JSON.stringify({ error: "Project ID and message are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // console.log("🔔 [ADD-PUNCHLIST] Adding punchlist item:", {
      projectId,
      message: message.substring(0, 50) + "...",
      internal,
      parentId,
      userId: currentUser.id,
    });

    // Get user profile for company_name
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, first_name, last_name")
      .eq("id", currentUser.id)
      .single();

    const companyName =
      profile?.company_name ||
      (profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : "Unknown User");

    // Insert punchlist item
    const { data: punchlistData, error: punchlistError } = await supabase
      .from("punchlist")
      .insert({
        project_id: projectId,
        author_id: currentUser.id,
        message,
        internal,
        parent_id: parentId,
        company_name: companyName,
      })
      .select("*")
      .single();

    if (punchlistError) {
      console.error("❌ [ADD-PUNCHLIST] Database error:", punchlistError);
      return new Response(
        JSON.stringify({
          error: "Failed to create punchlist item",
          details: punchlistError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // console.log("✅ [ADD-PUNCHLIST] Punchlist item created successfully:", punchlistData.id);

    // Log the punchlist item creation
    if (typeof window !== "undefined" && window.SimpleProjectLogger) {
      window.SimpleProjectLogger.logPunchlistAdd(
        projectId,
        punchlistData.id,
        currentUser,
        message.substring(0, 50) + "..."
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        punchlist: punchlistData,
        message: "Punchlist item created successfully",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [ADD-PUNCHLIST] Unexpected error:", error);
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
