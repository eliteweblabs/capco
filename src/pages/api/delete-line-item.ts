import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { itemId } = await request.json();

    if (!itemId) {
      return new Response(
        JSON.stringify({ error: "Line item ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.log("Deleting line item:", itemId);

    const { error } = await supabase
      .from("invoice_line_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      console.error("Error deleting line item:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to delete line item",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Line item deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Delete line item API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
