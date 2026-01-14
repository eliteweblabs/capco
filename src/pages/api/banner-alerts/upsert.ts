import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

interface BannerAlertRequest {
  id?: number;
  title?: string;
  description: string;
  type?: "info" | "success" | "warning" | "error";
  position?: "top" | "bottom";
  expireMs?: number | null;
  dismissible?: boolean;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

/**
 * Banner Alerts UPSERT API
 *
 * POST /api/banner-alerts/upsert
 *
 * Body:
 * - id?: number (if provided, updates existing banner)
 * - title?: string
 * - description: string (required)
 * - type?: "info" | "success" | "warning" | "error" (default: "info")
 * - position?: "top" | "bottom" (default: "top")
 * - expireMs?: number | null (milliseconds, null = never expires)
 * - dismissible?: boolean (default: true)
 * - isActive?: boolean (default: true)
 * - startDate?: string | null (ISO date string)
 * - endDate?: string | null (ISO date string)
 */
export const POST: APIRoute = async ({ request, cookies }): Promise<Response> => {
  console.log("📢 [BANNER-ALERTS] Upsert API endpoint called");
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

    const body: BannerAlertRequest = await request.json();

    const {
      id,
      title,
      description,
      type = "info",
      position = "top",
      expireMs = null,
      dismissible = true,
      isActive = true,
      startDate = null,
      endDate = null,
    } = body;

    if (!description) {
      return new Response(JSON.stringify({ error: "Description is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bannerData = {
      title,
      description,
      type,
      position,
      expireMs,
      dismissible,
      isActive,
      startDate,
      endDate,
      ...(id ? {} : { createdBy: currentUser.id }),
    };

    let data, error;

    if (id) {
      // Update existing banner
      const result = await supabaseAdmin
        .from("banner_alerts")
        .update(bannerData)
        .eq("id", id)
        .select()
        .single();
      data = result.data;
      error = result.error;
      console.log(`📢 [BANNER-ALERTS] Updated banner ${id}`);
    } else {
      // Create new banner
      const result = await supabaseAdmin
        .from("banner_alerts")
        .insert(bannerData)
        .select()
        .single();
      data = result.data;
      error = result.error;
      console.log(`📢 [BANNER-ALERTS] Created new banner`);
    }

    if (error) {
      console.error("❌ [BANNER-ALERTS] Error upserting banner:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to save banner alert",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        banner: data,
        message: id ? "Banner updated successfully" : "Banner created successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [BANNER-ALERTS] Error in upsert API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
