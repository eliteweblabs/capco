import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Create test discussion data for debugging
 */

export const POST: APIRoute = async ({ cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("🧪 [CREATE-TEST-DATA] Creating test discussion data");

    // First, get a project to attach discussions to
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from("projects")
      .select("id")
      .limit(1);

    if (projectsError || !projects || projects.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No projects found. Please create a project first.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const projectId = projects[0].id;

    // Create test discussions with different timestamps
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const testDiscussions = [
      {
        projectId: projectId,
        authorId: currentUser.id,
        message: "Test discussion from 1 hour ago",
        createdAt: oneHourAgo.toISOString(),
        internal: false,
      },
      {
        projectId: projectId,
        authorId: currentUser.id,
        message: "Test discussion from 2 hours ago",
        createdAt: twoHoursAgo.toISOString(),
        internal: false,
      },
      {
        projectId: projectId,
        authorId: currentUser.id,
        message: "Test discussion from 3 days ago",
        createdAt: threeDaysAgo.toISOString(),
        internal: false,
      },
    ];

    const { data: insertedDiscussions, error: insertError } = await supabaseAdmin
      .from("discussion")
      .insert(testDiscussions)
      .select();

    if (insertError) {
      console.error("❌ [CREATE-TEST-DATA] Error inserting test discussions:", insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create test discussions",
          details: insertError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🧪 [CREATE-TEST-DATA] Created test discussions:", insertedDiscussions);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test discussion data created successfully",
        discussions: insertedDiscussions,
        count: insertedDiscussions.length,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ [CREATE-TEST-DATA] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
