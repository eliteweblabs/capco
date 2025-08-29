import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { filePath, fileName } = await request.json();

    console.log("Download API called with:", { filePath, fileName });

    if (!filePath || !fileName) {
      return new Response(JSON.stringify({ error: "File path and name are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set up session from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Download file from Supabase Storage
    console.log("Attempting to download from storage:", filePath);
    
    // Extract the actual file path (remove bucket prefix if present)
    let actualFilePath = filePath;
    if (filePath.startsWith("project-documents/")) {
      actualFilePath = filePath.replace("project-documents/", "");
    }
    
    console.log("Actual file path for download:", actualFilePath);
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("project-documents")
      .download(actualFilePath);

    if (downloadError || !fileData) {
      console.error("Error downloading file from storage:", downloadError);
      console.error("File path attempted:", filePath);
      return new Response(JSON.stringify({ 
        error: "Failed to download file",
        details: downloadError?.message || "Unknown error",
        filePath: filePath
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer();

    // Return file with proper headers for download
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": arrayBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Download API error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
