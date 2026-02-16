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
      let query = supabaseAdmin.from("cmsPages").select("*").eq("slug", slug);

      // Filter by clientId: show global (null) or matching clientId
      if (clientId) {
        query = query.or(`clientId.is.null,clientId.eq.${clientId}`);
      }
      // If no clientId set, query already has correct scope for all pages

      const { data, error } = await query
        .order("clientId", { ascending: false })
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
      let query = supabaseAdmin.from("cmsPages").select("*");

      // Filter by clientId: show global (null) or matching clientId
      if (clientId) {
        query = query.or(`clientId.is.null,clientId.eq.${clientId}`);
      }
      // If no clientId set, show all pages (no filter)

      // Try to order by displayOrder if column exists, otherwise order by slug
      // Note: If displayOrder column doesn't exist yet, this will fall back gracefully
      let { data, error } = await query.order("displayOrder", {
        ascending: true,
        nullsFirst: false,
      });

      // If ordering by displayOrder fails (column doesn't exist), fall back to slug ordering
      if (error && error.code === "42703") {
        // Column doesn't exist, use slug ordering instead
        let fallbackQuery = supabaseAdmin.from("cmsPages").select("*");
        if (clientId) {
          fallbackQuery = fallbackQuery.or(`clientId.is.null,clientId.eq.${clientId}`);
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
    let {
      slug,
      title,
      description,
      content,
      frontmatter,
      template,
      includeInNavigation,
      nav_roles,
      nav_page_type,
      nav_button_style,
      nav_desktop_only,
      nav_hide_when_auth,
    } = body;

    // Sanitize slug: remove leading/trailing slashes and whitespace
    // EXCEPT for '/' which is allowed for the home page
    if (slug) {
      slug = slug.trim();
      if (slug !== "/") {
        slug = slug.replace(/^\/+|\/+$/g, "");
      }
    }
    console.log("📥 [CMS-PAGES] Extracted values:", {
      slug,
      title,
      description,
      content: content?.substring(0, 50) + "...",
      template,
      includeInNavigation,
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
    const { error: tableCheckError } = await supabaseAdmin.from("cmsPages").select("id").limit(1);

    if (tableCheckError) {
      // Check if it's a "relation does not exist" error
      if (tableCheckError.code === "42P01" || tableCheckError.message?.includes("does not exist")) {
        throw new Error(
          "The cmsPages table does not exist. Please run the SQL migration: sql-queriers/create-cms-pages-table.sql"
        );
      }
      console.error("❌ [CMS-PAGES] Error checking table:", tableCheckError);
      throw tableCheckError;
    }

    // Check if page already exists (use same logic as GET to avoid duplicates)
    let query = supabaseAdmin.from("cmsPages").select("*").eq("slug", slug);

    // Use same OR logic as GET to find either global or client-specific page
    if (clientId) {
      query = query.or(`clientId.is.null,clientId.eq.${clientId}`);
    }
    // If no clientId set, show all pages (no filter)

    const { data: existingPages, error: queryError } = await query.order("clientId", {
      ascending: false,
    }); // Client-specific takes priority

    if (queryError) {
      console.error("❌ [CMS-PAGES] Error checking for existing page:", queryError);
      throw queryError;
    }

    // Get the highest priority page (client-specific over global)
    const existingPage = existingPages && existingPages.length > 0 ? existingPages[0] : null;

    let data, error;

    if (existingPage) {
      // Update existing page
      const updateData: any = {
        title: title || null,
        description: description || null,
        content,
        frontmatter: frontmatter || {},
        template: template || "default",
        includeInNavigation: includeInNavigation === true,
        navRoles: nav_roles && Array.isArray(nav_roles) ? nav_roles : ["any"],
        navPageType: nav_page_type || "frontend",
        navButtonStyle: nav_button_style || null,
        navDesktopOnly: nav_desktop_only === true,
        navHideWhenAuth: nav_hide_when_auth === true,
        isActive: true,
        updatedAt: new Date().toISOString(),
      };

      const result = await supabaseAdmin
        .from("cmsPages")
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
        includeInNavigation: includeInNavigation === true,
        navRoles: nav_roles && Array.isArray(nav_roles) ? nav_roles : ["any"],
        navPageType: nav_page_type || "frontend",
        navButtonStyle: nav_button_style || null,
        navDesktopOnly: nav_desktop_only === true,
        navHideWhenAuth: nav_hide_when_auth === true,
        clientId: clientId,
        isActive: true,
        // displayOrder will be set if column exists, otherwise ignored
        updatedAt: new Date().toISOString(),
      };

      // Only set displayOrder if column exists (check by trying to get max value)
      // For now, we'll let it default to NULL if column doesn't exist
      // The migration will set initial values

      const result = await supabaseAdmin.from("cmsPages").insert(insertData).select().single();

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

    // Use same OR logic as GET to find pages to delete
    let deleteQuery = supabaseAdmin.from("cmsPages").delete().eq("slug", slug);

    if (clientId) {
      // Delete BOTH global and client-specific pages with this slug
      deleteQuery = deleteQuery.or(`clientId.is.null,clientId.eq.${clientId}`);
    }
    // If no clientId set, delete all pages with this slug (no filter)

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

    // Update displayOrder for each page
    const updatePromises = orders.map((item: { id: string; displayOrder: number }) =>
      supabaseAdmin.from("cmsPages").update({ displayOrder: item.displayOrder }).eq("id", item.id)
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
