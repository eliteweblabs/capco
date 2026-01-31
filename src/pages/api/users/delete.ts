import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const DELETE: APIRoute = async ({ request, cookies }) => {
  console.log("🗑️ [DELETE-USER] API route called");

  try {
    // Check authentication and ensure user is Admin
    const { isAuth, currentUser, currentRole } = await checkAuth(cookies);

    if (!isAuth || currentRole !== "Admin") {
      console.log("🗑️ [DELETE-USER] Unauthorized access attempt");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized - Admin access required",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const { userId, itemId, id } = body;
    const userIdToDelete = userId || itemId || id;

    if (!userIdToDelete) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `🗑️ [DELETE-USER] Admin ${currentUser?.email} attempting to delete user ${userIdToDelete}`
    );

    // Prevent self-deletion
    if (userIdToDelete === currentUser?.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Cannot delete your own account",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!supabase || !supabaseAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database connection not available",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user details before deletion for logging
    const { data: userToDelete, error: fetchError } = await supabase
      .from("profiles")
      .select("firstName, lastName, companyName, role")
      .eq("id", userIdToDelete)
      .single();

    if (fetchError || !userToDelete) {
      console.error("🗑️ [DELETE-USER] User not found:", fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "User not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userName =
      `${userToDelete.firstName || ""} ${userToDelete.lastName || ""}`.trim() ||
      userToDelete.companyName ||
      "Unknown User";

    console.log(`🗑️ [DELETE-USER] Deleting user: ${userName} (${userToDelete.role})`);

    // Check if user has any associated projects
    const { data: userProjects, error: projectsError } = await supabase
      .from("projects")
      .select("id, title")
      .eq("authorId", userIdToDelete);

    if (projectsError) {
      console.error("🗑️ [DELETE-USER] Error checking user projects:", projectsError);
    }

    if (userProjects && userProjects.length > 0) {
      console.log(`🗑️ [DELETE-USER] User has ${userProjects.length} associated projects`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Cannot delete user with ${userProjects.length} associated project(s). Please reassign or delete projects first.`,
          details: `User has projects: ${userProjects.map((p) => p.title).join(", ")}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete user from profiles table first
    const { error: profileDeleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userIdToDelete);

    if (profileDeleteError) {
      console.error("🗑️ [DELETE-USER] Error deleting profile:", profileDeleteError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to delete user profile",
          details: profileDeleteError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete user from auth.users table using admin client
    try {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

      if (authDeleteError) {
        console.error("🗑️ [DELETE-USER] Error deleting auth user:", authDeleteError);
        // Profile is already deleted, but auth user deletion failed
        // This is not critical as the user won't be able to login anyway
        console.warn("🗑️ [DELETE-USER] Profile deleted but auth user deletion failed");
      } else {
        console.log("🗑️ [DELETE-USER] Auth user deleted successfully");
      }
    } catch (authError) {
      console.error("🗑️ [DELETE-USER] Auth deletion error:", authError);
      // Continue - profile deletion was successful
    }

    console.log(`🗑️ [DELETE-USER] Successfully deleted user: ${userName}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${userName} has been successfully deleted`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("🗑️ [DELETE-USER] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
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
