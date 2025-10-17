import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Files UPSERT API
 *
 * Handles both creating new files and updating existing ones
 *
 * POST Body:
 * - id?: number (if updating existing file)
 * - projectId: number
 * - fileName: string
 * - filePath: string
 * - fileSize?: number
 * - mimeType?: string
 * - title?: string
 * - comments?: string
 * - isPrivate?: boolean
 * - authorId: string
 * - bucketName?: string
 *
 * Examples:
 * - Create: POST /api/files/upsert { projectId, fileName, filePath, authorId }
 * - Update: POST /api/files/upsert { id, title, comments, isPrivate }
 */

interface FileData {
  id?: number;
  projectId: number;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  title?: string;
  comments?: string;
  isPrivate?: boolean;
  authorId: string;
  bucketName?: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const fileData: FileData = body;

    // Validate required fields
    if (!fileData.projectId || !fileData.fileName?.trim() || !fileData.filePath?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "projectId, fileName, and filePath are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!fileData.authorId?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "authorId is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(
      `📁 [FILES-UPSERT] ${fileData.id ? "Updating" : "Creating"} file:`,
      fileData.fileName
    );

    if (!supabase || !supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prepare file data for update (only update fields that should be updated)
    const filePayload = {
      title: fileData.title?.trim() || null,
      comments: fileData.comments?.trim() || null,
      isPrivate: fileData.isPrivate || false,
      updatedAt: new Date().toISOString(),
    };

    let result;
    let isUpdate = false;

    if (fileData.id) {
      // Update existing file
      const { data, error } = await supabaseAdmin
        .from("files")
        .update(filePayload)
        .eq("id", fileData.id)
        .select()
        .single();

      if (error) {
        console.error("❌ [FILES-UPSERT] Error updating file:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to update file",
            details: error.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      result = data;
      isUpdate = true;
    } else {
      // Create new file
      const { data, error } = await supabaseAdmin
        .from("files")
        .insert([
          {
            ...filePayload,
            createdAt: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("❌ [FILES-UPSERT] Error creating file:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to create file",
            details: error.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      result = data;
    }

    console.log(
      `✅ [FILES-UPSERT] File ${isUpdate ? "updated" : "created"} successfully:`,
      result.id
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: `File ${isUpdate ? "updated" : "created"} successfully`,
      }),
      { status: isUpdate ? 200 : 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [FILES-UPSERT] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
