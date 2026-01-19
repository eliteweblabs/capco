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

    // Import the shared Supabase admin client
    const { supabaseAdmin } = await import("../../../lib/supabase-admin");

    if (!supabaseAdmin) {
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
    const { supabase } = await import("../../../lib/supabase");

    if (!supabase) {
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

    const supabaseUser = supabase;

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
    const { data: profile, error: profileError } = await supabaseAdmin
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
    const { data: tableCheck, error: tableError } = await supabaseAdmin
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
    // Note: Using manual join since foreign key points to auth.users, not profiles directly
    const { data: punchlistItems, error: punchlistError } = await supabaseAdmin
      .from("punchlist")
      .select("*")
      .eq("projectId", parseInt(projectId))
      .order("createdAt", { ascending: false });

    // Manually join with profiles if punchlist items exist
    if (punchlistItems && punchlistItems.length > 0) {
      const authorIds = [...new Set(punchlistItems.map((item: any) => item.authorId).filter(Boolean))];
      
      if (authorIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from("profiles")
          .select("id, companyName, email, role")
          .in("id", authorIds);

        if (!profilesError && profiles) {
          const profilesMap = new Map(profiles.map((p: any) => [p.id, p]));
          punchlistItems.forEach((item: any) => {
            if (item.authorId && profilesMap.has(item.authorId)) {
              item.author = profilesMap.get(item.authorId);
            }
          });
        }
      }
    }

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
    const incompleteCount = filteredItems.filter((item) => !item.markCompleted).length;

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
