import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication - only admins can run this
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase!
      .from("profiles")
      .select("role")
      .eq("id", session.session.user.id)
      .single();

    if (profileError || profile?.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get all users with auth metadata
    const { data: authUsers, error: authError } = await supabase!.auth.admin.listUsers();

    if (authError) {
      return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase!
      .from("profiles")
      .select("id, name, phone");

    if (profilesError) {
      return new Response(JSON.stringify({ error: "Failed to fetch profiles" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updates = [];
    const errors = [];

    // Process each user
    for (const authUser of authUsers.users || []) {
      const userProfile = profiles?.find((p) => p.id === authUser.id);

      if (!userProfile) {
        continue; // Skip if no profile exists
      }

      // Check if profile needs updating (missing name or has generic name)
      if (!userProfile.name || userProfile.name === "User" || userProfile.name.trim() === "") {
        const metadata = authUser.user_metadata || {};

        // Construct new name with priority order
        const newName =
          metadata.display_name ||
          metadata.full_name ||
          (metadata.first_name && metadata.last_name
            ? `${metadata.first_name} ${metadata.last_name}`
            : null) ||
          metadata.name ||
          authUser.email ||
          "User";

        const newPhone = metadata.phone || userProfile.phone;

        try {
          const { error: updateError } = await supabase!
            .from("profiles")
            .update({
              name: newName,
              phone: newPhone,
            })
            .eq("id", authUser.id);

          if (updateError) {
            errors.push({
              userId: authUser.id,
              email: authUser.email,
              error: updateError.message,
            });
          } else {
            updates.push({
              userId: authUser.id,
              email: authUser.email,
              oldName: userProfile.name,
              newName: newName,
              phone: newPhone,
            });
          }
        } catch (error) {
          errors.push({
            userId: authUser.id,
            email: authUser.email,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updates.length} profiles`,
        updates,
        errors,
        totalUsers: authUsers.users?.length || 0,
        totalProfiles: profiles?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in fix-user-profiles:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
