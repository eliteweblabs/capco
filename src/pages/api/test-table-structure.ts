import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async () => {
  try {
    // Try to select the notify column specifically
    const { data: statusWithNotify, error: notifyError } = await supabase
      .from("project_statuses")
      .select("status_code, status_name, notify")
      .eq("status_code", 20)
      .single();

    if (notifyError) {
      console.error("Error fetching with notify column:", notifyError);

      // Try without notify column to see if it exists
      const { data: statusWithoutNotify, error: noNotifyError } = await supabase
        .from("project_statuses")
        .select("status_code, status_name")
        .eq("status_code", 20)
        .single();

      return new Response(
        JSON.stringify({
          success: false,
          error: "notify column may not exist",
          notifyError: notifyError.message,
          noNotifyError: noNotifyError?.message,
          statusWithoutNotify,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        statusWithNotify,
        notifyColumnExists: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Test table structure API error:", error);
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
