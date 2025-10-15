import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Discussions DELETE API
 *
 * DELETE Body:
 * - id: number (discussion ID to delete)
 *
 * Example:
 * - DELETE /api/discussions/delete { "id": 123 }
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

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Discussion ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`💬 [DISCUSSIONS-DELETE] Deleting discussion:`, id);

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if discussion exists
    const { data: discussion, error: discussionError } = await supabaseAdmin
      .from("discussions")
      .select("id, title, projectId, authorId")
      .eq("id", id)
      .single();

    if (discussionError || !discussion) {
      return new Response(JSON.stringify({ error: "Discussion not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has permission to delete (author or admin)
    const userRole = currentUser.profile?.role;
    const isAdmin = userRole === "Admin" || userRole === "Staff";
    const isAuthor = discussion.authorId === currentUser.id;

    if (!isAdmin && !isAuthor) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions to delete this discussion" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete the discussion
    const { error: deleteError } = await supabaseAdmin.from("discussions").delete().eq("id", id);

    if (deleteError) {
      console.error("❌ [DISCUSSIONS-DELETE] Error deleting discussion:", deleteError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete discussion",
          details: deleteError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [DISCUSSIONS-DELETE] Discussion deleted successfully:`, id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Discussion deleted successfully",
        deletedDiscussion: {
          id: discussion.id,
          title: discussion.title,
          projectId: discussion.projectId,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [DISCUSSIONS-DELETE] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
