import { supabaseAdmin } from "@/lib/supabase-admin";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const { action, fileId, userId, assignedTo, notes } = await request.json();

    if (!action || !fileId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let result;

    switch (action) {
      case "checkout":
        if (!userId) {
          return new Response(
            JSON.stringify({ success: false, error: "User ID required for checkout" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        if (!supabaseAdmin) {
          return new Response(
            JSON.stringify({ success: false, error: "Database connection failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        result = await supabaseAdmin.rpc("checkout_file", {
          file_id_param: fileId,
          user_id_param: userId,
          notes_param: notes || null,
        });
        break;

      case "checkin":
        if (!userId) {
          return new Response(
            JSON.stringify({ success: false, error: "User ID required for checkin" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        if (!supabaseAdmin) {
          return new Response(
            JSON.stringify({ success: false, error: "Database connection failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        result = await supabaseAdmin.rpc("checkin_file", {
          file_id_param: fileId,
          user_id_param: userId,
          notes_param: notes || null,
        });
        break;

      case "assign":
        if (!assignedTo || !userId) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Assigned to and user ID required for assignment",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        if (!supabaseAdmin) {
          return new Response(
            JSON.stringify({ success: false, error: "Database connection failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        result = await supabaseAdmin.rpc("assign_file", {
          file_id_param: fileId,
          assigned_to_param: assignedTo,
          assigned_by_param: userId,
          notes_param: notes || null,
        });
        break;

      default:
        return new Response(JSON.stringify({ success: false, error: "Invalid action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }

    if (result.error) {
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("File checkout error:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const fileId = url.searchParams.get("fileId");

    if (!fileId) {
      return new Response(JSON.stringify({ success: false, error: "File ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Database connection failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await supabaseAdmin.rpc("get_file_checkout_status", {
      file_id_param: parseInt(fileId),
    });

    if (result.error) {
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("File checkout status error:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
