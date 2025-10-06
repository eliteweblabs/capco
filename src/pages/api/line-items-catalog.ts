import type { APIRoute } from "astro";
import { apiCache } from "../../lib/api-cache";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    },
  });
};

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
    const ids = searchParams.get("ids") || "";
    const id = searchParams.get("id") || "";

    // Check cache first (but not for specific IDs)
    const cacheKey = `catalog-items-${searchTerm}-${category}-${limit}-${ids}`;
    const cached = apiCache.get(cacheKey);
    if (cached && !ids) {
      return new Response(JSON.stringify({ success: true, items: cached, cached: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build query conditions
    let query = supabase.from("lineItemsCatalog").select("*");

    // If specific ID is requested, fetch that single item
    if (id) {
      const itemId = parseInt(id.trim());
      if (!isNaN(itemId)) {
        query = query.eq("id", itemId);
      } else {
        return new Response(JSON.stringify({ success: false, error: "Invalid ID format" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    // If specific IDs are requested, fetch those items
    else if (ids) {
      const idArray = ids
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (idArray.length > 0) {
        query = query.in("id", idArray);
      } else {
        return new Response(JSON.stringify({ success: true, items: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      // Add search conditions for general queries
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (category) {
        query = query.eq("category", category);
      }

      // Only show active items for general queries
      query = query.eq("isActive", true);

      // Add limit and ordering for general queries
      query = query.limit(limit).order("name", { ascending: true });
    }

    const { data: items, error } = await query;

    if (error) {
      console.error("Error fetching catalog items:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch catalog items" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Cache results for 10 minutes (popular items change less frequently)
    if (!id) {
      apiCache.set(cacheKey, items, 10);
    }

    // For single item queries, return the item directly
    if (id) {
      const item = items && items.length > 0 ? items[0] : null;
      return new Response(JSON.stringify({ success: true, item: item }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

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
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
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

    // Test database connection and table existence
    try {
      const { data: testData, error: testError } = await supabase
        .from("lineItemsCatalog")
        .select("id")
        .limit(1);

      if (testError) {
        console.error("🔍 [LINE-ITEMS-CATALOG] Database test failed:", testError);
        return new Response(
          JSON.stringify({ error: "Database table not accessible", details: testError.message }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      console.log("🔍 [LINE-ITEMS-CATALOG] Database connection test successful");
    } catch (testError) {
      console.error("🔍 [LINE-ITEMS-CATALOG] Database connection test error:", testError);
      return new Response(
        JSON.stringify({ error: "Database connection failed", details: testError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const requestBody = await request.json();
    console.log("🔍 [LINE-ITEMS-CATALOG] Received request body:", requestBody);

    const { name, description, unitPrice, category } = requestBody;

    if (!name || !description || unitPrice === undefined) {
      return new Response(
        JSON.stringify({ error: "Name, description, and unitPrice are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔍 [LINE-ITEMS-CATALOG] Creating catalog item with data:", {
      name: name.trim(),
      description: description.trim(),
      unitPrice: parseFloat(unitPrice),
      category: category?.trim() || null,
      createdBy: currentUser.id,
    });

    const { data: newItem, error } = await supabase
      .from("lineItemsCatalog")
      .insert({
        name: name.trim(),
        description: description.trim(),
        unitPrice: parseFloat(unitPrice),
        category: category?.trim() || null,
        createdBy: currentUser.id,
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
    const { isAuth, currentRole, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser || !["Admin", "Staff"].includes(currentRole)) {
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

    const { id, name, description, unitPrice, category, isActive } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "Item ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (unitPrice !== undefined) updateData.unitPrice = parseFloat(unitPrice);
    if (category !== undefined) updateData.category = category?.trim() || null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const { data: updatedItem, error } = await supabase
      .from("lineItemsCatalog")
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
