// import type { APIRoute } from "astro";
// import { checkAuth } from "../../../lib/auth";
// import { supabase } from "../../../lib/supabase";
// import { supabaseAdmin } from "../../../lib/supabase-admin";

// /**
//  * Standardized Files DOWNLOAD API
//  *
//  * Query Parameters:
//  * - id: File ID to download
//  * - projectId: Project ID (for authorization check)
//  *
//  * Examples:
//  * - /api/files/download?id=123
//  * - /api/files/download?id=123&projectId=456
//  */

// export const GET: APIRoute = async ({ url, cookies }) => {
//   try {
//     // Check authentication
//     const { isAuth, currentUser } = await checkAuth(cookies);
//     if (!isAuth || !currentUser) {
//       return new Response(JSON.stringify({ error: "Authentication required" }), {
//         status: 401,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     const fileId = url.searchParams.get("id");
//     const projectId = url.searchParams.get("projectId");

//     if (!fileId) {
//       return new Response(JSON.stringify({ error: "File ID is required" }), {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     console.log(`📁 [FILES-DOWNLOAD] Downloading file:`, fileId);

//     if (!supabase || !supabaseAdmin) {
//       return new Response(JSON.stringify({ error: "Database connection not available" }), {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Get file information from database
//     const { data: file, error: fileError } = await supabase
//       .from("files")
//       .select(
//         `
//         *,
//         project:projects!projectId(id, title, authorId, assignedToId)
//       `
//       )
//       .eq("id", fileId)
//       .single();

//     if (fileError || !file) {
//       return new Response(JSON.stringify({ error: "File not found" }), {
//         status: 404,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Check authorization
//     const userRole = currentUser.profile?.role;
//     const isAdmin = userRole === "Admin" || userRole === "Staff";
//     const isProjectAuthor = file.project?.authorId === currentUser.id;
//     const isAssignedTo = file.project?.assignedToId === currentUser.id;
//     const isFileAuthor = file.authorId === currentUser.id;

//     // Allow access if user is admin, project author, assigned to project, or file author
//     const hasAccess = isAdmin || isProjectAuthor || isAssignedTo || isFileAuthor;

//     if (!hasAccess) {
//       return new Response(
//         JSON.stringify({ error: "Insufficient permissions to download this file" }),
//         { status: 403, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     // Check if file is private and user is not admin/staff
//     if (file.isPrivate && !isAdmin) {
//       return new Response(
//         JSON.stringify({ error: "This file is private and requires admin access" }),
//         { status: 403, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     console.log(`📁 [FILES-DOWNLOAD] File access authorized, downloading from storage`);

//     // Download file from Supabase Storage
//     const { data: fileData, error: downloadError } = await supabaseAdmin.storage
//       .from(file.bucketName)
//       .download(file.filePath);

//     if (downloadError) {
//       console.error("❌ [FILES-DOWNLOAD] Error downloading file from storage:", downloadError);
//       return new Response(
//         JSON.stringify({
//           error: "Failed to download file from storage",
//           details: downloadError.message,
//         }),
//         { status: 500, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     // Convert blob to array buffer
//     const arrayBuffer = await fileData.arrayBuffer();

//     console.log(`✅ [FILES-DOWNLOAD] File downloaded successfully:`, file.fileName);

//     // Return file with appropriate headers
//     return new Response(arrayBuffer, {
//       status: 200,
//       headers: {
//         "Content-Type": file.mimeType || "application/octet-stream",
//         "Content-Disposition": `attachment; filename="${file.fileName}"`,
//         "Content-Length": file.fileSize?.toString() || arrayBuffer.byteLength.toString(),
//         "Cache-Control": "private, max-age=3600",
//       },
//     });
//   } catch (error) {
//     console.error("❌ [FILES-DOWNLOAD] Unexpected error:", error);
//     return new Response(
//       JSON.stringify({
//         error: "Internal server error",
//         details: error instanceof Error ? error.message : "Unknown error",
//       }),
//       { status: 500, headers: { "Content-Type": "application/json" } }
//     );
//   }
// };

import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
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
    } else if (contentType?.includes("application/x-www-form-urlencoded")) {
      // Handle regular HTML form submissions
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

  // Sanitize filename to handle Unicode characters properly
  const rawFileName = fileRecord.fileName || fileName;
  const downloadFileName = rawFileName
    .replace(/[\u00A0\u2000-\u200F\u2028-\u202F\u205F-\u206F\u3000]/g, " ") // Replace various Unicode spaces with regular space
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, "_") // Keep printable ASCII and common Unicode, replace others with underscore
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim(); // Remove leading/trailing spaces

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

  // Better filename sanitization that handles Unicode properly
  const sanitizedFilename = filename
    .replace(/[\u00A0\u2000-\u200F\u2028-\u202F\u205F-\u206F\u3000]/g, " ") // Replace various Unicode spaces with regular space
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, "_") // Keep printable ASCII and common Unicode, replace others with underscore
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim(); // Remove leading/trailing spaces

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
