import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request }) => {
  try {
    if (!supabase) {
      // Return demo staff users when database is not configured
      const demoStaffUsers = [
        {
          id: "demo-staff-1",
          name: "John Smith",
          phone: "555-123-4567",
          role: "Staff",
        },
        {
          id: "demo-staff-2",
          name: "Sarah Johnson",
          phone: "555-987-6543",
          role: "Staff",
        },
        {
          id: "demo-staff-3",
          name: "Mike Davis",
          phone: "555-555-1234",
          role: "Staff",
        },
        {
          id: "demo-staff-4",
          name: "Lisa Chen",
          phone: "555-456-7890",
          role: "Staff",
        },
        {
          id: "demo-staff-5",
          name: "Robert Wilson",
          phone: "555-333-4567",
          role: "Staff",
        },
      ];

      return new Response(
        JSON.stringify({
          success: true,
          staffUsers: demoStaffUsers,
          message: "Demo staff users (no database interaction)",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get current user to verify permissions
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      // Return demo staff for unauthenticated users
      const demoStaffUsers = [
        {
          id: "guest-staff-1",
          name: "Demo Staff Member",
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
        },
      );
    }

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role;

    // Only admins and staff can view staff list
    if (userRole !== "Admin" && userRole !== "Staff") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized - Only admins and staff can view staff list",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Fetch staff users from database
    const { data: staffUsers, error } = await supabase
      .from("profiles")
      .select("id, name, phone, role, created")
      .eq("role", "Staff")
      .order("name", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch staff users",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        staffUsers: staffUsers || [],
        count: staffUsers?.length || 0,
        message: staffUsers?.length
          ? `Found ${staffUsers.length} staff member(s)`
          : "No staff members found",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    console.error("Unexpected error in get-staff-users:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: (error as Error)?.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
