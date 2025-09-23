import { createClient } from "@supabase/supabase-js";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Get Supabase client
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Supabase configuration missing" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the request body
    const body = await request.json();
    const { type, priority, subject, message, anonymous } = body;

    // Validate required fields
    if (!type || !priority || !subject || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user session
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    let userId = null;
    let userEmail = null;
    let userName = null;

    if (accessToken && refreshToken && !anonymous) {
      try {
        // Create a client with the user's session
        const supabaseUser = createClient(supabaseUrl, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        });

        const {
          data: { user },
          error: userError,
        } = await supabaseUser.auth.getUser();

        if (!userError && user) {
          userId = user.id;
          userEmail = user.email;

          // Get user profile for name
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", user.id)
            .single();

          userName = profile?.name || user.email;
        }
      } catch (error) {
        console.warn("Could not get user info for feedback:", error);
        // Continue with anonymous feedback
      }
    }

    // Prepare feedback data
    const feedbackData = {
      type,
      priority,
      subject: subject.trim(),
      message: message.trim(),
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      anonymous: anonymous || false,
      status: "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert feedback into database
    const { data, error } = await supabase
      .from("feedback")
      .insert([feedbackData])
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return new Response(JSON.stringify({ error: "Failed to save feedback" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log feedback submission for monitoring
    console.log(`📝 [FEEDBACK] New feedback submitted:`, {
      id: data.id,
      type,
      priority,
      subject,
      anonymous,
      userId: userId || "anonymous",
    });

    // Send notification to admins (optional)
    try {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("role", "Admin");

      if (admins && admins.length > 0) {
        // You can add email notifications here if needed
        console.log(`📧 [FEEDBACK] Notifying ${admins.length} admin(s) about new feedback`);
      }
    } catch (notificationError) {
      console.warn("Could not notify admins:", notificationError);
      // Don't fail the request if notification fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Feedback submitted successfully",
        id: data.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Feedback API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Handle OPTIONS request for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};
