import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

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

    const { description, unit_price, category } = await request.json();

    if (!description || !unit_price) {
      return new Response(JSON.stringify({ error: "Description and unit price are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract a reasonable name from the description (first 50 characters)
    const name = description.length > 50 ? description.substring(0, 47) + "..." : description;

    // Check if a similar item already exists in the catalog
    const { data: existing } = await supabase
      .from("line_items_catalog")
      .select("id, usage_count")
      .or(`name.ilike.%${name}%,description.ilike.%${description}%`)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (existing) {
      // Similar item exists, increment usage count
      const { data: updated, error: updateError } = await supabase
        .from("line_items_catalog")
        .update({
          usage_count: existing.usage_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating catalog item usage:", updateError);
        // Don't fail the request if usage count update fails
      }

      return new Response(
        JSON.stringify({
          success: true,
          catalog_item: updated,
          message: "Similar catalog item usage updated",
          isNew: false,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      // Create new catalog item
      const { data: newItem, error: insertError } = await supabase
        .from("line_items_catalog")
        .insert({
          name,
          description,
          unit_price: parseFloat(unit_price),
          category: category || "General",
          usage_count: 1,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating catalog item:", insertError);
        // Don't fail the request if catalog creation fails
        return new Response(
          JSON.stringify({
            success: true,
            message: "Line item processed (catalog creation failed)",
            error: insertError.message,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          catalog_item: newItem,
          message: "New catalog item created from line item",
          isNew: true,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Auto-save line item error:", error);
    return new Response(
      JSON.stringify({
        success: true, // Don't fail the main operation
        message: "Line item processed (auto-save failed)",
        error: error.message,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
