import { createClient } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);

    if (!isAuth || !currentUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const requestBody = await request.json();
    const { file_id, title, comments, is_private } = requestBody;

    if (!file_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "File ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update file details
    const { data, error } = await supabaseAdmin
      .from("files")
      .update({
        title: title || null,
        comments: comments || null,
        is_private: is_private || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", file_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating file details:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to update file details",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "File details updated successfully",
        data: data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in update-file-details:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
