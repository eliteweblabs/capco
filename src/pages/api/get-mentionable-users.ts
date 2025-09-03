import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

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

    // Get all profiles and filter (using correct column names: first_name, last_name, company_name)
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from("profiles")
      .select("id, company_name, role, first_name, last_name");

    if (allProfilesError) {
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch users" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Filter for mentionable users (Admin, Staff, or project author)
    const users =
      allProfiles?.filter(
        (profile) =>
          profile.role === "Admin" || profile.role === "Staff" || profile.id === project.author_id
      ) || [];

    const mentionableUsers = users.map((user) => ({
      id: user.id,
      name:
        user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.company_name || "Unknown User",
      role: user.role,
    }));

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
