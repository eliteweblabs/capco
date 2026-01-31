import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    console.log("[MEP-SUBMIT] Received data:", data);

    // Check if user is authenticated
    const user = locals.user;
    const isAuthenticated = !!user;

    console.log("[MEP-SUBMIT] User authenticated:", isAuthenticated);

    let userId: string;
    let userEmail: string;
    let userPhone: string | null = null;
    let firstName: string = "";
    let lastName: string = "";

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    if (isAuthenticated) {
      // User is logged in - use their existing account
      userId = user.id;
      userEmail = user.email!;
      userPhone = data.phone?.toString() || user.phone || null;

      // Get user profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", userId)
        .single();

      if (profile?.name) {
        const nameParts = profile.name.split(" ");
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(" ") || "";
      }

      console.log("[MEP-SUBMIT] Using authenticated user:", userId, userEmail);
    } else {
      // User is NOT logged in - create or find user account
      userEmail = data.email?.toString()!;
      userPhone = data.phone?.toString() || null;
      firstName = data.firstName?.toString() || "";
      lastName = data.lastName?.toString() || "";
      const fullName = `${firstName} ${lastName}`.trim();

      console.log("[MEP-SUBMIT] No auth - creating/finding user for:", userEmail);

      // Check if user already exists by email
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, name, phone")
        .eq("email", userEmail)
        .single();

      if (existingProfile) {
        // User exists - use their ID
        userId = existingProfile.id;
        console.log("[MEP-SUBMIT] Found existing user:", userId);

        // Update their profile if new data provided
        if (fullName || userPhone) {
          await supabase
            .from("profiles")
            .update({
              ...(fullName && { name: fullName }),
              ...(userPhone && { phone: userPhone }),
            })
            .eq("id", userId);
          console.log("[MEP-SUBMIT] Updated existing profile");
        }
      } else {
        // User doesn't exist - create a temporary password and account
        const tempPassword = Math.random().toString(36).slice(-12) + "Aa1!"; // Random secure password

        console.log("[MEP-SUBMIT] Creating new user account for:", userEmail);

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userEmail,
          password: tempPassword,
          email_confirm: false, // Don't require email confirmation for MEP submissions
          user_metadata: {
            firstName,
            lastName,
            full_name: fullName,
            phone: userPhone,
            source: "mep-form",
          },
        });

        if (authError) {
          console.error("[MEP-SUBMIT] Error creating user:", authError);
          throw authError;
        }

        userId = authData.user.id;
        console.log("[MEP-SUBMIT] Created new user:", userId);

        // Create profile
        await supabase.from("profiles").insert({
          id: userId,
          email: userEmail,
          name: fullName,
          phone: userPhone,
          role: "Client",
        });

        console.log("[MEP-SUBMIT] Created profile for new user");

        // TODO: Send password reset email so they can set their own password
        // await supabase.auth.resetPasswordForEmail(userEmail, {
        //   redirectTo: `${new URL(request.url).origin}/auth/reset-password`,
        // });
      }
    }

    // Now create the MEP project
    const projectData = {
      authorId: userId,
      address: data.address?.toString() || "",
      title: `MEP Project - ${data.address?.toString() || "No Address"}`,
      // Add other MEP-specific fields here as you add more steps
      status: 1, // Initial status
    };

    console.log("[MEP-SUBMIT] Creating project:", projectData);

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert(projectData)
      .select()
      .single();

    if (projectError) {
      console.error("[MEP-SUBMIT] Error creating project:", projectError);
      throw projectError;
    }

    console.log("[MEP-SUBMIT] Project created:", project.id);

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: "MEP project submitted successfully",
        projectId: project.id,
        userId: userId,
        redirect: `/project/${project.id}`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("[MEP-SUBMIT] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to submit MEP project",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
