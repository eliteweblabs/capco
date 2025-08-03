import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response("PDF ID is required", { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createClient(
      import.meta.env.SUPABASE_URL!,
      import.meta.env.SUPABASE_ANON_KEY!,
    );

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
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response("Authentication required", { status: 401 });
    }

    // Get PDF document record
    const { data: pdfDoc, error: pdfError } = await supabase
      .from("pdf_documents")
      .select(
        `
        *,
        projects!inner(id, author_id)
      `,
      )
      .eq("id", id)
      .single();

    if (pdfError || !pdfDoc) {
      return new Response("PDF document not found", { status: 404 });
    }

    // Check if user has access to this PDF
    if (
      pdfDoc.projects.author_id !== user.id &&
      pdfDoc.created_by !== user.id
    ) {
      return new Response("Access denied", { status: 403 });
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(pdfDoc.file_path);

    if (downloadError || !fileData) {
      console.error("Error downloading PDF from storage:", downloadError);
      return new Response("Failed to download PDF file", { status: 500 });
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer();

    // Return PDF file
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfDoc.file_name}"`,
        "Content-Length": arrayBuffer.byteLength.toString(),
        "Cache-Control": "private, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Download PDF error:", error);

    return new Response("Failed to download PDF", { status: 500 });
  }
};
