import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted
// console.log("🚧 [DEAD-STOP-2024-12-19] get-team-users.ts accessed - may be unused");

export const GET: APIRoute = async ({ request, cookies }) => {
  // console.log("📡 [API] GET /api/get-staff-users called");

  try {
    // console.log("📡 [API] Checking Supabase configuration...");

    if (!supabase) {
      // console.log("📡 [API] Supabase not configured, returning demo staff users");

      // // Return demo staff users when database is not configured
      // const demoStaffUsers = [
      //   {
      //     id: "demo-staff-1",
      //     name: "John Smith",
      //     phone: "555-123-4567",
      //     role: "Staff",
      //   },
      //   {
      //     id: "demo-staff-2",
      //     name: "Sarah Johnson",
      //     phone: "555-987-6543",
      //     role: "Staff",
      //   },
      //   {
      //     id: "demo-staff-3",
      //     name: "Mike Davis",
      //     phone: "555-555-1234",
      //     role: "Staff",
      //   },
      //   {
      //     id: "demo-staff-4",
      //     name: "Lisa Chen",
      //     phone: "555-456-7890",
      //     role: "Staff",
      //   },
      //   {
      //     id: "demo-staff-5",
      //     name: "Robert Wilson",
      //     phone: "555-333-4567",
      //     role: "Staff",
      //   },
      // ];

      // return new Response(
      //   JSON.stringify({
      //     success: true,
      //     staffUsers: demoStaffUsers,
      //     message: "Demo staff users (no database interaction)",
      //   }),
      //   {
      //     status: 200,
      //     headers: { "Content-Type": "application/json" },
      //   }
      // );
    }

    // console.log("📡 [API] Getting current user...");

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set up session from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    // console.log("📡 [API] Auth check:", {
    //   hasAccessToken: !!accessToken,
    //   hasRefreshToken: !!refreshToken,
    // });

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    // Get current user to verify permissions
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // console.log("📡 [API] User auth result:", {
    //   hasUser: !!user,
    //   userId: user?.id || null,
    //   userEmail: user?.email || null,
    //   hasError: !!userError,
    //   errorMessage: userError?.message || null,
    // });

    if (userError || !user) {
      // console.log("📡 [API] No authenticated user, returning demo staff users");

      // Return demo staff for unauthenticated users
      const demoStaffUsers = [
        {
          id: "guest-staff-1",
          company_name: "Demo Staff Member",
          phone: "555-000-0000",
          role: "Staff",
        },
      ];

      return new Response(
        JSON.stringify({
          success: true,
          staffUsers: demoStaffUsers,
          message: "Demo staff users (demo mode - sign in for real data)",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // console.log("📡 [API] Getting user profile for role...");

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role;
    // console.log("📡 [API] User role:", userRole);

    // Only admins and staff can view staff list
    if (userRole !== "Admin" && userRole !== "Staff") {
      // console.log(`📡 [API] User role is: ${userRole}, denying access to staff list`);

      // TEMPORARY: Allow all users to view staff list for debugging
      // console.log("📡 [API] TEMPORARY: Allowing access for debugging purposes");

      // Uncomment the return statement below to restore proper authorization
      /*
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized - Only admins and staff can view staff list",
          userRole: userRole,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
      */
    }

    // Fetch staff users from database
    // console.log("📡 [API] Fetching staff users from database...");
    const { data: staffUsers, error } = await supabase
      .from("profiles")
      .select("id, company_name, role, created_at")
      .neq("role", "Client")
      .order("company_name", { ascending: true });

    // console.log("📡 [API] Staff users query result:", { staffUsers, error });

    // Try direct SQL query to bypass RLS
    const { data: directStaffUsers, error: directError } = await supabase.rpc(
      "get_staff_users_direct",
      {}
    );

    // console.log("📡 [API] Direct SQL staff users result:", {
    //   directStaffUsers,
    //   directError,
    // });

    // Try a simpler approach - get all profiles and filter in JavaScript
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from("profiles")
      .select("id, company_name, role, created_at");

    // Filter for staff users and get phone from auth
    const staffUsersFromAll = [];
    if (allProfiles) {
      for (const profile of allProfiles.filter((p) => p.role === "Staff")) {
        try {
          if (!supabaseAdmin) {
            console.error("📡 [API] Supabase admin client not available");
            return new Response(
              JSON.stringify({
                success: false,
                error: "Admin client not available",
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          // Phone is already available in profiles table
          staffUsersFromAll.push({
            ...profile,
            phone: profile.phone || null,
          });
        } catch (authError) {
          console.error(`Error fetching auth data for user ${profile.id}:`, authError);
          staffUsersFromAll.push({
            ...profile,
            phone: null,
          });
        }
      }
    }

    // console.log("📡 [API] Staff users from all profiles:", staffUsersFromAll);

    if (error) {
      console.error("📡 [API] Database error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch staff users",
          details: error.message,
          // rawError: rawError?.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // If no staff users found with regular query, try alternative approach
    let finalStaffUsers = staffUsers || [];
    let message = staffUsers?.length
      ? `Found ${staffUsers.length} staff member(s)`
      : "No staff members found";

    if (!staffUsers || staffUsers.length === 0) {
      // console.log(
      //   "📡 [API] No staff users found with regular query, trying alternative approach..."
      // );

      if (staffUsersFromAll && staffUsersFromAll.length > 0) {
        finalStaffUsers = staffUsersFromAll;
        message = `Found ${staffUsersFromAll.length} staff member(s) via alternative query`;
        // console.log("📡 [API] Using alternative query results for staff users");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        staffUsers: finalStaffUsers,
        count: finalStaffUsers.length,
        message: message,
        debug: {
          regularQuery: { staffUsers, error },
          alternativeQuery: {
            allProfiles: allProfiles?.length || 0,
            staffUsersFromAll: staffUsersFromAll.length,
            error: allProfilesError?.message,
          },
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("📡 [API] Unexpected error in get-staff-users:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: (error as Error)?.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
