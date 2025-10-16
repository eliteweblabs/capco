import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Users UPSERT API
 *
 * Handles both creating new users and updating existing ones
 *
 * POST Body:
 * - id?: string (if updating existing user)
 * - firstName: string
 * - lastName: string
 * - companyName?: string
 * - email: string
 * - role: "Admin" | "Staff" | "Client"
 * - phone?: string
 * - address?: string
 *
 * Examples:
 * - Create: POST /api/users/upsert { firstName, lastName, email, role }
 * - Update: POST /api/users/upsert { id, firstName, lastName, email, role }
 */

interface UserData {
  id?: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  role: "Admin" | "Staff" | "Client";
  phone?: string;
  address?: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has permission to create/update users
    const userRole = currentUser.profile?.role;
    if (userRole !== "Admin" && userRole !== "Staff") {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const userData: UserData = body;

    // Validate required fields
    if (!userData.firstName?.trim() || !userData.lastName?.trim() || !userData.email?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "firstName, lastName, and email are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!["Admin", "Staff", "Client"].includes(userData.role)) {
      return new Response(
        JSON.stringify({
          error: "Invalid role",
          details: "Role must be Admin, Staff, or Client",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📡 [USERS-UPSERT] ${userData.id ? "Updating" : "Creating"} user:`, userData.email);

    if (!supabase || !supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user with this email already exists (for new users)
    if (!userData.id) {
      const { data: existingUser } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .eq("email", userData.email.trim())
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({
            error: "User already exists",
            details: `A user with email ${userData.email} already exists`,
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Prepare user data
    const userPayload = {
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      companyName: userData.companyName?.trim() || "",
      email: userData.email.trim(),
      role: userData.role,
      phone: userData.phone?.trim() || null,
      address: userData.address?.trim() || null,
      updatedAt: new Date().toISOString(),
    };

    let result;
    let isUpdate = false;

    if (userData.id) {
      // Update existing user
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update(userPayload)
        .eq("id", userData.id)
        .select()
        .single();

      if (error) {
        console.error("❌ [USERS-UPSERT] Error updating user:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to update user",
            details: error.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      result = data;
      isUpdate = true;
    } else {
      // Create new user
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .insert([userPayload])
        .select()
        .single();

      if (error) {
        console.error("❌ [USERS-UPSERT] Error creating user:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to create user",
            details: error.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      result = data;
    }

    console.log(
      `✅ [USERS-UPSERT] User ${isUpdate ? "updated" : "created"} successfully:`,
      result.id
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: `User ${isUpdate ? "updated" : "created"} successfully`,
      }),
      { status: isUpdate ? 200 : 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [USERS-UPSERT] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
