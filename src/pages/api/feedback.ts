import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { type, priority, subject, message, anonymous } = await request.json();

    // Validate required fields
    if (!type || !priority || !subject || !message) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get session from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized - Please sign in to submit feedback",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Set session
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !sessionData.user) {
      return new Response(
        JSON.stringify({
          error: "Invalid session",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = sessionData.user.id;

    // Insert feedback into database
    const { data, error } = await supabase
      .from("feedback")
      .insert({
        userId: anonymous ? null : userId,
        type,
        priority,
        subject,
        message,
        anonymous,
        createdAt: new Date().toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting feedback:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to submit feedback",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Feedback submitted successfully",
        data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing feedback:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
