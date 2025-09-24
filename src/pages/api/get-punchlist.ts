import { createClient } from "@supabase/supabase-js";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const url = new URL(request.url);
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

    // Get Supabase credentials from environment
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database configuration missing",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role key for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the current user from the session
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
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

    // Create a client with user session for RLS
    const supabaseUser = createClient(supabaseUrl, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    // Get user profile to determine role
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid authentication",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to get user profile",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userRole = profile?.role || "Client";

    // Check if punchlist table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from("punchlist")
      .select("id")
      .limit(1);

    if (tableError && tableError.code === "PGRST116") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Punchlist table does not exist",
          migration_needed: true,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch punchlist items for the project
    const { data: punchlistItems, error: punchlistError } = await supabase
      .from("punchlist")
      .select(
        `
        *,
        author:profiles!punchlist_author_id_fkey(
          id,
          name,
          email,
          role
        )
      `
      )
      .eq("project_id", parseInt(projectId))
      .order("created_at", { ascending: false });

    if (punchlistError) {
      console.error("Error fetching punchlist items:", punchlistError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch punchlist items",
          details: punchlistError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Filter items based on user role and internal status
    const filteredItems = punchlistItems.filter((item) => {
      // Admins and Staff can see all items
      if (userRole === "Admin" || userRole === "Staff") {
        return true;
      }

      // Clients can only see non-internal items
      return !item.internal;
    });

    // Calculate incomplete count
    const incompleteCount = filteredItems.filter((item) => !item.mark_completed).length;

    return new Response(
      JSON.stringify({
        success: true,
        punchlist: filteredItems,
        incompleteCount,
        userRole,
        totalCount: filteredItems.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in get-punchlist API:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
