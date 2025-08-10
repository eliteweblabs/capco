import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { checkAuth } from "../../lib/auth";

export const GET: APIRoute = async ({ cookies }) => {
  console.log("=== Database Test Endpoint ===");

  // Test 0: Check cookies
  console.log("0. Cookie check:");
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");
  console.log("   - access token cookie:", accessToken ? "present" : "missing");
  console.log(
    "   - refresh token cookie:",
    refreshToken ? "present" : "missing",
  );

  // Test 1: Check Supabase configuration
  console.log("1. Supabase config check:");
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
  console.log("   - SUPABASE_URL:", supabaseUrl ? "Set" : "Missing");
  console.log("   - SUPABASE_ANON_KEY:", supabaseAnonKey ? "Set" : "Missing");
  console.log(
    "   - Supabase client:",
    supabase ? "Created" : "Failed to create",
  );

  if (!supabase) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Supabase not configured",
        details: {
          supabaseUrl: !!supabaseUrl,
          supabaseAnonKey: !!supabaseAnonKey,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Test 1.5: Check if there are any projects at all (no auth required)
  console.log("1.5. Raw projects check (no auth):");
  const { data: rawProjects, error: rawError } = await supabase
    .from("projects")
    .select("id, title, author_id, created, status")
    .limit(10);

  console.log("   - raw projects count:", rawProjects?.length || 0);
  console.log("   - raw projects error:", rawError);
  console.log("   - sample projects:", rawProjects?.slice(0, 3));
  console.log(
    "   - project statuses:",
    rawProjects?.map((p) => ({ id: p.id, status: p.status })),
  );

  // Test 1.6: Check project statuses table (no auth required)
  console.log("1.6. Project statuses table check (no auth):");
  const { data: statuses, error: statusesError } = await supabase
    .from("project_statuses")
    .select("*")
    .order("status_code");

  console.log("   - project statuses count:", statuses?.length || 0);
  console.log("   - project statuses error:", statusesError);
  console.log(
    "   - available statuses:",
    statuses?.map((s) => ({ code: s.status_code, name: s.status_name })),
  );

  // Test 2: Check authentication
  console.log("2. Authentication check:");
  const { isAuth, session, user, role } = await checkAuth(cookies);
  console.log("   - isAuth:", isAuth);
  console.log("   - user:", user ? { id: user.id, email: user.email } : "null");
  console.log("   - role:", role);
  console.log("   - session:", session ? "exists" : "null");
  console.log("   - session data:", session?.data ? "present" : "null");
  console.log("   - session error:", session?.error || "none");

  if (!isAuth) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Not authenticated",
        details: {
          isAuth,
          user: user ? { id: user.id, email: user.email } : null,
          role,
          rawProjectsCount: rawProjects?.length || 0,
          rawProjectsError: rawError,
          projectStatuses:
            rawProjects?.map((p) => ({ id: p.id, status: p.status })) || [],
          availableStatuses:
            statuses?.map((s) => ({
              code: s.status_code,
              name: s.status_name,
            })) || [],
          statusesError: statusesError,
          cookies: {
            accessToken: accessToken ? "present" : "missing",
            refreshToken: refreshToken ? "present" : "missing",
          },
          session: {
            exists: !!session,
            hasData: !!session?.data,
            error: session?.error || null,
          },
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Test 3: Check user profile
  console.log("3. User profile check:");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  console.log("   - profile:", profile);
  console.log("   - profile error:", profileError);

  // Test 4: Check total projects count
  console.log("4. Total projects check:");
  const { count: totalProjects, error: countError } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true });

  console.log("   - total projects:", totalProjects);
  console.log("   - count error:", countError);

  // Test 5: Check user's projects (filtered by author_id)
  console.log("5. User's projects check:");
  const { data: userProjects, error: userProjectsError } = await supabase
    .from("projects")
    .select("*")
    .eq("author_id", user.id);

  console.log("   - user projects count:", userProjects?.length || 0);
  console.log("   - user projects error:", userProjectsError);

  // Test 6: Check all projects (if admin)
  console.log("6. All projects check (admin only):");
  let allProjects = null;
  let allProjectsError = null;

  if (role === "Admin") {
    const { data, error } = await supabase.from("projects").select("*");
    allProjects = data;
    allProjectsError = error;
    console.log("   - all projects count:", allProjects?.length || 0);
    console.log("   - all projects error:", allProjectsError);
  } else {
    console.log("   - not admin, skipping all projects check");
  }

  // Test 7: Check RLS policies
  console.log("7. RLS policy test:");
  const { data: rlsTest, error: rlsError } = await supabase
    .from("projects")
    .select("id, title, author_id")
    .limit(5);

  console.log(
    "   - RLS test result:",
    rlsTest?.length || 0,
    "projects accessible",
  );
  console.log("   - RLS error:", rlsError);

  // Test 8: Check project statuses table
  console.log("8. Project statuses check:");
  const { data: statuses, error: statusesError } = await supabase
    .from("project_statuses")
    .select("*")
    .order("status_code");

  console.log("   - project statuses count:", statuses?.length || 0);
  console.log("   - project statuses error:", statusesError);
  console.log(
    "   - available statuses:",
    statuses?.map((s) => ({ code: s.status_code, name: s.status_name })),
  );

  const result = {
    success: true,
    rawProjects: {
      count: rawProjects?.length || 0,
      error: rawError,
      sample: rawProjects?.slice(0, 3),
    },
    auth: {
      isAuth,
      user: user ? { id: user.id, email: user.email } : null,
      role,
    },
    profile: {
      data: profile,
      error: profileError,
    },
    projects: {
      total: totalProjects,
      userProjects: userProjects?.length || 0,
      allProjects:
        role === "Admin" ? allProjects?.length || 0 : "N/A (not admin)",
      rlsTest: rlsTest?.length || 0,
    },
    statuses: {
      count: statuses?.length || 0,
      error: statusesError,
      available:
        statuses?.map((s) => ({ code: s.status_code, name: s.status_name })) ||
        [],
    },
    errors: {
      countError,
      userProjectsError,
      allProjectsError,
      rlsError,
    },
  };

  console.log("=== Test Complete ===");
  console.log("Result:", JSON.stringify(result, null, 2));

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
