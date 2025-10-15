import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { projectIds } = await request.json();

    // Initialize Supabase client
    const supabase = createClient(
      import.meta.env.SUPABASE_URL!,
      import.meta.env.SUPABASE_ANON_KEY!
    );

    // Set up session from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Call the database function to get PDF documents
    const { data: pdfs, error: pdfsError } = await supabase.rpc("get_user_pdf_documents", {
      project_ids: projectIds || null,
    });

    if (pdfsError) {
      console.error("Error fetching PDF documents:", pdfsError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch PDF documents",
          details: pdfsError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        pdfs: pdfs || [],
        count: pdfs?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get PDF documents error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to fetch PDF documents",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
