import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Check authentication and admin role
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }

    // Set session
    const { data: session, error: sessionError } = await supabase!.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !session.session?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
      });
    }

    // Check if user is admin
    const { data: profile } = await supabase!
      .from("profiles")
      .select("role")
      .eq("id", session.session.user.id)
      .single();

    if (!profile || profile.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
      });
    }

    // Get recent projects created via email
    const { data: recentProjects, error: projectsError } = await supabase!
      .from("projects")
      .select(
        `
        id, 
        created_at, 
        address, 
        owner,
        source_email,
        profiles!projects_author_id_fkey(name)
      `
      )
      .eq("created_via", "email")
      .order("created_at", { ascending: false })
      .limit(10);

    if (projectsError) {
      console.error("Error fetching recent projects:", projectsError);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Transform data for display
    const activity = (recentProjects || []).map((project) => ({
      id: project.id,
      from: project.profiles?.name || project.owner || "Unknown",
      subject: `Project: ${project.address}`,
      timestamp: project.created_at,
      success: true, // If it's in the database, it was successful
      confidence: 85, // Mock data - you'd store this in email_logs table
      projectId: project.id,
      sourceEmail: project.source_email,
    }));

    return new Response(JSON.stringify(activity), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in email monitoring activity:", error);
    return new Response(JSON.stringify([]), {
      status: 500,
    });
  }
};
