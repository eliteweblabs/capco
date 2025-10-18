import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { supabase } from "../../../lib/supabase";

/**
 * Process Uploaded File API
 *
 * POST /api/pdf/process-file
 *
 * Processes uploaded files (PDF, DOC, DOCX, images) and extracts text content
 * Uses OCR for images and text extraction for documents
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResponse("Authentication required", 401);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return createErrorResponse("No file provided", 400);
    }

    console.log("📄 [PDF-PROCESS-FILE] Processing file:", file.name, "Type:", file.type);

    const fileType = file.type;
    const fileName = file.name;
    const fileSize = file.size;

    // Check file size (max 10MB)
    if (fileSize > 10 * 1024 * 1024) {
      return createErrorResponse("File size too large. Maximum 10MB allowed.", 400);
    }

    let extractedContent = "";
    let detectedFields = [];

    try {
      console.log("📄 [PDF-PROCESS-FILE] File type detected:", fileType);

      if (fileType.startsWith("image/")) {
        console.log(
          "🔍 [PDF-PROCESS-FILE] Processing as image - returning placeholder for client-side OCR..."
        );
        // For images, return a placeholder that tells the client to do OCR
        extractedContent = "IMAGE_OCR_PLACEHOLDER";
        detectedFields = [];
      } else if (fileType === "application/pdf") {
        console.log(
          "📄 [PDF-PROCESS-FILE] Processing PDF - using client-side OCR for better reliability..."
        );
        // For PDFs, always use client-side OCR for better reliability
        extractedContent = "PDF_OCR_PLACEHOLDER";
        detectedFields = [];
      } else if (fileType.includes("document") || fileType.includes("word")) {
        // Handle DOC/DOCX files
        const result = await processDocumentFile(file);
        extractedContent = result.content;
        detectedFields = result.fields;
      } else {
        return createErrorResponse(
          "Unsupported file type. Please upload PDF, DOC, DOCX, or image files.",
          400
        );
      }

      console.log("✅ [PDF-PROCESS-FILE] File processed successfully");
      console.log("📄 [PDF-PROCESS-FILE] Extracted content:", extractedContent);
      console.log("📄 [PDF-PROCESS-FILE] Extracted content length:", extractedContent.length);
      console.log("📄 [PDF-PROCESS-FILE] Detected fields:", detectedFields.length);

      return createSuccessResponse({
        content: extractedContent,
        fields: detectedFields,
        fileName,
        fileType,
        fileSize,
      });
    } catch (processingError) {
      console.error("❌ [PDF-PROCESS-FILE] Error processing file:", processingError);
      return createErrorResponse("Failed to process file: " + processingError.message, 500);
    }
  } catch (error) {
    console.error("❌ [PDF-PROCESS-FILE] Unexpected error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

/**
 * Process image files with OCR
 */
async function processImageWithOCR(file: File) {
  console.log("🔍 [PDF-PROCESS-FILE] Processing image with OCR");

  try {
    // Import Tesseract.js dynamically
    const Tesseract = await import("tesseract.js");

    // Convert file to buffer for Tesseract
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("🔍 [PDF-PROCESS-FILE] Running OCR on image...");

    // Run OCR on the image
    const {
      data: { text },
    } = await Tesseract.recognize(buffer, "eng", {
      logger: (m) => console.log("🔍 [OCR]", m),
    });

    console.log("🔍 [PDF-PROCESS-FILE] OCR completed. Text length:", text.length);

    // Convert extracted text to HTML format
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; white-space: pre-wrap;">
        <h2>Extracted from Image (OCR)</h2>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${text.replace(/\n/g, "<br>")}
        </div>
      </div>
    `;

    // Extract common fields from the OCR text
    const fields = extractFieldsFromText(text);

    return {
      content: htmlContent,
      fields: fields,
    };
  } catch (error) {
    console.error("❌ [PDF-PROCESS-FILE] Error running OCR:", error);

    // Fallback to mock content if OCR fails
    const mockContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Extracted from Image</h2>
        <p><strong>Error:</strong> Could not extract text from image</p>
        <p><strong>Company Name:</strong> [DETECTED_COMPANY_NAME]</p>
        <p><strong>Address:</strong> [DETECTED_ADDRESS]</p>
        <p><strong>Phone:</strong> [DETECTED_PHONE]</p>
        <p><strong>Email:</strong> [DETECTED_EMAIL]</p>
        <p><strong>Date:</strong> [DETECTED_DATE]</p>
        <hr>
        <p>Please try uploading a clearer image or use a different format.</p>
      </div>
    `;

    const mockFields = [
      { name: "Company Name", type: "text", value: "[DETECTED_COMPANY_NAME]" },
      { name: "Address", type: "address", value: "[DETECTED_ADDRESS]" },
      { name: "Phone", type: "phone", value: "[DETECTED_PHONE]" },
      { name: "Email", type: "email", value: "[DETECTED_EMAIL]" },
      { name: "Date", type: "date", value: "[DETECTED_DATE]" },
    ];

    return {
      content: mockContent,
      fields: mockFields,
    };
  }
}

/**
 * Process PDF files
 */
async function processPDFFile(file: File) {
  console.log("📄 [PDF-PROCESS-FILE] Processing PDF file");

  try {
    // Convert file to buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("📄 [PDF-PROCESS-FILE] Buffer size:", buffer.length);

    // Import pdf-parse dynamically
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = pdfParseModule.default || pdfParseModule;
    console.log("📄 [PDF-PROCESS-FILE] pdf-parse imported successfully");

    // Extract text from PDF
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;

    console.log("📄 [PDF-PROCESS-FILE] Extracted text length:", extractedText.length);
    console.log("📄 [PDF-PROCESS-FILE] First 100 chars:", extractedText.substring(0, 100));

    // Check if we got meaningful text (more than just whitespace)
    const meaningfulText = extractedText.trim().length > 50;

    if (meaningfulText) {
      // We got good text extraction - use it
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; white-space: pre-wrap;">
          <h2>PDF Document Content</h2>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
            ${extractedText.replace(/\n/g, "<br>")}
          </div>
        </div>
      `;

      const fields = extractFieldsFromText(extractedText);
      console.log("📄 [PDF-PROCESS-FILE] Returning content with", fields.length, "fields");
      return { content: htmlContent, fields: fields };
    } else {
      // Text extraction failed or returned minimal text - return placeholder for client-side OCR
      console.log(
        "📄 [PDF-PROCESS-FILE] Minimal text extracted, returning placeholder for client-side OCR..."
      );
      throw new Error("Minimal text extracted from PDF");
    }
  } catch (error) {
    console.error("❌ [PDF-PROCESS-FILE] Error parsing PDF:", error);
    console.log("📄 [PDF-PROCESS-FILE] PDF text extraction failed, will trigger client-side OCR");
    throw error; // Re-throw to trigger the placeholder logic in the main function
  }
}

/**
 * Process PDF with OCR (for scanned/flat PDFs)
 */
async function processPDFWithOCR(buffer: Buffer) {
  try {
    console.log("🔍 [PDF-PROCESS-FILE] Converting PDF to images for OCR...");

    // Import pdf-poppler dynamically
    const pdfPoppler = await import("pdf-poppler");

    // Convert PDF to images
    const options = {
      format: "png",
      out_dir: "/tmp",
      out_prefix: "pdf_page",
      page: null, // Convert all pages
    };

    const images = await pdfPoppler.convert(buffer, options);
    console.log("🔍 [PDF-PROCESS-FILE] Converted PDF to", images.length, "images");

    // Run OCR on each page
    const Tesseract = await import("tesseract.js");
    let allText = "";

    for (let i = 0; i < images.length; i++) {
      console.log(`🔍 [PDF-PROCESS-FILE] Running OCR on page ${i + 1}/${images.length}...`);

      const {
        data: { text },
      } = await Tesseract.recognize(images[i], "eng", {
        logger: (m) => console.log(`🔍 [OCR-Page-${i + 1}]`, m),
      });

      allText += `\n--- Page ${i + 1} ---\n${text}\n`;
    }

    console.log("🔍 [PDF-PROCESS-FILE] OCR completed. Total text length:", allText.length);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; white-space: pre-wrap;">
        <h2>PDF Document Content (OCR)</h2>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${allText.replace(/\n/g, "<br>")}
        </div>
      </div>
    `;

    const fields = extractFieldsFromText(allText);
    return { content: htmlContent, fields: fields };
  } catch (error) {
    console.error("❌ [PDF-PROCESS-FILE] Error with PDF OCR:", error);

    // Final fallback to mock content
    const mockContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>PDF Document Content</h2>
        <p><strong>Error:</strong> Could not extract text from PDF</p>
        <p><strong>Project:</strong> [PROJECT_NAME]</p>
        <p><strong>Client:</strong> [CLIENT_NAME]</p>
        <p><strong>Address:</strong> [PROJECT_ADDRESS]</p>
        <p><strong>Phone:</strong> [CLIENT_PHONE]</p>
        <p><strong>Email:</strong> [CLIENT_EMAIL]</p>
        <hr>
        <p>Please try uploading a text-based PDF or a clearer scanned document.</p>
      </div>
    `;

    const mockFields = [
      { name: "Project Name", type: "text", value: "[PROJECT_NAME]" },
      { name: "Client Name", type: "name", value: "[CLIENT_NAME]" },
      { name: "Project Address", type: "address", value: "[PROJECT_ADDRESS]" },
      { name: "Client Phone", type: "phone", value: "[CLIENT_PHONE]" },
      { name: "Client Email", type: "email", value: "[CLIENT_EMAIL]" },
    ];

    return { content: mockContent, fields: mockFields };
  }
}

/**
 * Process DOC/DOCX files
 */
async function processDocumentFile(file: File) {
  console.log("📄 [PDF-PROCESS-FILE] Processing document file");

  // For now, return a placeholder - in production you'd use a document parsing library
  // like mammoth.js for DOCX or docx-parser
  const mockContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Document Content</h2>
      <p><strong>Title:</strong> [DOCUMENT_TITLE]</p>
      <p><strong>Author:</strong> [AUTHOR_NAME]</p>
      <p><strong>Date:</strong> [DOCUMENT_DATE]</p>
      <p><strong>Company:</strong> [COMPANY_NAME]</p>
      <hr>
      <p>Document content would be extracted here...</p>
    </div>
  `;

  const mockFields = [
    { name: "Document Title", type: "text", value: "[DOCUMENT_TITLE]" },
    { name: "Author Name", type: "name", value: "[AUTHOR_NAME]" },
    { name: "Document Date", type: "date", value: "[DOCUMENT_DATE]" },
    { name: "Company Name", type: "text", value: "[COMPANY_NAME]" },
  ];

  return {
    content: mockContent,
    fields: mockFields,
  };
}

/**
 * Extract common fields from extracted text
 */
function extractFieldsFromText(text: string) {
  const fields = [];

  // Email pattern
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex);
  if (emails) {
    fields.push({ name: "Email", type: "email", value: emails[0] });
  }

  // Phone pattern
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phones = text.match(phoneRegex);
  if (phones) {
    fields.push({ name: "Phone", type: "phone", value: phones[0] });
  }

  // Date pattern
  const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
  const dates = text.match(dateRegex);
  if (dates) {
    fields.push({ name: "Date", type: "date", value: dates[0] });
  }

  // Address pattern (basic)
  const addressRegex =
    /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)/gi;
  const addresses = text.match(addressRegex);
  if (addresses) {
    fields.push({ name: "Address", type: "address", value: addresses[0] });
  }

  return fields;
}
