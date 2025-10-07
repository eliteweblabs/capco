import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const url = formData.get('url')?.toString();
    const filename = formData.get('filename')?.toString();

    if (!url || !filename) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "URL and filename are required",
        }),
        { status: 400 }
      );
    }

    console.log(`📄 [FILE-DOWNLOAD] Proxying download for: ${filename} from ${url}`);

    // Fetch the file from the original URL
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch file from external URL: ${response.statusText}`);
    }

    // Get the file content as a Blob
    const fileBlob = await response.blob();

    // Determine content type, default to octet-stream to force download
    const contentType = response.headers.get("content-type") || "application/octet-stream";

    console.log(`✅ [FILE-DOWNLOAD] Successfully fetched file: ${filename} (${contentType})`);

    // Return the file as a downloadable attachment
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9\s-_.]/g, "_");

    return new Response(fileBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${sanitizedFilename}"`,
        // Prevent caching
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    console.error("❌ [FILE-DOWNLOAD] Error proxying file download:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to download file",
        error: error.message,
      }),
      { status: 500 }
    );
  }
};
