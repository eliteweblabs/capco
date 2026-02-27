import type { APIRoute } from "astro";
import { quoteClientIdForPostgrest } from "../../../lib/content";
import { clearBlockPageCache } from "../../../lib/content-blocks";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * CMS Block Pages API
 * List, get, create/update, and delete block-based pages (cmsBlockPages).
 */

export const GET: APIRoute = async ({ url }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const slug = url.searchParams.get("slug");
    const clientId = process.env.RAILWAY_PROJECT_NAME || null;

    if (slug) {
      let query = supabaseAdmin.from("cmsBlockPages").select("*").eq("slug", slug).eq("isActive", true);
      if (clientId) {
        query = query.or(`clientId.is.null,clientId.eq.${quoteClientIdForPostgrest(clientId)}`);
      }
      const { data, error } = await query.order("clientId", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return new Response(JSON.stringify({ page: data }), {
        status: data ? 200 : 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    let query = supabaseAdmin.from("cmsBlockPages").select("*").eq("isActive", true);
    if (clientId) {
      query = query.or(`clientId.is.null,clientId.eq.${quoteClientIdForPostgrest(clientId)}`);
    }
    const { data, error } = await query.order("slug");
    if (error) throw error;
    return new Response(JSON.stringify({ pages: data || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [CMS-BLOCK-PAGES] GET Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to fetch block pages" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { slug, title, description, sections } = body;

    if (!slug || typeof slug !== "string" || !slug.trim()) {
      return new Response(JSON.stringify({ error: "Slug is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const clientId = process.env.RAILWAY_PROJECT_NAME || null;
    const normalizedSlug = slug.trim().replace(/^\/+|\/+$/g, "") || "home";
    const sectionsArray = Array.isArray(sections) ? sections : [];

    const row = {
      slug: normalizedSlug,
      title: title ?? normalizedSlug,
      description: description ?? "",
      sections: sectionsArray,
      clientId: clientId || null,
      isActive: true,
    };

    const { data: existing } = await supabaseAdmin
      .from("cmsBlockPages")
      .select("id")
      .eq("slug", normalizedSlug)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin
        .from("cmsBlockPages")
        .update({ title: row.title, description: row.description, sections: row.sections })
        .eq("id", existing.id);
      if (error) throw error;
      clearBlockPageCache(normalizedSlug);
      return new Response(JSON.stringify({ success: true, slug: normalizedSlug }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error } = await supabaseAdmin.from("cmsBlockPages").insert(row);
    if (error) throw error;
    clearBlockPageCache(normalizedSlug);
    return new Response(JSON.stringify({ success: true, slug: normalizedSlug }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [CMS-BLOCK-PAGES] POST Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to save block page" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json().catch(() => ({}));
    const slug = body.slug ?? new URL(request.url).searchParams.get("slug");
    if (!slug) {
      return new Response(JSON.stringify({ error: "Slug is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error } = await supabaseAdmin.from("cmsBlockPages").delete().eq("slug", slug);
    if (error) throw error;
    clearBlockPageCache(slug);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [CMS-BLOCK-PAGES] DELETE Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to delete block page" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
