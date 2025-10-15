import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import puppeteer from "puppeteer";

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const urlParams = new URLSearchParams(url.search);
    const fileId = urlParams.get("id");
    const type = urlParams.get("type") || "file"; // 'file', 'pdf', 'external'

    console.log(`📄 [DOWNLOAD] GET request - ID: ${fileId}, Type: ${type}`);

    if (!fileId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "File ID is required",
        }),
        { status: 400 }
      );
    }

    // Handle different download types
    switch (type) {
      case "file":
        return await handleFileDownload(fileId, cookies);
      case "pdf":
        return await handlePDFDownload(fileId, cookies);
      case "external":
        return await handleExternalDownload(fileId);
      default:
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid download type",
          }),
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("❌ [DOWNLOAD] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Download failed",
        error: error.message,
      }),
      { status: 500 }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      // Handle JSON requests (PDF generation, file downloads)
      const body = await request.json();
      const { htmlContent, documentName, filePath, fileName, projectId, type } = body;

      if (type === "pdf" && htmlContent && documentName) {
        return await generatePDF(htmlContent, documentName);
      } else if (type === "file" && filePath && fileName && projectId) {
        return await handleFileDownloadWithAuth(filePath, fileName, projectId, cookies);
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid request parameters",
          }),
          { status: 400 }
        );
      }
    } else if (contentType?.includes("multipart/form-data")) {
      // Handle FormData requests (external URL downloads)
      const formData = await request.formData();
      const url = formData.get("url")?.toString();
      const filename = formData.get("filename")?.toString();

      if (!url || !filename) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "URL and filename are required",
          }),
          { status: 400 }
        );
      }

      return await handleExternalURLDownload(url, filename);
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Unsupported content type",
        }),
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("❌ [DOWNLOAD] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Download failed",
        error: error.message,
      }),
      { status: 500 }
    );
  }
};

// Handle file download by ID (for PDFGenerator.astro)
async function handleFileDownload(fileId: string, cookies: any) {
  console.log(`📄 [DOWNLOAD] Handling file download for ID: ${fileId}`);

  // This would need to be implemented based on your file storage structure
  // For now, return a placeholder response
  return new Response(
    JSON.stringify({
      success: false,
      message: "File download by ID not implemented yet",
    }),
    { status: 501 }
  );
}

// Handle PDF download by ID
async function handlePDFDownload(fileId: string, cookies: any) {
  console.log(`📄 [DOWNLOAD] Handling PDF download for ID: ${fileId}`);

  // This would need to be implemented based on your PDF storage structure
  return new Response(
    JSON.stringify({
      success: false,
      message: "PDF download by ID not implemented yet",
    }),
    { status: 501 }
  );
}

// Handle external URL download
async function handleExternalDownload(fileId: string) {
  console.log(`📄 [DOWNLOAD] Handling external download for ID: ${fileId}`);

  // This would need to be implemented based on your external URL storage
  return new Response(
    JSON.stringify({
      success: false,
      message: "External download by ID not implemented yet",
    }),
    { status: 501 }
  );
}

// Generate PDF from HTML content
async function generatePDF(htmlContent: string, documentName: string) {
  console.log(`📄 [DOWNLOAD] Generating PDF for: ${documentName}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
    });

    await browser.close();

    const sanitizedFileName = documentName.replace(/[^a-zA-Z0-9\s-_]/g, "_");
    let bufferData: any;
    let bufferLength: number;

    if (pdfBuffer.buffer instanceof Buffer) {
      bufferData = pdfBuffer.buffer;
      bufferLength = (pdfBuffer.buffer as Buffer).length;
    } else {
      bufferData = pdfBuffer;
      bufferLength = (pdfBuffer as Uint8Array).length;
    }

    return new Response(bufferData, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${sanitizedFileName}.pdf"`,
        "Content-Length": bufferLength.toString(),
      },
    });
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Handle file download with authentication
async function handleFileDownloadWithAuth(
  filePath: string,
  fileName: string,
  projectId: string,
  cookies: any
) {
  console.log(`📄 [DOWNLOAD] Handling authenticated file download: ${fileName}`);

  // Set up session from cookies
  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;

  if (!supabase) {
    return new Response(JSON.stringify({ error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (accessToken && refreshToken && supabase) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify project access
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, authorId")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return new Response(JSON.stringify({ error: "Project not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check if user is admin or project owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "Client";
  const isAdmin = userRole === "Admin" || userRole === "Staff";
  const isProjectOwner = project.authorId === user.id;

  if (!isAdmin && !isProjectOwner) {
    return new Response(JSON.stringify({ error: "Access denied to project files" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get file record from database
  const { data: fileRecord, error: fileError } = await supabase
    .from("files")
    .select("bucketName, filePath, fileName")
    .eq("filePath", filePath)
    .eq("projectId", projectId)
    .single();

  if (fileError || !fileRecord) {
    return new Response(
      JSON.stringify({
        error: "File record not found in database",
        details: fileError?.message || "No matching file record",
        filePath: filePath,
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Download file from storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(fileRecord.bucketName)
    .download(fileRecord.filePath);

  if (downloadError || !fileData) {
    return new Response(
      JSON.stringify({
        error: "Failed to download file from storage",
        details: downloadError?.message || "Unknown error",
        bucket: fileRecord.bucketName,
        storagePath: fileRecord.filePath,
        originalPath: filePath,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const downloadFileName = fileRecord.fileName || fileName;

  return new Response(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${downloadFileName}"`,
      "Content-Length": arrayBuffer.byteLength.toString(),
    },
  });
}

// Handle external URL download
async function handleExternalURLDownload(url: string, filename: string) {
  console.log(`📄 [DOWNLOAD] Proxying external download: ${filename} from ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch file from external URL: ${response.statusText}`);
  }

  const fileBlob = await response.blob();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9\s-_.]/g, "_");

  return new Response(fileBlob, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${sanitizedFilename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
