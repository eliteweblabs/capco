// Unified Media API
// Handles all media operations: GET, POST, PUT, DELETE
// Uses the media service functions

import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { deleteMedia, getMedia, saveMedia, updateFeaturedImage } from "../../lib/media";

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
    const projectId = searchParams.get("projectId");
    const targetLocation = searchParams.get("targetLocation");
    const targetId = searchParams.get("targetId");
    const fileId = searchParams.get("fileId");
    const mediaType = searchParams.get("mediaType");

    const result = await getMedia({
      projectId,
      targetLocation,
      targetId,
      fileId,
      mediaType,
      currentUser,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to get media: ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

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

    const body = await request.json();

    const {
      mediaData,
      fileName,
      fileType,
      projectId,
      targetLocation,
      targetId,
      title,
      description,
    } = body;

    if (!mediaData || !fileName || !targetLocation) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Media data, file name, and target location are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await saveMedia({
      mediaData,
      fileName,
      fileType,
      projectId,
      targetLocation,
      targetId,
      title,
      description,
      currentUser,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Media saved successfully",
        file: result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to save media: ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
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

    const body = await request.json();
    const { projectId, fileId, mediaType, isActive } = body;

    if (mediaType === "featured_image" && projectId && fileId !== undefined) {
      const result = await updateFeaturedImage(projectId, fileId, isActive, currentUser);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid update operation",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to update media: ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
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

    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
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

    const result = await deleteMedia(fileId, currentUser);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to delete media: ${error.message}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
