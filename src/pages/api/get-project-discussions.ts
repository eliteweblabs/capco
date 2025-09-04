import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

// // Server-side function to get user info directly from database

async function getUserInfoServer(userId: string) {
  // Get user metadata from auth.users table
  if (!supabaseAdmin) {
    return null;
  }
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (authError || !authUser.user) {
    console.error("Error fetching auth user:", authError);
    return null;
  }

  if (!supabase) {
    return null;
  }

  // Get user profile from profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  console.log(`🔍 [USER-INFO] Profile data for ${userId}:`, profile);
  console.log(`🔍 [USER-INFO] Profile error:`, profileError);
  console.log(`🔍 [USER-INFO] Auth user metadata:`, authUser.user.user_metadata);

  // Combine auth user data with profile data
  const userInfo = {
    id: authUser.user.id,
    email: authUser.user.email,
    profile: profile || null,
    // Computed fields for easy access
    display_name:
      profile?.company_name ||
      profile?.name ||
      authUser.user.user_metadata?.full_name ||
      authUser.user.email?.split("@")[0] ||
      "Unknown User",
    company_name: profile?.company_name || null,
    name: profile?.name || null,
    role: profile?.role || "Unknown",
  };

  console.log(`🔍 [USER-INFO] Final userInfo for ${userId}:`, {
    company_name: userInfo.company_name,
    name: userInfo.name,
    display_name: userInfo.display_name,
    email: userInfo.email,
  });

  return userInfo;
}

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication to get user role for filtering
    const { role } = await checkAuth(cookies);
    const isClient = role === "Client";
    console.log("📡 [GET-DISCUSSIONS] User role:", role, "isClient:", isClient);

    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Project ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get discussions with author information
    // Convert projectId to integer since projects table uses integer IDs
    const projectIdInt = parseInt(projectId, 10);

    if (isNaN(projectIdInt)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid project ID format",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let discussionsQuery = supabase
      .from("discussion")
      .select(
        `
        id,
        created_at,
        message,
        author_id,
        project_id,
        internal,
        mark_completed,
        parent_id
      `
      )
      .eq("project_id", projectIdInt);

    // For clients, exclude internal discussions (Admin/Staff see all)
    if (isClient) {
      discussionsQuery = discussionsQuery.eq("internal", false);
    }
    // Admin and Staff see all discussions (no additional filtering needed)

    const { data: discussions, error } = await discussionsQuery.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching discussions:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get author profiles using getUserInfoServer (same as add-discussion.ts)
    const authorIds = [...new Set(discussions?.map((d) => d.author_id) || [])];
    let authorProfiles: any = {};

    if (authorIds.length > 0) {
      console.log(`🔔 [DISCUSSIONS] Fetching profiles for ${authorIds.length} authors:`, authorIds);

      for (const authorId of authorIds) {
        try {
          const userInfo = await getUserInfoServer(authorId);
          if (userInfo) {
            authorProfiles[authorId] = userInfo;
            console.log(`🔔 [DISCUSSIONS] Profile for ${authorId}:`, {
              company_name: userInfo.company_name,
              display_name: userInfo.display_name,
              name: userInfo.name,
            });
          } else {
            console.log(`🔔 [DISCUSSIONS] No profile found for ${authorId}`);
          }
        } catch (error) {
          console.error(`🔔 [DISCUSSIONS] Error fetching profile for ${authorId}:`, error);
        }
      }

      console.log(`🔔 [DISCUSSIONS] Total profiles fetched: ${Object.keys(authorProfiles).length}`);
    }

    // Combine discussions with author profiles
    const discussionsWithProfiles =
      discussions?.map((discussion) => {
        const authorProfile = authorProfiles[discussion.author_id];
        const authorName = authorProfile?.display_name || authorProfile?.company_name || authorProfile?.name || "Unknown User";
        
        console.log(`🔍 [DISCUSSIONS] Discussion ${discussion.id} author mapping:`, {
          author_id: discussion.author_id,
          hasProfile: !!authorProfile,
          profileData: authorProfile ? {
            display_name: authorProfile.display_name,
            company_name: authorProfile.company_name,
            name: authorProfile.name,
            email: authorProfile.email
          } : null,
          finalAuthorName: authorName
        });
        
        return {
          ...discussion,
          profiles: authorProfile || null,
          author_name: authorName,
        };
      }) || [];

    return new Response(
      JSON.stringify({
        success: true,
        discussions: discussionsWithProfiles,
        count: discussionsWithProfiles.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get project discussions error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch discussions",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
