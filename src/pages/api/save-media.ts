import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
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

    const body = await request.json();
    const { mediaData, fileName, fileType } = body;

    if (!mediaData || !fileName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Media data and file name are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // In a real implementation, you would save the media to storage
    // For now, just return a success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Media saved successfully",
        fileName: fileName,
        fileType: fileType || "unknown",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Save media error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to save media",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
