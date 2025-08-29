import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    console.log("Test download API called");

    // Set up session from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    console.log("Auth tokens:", { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken 
    });

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log("User auth result:", { 
      hasUser: !!user, 
      userError: userError?.message 
    });

    if (userError || !user) {
      return new Response(JSON.stringify({ 
        error: "Authentication required",
        details: userError?.message 
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Test listing files in the bucket
    try {
      const { data: files, error: listError } = await supabase.storage
        .from("project-documents")
        .list("", { limit: 10 });

      console.log("Storage list result:", { 
        filesCount: files?.length || 0, 
        error: listError?.message 
      });

      return new Response(JSON.stringify({
        success: true,
        user: { id: user.id, email: user.email },
        storage: {
          files: files || [],
          error: listError?.message || null
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (storageError) {
      console.error("Storage error:", storageError);
      return new Response(JSON.stringify({
        error: "Storage access error",
        details: (storageError as Error).message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Test download API error:", error);
    return new Response(JSON.stringify({
      error: "Test failed",
      details: (error as Error).message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
