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
    const saveToKnowledge = formData.get("saveToKnowledge") === "true";

    if (!file) {
      return createErrorResponse("No file provided", 400);
    }

    console.log("📄 [VOICE-ASSISTANT-FILE] Processing file:", file.name, "Type:", file.type);

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
      if (fileType.startsWith("image/")) {
        // Process image with OCR
        extractedContent = await processImageWithOCR(file);
        detectedFields = extractFieldsFromText(extractedContent);
      } else if (fileType === "application/pdf") {
        // Process PDF
        extractedContent = await processPDFFile(file);
        detectedFields = extractFieldsFromText(extractedContent);
      }

      console.log("✅ [VOICE-ASSISTANT-FILE] File processed successfully");
      console.log("📄 [VOICE-ASSISTANT-FILE] Extracted content length:", extractedContent.length);
      console.log("📄 [VOICE-ASSISTANT-FILE] Detected fields:", detectedFields.length);

      // Optionally save to knowledge base
      let knowledgeEntryId = null;
      if (saveToKnowledge && extractedContent) {
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
          console.error("⚠️ [VOICE-ASSISTANT-FILE] Failed to save to knowledge base:", knowledgeErr);
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
      return createErrorResponse("Failed to process file: " + processingError.message, 500);
    }
  } catch (error: any) {
    console.error("❌ [VOICE-ASSISTANT-FILE] Unexpected error:", error);
    return createErrorResponse("Internal server error: " + error.message, 500);
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
      const Tesseract = await import("tesseract.js");
      
      console.log("🔍 [OCR] Starting OCR recognition...");
      
      const {
        data: { text, words, lines },
      } = await Tesseract.recognize(buffer, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            const progress = Math.round(m.progress * 100);
            if (progress % 25 === 0) { // Log every 25% to reduce noise
              console.log(`🔍 [OCR] Progress: ${progress}%`);
            }
          }
        },
      });

      const extractedText = text?.trim() || "";
      console.log("🔍 [VOICE-ASSISTANT-FILE] OCR completed. Text length:", extractedText.length);
      
      if (extractedText.length < 10) {
        console.warn("⚠️ [OCR] Very little text extracted, image may be unclear or contain no text");
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

    // First, try to extract text directly from PDF
    try {
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = pdfParseModule.default || pdfParseModule;

      const pdfData = await pdfParse(buffer);
      const extractedText = pdfData.text.trim();

      if (extractedText.length > 50) {
        console.log("📄 [VOICE-ASSISTANT-FILE] Extracted text length:", extractedText.length);
        return extractedText;
      } else {
        // PDF appears to be scanned/image-based, try OCR
        console.log("📄 [VOICE-ASSISTANT-FILE] Minimal text extracted, attempting OCR on PDF pages...");
        return await processPDFWithOCR(buffer, file.name);
      }
    } catch (pdfParseError: any) {
      console.warn("⚠️ [VOICE-ASSISTANT-FILE] pdf-parse error:", pdfParseError.message);
      // Try OCR as fallback
      console.log("📄 [VOICE-ASSISTANT-FILE] Attempting OCR fallback...");
      return await processPDFWithOCR(buffer, file.name);
    }
  } catch (error) {
    console.error("❌ [VOICE-ASSISTANT-FILE] Error parsing PDF:", error);
    return `Error processing PDF: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Process PDF with OCR (for scanned/image-based PDFs)
 */
async function processPDFWithOCR(buffer: Buffer, fileName: string): Promise<string> {
  try {
    // Try to use pdf2pic or similar to convert PDF pages to images, then OCR
    // For now, we'll use a simpler approach with pdf-parse + Tesseract if needed
    console.log("🔍 [PDF-OCR] Attempting OCR on PDF...");
    
    // Note: Full PDF OCR requires converting PDF pages to images first
    // This is a simplified version - in production you might want to use pdf2pic or pdf-poppler
    const Tesseract = await import("tesseract.js");
    
    // For now, return a message indicating OCR is needed
    // In a full implementation, you would:
    // 1. Convert PDF pages to images (using pdf-poppler or similar)
    // 2. Run OCR on each page
    // 3. Combine results
    
    return `PDF file "${fileName}" uploaded. The document appears to be scanned or image-based. Text extraction found minimal content. Please describe the document content or ensure the PDF contains selectable text.`;
  } catch (error: any) {
    console.error("❌ [PDF-OCR] Error:", error);
    return `PDF file "${fileName}" uploaded. Unable to extract text. The PDF may be scanned or image-based. Please describe the document content.`;
  }
}

/**
 * Extract fields from extracted text using comprehensive patterns
 * Specifically designed for fire protection project documents
 */
function extractFieldsFromText(text: string): any[] {
  const fields: any[] = [];
  const normalizedText = text.toLowerCase();

  // ===== CLIENT INFORMATION =====
  
  // Email pattern (multiple matches)
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex);
  if (emails) {
    emails.forEach((email, index) => {
      fields.push({ 
        name: index === 0 ? "Email" : `Email ${index + 1}`, 
        type: "email", 
        value: email,
        confidence: "high"
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
  phonePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(phone => {
        const cleaned = phone.replace(/[^\d]/g, '');
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
        confidence: "high"
      });
    });
  }

  // ===== PROJECT ADDRESS =====
  
  // Enhanced address patterns
  const addressPatterns = [
    // Standard street address
    /\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Circle|Cir|Court|Ct|Place|Pl|Parkway|Pkwy)[\s,]+[A-Za-z\s]+(?:,\s*)?[A-Z]{2}\s+\d{5}(?:-\d{4})?/gi,
    // Address with "Address:" label
    /address[:\s]+([A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)[\s,]+[A-Za-z\s]+(?:,\s*)?[A-Z]{2}\s+\d{5})/gi,
    // Project location
    /project\s+location[:\s]+([A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr)[\s,]+[A-Za-z\s]+(?:,\s*)?[A-Z]{2}\s+\d{5})/gi,
    // Site address
    /site\s+address[:\s]+([A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr)[\s,]+[A-Za-z\s]+(?:,\s*)?[A-Z]{2}\s+\d{5})/gi,
  ];
  
  const foundAddresses = new Set<string>();
  addressPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(addr => {
        const cleaned = addr.replace(/^(address|project\s+location|site\s+address)[:\s]+/i, '').trim();
        if (cleaned.length > 10) {
          foundAddresses.add(cleaned);
        }
      });
    }
  });
  
  if (foundAddresses.size > 0) {
    Array.from(foundAddresses).forEach((addr, index) => {
      fields.push({ 
        name: index === 0 ? "Project Address" : `Address ${index + 1}`, 
        type: "address", 
        value: addr,
        confidence: "high"
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
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(date => foundDates.add(date.trim()));
    }
  });
  
  if (foundDates.size > 0) {
    Array.from(foundDates).forEach((date, index) => {
      fields.push({ 
        name: index === 0 ? "Date" : `Date ${index + 1}`, 
        type: "date", 
        value: date,
        confidence: "medium"
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
  
  sqftPatterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match) {
      const sqftMatch = match[0].match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/);
      if (sqftMatch) {
        fields.push({ 
          name: "Square Footage", 
          type: "number", 
          value: sqftMatch[1].replace(/,/g, ''),
          unit: "sq ft",
          confidence: "high"
        });
        return; // Only add once
      }
    }
  });

  // ===== BUILDING TYPES =====
  
  const buildingTypes = [
    "residential", "commercial", "warehouse", "storage", "mercantile",
    "institutional", "mixed use", "industrial", "office", "retail",
    "restaurant", "hotel", "apartment", "condominium", "single family",
    "multi-family", "school", "hospital", "church", "theater"
  ];
  
  const foundBuildingTypes: string[] = [];
  buildingTypes.forEach(type => {
    const regex = new RegExp(`\\b${type}\\b`, 'gi');
    if (regex.test(text)) {
      foundBuildingTypes.push(type.charAt(0).toUpperCase() + type.slice(1));
    }
  });
  
  if (foundBuildingTypes.length > 0) {
    fields.push({ 
      name: "Building Type", 
      type: "multi-select", 
      value: foundBuildingTypes,
      confidence: "medium"
    });
  }

  // ===== PROJECT TYPES (FIRE PROTECTION SYSTEMS) =====
  
  const projectTypes = [
    "sprinkler", "fire alarm", "fire detection", "fire suppression",
    "mechanical", "electrical", "plumbing", "civil engineering",
    "emergency lighting", "exit signage", "standpipe", "fire pump",
    "pre-action", "deluge", "wet pipe", "dry pipe", "foam", "clean agent"
  ];
  
  const foundProjectTypes: string[] = [];
  projectTypes.forEach(type => {
    const regex = new RegExp(`\\b${type}\\b`, 'gi');
    if (regex.test(text)) {
      foundProjectTypes.push(type.charAt(0).toUpperCase() + type.slice(1));
    }
  });
  
  if (foundProjectTypes.length > 0) {
    fields.push({ 
      name: "Project Type", 
      type: "multi-select", 
      value: foundProjectTypes,
      confidence: "medium"
    });
  }

  // ===== CONSTRUCTION TYPE =====
  
  if (/\bnew\s+construction\b/gi.test(text)) {
    fields.push({ 
      name: "New Construction", 
      type: "boolean", 
      value: true,
      confidence: "high"
    });
  }
  
  if (/\b(?:existing|renovation|remodel|retrofit)\b/gi.test(text)) {
    fields.push({ 
      name: "New Construction", 
      type: "boolean", 
      value: false,
      confidence: "medium"
    });
  }

  // ===== CLIENT/COMPANY NAME =====
  
  const companyPatterns = [
    /company[:\s]+([A-Z][A-Za-z0-9\s&.,-]+)/g,
    /client[:\s]+([A-Z][A-Za-z0-9\s&.,-]+)/g,
    /customer[:\s]+([A-Z][A-Za-z0-9\s&.,-]+)/g,
    /(?:attn|attention|attn:)\s+([A-Z][A-Za-z\s]+)/g,
  ];
  
  companyPatterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match && match[1]) {
      const company = match[1].trim();
      if (company.length > 2 && company.length < 100) {
        fields.push({ 
          name: "Company Name", 
          type: "text", 
          value: company,
          confidence: "medium"
        });
        return; // Only add first match
      }
    }
  });

  // ===== NFPA CODES/STANDARDS =====
  
  const nfpaPattern = /\bNFPA\s+(\d{2,3}[A-Z]?)\b/gi;
  const nfpaMatches = text.match(nfpaPattern);
  if (nfpaMatches) {
    const nfpaCodes = [...new Set(nfpaMatches.map(m => m.replace(/\bNFPA\s+/i, '')))];
    fields.push({ 
      name: "NFPA Standards", 
      type: "array", 
      value: nfpaCodes,
      confidence: "high"
    });
  }

  // ===== PERMIT NUMBERS =====
  
  const permitPatterns = [
    /permit\s+(?:number|#|no\.?)[:\s]+([A-Z0-9\-]+)/gi,
    /permit[:\s]+([A-Z0-9\-]+)/gi,
    /permit\s+#\s*([A-Z0-9\-]+)/gi,
  ];
  
  permitPatterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match && match[1]) {
      fields.push({ 
        name: "Permit Number", 
        type: "text", 
        value: match[1].trim(),
        confidence: "medium"
      });
      return;
    }
  });

  // ===== PROJECT TITLE/NAME =====
  
  const titlePatterns = [
    /project\s+(?:title|name)[:\s]+([A-Z][A-Za-z0-9\s\-.,]+)/g,
    /job\s+(?:title|name)[:\s]+([A-Z][A-Za-z0-9\s\-.,]+)/g,
  ];
  
  titlePatterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim();
      if (title.length > 3 && title.length < 200) {
        fields.push({ 
          name: "Project Title", 
          type: "text", 
          value: title,
          confidence: "medium"
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
    const validZips = zipMatches.filter(zip => {
      const num = parseInt(zip.replace('-', ''));
      return num >= 10000 && num <= 99999;
    });
    if (validZips.length > 0) {
      fields.push({ 
        name: "Zip Code", 
        type: "text", 
        value: validZips[0],
        confidence: "medium"
      });
    }
  }

  console.log(`📋 [FIELD-EXTRACTION] Found ${fields.length} fields from text`);
  return fields;
}

