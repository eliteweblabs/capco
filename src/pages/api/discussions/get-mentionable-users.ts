import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted
console.log("🚧 [DEAD-STOP-2024-12-19] get-mentionable-users.ts accessed - may be unused");

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
    const isGlobal = url.searchParams.get("global") === "true";

    // For global discussions, we don't need a projectId
    if (!isGlobal && !projectId) {
      return new Response(JSON.stringify({ success: false, error: "Project ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let projectAuthorId = null;

    // Only get project author if not global discussion
    if (!isGlobal && projectId) {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("authorId")
        .eq("id", parseInt(projectId))
        .single();

      if (projectError || !project) {
        return new Response(JSON.stringify({ success: false, error: "Project not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      projectAuthorId = project.authorId;
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

    // If user is a client, they can only mention themselves (project author) or all users in global discussions
    if (currentUserRole === "Client") {
      if (isGlobal) {
        // For global discussions, clients can mention all users
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from("profiles")
          .select("id, companyName, role, firstName, lastName, email");

        if (allProfilesError) {
          return new Response(JSON.stringify({ success: false, error: "Failed to fetch users" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        users = allProfiles || [];
      } else {
        // For project discussions, clients can only mention the project author
        if (!projectAuthorId) {
          return new Response(JSON.stringify({ success: true, users: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { data: clientProfile, error: clientError } = await supabase
          .from("profiles")
          .select("id, companyName, role, firstName, lastName, email, avatarUrl")
          .eq("id", projectAuthorId)
          .single();

        if (clientError || !clientProfile) {
          return new Response(JSON.stringify({ success: true, users: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        users = [clientProfile];
      }
    } else {
      // For Admin/Staff, get all mentionable users (Admin, Staff, or project author)
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from("profiles")
        .select("id, companyName, role, firstName, lastName, email, avatarUrl");

      if (allProfilesError) {
        return new Response(JSON.stringify({ success: false, error: "Failed to fetch users" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (isGlobal) {
        // For global discussions, Admin/Staff can mention all users
        users = allProfiles || [];
      } else {
        // For project discussions, Admin/Staff can mention Admin, Staff, or project author
        users =
          allProfiles?.filter(
            (profile) =>
              profile.role === "Admin" || profile.role === "Staff" || profile.id === projectAuthorId
          ) || [];
      }
    }

    // Build mentionable users from profiles data (email already available)
    const mentionableUsers = users.map((user) => {
      return {
        id: user.id,
        name:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.companyName || "Unknown User",
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
