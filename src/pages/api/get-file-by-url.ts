import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication
    const { isAuth } = await checkAuth(cookies);

    if (!isAuth) {
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

    const fileUrl = url.searchParams.get("url");

    if (!fileUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "File URL is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Basic file URL validation
    try {
      new URL(fileUrl);
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid file URL",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return the file URL (in a real implementation, you might want to proxy the file)
    return new Response(
      JSON.stringify({
        success: true,
        fileUrl: fileUrl,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get file by URL error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get file",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
