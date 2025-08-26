import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      supabaseConfigured: !!supabase,
      tests: {} as any,
    };

    if (!supabase) {
      return new Response(
        JSON.stringify({
          ...results,
          error: "Supabase not configured",
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Test 1: Check auth cookies
    const accessToken = cookies.get("sb-access-token");
    const refreshToken = cookies.get("sb-refresh-token");

    results.tests.cookies = {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.value?.length || 0,
    };

    // Test 2: Get current user from session
    let currentUser = null;
    if (accessToken && refreshToken) {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken.value,
          refresh_token: refreshToken.value,
        });

        results.tests.session = {
          success: !sessionError,
          hasUser: !!sessionData.user,
          userId: sessionData.user?.id,
          userEmail: sessionData.user?.email,
          error: sessionError?.message,
        };

        currentUser = sessionData.user;
      } catch (err) {
        results.tests.session = {
          success: false,
          error: err instanceof Error ? err.message : "Unknown session error",
        };
      }
    } else {
      results.tests.session = {
        success: false,
        error: "No auth tokens found",
      };
    }

    // Test 3: Direct table access (bypassing RLS for debugging)
    try {
      // Count total records in each table
      const tables = ["profiles", "projects", "files"];
      const tableCounts = {};

      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select("*", { count: "exact", head: true });

          tableCounts[table] = {
            count: count || 0,
            error: error?.message,
            rlsEnabled: error?.message?.includes("RLS") || error?.message?.includes("policy"),
          };
        } catch (err) {
          tableCounts[table] = {
            count: 0,
            error: err instanceof Error ? err.message : "Unknown error",
            rlsEnabled: true,
          };
        }
      }

      results.tests.tables = tableCounts;
    } catch (err) {
      results.tests.tables = {
        error: err instanceof Error ? err.message : "Unknown table access error",
      };
    }

    // Test 4: User-specific queries if authenticated
    if (currentUser) {
      try {
        // Try to get user's profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        results.tests.userProfile = {
          found: !!profile,
          role: profile?.role,
          error: profileError?.message,
        };

        // Try to get user's projects
        const { data: projects, error: projectError } = await supabase
          .from("projects")
          .select("id, title, author_id")
          .eq("author_id", currentUser.id);

        results.tests.userProjects = {
          count: projects?.length || 0,
          error: projectError?.message,
        };

        // Try to get ALL projects (admin test)
        const { data: allProjects, error: allProjectError } = await supabase
          .from("projects")
          .select("id, title, author_id")
          .limit(10);

        results.tests.allProjects = {
          count: allProjects?.length || 0,
          error: allProjectError?.message,
          adminAccess: (allProjects?.length || 0) > (projects?.length || 0),
        };
      } catch (err) {
        results.tests.userQueries = {
          error: err instanceof Error ? err.message : "Unknown user query error",
        };
      }
    }

    return new Response(JSON.stringify(results, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};
