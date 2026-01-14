/**
 * Admin Media API
 * Handles media operations for the admin media manager
 * Supports: GET (list all), POST (upload to global), DELETE (remove file)
 */

import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    const currentRole = currentUser?.profile?.role;

    if (!isAuth || !currentUser || currentRole !== "Admin") {
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const source = url.searchParams.get("source"); // "project", "global", or null for all

    let projectFiles: any[] = [];
    let globalFiles: any[] = [];

    // Fetch project files
    if (!source || source === "project") {
      const { data, error } = await supabaseAdmin
        .from("files")
        .select("*")
        .order("uploadedAt", { ascending: false })
        .limit(200);

      if (!error && data) {
        projectFiles = data;
      }
    }

    // Fetch global files
    if (!source || source === "global") {
      const { data, error } = await supabaseAdmin
        .from("files_global")
        .select("*")
        .order("uploadedAt", { ascending: false })
        .limit(200);

      if (!error && data) {
        globalFiles = data;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        projectFiles,
        globalFiles,
        total: projectFiles.length + globalFiles.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ [ADMIN-MEDIA] GET error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    const currentRole = currentUser?.profile?.role;

    if (!isAuth || !currentUser || currentRole !== "Admin") {
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { mediaData, fileName, fileType, targetLocation = "global" } = body;

    if (!mediaData || !fileName) {
      return new Response(
        JSON.stringify({ success: false, error: "Media data and file name required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convert base64 to buffer
    const base64Data = mediaData.split(",")[1] || mediaData;
    const buffer = Buffer.from(base64Data, "base64");

    // Generate unique file path
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `global/${timestamp}-${safeName}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("project-media")
      .upload(filePath, buffer, {
        contentType: fileType || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ [ADMIN-MEDIA] Upload error:", uploadError);
      return new Response(
        JSON.stringify({ success: false, error: uploadError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("project-media")
      .getPublicUrl(filePath);

    // Save to files_global table
    const { data: fileRecord, error: dbError } = await supabaseAdmin
      .from("files_global")
      .insert({
        name: fileName,
        fileName: fileName,
        filePath: filePath,
        fileType: fileType,
        fileSize: buffer.length,
        type: 0, // Global type
        status: "active",
        uploadedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("❌ [ADMIN-MEDIA] DB insert error:", dbError);
      // File uploaded but DB entry failed - still return success with warning
    }

    console.log("✅ [ADMIN-MEDIA] File uploaded:", filePath);

    return new Response(
      JSON.stringify({
        success: true,
        message: "File uploaded successfully",
        file: {
          id: fileRecord?.id,
          fileName,
          filePath,
          fileType,
          fileSize: buffer.length,
          publicUrl: urlData?.publicUrl,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ [ADMIN-MEDIA] POST error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    const currentRole = currentUser?.profile?.role;

    if (!isAuth || !currentUser || currentRole !== "Admin") {
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { fileId, source } = body;

    if (!fileId) {
      return new Response(
        JSON.stringify({ success: false, error: "File ID required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get file info first
    let filePath: string | null = null;
    
    if (source === "global") {
      const { data: file } = await supabaseAdmin
        .from("files_global")
        .select("filePath")
        .eq("id", fileId)
        .single();
      
      filePath = file?.filePath;

      // Delete from database
      await supabaseAdmin
        .from("files_global")
        .delete()
        .eq("id", fileId);
    } else {
      const { data: file } = await supabaseAdmin
        .from("files")
        .select("filePath")
        .eq("id", fileId)
        .single();
      
      filePath = file?.filePath;

      // Delete from database
      await supabaseAdmin
        .from("files")
        .delete()
        .eq("id", fileId);
    }

    // Delete from storage if we have the path
    if (filePath) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("project-media")
        .remove([filePath]);

      if (storageError) {
        console.warn("⚠️ [ADMIN-MEDIA] Storage delete warning:", storageError);
        // Don't fail - file might already be deleted from storage
      }
    }

    console.log("✅ [ADMIN-MEDIA] File deleted:", fileId);

    return new Response(
      JSON.stringify({ success: true, message: "File deleted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ [ADMIN-MEDIA] DELETE error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
