import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { projectId, authorEmail } = await request.json();

    if (!projectId || !authorEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing projectId or authorEmail",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Generate magic link for this specific project
    const { data, error } = await supabase.auth.signInWithOtp({
      email: authorEmail,
      options: {
        emailRedirectTo: `${process.env.SITE_URL || "http://localhost:4321"}/project/${projectId}/view?token=magic`,
        data: {
          projectId: projectId,
          action: "view_project",
        },
      },
    });

    if (error) {
      console.error("Magic link error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Magic link sent successfully",
        data: data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Send magic link error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to send magic link",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
