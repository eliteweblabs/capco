import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Users DELETE API
 *
 * DELETE Body:
 * - id: string (user ID to delete)
 *
 * Example:
 * - DELETE /api/users/delete { "id": "123" }
 */

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has permission to delete users
    const userRole = currentUser.profile?.role;
    if (userRole !== "Admin") {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions - Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`📡 [USERS-DELETE] Deleting user:`, id);

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", id)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prevent deleting the current user
    if (id === currentUser.id) {
      return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete the user
    const { error: deleteError } = await supabaseAdmin.from("profiles").delete().eq("id", id);

    if (deleteError) {
      console.error("❌ [USERS-DELETE] Error deleting user:", deleteError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete user",
          details: deleteError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [USERS-DELETE] User deleted successfully:`, id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "User deleted successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [USERS-DELETE] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
