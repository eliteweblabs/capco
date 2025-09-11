import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

// // Server-side function to get user info directly from database

async function getAuthorInfoServer(userId: string) {
  // Get user profile from profiles table
  if (!supabaseAdmin) {
    return null;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, first_name, last_name, company_name, email, phone, role")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching user profile:", profileError);
    return null;
  }

  // Build user info from profile data
  const userInfo = {
    id: profile.id,
    email: profile.email,
    profile: profile,
    // Computed fields for easy access
    display_name:
      profile.company_name ||
      `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
      profile.email?.split("@")[0] ||
      "Unknown User",
    company_name: profile.company_name || null,
    name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || null,
    role: profile.role || "Unknown",
  };

  return userInfo;
}

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication to get user role for filtering
    const { currentRole } = await checkAuth(cookies);
    const isClient = currentRole === "Client";
    // console.log("📡 [GET-DISCUSSIONS] User role:", currentRole, "isClient:", isClient);

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
        parent_id,
        image_paths
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

    // Get author profiles using getAuthorInfoServer (same as add-discussion.ts)
    const authorIds = [...new Set(discussions?.map((d) => d.author_id) || [])];
    let authorProfiles: any = {};

    if (authorIds.length > 0) {
      // console.log(`🔔 [DISCUSSIONS] Fetching profiles for ${authorIds.length} authors:`, authorIds);

      for (const authorId of authorIds) {
        try {
          const userInfo = await getAuthorInfoServer(authorId);
          if (userInfo) {
            authorProfiles[authorId] = userInfo;
            // console.log(`🔔 [DISCUSSIONS] Profile for ${authorId}:`, {
            //   company_name: userInfo.company_name,
            //   display_name: userInfo.display_name,
            //   name: userInfo.name,
            // });
          } else {
            console.log(`🔔 [DISCUSSIONS] No profile found for ${authorId}`);
          }
        } catch (error) {
          console.error(`🔔 [DISCUSSIONS] Error fetching profile for ${authorId}:`, error);
        }
      }

      // console.log(`🔔 [DISCUSSIONS] Total profiles fetched: ${Object.keys(authorProfiles).length}`);
    }

    // Combine discussions with author profiles
    const discussionsWithProfiles =
      discussions?.map((discussion) => {
        const authorProfile = authorProfiles[discussion.author_id];
        const companyName =
          authorProfile?.company_name ||
          authorProfile?.display_name ||
          authorProfile?.name ||
          "Unknown User";

        // console.log(`🔍 [DISCUSSIONS] Discussion ${discussion.id} author mapping:`, {
        //   author_id: discussion.author_id,
        //   hasProfile: !!authorProfile,
        //   profileData: authorProfile ? {
        //     display_name: authorProfile.display_name,
        //     company_name: authorProfile.company_name,
        //     name: authorProfile.name,
        //     email: authorProfile.email
        //   } : null,
        //   finalCompanyName: companyName
        // });

        return {
          ...discussion,
          profiles: authorProfile || null,
          company_name: companyName,
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
