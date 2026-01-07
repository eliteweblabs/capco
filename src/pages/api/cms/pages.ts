import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * CMS Pages API
 * Manage page content stored in Supabase database
 * Allows per-deployment customization without git commits
 */

// Get all pages or a specific page
export const GET: APIRoute = async ({ request, url }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const slug = url.searchParams.get("slug");
    const clientId = process.env.RAILWAY_PROJECT_NAME || null;

    if (slug) {
      // Get specific page
      const { data, error } = await supabaseAdmin
        .from("cms_pages")
        .select("*")
        .eq("slug", slug)
        .or(`client_id.is.null,client_id.eq.${clientId}`)
        .order("client_id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ page: data }), {
        status: data ? 200 : 404,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Get all pages
      const { data, error } = await supabaseAdmin
        .from("cms_pages")
        .select("*")
        .or(`client_id.is.null,client_id.eq.${clientId}`)
        .order("slug");

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ pages: data || [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    console.error("❌ [CMS-PAGES] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch pages" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Create or update a page
export const POST: APIRoute = async ({ request }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { slug, title, description, content, frontmatter, template } = body;

    if (!slug || !content) {
      return new Response(
        JSON.stringify({ error: "Slug and content are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const clientId = process.env.RAILWAY_PROJECT_NAME || null;

    // Upsert (insert or update)
    const { data, error } = await supabaseAdmin
      .from("cms_pages")
      .upsert(
        {
          slug,
          title: title || null,
          description: description || null,
          content,
          frontmatter: frontmatter || {},
          template: template || "default",
          client_id: clientId,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "slug,client_id",
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Clear cache for this page
    // Note: Cache clearing would need to be implemented in content.ts

    return new Response(JSON.stringify({ page: data, message: "Page saved successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [CMS-PAGES] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to save page" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Delete a page
export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const slug = url.searchParams.get("slug");
    if (!slug) {
      return new Response(
        JSON.stringify({ error: "Slug is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const clientId = process.env.RAILWAY_PROJECT_NAME || null;

    const { error } = await supabaseAdmin
      .from("cms_pages")
      .delete()
      .eq("slug", slug)
      .eq("client_id", clientId);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ message: "Page deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [CMS-PAGES] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to delete page" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

