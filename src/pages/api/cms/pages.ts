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
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const slug = url.searchParams.get("slug");
    const clientId = process.env.RAILWAY_PROJECT_NAME || null;

    if (slug) {
      // Get specific page
      let query = supabaseAdmin
        .from("cms_pages")
        .select("*")
        .eq("slug", slug);
      
      // Filter by client_id: show global (null) or matching client_id
      if (clientId) {
        query = query.or(`client_id.is.null,client_id.eq.${clientId}`);
      } else {
        // If no clientId set, show all pages (both null and non-null client_id)
        // This ensures pages aren't hidden if RAILWAY_PROJECT_NAME is not set
        query = query;
      }
      
      const { data, error } = await query
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
      let query = supabaseAdmin
        .from("cms_pages")
        .select("*");
      
      // Filter by client_id: show global (null) or matching client_id
      if (clientId) {
        query = query.or(`client_id.is.null,client_id.eq.${clientId}`);
      }
      // If no clientId set, show all pages (no filter)
      
      // Try to order by display_order if column exists, otherwise order by slug
      // Note: If display_order column doesn't exist yet, this will fall back gracefully
      let { data, error } = await query.order("display_order", { ascending: true, nullsFirst: false });
      
      // If ordering by display_order fails (column doesn't exist), fall back to slug ordering
      if (error && error.code === "42703") {
        // Column doesn't exist, use slug ordering instead
        let fallbackQuery = supabaseAdmin.from("cms_pages").select("*");
        if (clientId) {
          fallbackQuery = fallbackQuery.or(`client_id.is.null,client_id.eq.${clientId}`);
        }
        const fallbackResult = await fallbackQuery.order("slug");
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

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
    return new Response(JSON.stringify({ error: error.message || "Failed to fetch pages" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Create or update a page
export const POST: APIRoute = async ({ request }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    console.log("📥 [CMS-PAGES] Received body:", JSON.stringify(body, null, 2));
    const {
      slug,
      title,
      description,
      content,
      frontmatter,
      template,
      include_in_navigation,
      nav_roles,
      nav_page_type,
      nav_button_style,
      nav_desktop_only,
      nav_hide_when_auth,
    } = body;
    console.log("📥 [CMS-PAGES] Extracted values:", {
      slug,
      title,
      description,
      content: content?.substring(0, 50) + "...",
      template,
      include_in_navigation,
      nav_roles,
      nav_page_type,
      nav_button_style,
      nav_desktop_only,
      nav_hide_when_auth,
    });

    if (!slug || !content) {
      return new Response(JSON.stringify({ error: "Slug and content are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const clientId = process.env.RAILWAY_PROJECT_NAME || null;

    // First, verify the table exists by attempting a simple query
    const { error: tableCheckError } = await supabaseAdmin.from("cms_pages").select("id").limit(1);

    if (tableCheckError) {
      // Check if it's a "relation does not exist" error
      if (tableCheckError.code === "42P01" || tableCheckError.message?.includes("does not exist")) {
        throw new Error(
          "The cms_pages table does not exist. Please run the SQL migration: sql-queriers/create-cms-pages-table.sql"
        );
      }
      console.error("❌ [CMS-PAGES] Error checking table:", tableCheckError);
      throw tableCheckError;
    }

    // Check if page already exists
    let query = supabaseAdmin.from("cms_pages").select("*").eq("slug", slug);

    if (clientId) {
      query = query.eq("client_id", clientId);
    } else {
      query = query.is("client_id", null);
    }

    const { data: existingPage, error: queryError } = await query.maybeSingle();

    if (queryError) {
      console.error("❌ [CMS-PAGES] Error checking for existing page:", queryError);
      throw queryError;
    }

    let data, error;

    if (existingPage) {
      // Update existing page
      const updateData: any = {
        title: title || null,
        description: description || null,
        content,
        frontmatter: frontmatter || {},
        template: template || "default",
        include_in_navigation: include_in_navigation === true,
        nav_roles: nav_roles && Array.isArray(nav_roles) ? nav_roles : ["any"],
        nav_page_type: nav_page_type || "frontend",
        nav_button_style: nav_button_style || null,
        nav_desktop_only: nav_desktop_only === true,
        nav_hide_when_auth: nav_hide_when_auth === true,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      const result = await supabaseAdmin
        .from("cms_pages")
        .update(updateData)
        .eq("id", existingPage.id)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      // Insert new page
      const insertData = {
        slug,
        title: title || null,
        description: description || null,
        content,
        frontmatter: frontmatter || {},
        template: template || "default",
        include_in_navigation: include_in_navigation === true,
        nav_roles: nav_roles && Array.isArray(nav_roles) ? nav_roles : ["any"],
        nav_page_type: nav_page_type || "frontend",
        nav_button_style: nav_button_style || null,
        nav_desktop_only: nav_desktop_only === true,
        nav_hide_when_auth: nav_hide_when_auth === true,
        client_id: clientId,
        is_active: true,
        // display_order will be set if column exists, otherwise ignored
        updated_at: new Date().toISOString(),
      };
      
      // Only set display_order if column exists (check by trying to get max value)
      // For now, we'll let it default to NULL if column doesn't exist
      // The migration will set initial values

      const result = await supabaseAdmin.from("cms_pages").insert(insertData).select().single();

      data = result.data;
      error = result.error;
    }

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
    console.error("❌ [CMS-PAGES] Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to save page",
        details: error.details || error.hint || null,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Delete a page
export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const slug = url.searchParams.get("slug");
    if (!slug) {
      return new Response(JSON.stringify({ error: "Slug is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const clientId = process.env.RAILWAY_PROJECT_NAME || null;

    let deleteQuery = supabaseAdmin.from("cms_pages").delete().eq("slug", slug);

    if (clientId) {
      deleteQuery = deleteQuery.eq("client_id", clientId);
    } else {
      deleteQuery = deleteQuery.is("client_id", null);
    }

    const { error } = await deleteQuery;

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ message: "Page deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [CMS-PAGES] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to delete page" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Reorder pages
export const PUT: APIRoute = async ({ request }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { orders } = body;

    if (!orders || !Array.isArray(orders)) {
      return new Response(JSON.stringify({ error: "Invalid request: orders array required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update display_order for each page
    const updatePromises = orders.map((item: { id: string; display_order: number }) =>
      supabaseAdmin
        .from("cms_pages")
        .update({ display_order: item.display_order })
        .eq("id", item.id)
    );

    const results = await Promise.all(updatePromises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      console.error("❌ [CMS-PAGES] Errors updating order:", errors);
      return new Response(
        JSON.stringify({ error: "Some pages failed to update", details: errors }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, message: "Order updated successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [CMS-PAGES] Error reordering pages:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to reorder pages" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
