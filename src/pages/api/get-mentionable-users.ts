import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted
// console.log("🚧 [DEAD-STOP-2024-12-19] get-mentionable-users.ts accessed - may be unused");

export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    if (!supabase) {
      return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set up session from cookies (same as get-staff-users.ts)
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return new Response(JSON.stringify({ success: false, error: "Project ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get project to find the author
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("author_id")
      .eq("id", parseInt(projectId))
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ success: false, error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get current user's role to determine what users they can mention
    const { data: currentUserProfile, error: currentUserError } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .single();

    if (currentUserError) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch user profile" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const currentUserRole = currentUserProfile?.role;

    let users = [];

    // If user is a client, they can only mention themselves (project author)
    if (currentUserRole === "Client") {
      const { data: clientProfile, error: clientError } = await supabase
        .from("profiles")
        .select("id, company_name, role, first_name, last_name, email")
        .eq("id", project.author_id)
        .single();

      if (clientError || !clientProfile) {
        return new Response(JSON.stringify({ success: true, users: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      users = [clientProfile];
    } else {
      // For Admin/Staff, get all mentionable users (Admin, Staff, or project author)
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from("profiles")
        .select("id, company_name, role, first_name, last_name, email");

      if (allProfilesError) {
        return new Response(JSON.stringify({ success: false, error: "Failed to fetch users" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      users =
        allProfiles?.filter(
          (profile) =>
            profile.role === "Admin" || profile.role === "Staff" || profile.id === project.author_id
        ) || [];
    }

    // Build mentionable users from profiles data (email already available)
    const mentionableUsers = users.map((user) => {
      return {
        id: user.id,
        name:
          user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : user.company_name || "Unknown User",
        role: user.role,
        email: user.email || "",
      };
    });

    return new Response(JSON.stringify({ success: true, users: mentionableUsers }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-mentionable-users:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
