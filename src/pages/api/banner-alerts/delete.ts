import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Banner Alerts DELETE API
 *
 * DELETE /api/banner-alerts/delete?id=123
 * or
 * POST /api/banner-alerts/delete { id: 123 }
 */
export const DELETE: APIRoute = async ({ request, cookies }): Promise<Response> => {
  return handleDelete(request, cookies);
};

export const POST: APIRoute = async ({ request, cookies }): Promise<Response> => {
  return handleDelete(request, cookies);
};

async function handleDelete(request: Request, cookies: any): Promise<Response> {
  console.log("🗑️ [BANNER-ALERTS] Delete API endpoint called");
  try {
    // Check authentication
    const { isAuth, currentUser, supabase } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (profile?.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      console.error("Supabase admin client not initialized");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get ID from query params or body
    let id: number | null = null;
    const url = new URL(request.url);
    const queryId = url.searchParams.get("id");

    if (queryId) {
      id = parseInt(queryId);
    } else {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // No body
      }
    }

    if (!id) {
      return new Response(JSON.stringify({ error: "Banner ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error } = await supabaseAdmin.from("bannerAlerts").delete().eq("id", id);

    if (error) {
      console.error("❌ [BANNER-ALERTS] Error deleting banner:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to delete banner alert",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ [BANNER-ALERTS] Deleted banner ${id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Banner deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [BANNER-ALERTS] Error in delete API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
