/**
 * Voice Assistant File Processing API
 *
 * Processes PDFs and images uploaded from the voice assistant
 * Extracts text content and optionally saves to knowledge base
 *
 * POST /api/voice-assistant/process-file
 */

import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  const startTime = Date.now();

  // Global timeout wrapper - prevent 502 errors by ensuring response within 2 minutes
  const timeoutMs = 120000; // 2 minutes
  const timeoutPromise = new Promise<Response>((_, reject) =>
    setTimeout(() => {
      console.error(`⏱️ [VOICE-ASSISTANT-FILE] Request timeout after ${timeoutMs}ms`);
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs)
  );

  const handlerPromise = (async (): Promise<Response> => {
    try {
      console.log("📄 [VOICE-ASSISTANT-FILE] Request received");

      if (!supabase) {
        return createErrorResponse("Database connection not available", 500);
      }

      // Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log("📄 [VOICE-ASSISTANT-FILE] Auth error:", authError?.message);
        return createErrorResponse("Authentication required", 401);
      }

      console.log("📄 [VOICE-ASSISTANT-FILE] User authenticated:", user.id);

      const formData = await request.formData();
      const file = formData.get("file") as File;
      const saveToKnowledge = formData.get("saveToKnowledge") === "true";

      if (!file) {
        return createErrorResponse("No file provided", 400);
      }

      console.log(
        "📄 [VOICE-ASSISTANT-FILE] Processing file:",
        file.name,
        "Type:",
        file.type,
        "Size:",
        file.size
      );

      const fileType = file.type;
      const fileName = file.name;
      const fileSize = file.size;

      // Check file size (max 10MB)
      if (fileSize > 10 * 1024 * 1024) {
        return createErrorResponse("File size too large. Maximum 10MB allowed.", 400);
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp",
      ];

      if (!allowedTypes.includes(fileType)) {
        return createErrorResponse(
          "Unsupported file type. Please upload PDF or image files (PNG, JPG, GIF, WEBP).",
          400
        );
      }

      let extractedContent = "";
      let detectedFields: any[] = [];

      try {
        console.log("📄 [VOICE-ASSISTANT-FILE] Starting file processing...");

        if (fileType.startsWith("image/")) {
          // Process image with OCR
          console.log("📄 [VOICE-ASSISTANT-FILE] Processing as image");
          extractedContent = await processImageWithOCR(file);
          // Fix word breaks caused by OCR line splits
          extractedContent = fixWordBreaks(extractedContent);
          // Extract fields: regex first (address priority), then LLM, then merge
          const regexFields = extractFieldsFromText(extractedContent);
          detectedFields = await extractFieldsWithLLM(extractedContent);
          // Merge fields: regex address takes priority, LLM for other fields
          detectedFields = mergeFields(detectedFields, regexFields);
        } else if (fileType === "application/pdf") {
          // Process PDF using pdf-parse v2 API (like pdf-system)
          console.log("📄 [VOICE-ASSISTANT-FILE] Processing as PDF");
          extractedContent = await processPDFFile(file);
          // Fix word breaks caused by PDF line splits
          extractedContent = fixWordBreaks(extractedContent);
          // Extract fields: regex first (address priority), then LLM, then merge
          const regexFields = extractFieldsFromText(extractedContent);
          detectedFields = await extractFieldsWithLLM(extractedContent);
          // Merge fields: regex address takes priority, LLM for other fields
          detectedFields = mergeFields(detectedFields, regexFields);
        } else {
          return createErrorResponse(`Unsupported file type: ${fileType}`, 400);
        }

        console.log("✅ [VOICE-ASSISTANT-FILE] File processed successfully");
        console.log("📄 [VOICE-ASSISTANT-FILE] Extracted content length:", extractedContent.length);
        console.log("📄 [VOICE-ASSISTANT-FILE] Detected fields:", detectedFields.length);
        console.log("📄 [VOICE-ASSISTANT-FILE] Processing took:", Date.now() - startTime, "ms");

        // Optionally save to knowledge base
        let knowledgeEntryId = null;
        if (saveToKnowledge && extractedContent && supabase) {
          try {
            const { data: knowledgeData, error: knowledgeError } = await supabase
              .from("ai_agent_knowledge")
              .insert({
                title: `Document: ${fileName}`,
                content: extractedContent.substring(0, 50000), // Limit to 50k chars
                category: "document_upload",
                tags: [fileType.split("/")[1], "voice-assistant"],
                priority: 5,
                authorId: user.id,
                isActive: true,
              })
              .select("id")
              .single();

            if (!knowledgeError && knowledgeData) {
              knowledgeEntryId = knowledgeData.id;
              console.log("✅ [VOICE-ASSISTANT-FILE] Saved to knowledge base:", knowledgeEntryId);
            }
          } catch (knowledgeErr) {
            console.error(
              "⚠️ [VOICE-ASSISTANT-FILE] Failed to save to knowledge base:",
              knowledgeErr
            );
            // Don't fail the whole request if knowledge save fails
          }
        }

        return createSuccessResponse({
          content: extractedContent,
          fields: detectedFields,
          fileName,
          fileType,
          fileSize,
          knowledgeEntryId,
        });
      } catch (processingError: any) {
        console.error("❌ [VOICE-ASSISTANT-FILE] Error processing file:", processingError);
        console.error("❌ [VOICE-ASSISTANT-FILE] Error stack:", processingError.stack);
        console.error(
          "❌ [VOICE-ASSISTANT-FILE] Processing took:",
          Date.now() - startTime,
          "ms before error"
        );

        // Return a helpful error message
        const errorMessage = processingError.message || "Unknown error";
        return createErrorResponse(
          `Failed to process file: ${errorMessage}. The file may be too large or in an unsupported format.`,
          500
        );
      }
    } catch (error: any) {
      console.error("❌ [VOICE-ASSISTANT-FILE] Unexpected error:", error);
      console.error("❌ [VOICE-ASSISTANT-FILE] Error stack:", error.stack);
      console.error(
        "❌ [VOICE-ASSISTANT-FILE] Request took:",
        Date.now() - startTime,
        "ms before unexpected error"
      );
      return createErrorResponse(
        "Internal server error: " + (error.message || "Unknown error"),
        500
      );
    }
  })();

  // Race between handler and timeout
  try {
    return await Promise.race([handlerPromise, timeoutPromise]);
  } catch (timeoutError: any) {
    console.error("⏱️ [VOICE-ASSISTANT-FILE] Request timed out or failed:", timeoutError);
    return createErrorResponse(
      timeoutError.message?.includes("timeout")
        ? "File processing timed out. The file may be too large or complex. Please try a smaller file or describe the content manually."
        : `Request failed: ${timeoutError.message || "Unknown error"}`,
      504
    );
  }
};

/**
 * Process image files with OCR
 */
async function processImageWithOCR(file: File): Promise<string> {
  console.log("🔍 [VOICE-ASSISTANT-FILE] Processing image with OCR");

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try to use Tesseract.js if available
    try {
      const TesseractModule = await import("tesseract.js");
      // ESM import: recognize is under default export
      const Tesseract = (TesseractModule as any).default || TesseractModule;

      if (!Tesseract || typeof Tesseract.recognize !== "function") {
        throw new Error("Tesseract.recognize is not available");
      }

      console.log("🔍 [OCR] Starting OCR recognition...");

      const {
        data: { text },
      } = await Tesseract.recognize(buffer, "eng", {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            const progress = Math.round(m.progress * 100);
            if (progress % 25 === 0) {
              // Log every 25% to reduce noise
              console.log(`🔍 [OCR] Progress: ${progress}%`);
            }
          }
        },
      });

      const extractedText = text?.trim() || "";
      console.log("🔍 [VOICE-ASSISTANT-FILE] OCR completed. Text length:", extractedText.length);

      if (extractedText.length < 10) {
        console.warn(
          "⚠️ [OCR] Very little text extracted, image may be unclear or contain no text"
        );
        return `Image file "${file.name}" processed. Very little text was found. The image may be unclear or contain no readable text.`;
      }

      return extractedText;
    } catch (tesseractError: any) {
      console.error("⚠️ [VOICE-ASSISTANT-FILE] Tesseract error:", tesseractError);
      // Try to provide helpful error message
      if (tesseractError.message?.includes("Tesseract")) {
        return `Image file "${file.name}" uploaded. OCR processing encountered an error: ${tesseractError.message}. Please try a clearer image or describe the content.`;
      }
      return `Image file "${file.name}" uploaded. OCR processing requires Tesseract.js library. Please describe the image content or use a text-based document.`;
    }
  } catch (error) {
    console.error("❌ [VOICE-ASSISTANT-FILE] Error running OCR:", error);
    return `Error processing image: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Process PDF files (with OCR fallback for scanned PDFs)
 */
async function processPDFFile(file: File): Promise<string> {
  console.log("📄 [VOICE-ASSISTANT-FILE] Processing PDF file");

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Add timeout wrapper for pdf-parse (60 seconds)
    const parseWithTimeout = async (buffer: Buffer, timeoutMs: number = 60000): Promise<any> => {
      return Promise.race([
        (async () => {
          try {
            // pdf-parse v2 uses PDFParse class
            const pdfParseModule = await import("pdf-parse");
            const PDFParse = (pdfParseModule as any).PDFParse;

            if (!PDFParse || typeof PDFParse !== "function") {
              throw new Error(
                `PDFParse class not found. Module keys: ${Object.keys(pdfParseModule || {}).join(", ")}`
              );
            }

            console.log("📄 [VOICE-ASSISTANT-FILE] pdf-parse loaded successfully, parsing PDF...");

            // v2 API: Create instance with { data: buffer }, call getText(), then destroy()
            const parser = new PDFParse({ data: buffer });
            try {
              // First get page info to verify total pages
              const info = await parser.getInfo();
              const totalPages = info?.total || 0;
              console.log(`📄 [VOICE-ASSISTANT-FILE] PDF has ${totalPages} page(s)`);

              // getText() with no options parses all pages by default
              // But let's explicitly ensure all pages are parsed
              const result = await parser.getText({
                // Don't specify partial/first/last to parse all pages
                pageJoiner: "\n\n--- Page {page_number} of {total_number} ---\n\n",
              });

              console.log("📄 [VOICE-ASSISTANT-FILE] PDF parsed successfully");
              console.log("📄 [VOICE-ASSISTANT-FILE] Result keys:", Object.keys(result || {}));
              console.log("📄 [VOICE-ASSISTANT-FILE] Text length:", result?.text?.length || 0);

              // Count page separators to verify all pages were parsed
              if (result?.text) {
                const pageMarkers = (result.text.match(/--- Page \d+ of \d+ ---/g) || []).length;
                console.log(
                  `📄 [VOICE-ASSISTANT-FILE] Found ${pageMarkers} page marker(s) in extracted text`
                );
              }

              return result;
            } finally {
              await parser.destroy();
            }
          } catch (importError: any) {
            console.error("📄 [VOICE-ASSISTANT-FILE] Error importing pdf-parse:", importError);
            console.error("📄 [VOICE-ASSISTANT-FILE] Error stack:", importError.stack);
            throw importError;
          }
        })(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("PDF parsing timed out after 60 seconds")), timeoutMs)
        ),
      ]);
    };

    // First, try to extract text directly from PDF
    try {
      console.log("📄 [VOICE-ASSISTANT-FILE] Attempting text extraction with pdf-parse...");
      const pdfData = await parseWithTimeout(buffer);
      // v2 API: result.text is a string, not an object with .text property
      const extractedText = (typeof pdfData === "string" ? pdfData : pdfData.text || "").trim();

      if (extractedText.length > 50) {
        console.log("📄 [VOICE-ASSISTANT-FILE] Extracted text length:", extractedText.length);
        return extractedText;
      } else {
        // PDF appears to be scanned/image-based, try OCR
        console.log(
          "📄 [VOICE-ASSISTANT-FILE] Minimal text extracted, attempting OCR on PDF pages..."
        );
        return await processPDFWithOCR(buffer, file.name);
      }
    } catch (pdfParseError: any) {
      console.warn("⚠️ [VOICE-ASSISTANT-FILE] pdf-parse error:", pdfParseError.message);

      // If timeout, return helpful message instead of trying OCR (which will also timeout)
      if (pdfParseError.message?.includes("timed out")) {
        return `PDF file "${file.name}" uploaded. The PDF is taking too long to process. It may be very large or complex. Please try a smaller file or describe the content manually.`;
      }

      // Try OCR as fallback (but with timeout)
      console.log("📄 [VOICE-ASSISTANT-FILE] Attempting OCR fallback...");
      try {
        return await Promise.race([
          processPDFWithOCR(buffer, file.name),
          new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error("OCR processing timed out after 60 seconds")), 60000)
          ),
        ]);
      } catch (ocrError: any) {
        if (ocrError.message?.includes("timed out")) {
          return `PDF file "${file.name}" uploaded. OCR processing timed out. The PDF may be too large or complex. Please try a smaller file or describe the content manually.`;
        }
        throw ocrError;
      }
    }
  } catch (error) {
    console.error("❌ [VOICE-ASSISTANT-FILE] Error parsing PDF:", error);
    return `Error processing PDF: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Process PDF with OCR (for scanned/image-based PDFs)
 * Converts PDF pages to images and runs OCR on each page
 */
async function processPDFWithOCR(buffer: Buffer, fileName: string): Promise<string> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const os = await import("os");

  let tempPdfPath: string | null = null;
  let tempImageFiles: string[] = [];

  try {
    console.log("🔍 [PDF-OCR] Converting PDF pages to images for OCR...");

    // Try pdf-poppler first (if available and poppler binaries are installed)
    try {
      const tempDir = os.tmpdir();
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      tempPdfPath = path.join(tempDir, `pdf_ocr_${Date.now()}_${safeFileName}`);

      await fs.writeFile(tempPdfPath, buffer);
      console.log(`📁 [PDF-OCR] Wrote PDF to temporary file: ${tempPdfPath}`);

      // Import pdf-poppler to convert PDF pages to images
      const pdfPoppler = (await import("pdf-poppler")) as any;

      // Convert PDF to images
      const options = {
        format: "png",
        out_dir: tempDir,
        out_prefix: `pdf_page_${Date.now()}`,
        page: null, // Convert all pages
      };

      console.log(`🔍 [PDF-OCR] Attempting to convert PDF using pdf-poppler...`);
      // Add timeout for PDF conversion (45 seconds)
      const images = (await Promise.race([
        pdfPoppler.convert(tempPdfPath, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("PDF conversion timed out after 45 seconds")), 45000)
        ),
      ])) as any;
      console.log(`🔍 [PDF-OCR] Converted PDF to ${images.length} image(s)`);

      if (images && images.length > 0) {
        tempImageFiles = Array.isArray(images) ? images : [images];
        return await runOCROnImageFiles(tempImageFiles, fileName);
      }
    } catch (popplerError: any) {
      console.warn("⚠️ [PDF-OCR] pdf-poppler failed:", popplerError.message);
      // Clean up temp PDF file if it exists
      if (tempPdfPath) {
        await fs.unlink(tempPdfPath).catch(() => {});
        tempPdfPath = null;
      }
      // Continue to fallback method
    }

    // Fallback: Try to extract text directly first (in case it's not actually scanned)
    try {
      console.log("🔍 [PDF-OCR] Attempting direct text extraction as fallback...");
      const pdfParseModule = await import("pdf-parse");
      const PDFParse = (pdfParseModule as any).PDFParse;

      if (!PDFParse) {
        throw new Error("PDFParse class not available");
      }

      // Add timeout for fallback extraction (30 seconds)
      const parser = new PDFParse({ data: buffer });
      try {
        const pdfData = (await Promise.race([
          parser.getText(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Fallback PDF extraction timed out after 30 seconds")),
              30000
            )
          ),
        ])) as any;

        const extractedText = (typeof pdfData === "string" ? pdfData : pdfData.text || "").trim();
        if (extractedText.length > 50) {
          console.log("✅ [PDF-OCR] Found extractable text in PDF, using direct extraction");
          return extractedText;
        }
      } finally {
        await parser.destroy();
      }
    } catch (parseError: any) {
      console.warn("⚠️ [PDF-OCR] Direct text extraction failed:", parseError.message);
    }

    // If we get here, OCR is needed but pdf-poppler isn't available
    throw new Error(
      "PDF appears to be scanned/image-based. pdf-poppler library requires system-level poppler binaries (poppler-utils) to be installed. " +
        "On Railway, you may need to add poppler-utils to your buildpack or use a different OCR service. " +
        "Alternatively, please describe the document content manually."
    );
  } catch (error: any) {
    console.error("❌ [PDF-OCR] Error:", error);

    // Provide helpful error messages
    if (error.message?.includes("pdf-poppler") || error.message?.includes("poppler")) {
      return `PDF file "${fileName}" uploaded. OCR processing requires pdf-poppler library with system poppler binaries installed. The PDF appears to be scanned or image-based. Please ensure poppler-utils is installed on your server or describe the document content.`;
    }

    if (error.message?.includes("Tesseract")) {
      return `PDF file "${fileName}" uploaded. OCR processing requires Tesseract.js. The PDF appears to be scanned. Please ensure Tesseract.js is available or describe the document content.`;
    }

    return `PDF file "${fileName}" uploaded. Unable to extract text via OCR: ${error.message || "Unknown error"}. The PDF may be scanned or image-based. Please describe the document content.`;
  } finally {
    // Clean up temporary files
    if (tempPdfPath) {
      try {
        await fs.unlink(tempPdfPath);
        console.log(`🧹 [PDF-OCR] Cleaned up temporary PDF file: ${tempPdfPath}`);
      } catch (cleanupError) {
        console.warn(
          `⚠️ [PDF-OCR] Failed to clean up temporary PDF file: ${tempPdfPath}`,
          cleanupError
        );
      }
    }

    // Clean up temporary image files
    for (const imageFile of tempImageFiles) {
      try {
        await fs.unlink(imageFile).catch(() => {});
      } catch (cleanupError) {
        // Ignore cleanup errors for image files
      }
    }
  }
}

/**
 * Helper function to run OCR on image file paths
 */
async function runOCROnImageFiles(imageFiles: string[], fileName: string): Promise<string> {
  const fs = await import("fs/promises");
  const TesseractModule = await import("tesseract.js");
  // ESM import: recognize is under default export
  const Tesseract = (TesseractModule as any).default || TesseractModule;
  let allText = "";

  if (!Tesseract || typeof Tesseract.recognize !== "function") {
    throw new Error("Tesseract.recognize is not available");
  }

  for (let i = 0; i < imageFiles.length; i++) {
    console.log(`🔍 [PDF-OCR] Running OCR on page ${i + 1}/${imageFiles.length}...`);

    try {
      // Read image file
      const imageBuffer = await fs.readFile(imageFiles[i]);

      const {
        data: { text },
      } = await Tesseract.recognize(imageBuffer, "eng", {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            const progress = Math.round(m.progress * 100);
            if (progress % 25 === 0) {
              console.log(`🔍 [PDF-OCR-Page-${i + 1}] Progress: ${progress}%`);
            }
          }
        },
      });

      if (text && text.trim().length > 0) {
        allText += `\n--- Page ${i + 1} ---\n${text.trim()}\n`;
        console.log(`✅ [PDF-OCR] Page ${i + 1} completed. Text length: ${text.trim().length}`);
      } else {
        console.warn(`⚠️ [PDF-OCR] Page ${i + 1} returned no text`);
      }
    } catch (pageError: any) {
      console.error(`❌ [PDF-OCR] Error processing page ${i + 1}:`, pageError);
      // Continue with other pages even if one fails
      allText += `\n--- Page ${i + 1} ---\n[OCR Error: ${pageError.message}]\n`;
    }
  }

  const extractedText = allText.trim();

  if (extractedText.length < 10) {
    console.warn("⚠️ [PDF-OCR] Very little text extracted from PDF");
    return `PDF file "${fileName}" processed with OCR. Very little text was found. The document may be unclear, contain mostly images, or have poor scan quality.`;
  }

  console.log(`✅ [PDF-OCR] OCR completed. Total text length: ${extractedText.length}`);
  return extractedText;
}

/**
 * Fix word breaks caused by line splits in PDF/OCR text extraction
 * Handles cases like "istroy" -> "history", "heet" -> "sheet", etc.
 */
function fixWordBreaks(text: string): string {
  // Common word patterns that get broken
  const wordFixes: Record<string, string> = {
    // Common broken words
    istroy: "history",
    heet: "sheet",
    ame: "name",
    nformation: "information",
    rawing: "drawing",
    orth: "north",
    outh: "south",
    ast: "east",
    est: "west",
    uilding: "building",
    onstruction: "construction",
    lassification: "classification",
    istrict: "district",
    ubdistrict: "subdistrict",
    roposed: "proposed",
    xisting: "existing",
    ermeable: "permeable",
    arking: "parking",
    verage: "coverage",
    eight: "height",
    epth: "depth",
    idth: "width",
    late: "plate",
    rea: "area",
    ard: "yard",
    escription: "description",
  };

  // Fix broken words at word boundaries
  let fixedText = text;

  // First, try to fix common broken word patterns
  Object.entries(wordFixes).forEach(([broken, correct]) => {
    // Look for broken word at start of word or after space
    const regex = new RegExp(`(^|\\s|\\b)${broken}\\b`, "gi");
    fixedText = fixedText.replace(regex, (match, prefix) => {
      return prefix + correct;
    });
  });

  // Also fix common patterns where letters are split
  // Pattern: single letter followed by lowercase word (likely a break)
  // e.g., "h istory" -> "history", "s heet" -> "sheet"
  fixedText = fixedText.replace(/\b([a-z])\s+([a-z]{2,})\b/gi, (match, letter, rest) => {
    // Check if letter + rest forms a common word
    const combined = letter + rest;
    const commonWords = [
      "history",
      "sheet",
      "name",
      "information",
      "drawing",
      "north",
      "south",
      "east",
      "west",
      "building",
      "construction",
      "classification",
      "district",
      "subdistrict",
      "proposed",
      "existing",
      "permeable",
      "parking",
      "coverage",
      "height",
      "depth",
      "width",
      "plate",
      "area",
      "yard",
      "description",
      "story",
      "stories",
      "type",
      "group",
      "use",
      "lot",
      "parcel",
      "front",
      "side",
      "rear",
      "minimum",
      "maximum",
      "gross",
      "floor",
      "total",
    ];

    if (commonWords.includes(combined.toLowerCase())) {
      return combined;
    }
    return match; // Keep original if not a known word
  });

  // Fix double spaces
  fixedText = fixedText.replace(/\s+/g, " ");

  return fixedText;
}

/**
 * Extract the best address from text using top-down priority
 * Returns the first complete address found, removes it from text
 * Complete addresses (with zip) trump incomplete ones
 */
function extractBestAddress(text: string): { address: string | null; remainingText: string } {
  // Address patterns ordered by priority (most specific first)
  const addressPatterns = [
    // Labeled addresses (highest priority) - complete with zip
    {
      pattern:
        /(?:address|project\s+location|site\s+address|location)[:\s]+(\d+\s+[A-Za-z0-9\s,.#-]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Circle|Cir|Court|Ct|Place|Pl|Parkway|Pkwy|Highway|Hwy)[\s,]+[A-Za-z\s]+(?:,\s*)?[A-Z]{2}\s+\d{5}(?:-\d{4})?)/gi,
      isComplete: true,
      priority: 1,
    },
    // Standard complete address (street + city + state + zip)
    {
      pattern:
        /\d+\s+[A-Za-z0-9\s,.#-]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Circle|Cir|Court|Ct|Place|Pl|Parkway|Pkwy|Highway|Hwy)[\s,]+[A-Za-z\s]+(?:,\s*)?[A-Z]{2}\s+\d{5}(?:-\d{4})?/gi,
      isComplete: true,
      priority: 2,
    },
    // Address with PO Box
    {
      pattern:
        /(?:P\.?O\.?\s*Box|PO\s*Box|Post\s*Office\s*Box)\s+\d+[\s,]+[A-Za-z\s]+(?:,\s*)?[A-Z]{2}\s+\d{5}(?:-\d{4})?/gi,
      isComplete: true,
      priority: 3,
    },
    // Incomplete addresses (no zip) - lower priority
    {
      pattern:
        /(?:address|project\s+location|site\s+address)[:\s]+(\d+\s+[A-Za-z0-9\s,.#-]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Circle|Cir|Court|Ct|Place|Pl|Parkway|Pkwy)[\s,]+[A-Za-z\s]+)/gi,
      isComplete: false,
      priority: 4,
    },
    {
      pattern:
        /\d+\s+[A-Za-z0-9\s,.#-]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Circle|Cir|Court|Ct|Place|Pl|Parkway|Pkwy)[\s,]+[A-Za-z\s]+/gi,
      isComplete: false,
      priority: 5,
    },
  ];

  // Find all addresses with their positions and completeness
  const addressMatches: Array<{
    match: string;
    cleaned: string;
    position: number;
    isComplete: boolean;
    priority: number;
  }> = [];

  addressPatterns.forEach(({ pattern, isComplete, priority }) => {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const cleaned = fullMatch
        .replace(/^(address|project\s+location|site\s+address|location)[:\s]+/i, "")
        .trim();

      // Validate: must have street number and street name
      if (cleaned.length > 10 && /\d+/.test(cleaned) && /[A-Za-z]/.test(cleaned)) {
        addressMatches.push({
          match: fullMatch,
          cleaned,
          position: match.index,
          isComplete,
          priority,
        });
      }
    }
  });

  if (addressMatches.length === 0) {
    return { address: null, remainingText: text };
  }

  // Sort by: 1) completeness (complete first), 2) position (earlier first), 3) priority (lower number = higher priority)
  addressMatches.sort((a, b) => {
    // Complete addresses always win
    if (a.isComplete !== b.isComplete) {
      return a.isComplete ? -1 : 1;
    }
    // Among same completeness, earlier position wins
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    // Among same position, lower priority number wins
    return a.priority - b.priority;
  });

  const bestAddress = addressMatches[0];

  // Remove the found address from text (use original match to preserve exact formatting)
  const remainingText = text.replace(bestAddress.match, " ").replace(/\s+/g, " ").trim();

  console.log(
    `📍 [ADDRESS-EXTRACTION] Found address at position ${bestAddress.position}, complete: ${bestAddress.isComplete}, removed from text`
  );

  return {
    address: bestAddress.cleaned,
    remainingText,
  };
}

/**
 * Extract fields from extracted text using comprehensive patterns
 * Specifically designed for fire protection project documents
 * Address is extracted first and removed from text to prevent duplicates
 */
function extractFieldsFromText(text: string): any[] {
  const fields: any[] = [];
  const normalizedText = text.toLowerCase();

  // ===== PROJECT ADDRESS (FIRST PRIORITY) =====
  // Extract address first, then remove it from text for other field extraction
  const { address, remainingText } = extractBestAddress(text);
  let textForOtherFields = remainingText; // Use text without address for other extractions

  if (address) {
    fields.push({
      name: "Project Address",
      type: "address",
      value: address,
      confidence: "high",
    });
    console.log(`📍 [FIELD-EXTRACTION] Extracted address: ${address.substring(0, 50)}...`);
  }

  // ===== CLIENT INFORMATION =====

  // Email pattern (multiple matches)
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = textForOtherFields.match(emailRegex);
  if (emails) {
    emails.forEach((email, index) => {
      fields.push({
        name: index === 0 ? "Email" : `Email ${index + 1}`,
        type: "email",
        value: email,
        confidence: "high",
      });
    });
  }

  // Phone pattern (multiple formats)
  const phonePatterns = [
    /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, // Standard US format
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // Simple format
    /phone[:\s]+([0-9\-\(\)\s]+)/gi, // "Phone: ..."
    /tel[:\s]+([0-9\-\(\)\s]+)/gi, // "Tel: ..."
  ];

  const foundPhones = new Set<string>();
  phonePatterns.forEach((pattern) => {
    const matches = textForOtherFields.match(pattern);
    if (matches) {
      matches.forEach((phone) => {
        const cleaned = phone.replace(/[^\d]/g, "");
        if (cleaned.length >= 10) {
          foundPhones.add(phone.trim());
        }
      });
    }
  });

  if (foundPhones.size > 0) {
    Array.from(foundPhones).forEach((phone, index) => {
      fields.push({
        name: index === 0 ? "Phone" : `Phone ${index + 1}`,
        type: "phone",
        value: phone,
        confidence: "high",
      });
    });
  }

  // ===== DATES =====

  const datePatterns = [
    /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, // MM/DD/YYYY
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi, // Month DD, YYYY
    /\b\d{4}[-\.]\d{1,2}[-\.]\d{1,2}\b/g, // YYYY-MM-DD
  ];

  const foundDates = new Set<string>();
  datePatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach((date) => foundDates.add(date.trim()));
    }
  });

  if (foundDates.size > 0) {
    Array.from(foundDates).forEach((date, index) => {
      fields.push({
        name: index === 0 ? "Date" : `Date ${index + 1}`,
        type: "date",
        value: date,
        confidence: "medium",
      });
    });
  }

  // ===== SQUARE FOOTAGE =====

  const sqftPatterns = [
    /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|square\s+feet|sf)/gi,
    /square\s+footage[:\s]+(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/gi,
    /sqft[:\s]+(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/gi,
    /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*sf\b/gi,
  ];

  sqftPatterns.forEach((pattern) => {
    const match = text.match(pattern);
    if (match) {
      const sqftMatch = match[0].match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/);
      if (sqftMatch) {
        fields.push({
          name: "Square Footage",
          type: "number",
          value: sqftMatch[1].replace(/,/g, ""),
          unit: "sq ft",
          confidence: "high",
        });
        return; // Only add once
      }
    }
  });

  // ===== BUILDING USE GROUP =====
  // Reusable function for extracting fields with specific allowed values
  const extractFieldWithValues = (
    fieldName: string,
    fieldType: string,
    allowedValues: string[],
    text: string,
    confidence: "high" | "medium" | "low" = "medium"
  ) => {
    const foundValues: string[] = [];

    allowedValues.forEach((value) => {
      // Look for exact matches (case-insensitive) with word boundaries
      // Handle multi-word values by allowing flexible whitespace
      // Handle hyphens by using word boundaries that work with hyphens
      const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape special regex chars
      // Replace hyphens with a pattern that allows word boundaries on either side
      const patternValue = escapedValue.replace(/\s+/g, "\\s+").replace(/-/g, "-?");
      // Use word boundaries, but allow hyphens to be part of the word
      const regex = new RegExp(`(?:^|\\s|[^\\w-])${patternValue}(?:$|\\s|[^\\w-])`, "gi");
      if (regex.test(text)) {
        foundValues.push(value);
      }
    });

    if (foundValues.length > 0) {
      // If multiple found, return array; otherwise single value
      const value = foundValues.length === 1 ? foundValues[0] : foundValues;
      fields.push({
        name: fieldName,
        type: fieldType,
        value: value,
        confidence: confidence,
      });
    }
  };

  // Extract Building use group
  extractFieldWithValues(
    "Building use group",
    "building_use_group",
    ["Residential", "Lodging House", "Commercial", "Warehouse"],
    textForOtherFields,
    "high"
  );

  // Extract Construction Type
  extractFieldWithValues(
    "Construction Type",
    "construction_type",
    ["Type V-A", "Type IV-B", "Type V-B", "Type IV-A"],
    textForOtherFields,
    "high"
  );

  // ===== KEY-VALUE PAIR EXTRACTION =====
  // Extract all labeled fields (Key: Value pattern)
  // This catches fields like "Construction Use Group: R-2", "Stories: 3", "ADDRESS: 5 Swift Terrace", etc.

  // Common field names to look for (case-insensitive)
  const commonFieldNames = [
    "Construction Use Group",
    "Construction Classification",
    "Stories",
    "Zoning District",
    "Zoning Subdistrict",
    "Existing Use",
    "Proposed Use",
    "Lot Area",
    "Parcel Number",
    "Building Height",
    "Building Width",
    "Building Depth",
    "Floor Plate",
    "Gross Floor Area",
    "Permeable Area",
    "Front Yard",
    "Side Yard",
    "Rear Yard",
    "Parking Spaces",
    "Off-Street Parking",
    "Project Description",
    "Address",
    "ADDRESS",
    "Maximum Building Height",
    "Maximum Building Lot Coverage",
    "Max Building Width",
    "Max Building Depth",
    "Maximum Building Floor Plate",
    "Maximum Total Gross Floor Area",
    "Minimum Permeable Area",
    "Min Side Yard",
    "Min Rear Yard",
    "Off-Street Parking Space",
  ];

  // Extract key-value pairs using colon-separated pattern
  const extractedKeyValues = new Map<string, string>();

  // Pattern: "KEY: value" (most common format in documents)
  const colonPattern =
    /([A-Z][A-Za-z\s&\/\-]+?)[:\s]+([^\n\r]{1,200}?)(?=\n|$|(?=[A-Z][A-Za-z\s&]+?:))/g;
  let match;
  while ((match = colonPattern.exec(textForOtherFields)) !== null) {
    const key = match[1]?.trim();
    let value = match[2]?.trim();

    // Clean up value (remove trailing punctuation that might be part of next field)
    value = value.replace(/[,\s]+$/, "").trim();

    if (key && value && key.length >= 2 && value.length > 0 && value.length < 200) {
      // Normalize key
      const normalizedKey = key.replace(/\s+/g, " ").trim();

      // Check if this is a relevant field
      const isRelevantField = commonFieldNames.some((fieldName) => {
        const keyLower = normalizedKey.toLowerCase();
        const fieldLower = fieldName.toLowerCase();
        return (
          keyLower === fieldLower ||
          keyLower.includes(fieldLower) ||
          fieldLower.includes(keyLower) ||
          keyLower.replace(/\s+/g, "") === fieldLower.replace(/\s+/g, "")
        );
      });

      // Also extract if key is all caps (like "ADDRESS", "ZONING DISTRICT")
      const isAllCapsField =
        normalizedKey === normalizedKey.toUpperCase() &&
        normalizedKey.length >= 3 &&
        normalizedKey.length <= 50;

      // Extract if it looks like a field (starts with common prefixes)
      const looksLikeField =
        /^(Construction|Zoning|Building|Lot|Parcel|Use|Area|Yard|Parking|Stories|Address|Maximum|Max|Minimum|Min|Existing|Proposed|Project|Off-Street)/i.test(
          normalizedKey
        );

      if (isRelevantField || isAllCapsField || looksLikeField) {
        // Don't overwrite if we already have a better (longer) match
        const existingValue = extractedKeyValues.get(normalizedKey);
        if (!existingValue || existingValue.length < value.length) {
          extractedKeyValues.set(normalizedKey, value);
        }
      }
    }
  }

  // Add extracted key-value pairs as fields
  extractedKeyValues.forEach((value, key) => {
    // Skip if we already have this as a specific field type
    const existingField = fields.find((f) => {
      const fName = f.name?.toLowerCase() || "";
      const keyLower = key.toLowerCase();
      return (
        fName === keyLower ||
        (f.type === "address" && keyLower.includes("address")) ||
        (f.type === "building_use_group" &&
          (keyLower.includes("use group") || keyLower.includes("construction use"))) ||
        (f.type === "construction_type" && keyLower.includes("construction classification"))
      );
    });

    if (!existingField) {
      fields.push({
        name: key,
        type: "key_value",
        value: value,
        confidence: "medium",
      });
    }
  });

  // ===== BUILDING TYPES =====

  const buildingTypes = [
    "residential",
    "commercial",
    "warehouse",
    "storage",
    "mercantile",
    "institutional",
    "mixed use",
    "industrial",
    "office",
    "retail",
    "restaurant",
    "hotel",
    "apartment",
    "condominium",
    "single family",
    "multi-family",
    "school",
    "hospital",
    "church",
    "theater",
  ];

  const foundBuildingTypes: string[] = [];
  buildingTypes.forEach((type) => {
    const regex = new RegExp(`\\b${type}\\b`, "gi");
    if (regex.test(textForOtherFields)) {
      foundBuildingTypes.push(type.charAt(0).toUpperCase() + type.slice(1));
    }
  });

  if (foundBuildingTypes.length > 0) {
    fields.push({
      name: "Building Type",
      type: "multi-select",
      value: foundBuildingTypes,
      confidence: "medium",
    });
  }

  // ===== PROJECT TYPES (FIRE PROTECTION SYSTEMS) =====

  const projectTypes = [
    "sprinkler",
    "fire alarm",
    "fire detection",
    "fire suppression",
    "mechanical",
    "electrical",
    "plumbing",
    "civil engineering",
    "emergency lighting",
    "exit signage",
    "standpipe",
    "fire pump",
    "pre-action",
    "deluge",
    "wet pipe",
    "dry pipe",
    "foam",
    "clean agent",
  ];

  const foundProjectTypes: string[] = [];
  projectTypes.forEach((type) => {
    const regex = new RegExp(`\\b${type}\\b`, "gi");
    if (regex.test(text)) {
      foundProjectTypes.push(type.charAt(0).toUpperCase() + type.slice(1));
    }
  });

  if (foundProjectTypes.length > 0) {
    fields.push({
      name: "Project Type",
      type: "multi-select",
      value: foundProjectTypes,
      confidence: "medium",
    });
  }

  // ===== CONSTRUCTION TYPE =====

  if (/\bnew\s+construction\b/gi.test(text)) {
    fields.push({
      name: "New Construction",
      type: "boolean",
      value: true,
      confidence: "high",
    });
  }

  if (/\b(?:existing|renovation|remodel|retrofit)\b/gi.test(text)) {
    fields.push({
      name: "New Construction",
      type: "boolean",
      value: false,
      confidence: "medium",
    });
  }

  // ===== CLIENT/COMPANY NAME =====

  const companyPatterns = [
    /company[:\s]+([A-Z][A-Za-z0-9\s&.,-]+)/g,
    /client[:\s]+([A-Z][A-Za-z0-9\s&.,-]+)/g,
    /customer[:\s]+([A-Z][A-Za-z0-9\s&.,-]+)/g,
    /(?:attn|attention|attn:)\s+([A-Z][A-Za-z\s]+)/g,
  ];

  companyPatterns.forEach((pattern) => {
    const match = text.match(pattern);
    if (match && match[1]) {
      const company = match[1].trim();
      if (company.length > 2 && company.length < 100) {
        fields.push({
          name: "Company Name",
          type: "text",
          value: company,
          confidence: "medium",
        });
        return; // Only add first match
      }
    }
  });

  // ===== NFPA CODES/STANDARDS =====

  const nfpaPattern = /\bNFPA\s+(\d{2,3}[A-Z]?)\b/gi;
  const nfpaMatches = text.match(nfpaPattern);
  if (nfpaMatches) {
    const nfpaCodes = [...new Set(nfpaMatches.map((m) => m.replace(/\bNFPA\s+/i, "")))];
    fields.push({
      name: "NFPA Standards",
      type: "array",
      value: nfpaCodes,
      confidence: "high",
    });
  }

  // ===== PERMIT NUMBERS =====

  const permitPatterns = [
    /permit\s+(?:number|#|no\.?)[:\s]+([A-Z0-9\-]+)/gi,
    /permit[:\s]+([A-Z0-9\-]+)/gi,
    /permit\s+#\s*([A-Z0-9\-]+)/gi,
  ];

  permitPatterns.forEach((pattern) => {
    const match = text.match(pattern);
    if (match && match[1]) {
      fields.push({
        name: "Permit Number",
        type: "text",
        value: match[1].trim(),
        confidence: "medium",
      });
      return;
    }
  });

  // ===== PROJECT TITLE/NAME =====

  const titlePatterns = [
    /project\s+(?:title|name)[:\s]+([A-Z][A-Za-z0-9\s\-.,]+)/g,
    /job\s+(?:title|name)[:\s]+([A-Z][A-Za-z0-9\s\-.,]+)/g,
  ];

  titlePatterns.forEach((pattern) => {
    const match = text.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim();
      if (title.length > 3 && title.length < 200) {
        fields.push({
          name: "Project Title",
          type: "text",
          value: title,
          confidence: "medium",
        });
        return;
      }
    }
  });

  // ===== ZIP CODE =====

  const zipPattern = /\b\d{5}(?:-\d{4})?\b/g;
  const zipMatches = text.match(zipPattern);
  if (zipMatches) {
    // Filter out dates and phone numbers (they can look like zip codes)
    const validZips = zipMatches.filter((zip) => {
      const num = parseInt(zip.replace("-", ""));
      return num >= 10000 && num <= 99999;
    });
    if (validZips.length > 0) {
      fields.push({
        name: "Zip Code",
        type: "text",
        value: validZips[0],
        confidence: "medium",
      });
    }
  }

  console.log(`📋 [FIELD-EXTRACTION] Found ${fields.length} fields from text`);
  return fields;
}

/**
 * Extract project-specific fields using LLM (Anthropic Claude)
 * More accurate than regex patterns for complex documents
 */
async function extractFieldsWithLLM(text: string): Promise<any[]> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn(
        "⚠️ [VOICE-ASSISTANT-FILE] ANTHROPIC_API_KEY not configured, skipping LLM extraction"
      );
      return [];
    }

    // Limit text length to avoid token limits (keep first 8000 chars)
    const textToAnalyze = text.substring(0, 8000);

    const Anthropic = await import("@anthropic-ai/sdk");
    const client = new Anthropic.default({ apiKey });
    const model = "claude-3-haiku-20240307"; // Fast and cost-effective

    const systemPrompt = `You are an expert at extracting structured data from fire protection project documents. 
Extract key project information and return it as a JSON array of field objects.

Each field object should have:
- name: Field name (e.g., "Address", "Square Footage", "Architect")
- type: Field type (e.g., "address", "number", "text", "email", "phone", "date", "boolean")
- value: Extracted value (string, number, or boolean)
- confidence: "high", "medium", or "low"

IMPORTANT EXTRACTION PRIORITY (top-down hierarchy):
1. Project Address - MUST be extracted FIRST. Use the FIRST complete address found (with street, city, state, zip code). 
   Complete addresses (with zip) always trump incomplete ones. Addresses on the first page/earlier in document have priority.
   Only return ONE address - the best/most complete one found earliest in the document.
2. All other fields follow after address extraction.

Focus on extracting these project fields in this order:
- Project Address (full address with street, city, state, zip) - PRIORITY #1, only one address
- Project Title/Name
- Square Footage (sqFt)
- Architect/Engineer name
- New Construction (true/false)
- Building Type
- Project Type (sprinkler, fire alarm, standpipe, etc.)
- Client/Company Name
- Client Email
- Client Phone
- Project Date/Submission Date
- Units (if mentioned)
- NFPA Version/Code references

Return ONLY valid JSON array, no markdown, no explanation.`;

    const userPrompt = `Extract project fields from this document text:

${textToAnalyze}

Return a JSON array of field objects. Only include fields you're confident about.`;

    const response = await client.messages.create({
      model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Extract JSON from response
    let responseText = "";
    if (response.content && response.content.length > 0) {
      const firstBlock = response.content[0];
      if (firstBlock.type === "text") {
        responseText = firstBlock.text;
      }
    }

    // Try to parse JSON (might be wrapped in markdown code blocks)
    let jsonText = responseText.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else if (jsonText.startsWith("[")) {
      // Already JSON array
    } else {
      // Try to find JSON array in the text
      const arrayMatch = jsonText.match(/(\[[\s\S]*\])/);
      if (arrayMatch) {
        jsonText = arrayMatch[1];
      }
    }

    const fields = JSON.parse(jsonText);
    console.log(`✅ [VOICE-ASSISTANT-FILE] LLM extracted ${fields.length} fields`);
    return Array.isArray(fields) ? fields : [];
  } catch (error: any) {
    console.error("⚠️ [VOICE-ASSISTANT-FILE] LLM extraction error:", error.message);
    // Return empty array on error, fallback to regex extraction
    return [];
  }
}

/**
 * Merge LLM-extracted fields with regex-extracted fields
 * Special handling for address: regex address (extracted first) takes priority
 * For other fields: LLM results preferred, regex fills gaps
 */
function mergeFields(llmFields: any[], regexFields: any[]): any[] {
  const merged: any[] = [];
  const seen = new Set<string>();

  // Find address fields from both sources
  const regexAddress = regexFields.find(
    (f) => f.name?.toLowerCase().includes("address") && f.type === "address"
  );
  const llmAddress = llmFields.find(
    (f) => f.name?.toLowerCase().includes("address") && f.type === "address"
  );

  // Address priority: regex-extracted address (processed first with top-down logic) takes precedence
  if (regexAddress) {
    merged.push(regexAddress);
    seen.add("address:address");
    console.log(`📍 [FIELD-MERGE] Using regex-extracted address (priority)`);
  } else if (llmAddress) {
    merged.push(llmAddress);
    seen.add("address:address");
    console.log(`📍 [FIELD-MERGE] Using LLM-extracted address (fallback)`);
  }

  // Add LLM fields (except address, already handled)
  for (const field of llmFields) {
    const key = `${field.name}:${field.type}`.toLowerCase();
    if (
      !seen.has(key) &&
      !(field.name?.toLowerCase().includes("address") && field.type === "address")
    ) {
      merged.push(field);
      seen.add(key);
    }
  }

  // Add regex fields that don't conflict (except address, already handled)
  for (const field of regexFields) {
    const key = `${field.name}:${field.type}`.toLowerCase();
    if (
      !seen.has(key) &&
      !(field.name?.toLowerCase().includes("address") && field.type === "address")
    ) {
      merged.push(field);
      seen.add(key);
    }
  }

  return merged;
}
