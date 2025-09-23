import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { getMedia } from "../../lib/media";

export const GET: APIRoute = async ({ request, cookies, url }) => {
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

    const searchParams = url.searchParams;
    const project_id = searchParams.get("project_id");

    if (!project_id) {
      return new Response(JSON.stringify({ success: false, error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use the media system to get files with proper signed URLs
    const result = await getMedia({
      projectId: project_id,
      targetLocation: "documents",
      currentUser,
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        files: result.media,
        count: result.count || 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in get-project-files:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
