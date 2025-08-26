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

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count projects created via email today
    const { data: emailProjects, error: projectsError } = await supabase!
      .from("projects")
      .select("id, created_at")
      .eq("created_via", "email")
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString());

    if (projectsError) {
      console.error("Error fetching email projects:", projectsError);
    }

    // You might want to create an email_logs table to track processing
    // For now, we'll return mock data
    const stats = {
      emailsProcessed: emailProjects?.length || 0,
      projectsCreated: emailProjects?.length || 0,
      successRate: emailProjects?.length ? "100%" : "0%",
      totalProjectsViaEmail: emailProjects?.length || 0,
      averageConfidence: 85, // Mock data - you'd calculate this from logs
      lastProcessed: emailProjects?.[0]?.created_at || null,
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in email monitoring stats:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
