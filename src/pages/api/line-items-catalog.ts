import type { APIRoute } from "astro";
import { apiCache } from "../../lib/api-cache";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

// GET: Search and retrieve catalog items
export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const { isAuth } = await checkAuth(cookies);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const searchParams = new URL(url).searchParams;
    const searchTerm = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    // Check cache first
    const cacheKey = `catalog-items-${searchTerm}-${category}-${limit}`;
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return new Response(JSON.stringify({ success: true, items: cached, cached: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use the search function if search term or category is provided
    if (searchTerm || category) {
      const { data: items, error } = await supabase.rpc("search_catalog_items", {
        p_search_term: searchTerm || null,
        p_category: category || null,
        p_limit: limit,
      });

      if (error) {
        console.error("Error searching catalog items:", error);
        return new Response(JSON.stringify({ error: "Failed to search catalog items" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Cache results for 5 minutes
      apiCache.set(cacheKey, items, 5);

      return new Response(JSON.stringify({ success: true, items: items || [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Default: get popular items from catalog
    const { data: items, error } = await supabase.rpc("search_catalog_items", {
      p_search_term: null,
      p_category: null,
      p_limit: limit,
    });

    if (error) {
      console.error("Error fetching popular catalog items:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch catalog items" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Cache results for 10 minutes (popular items change less frequently)
    apiCache.set(cacheKey, items, 10);

    return new Response(JSON.stringify({ success: true, items: items || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Catalog items GET error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// POST: Create new catalog item
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, user } = await checkAuth(cookies);
    if (!isAuth || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { name, description, unit_price, category } = await request.json();

    if (!name || !description || unit_price === undefined) {
      return new Response(
        JSON.stringify({ error: "Name, description, and unit_price are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { data: newItem, error } = await supabase
      .from("line_items_catalog")
      .insert({
        name: name.trim(),
        description: description.trim(),
        unit_price: parseFloat(unit_price),
        category: category?.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating catalog item:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create catalog item", details: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Clear related cache entries
    apiCache.clear();

    return new Response(JSON.stringify({ success: true, item: newItem }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Catalog items POST error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// PUT: Update existing catalog item (Admin only)
export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, role, user } = await checkAuth(cookies);
    if (!isAuth || !user || !["Admin", "Staff"].includes(role)) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id, name, description, unit_price, category, is_active } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "Item ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (unit_price !== undefined) updateData.unit_price = parseFloat(unit_price);
    if (category !== undefined) updateData.category = category?.trim() || null;
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const { data: updatedItem, error } = await supabase
      .from("line_items_catalog")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating catalog item:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update catalog item", details: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Clear cache
    apiCache.clear();

    return new Response(JSON.stringify({ success: true, item: updatedItem }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Catalog items PUT error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
