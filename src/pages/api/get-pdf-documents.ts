import { createClient } from "@supabase/supabase-js";
import type { APIRoute } from "astro";

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

    // Check if pdf_documents table exists by attempting a simple query
    const { data: testPdfs, error: pdfsError } = await supabase
      .from("pdf_documents")
      .select("*")
      .limit(1);

    // If table doesn't exist, return empty result instead of failing
    if (pdfsError && pdfsError.code === "PGRST202") {
      console.log("PDF documents table doesn't exist yet, returning empty result");
      return new Response(
        JSON.stringify({
          pdfs: [],
          count: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // If table exists but has relationship issues, try simple query without join
    if (pdfsError && pdfsError.code === "PGRST200") {
      console.log("PDF documents table exists but has relationship issues, querying without join");
      let simpleQuery = supabase.from("pdf_documents").select("*");

      // Filter by project IDs if provided
      if (projectIds && projectIds.length > 0) {
        simpleQuery = simpleQuery.in("project_id", projectIds);
      }

      const { data: simplePdfs, error: simpleError } = await simpleQuery;

      if (simpleError) {
        console.error("Error with simple PDF query:", simpleError);
        return new Response(
          JSON.stringify({
            pdfs: [],
            count: 0,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          pdfs: simplePdfs || [],
          count: simplePdfs?.length || 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Query with full join for when everything works properly
    let fullQuery = supabase.from("pdf_documents").select(`
        *,
        projects!inner(id, author_id, title)
      `);

    // Filter by project IDs if provided
    if (projectIds && projectIds.length > 0) {
      fullQuery = fullQuery.in("project_id", projectIds);
    }

    const { data: fullPdfs, error: fullError } = await fullQuery;

    if (fullError) {
      console.error("Error with full PDF query:", fullError);
      // Fallback to simple query
      let fallbackQuery = supabase.from("pdf_documents").select("*");
      if (projectIds && projectIds.length > 0) {
        fallbackQuery = fallbackQuery.in("project_id", projectIds);
      }
      const { data: fallbackPdfs, error: fallbackError } = await fallbackQuery;

      return new Response(
        JSON.stringify({
          pdfs: fallbackPdfs || [],
          count: fallbackPdfs?.length || 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const pdfs = fullPdfs;

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
