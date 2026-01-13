// src/pages/api/email-webhook.ts
// This file is used to handle email webhooks from the email provider
// It is used to create a new project from an email

import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { getApiBaseUrl, ensureProtocol } from "../../../lib/url-utils";
// Import validateEmail from ux-utils (server-side API routes need explicit import)
import { validateEmail } from "../../../lib/ux-utils";

interface EmailWebhookData {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    contentType: string;
  }>;
  headers?: Record<string, string>;
  placeholders?: Record<string, string>;
}

export const GET: APIRoute = async () => {
  console.log("📧 [EMAIL-WEBHOOK] GET request received - webhook is accessible");
  return new Response(
    JSON.stringify({
      success: true,
      message: "Email webhook endpoint is accessible",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("📧 [EMAIL-WEBHOOK] Received email webhook");

    // Add basic connectivity test
    if (!request) {
      console.log("📧 [EMAIL-WEBHOOK] No request object provided");
      return new Response(JSON.stringify({ success: false, error: "No request object" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let body;
    try {
      body = await request.json();
      console.log("📧 [EMAIL-WEBHOOK] Webhook body:", JSON.stringify(body, null, 2));
    } catch (jsonError) {
      console.error("❌ [EMAIL-WEBHOOK] Error parsing JSON:", jsonError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse the email data (adjust based on your webhook provider)
    const emailData: EmailWebhookData = parseWebhookData(body);

    console.log("📧 [EMAIL-WEBHOOK] Parsed email data:", {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      hasText: !!emailData.text,
      hasHtml: !!emailData.html,
      attachmentCount: emailData.attachments?.length || 0,
      headerKeys: Object.keys(emailData.headers || {}),
    });

    if (!emailData.from || !emailData.subject) {
      console.error("❌ [EMAIL-WEBHOOK] Missing required email data", {
        from: emailData.from,
        subject: emailData.subject,
      });
      return new Response(
        JSON.stringify({ success: false, error: "Missing required email data" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Extract the original sender (handles forwarded emails)
    const originalSender = extractOriginalSender(emailData);
    console.log("📧 [EMAIL-WEBHOOK] Processing email from original sender:", originalSender);
    console.log("📧 [EMAIL-WEBHOOK] Subject:", emailData.subject);

    // Step 2: Find or create user based on original sender email
    const user = await findOrCreateUser(originalSender, emailData.headers);
    if (!user) {
      console.error("❌ [EMAIL-WEBHOOK] Failed to find or create user");
      return new Response(
        JSON.stringify({ success: false, error: "Failed to find or create user" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Extract project information from email
    const projectInfo = extractProjectInfo(emailData);
    console.log("📧 [EMAIL-WEBHOOK] Extracted project info:", projectInfo);

    // Step 4: Create new project
    const project = await createProjectFromEmail(user.id, projectInfo, user);
    if (!project) {
      console.error("❌ [EMAIL-WEBHOOK] Failed to create project");
      return new Response(JSON.stringify({ success: false, error: "Failed to create project" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Upload attachments as project documents
    if (emailData.attachments && emailData.attachments.length > 0) {
      await uploadAttachments(project.id, emailData.attachments);
    }

    // Step 6: Create initial discussion entry
    await createInitialDiscussion(project.id, user.id, emailData);

    console.log("✅ [EMAIL-WEBHOOK] Successfully processed email and created project:", project.id);

    return new Response(
      JSON.stringify({
        success: true,
        projectId: project.id,
        message: "Project created successfully from email",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [EMAIL-WEBHOOK] Unexpected error:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Parse webhook data based on provider (SendGrid, Mailgun, etc.)
function parseWebhookData(body: any): EmailWebhookData {
  console.log("🔍 [EMAIL-WEBHOOK] Parsing webhook data:", JSON.stringify(body, null, 2));

  // SendGrid Inbound Parse format
  if (body.from && body.to && body.subject) {
    console.log("✅ [EMAIL-WEBHOOK] Detected SendGrid format");
    return {
      from: body.from,
      to: body.to,
      subject: body.subject,
      text: body.text || body.body_plain || "",
      html: body.html || body.body_html || "",
      attachments: body.attachments || [],
      headers: body.headers || {},
    };
  }

  // Mailgun format
  if (body.sender || body["event-data"]) {
    console.log("✅ [EMAIL-WEBHOOK] Detected Mailgun format");
    // Handle both webhook and test formats
    if (body["event-data"]) {
      const message = body["event-data"].message;
      return {
        from: message.headers.from || "",
        to: message.headers.to || "",
        subject: message.headers.subject || "",
        text: message.body || "",
        html: message["body-html"] || "",
        attachments: message.attachments || [],
        headers: message.headers || {},
      };
    } else {
      // Test email format
      return {
        from: body.sender || "",
        to: body.recipient || "",
        subject: body.subject || "",
        text: body["body-plain"] || body.text || "",
        html: body["body-html"] || body.html || "",
        attachments: body.attachments || [],
        headers: body.headers || {},
      };
    }
  }

  // Generic format (fallback)
  if (body.from || body.sender) {
    console.log("✅ [EMAIL-WEBHOOK] Detected generic format");
    return {
      from: body.from || body.sender || "",
      to: body.to || body.recipient || "",
      subject: body.subject || "",
      text: body.text || body.body || "",
      html: body.html || body["body-html"] || "",
      attachments: body.attachments || [],
      headers: body.headers || {},
    };
  }

  console.error("❌ [EMAIL-WEBHOOK] Unsupported webhook format:", body);
  throw new Error("Unsupported webhook format - please check webhook provider configuration");
}

// Extract the original sender from forwarded emails
function extractOriginalSender(emailData: EmailWebhookData): string {
  console.log("🔍 [EMAIL-WEBHOOK] Extracting original sender from:", {
    from: emailData.from,
    to: emailData.to,
    headerKeys: Object.keys(emailData.headers || {}),
  });

  // If the 'from' field is our webhook address, this is likely a forwarded email
  const webhookAddresses = ["project@new.capcofire.com", "webhook@capcofire.com"];
  const fromLower = emailData.from?.toLowerCase() || "";
  const toLower = emailData.to?.toLowerCase() || "";

  const isForwardedEmail = webhookAddresses.some(
    (addr) => fromLower.includes(addr.toLowerCase()) || toLower.includes(addr.toLowerCase())
  );

  console.log("🔍 [EMAIL-WEBHOOK] Forwarding check:", {
    from: emailData.from,
    to: emailData.to,
    webhookAddresses,
    isForwardedEmail,
  });

  if (isForwardedEmail) {
    console.log("📧 [EMAIL-WEBHOOK] Detected forwarded email, looking for original sender");

    // Look for original sender in headers
    const headers = emailData.headers || {};

    // Check common forwarding headers
    const originalSenderHeaders = [
      "X-Original-Sender",
      "X-Forwarded-For",
      "Reply-To",
      "Return-Path",
      "X-Original-From",
    ];

    for (const headerName of originalSenderHeaders) {
      const headerValue = headers[headerName] || headers[headerName.toLowerCase()];
      if (headerValue && typeof headerValue === "string") {
        const extractedEmail = extractEmailAddress(headerValue);
        if (
          extractedEmail &&
          !webhookAddresses.some((addr) =>
            extractedEmail.toLowerCase().includes(addr.toLowerCase())
          )
        ) {
          console.log(`✅ [EMAIL-WEBHOOK] Found original sender in ${headerName}:`, extractedEmail);
          return extractedEmail;
        }
      }
    }

    // Look for original sender in email content (forwarded email patterns)
    const emailContent = emailData.text || emailData.html || "";

    // Common forwarding patterns
    const forwardingPatterns = [
      /From:\s*([^\n\r<>]+<[^>]+>|[^\s@]+@[^\s]+)/i,
      /Sent by:\s*([^\n\r<>]+<[^>]+>|[^\s@]+@[^\s]+)/i,
      /Originally sent by:\s*([^\n\r<>]+<[^>]+>|[^\s@]+@[^\s]+)/i,
      /---------- Forwarded message ---------[\s\S]*?From:\s*([^\n\r<>]+<[^>]+>|[^\s@]+@[^\s]+)/i,
      /Begin forwarded message:[\s\S]*?From:\s*([^\n\r<>]+<[^>]+>|[^\s@]+@[^\s]+)/i,
    ];

    for (const pattern of forwardingPatterns) {
      const match = emailContent.match(pattern);
      if (match && match[1]) {
        const extractedEmail = extractEmailAddress(match[1].trim());
        if (
          extractedEmail &&
          !webhookAddresses.some((addr) =>
            extractedEmail.toLowerCase().includes(addr.toLowerCase())
          )
        ) {
          console.log("✅ [EMAIL-WEBHOOK] Found original sender in email content:", extractedEmail);
          return extractedEmail;
        }
      }
    }

    console.log("⚠️ [EMAIL-WEBHOOK] Could not find original sender in forwarded email");
  }

  // Return the from field if not forwarded or if we couldn't find the original sender
  return emailData.from || "";
}

// Extract pure email address from formats like "Name <email@domain.com>" or just "email@domain.com"
function extractEmailAddress(emailString: string): string | null {
  if (!emailString || typeof emailString !== "string") {
    return null;
  }

  const trimmed = emailString.trim();

  // Check for "Name <email@domain.com>" format
  const emailInBrackets = trimmed.match(/<([^>]+)>/);
  if (emailInBrackets) {
    return emailInBrackets[1].trim();
  }

  // Return as-is if it's already a plain email
  return trimmed;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailError = validateEmail(email);
  return emailError === null;
}

// Generate a temporary password for new users
function generateTempPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Split a full name into first and last name
function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const nameParts = fullName.trim().split(/\s+/);

  if (nameParts.length === 1) {
    // Single name - use as first name, empty last name
    return {
      firstName: nameParts[0],
      lastName: "",
    };
  }

  if (nameParts.length === 2) {
    // Two names - first and last
    return {
      firstName: nameParts[0],
      lastName: nameParts[1],
    };
  }

  // Three or more names - first name is first part, last name is everything else
  return {
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" "),
  };
}

// Extract a good display name from email and headers
function extractNameFromEmail(email: string, headers?: Record<string, string>): string {
  // Try to get name from email headers first
  if (headers) {
    // Check for common header formats
    const fromHeader = headers.from || headers.From || headers.FROM;
    if (fromHeader) {
      // Parse "John Doe <john@example.com>" format
      const nameMatch = fromHeader.match(/^"?([^"<]+)"?\s*<[^>]+>$/);
      if (nameMatch) {
        const extractedName = nameMatch[1].trim();
        if (extractedName && extractedName !== email) {
          console.log("✅ [EMAIL-WEBHOOK] Extracted name from header:", extractedName);
          return extractedName;
        }
      }
    }
  }

  // Fallback: try to extract a reasonable name from email address
  const emailPrefix = email.split("@")[0];

  // Handle common patterns
  if (emailPrefix.includes(".")) {
    // "john.doe" -> "John Doe"
    const nameParts = emailPrefix
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
    const formattedName = nameParts.join(" ");
    console.log("✅ [EMAIL-WEBHOOK] Formatted name from email:", formattedName);
    return formattedName;
  }

  if (emailPrefix.includes("-")) {
    // "john-doe" -> "John Doe"
    const nameParts = emailPrefix
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
    const formattedName = nameParts.join(" ");
    console.log("✅ [EMAIL-WEBHOOK] Formatted name from email:", formattedName);
    return formattedName;
  }

  if (emailPrefix.includes("_")) {
    // "john_doe" -> "John Doe"
    const nameParts = emailPrefix
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
    const formattedName = nameParts.join(" ");
    console.log("✅ [EMAIL-WEBHOOK] Formatted name from email:", formattedName);
    return formattedName;
  }

  // Last resort: capitalize first letter
  const fallbackName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).toLowerCase();
  console.log("⚠️ [EMAIL-WEBHOOK] Using fallback name:", fallbackName);
  return fallbackName;
}

// Find existing user or create new one
async function findOrCreateUser(email: string, headers?: Record<string, string>) {
  try {
    console.log("🔍 [EMAIL-WEBHOOK] Looking for user with email:", email);
    console.log("🔍 [EMAIL-WEBHOOK] Raw email value:", JSON.stringify(email));
    console.log("🔍 [EMAIL-WEBHOOK] Email type:", typeof email);
    console.log("🔍 [EMAIL-WEBHOOK] Email length:", email?.length);

    // Extract pure email address from formats like "Name <email@domain.com>"
    const extractedEmail = extractEmailAddress(email);
    if (!extractedEmail) {
      console.error("❌ [EMAIL-WEBHOOK] Could not extract email address from:", email);
      return null;
    }

    const cleanEmail = extractedEmail.toLowerCase();
    console.log("🔍 [EMAIL-WEBHOOK] Extracted and cleaned email:", cleanEmail);

    if (!isValidEmail(cleanEmail)) {
      console.error("❌ [EMAIL-WEBHOOK] Invalid email format:", cleanEmail);
      return null;
    }

    if (!supabase) {
      console.error("❌ [EMAIL-WEBHOOK] Supabase client not initialized");
      return null;
    }
    // First, check if user exists in profiles
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", cleanEmail)
      .single();

    if (existingProfile) {
      console.log("✅ [EMAIL-WEBHOOK] Found existing user:", existingProfile.id);
      return existingProfile;
    }

    // User doesn't exist, create new one
    console.log("🆕 [EMAIL-WEBHOOK] Creating new user for email:", cleanEmail);

    // Extract name from email headers or email address
    const fullName = extractNameFromEmail(cleanEmail, headers);
    const { firstName, lastName } = splitFullName(fullName);

    // Generate a temporary password
    const tempPassword = generateTempPassword();

    // Use the create-user API to create the user (keeps logic consistent)
    console.log("🔐 [EMAIL-WEBHOOK] Creating user via create-user API");

    try {
      // Create FormData for consistency with other forms
      const formData = new FormData();
      formData.append("email", cleanEmail);
      formData.append("password", tempPassword);
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("companyName", fullName);
      formData.append("phone", "");
      formData.append("mobileCarrier", "");
      formData.append("smsAlerts", "false");
      formData.append("role", "Client");

      const baseUrl = ensureProtocol(process.env.RAILWAY_PUBLIC_DOMAIN || "http://localhost:4321");
      const createUserResponse = await fetch(`${baseUrl}/api/users/upsert`, {
        method: "POST",
        body: formData,
      });

      const createUserResult = await createUserResponse.json();

      if (!createUserResult.success) {
        console.error("❌ [EMAIL-WEBHOOK] Create user API failed:", createUserResult.error);
        return null;
      }

      console.log("✅ [EMAIL-WEBHOOK] Created new user via API:", createUserResult.user.id);

      // Return the profile data in the expected format
      const newProfile = {
        id: createUserResult.user.id,
        email: cleanEmail,
        firstName: firstName,
        lastName: lastName,
        companyName: fullName,
        phone: null,
        role: "Client",
      };

      return newProfile;
    } catch (error) {
      console.error("❌ [EMAIL-WEBHOOK] Error calling create-user API:", error);
      return null;
    }
  } catch (error) {
    console.error("❌ [EMAIL-WEBHOOK] Error in findOrCreateUser:", error);
    return null;
  }
}

// Extract project information from email content
function extractProjectInfo(emailData: EmailWebhookData) {
  const text = emailData.text || emailData.html || "";

  // First, check for structured placeholders
  const placeholders = extractPlaceholders(text);
  console.log("🔍 [EMAIL-WEBHOOK] Extracted placeholders:", placeholders);

  // Use placeholders if available, otherwise fall back to pattern matching
  let address = placeholders.PROJECT_ADDRESS || "";
  let sqft = placeholders.PROJECT_SQFT ? parseInt(placeholders.PROJECT_SQFT) : null;
  let isNewConstruction = placeholders.PROJECT_TYPE
    ? /new\s*construction|new\s*build|new\s*project|ground\s*up/i.test(placeholders.PROJECT_TYPE)
    : false;

  // If no placeholders found, use pattern matching as fallback
  if (!address) {
    const addressPatterns = [
      /address[:\s]+([^\n\r]+)/i,
      /location[:\s]+([^\n\r]+)/i,
      /property[:\s]+([^\n\r]+)/i,
      /site[:\s]+([^\n\r]+)/i,
      /\bat\s+([^,\n\r.]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|court|ct|place|pl)[^,\n\r.]*)/i,
      /building\s+(?:at|located\s+at)\s+([^\n\r]+)/i,
      /facility\s+(?:at|located\s+at)\s+([^\n\r]+)/i,
    ];

    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        address = match[1].trim();
        break;
      }
    }
  }

  if (!sqft) {
    const sqftPattern = /(\d+)\s*(?:sq\s*ft|square\s*feet|sf)/i;
    const sqftMatch = text.match(sqftPattern);
    sqft = sqftMatch ? parseInt(sqftMatch[1]) : null;
  }

  if (!isNewConstruction) {
    const newConstructionPatterns = [
      /new\s*construction/i,
      /new\s*build/i,
      /new\s*project/i,
      /ground\s*up/i,
    ];
    isNewConstruction = newConstructionPatterns.some((pattern) => pattern.test(text));
  }

  // Generate project title from subject and address
  let title = emailData.subject;
  if (address) {
    title = `${emailData.subject} - ${address}`;
  }

  return {
    title: title,
    address: address || "Address not specified",
    sqFt: sqft,
    newConstruction: isNewConstruction,
    description: text.substring(0, 500), // First 500 characters as description
  };
}

// Extract structured placeholders from email text
function extractPlaceholders(text: string): Record<string, string> {
  const placeholders: Record<string, string> = {};

  // Pattern: {{PLACEHOLDER_NAME: value}}
  const placeholderRegex = /\{\{(\w+):\s*([^}]+)\}\}/g;

  let match;
  while ((match = placeholderRegex.exec(text)) !== null) {
    const key = match[1];
    const value = match[2].trim();
    placeholders[key] = value;
    console.log(`🔍 [EMAIL-WEBHOOK] Found placeholder: ${key} = ${value}`);
  }

  return placeholders;
}

// Create new project using the create-project API (ensures proper notifications)
async function createProjectFromEmail(userId: string, projectInfo: any, userProfile: any) {
  try {
    console.log("🏗️ [EMAIL-WEBHOOK] Creating project via API for user:", userId);

    // Prepare the request body in the format expected by the create-project API
    const projectData = {
      // Client information (will be used to find existing client)
      firstName: userProfile.firstName || "",
      lastName: userProfile.lastName || "",
      companyName: userProfile.companyName || userProfile.firstName + " " + userProfile.lastName,
      email: userProfile.email,
      authorId: userId, // Use existing client ID

      // Project information
      title: projectInfo.title,
      address: projectInfo.address,
      description: projectInfo.description || "",
      sqFt: projectInfo.sqFt?.toString() || "",
      newConstruction: projectInfo.newConstruction || false,

      // Default arrays for required fields
      building: [],
      project: [],
      service: [],
      requestedDocs: [],
    };

    console.log("🏗️ [EMAIL-WEBHOOK] Project data for API:", JSON.stringify(projectData, null, 2));

    // Call the create-project API endpoint to ensure proper processing
    const baseUrl = ensureProtocol(process.env.RAILWAY_PUBLIC_DOMAIN || "http://localhost:4321");
    const createProjectResponse = await fetch(`${baseUrl}/api/projects/upsert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(projectData),
    });

    if (!createProjectResponse.ok) {
      const errorText = await createProjectResponse.text();
      console.error("❌ [EMAIL-WEBHOOK] Failed to create project via API:", errorText);
      return null;
    }

    const apiResult = await createProjectResponse.json();
    if (!apiResult.success) {
      console.error("❌ [EMAIL-WEBHOOK] API returned error:", apiResult.error);
      return null;
    }

    const project = apiResult.project;
    console.log("✅ [EMAIL-WEBHOOK] Created project:", project.id);

    // Update project status to 10 to trigger "Specs Received" notifications
    try {
      console.log("🔔 [EMAIL-WEBHOOK] Updating project status to trigger notifications");

      const nextStatus = 10;
      const statusResponse = await fetch(`${getApiBaseUrl()}/api/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentProject: project,
          status: nextStatus,
          currentUser: userProfile,
        }),
      });

      if (statusResponse.ok) {
        console.log("✅ [EMAIL-WEBHOOK] Project status updated, notifications should be sent");
      } else {
        console.warn("⚠️ [EMAIL-WEBHOOK] Failed to update project status for notifications");
      }
    } catch (statusError) {
      console.error("❌ [EMAIL-WEBHOOK] Error updating project status:", statusError);
    }

    return project;
  } catch (error) {
    console.error("❌ [EMAIL-WEBHOOK] Error in createProjectFromEmail:", error);
    return null;
  }
}

// Upload email attachments as project documents
async function uploadAttachments(projectId: number, attachments: any[]) {
  try {
    console.log("📎 [EMAIL-WEBHOOK] Uploading", attachments.length, "attachments");

    for (const attachment of attachments) {
      // Convert base64 to buffer
      if (!supabase) {
        console.error("❌ [EMAIL-WEBHOOK] Supabase client not initialized");
        return;
      }
      const buffer = Buffer.from(attachment.content, "base64");

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${attachment.filename}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(`${projectId}/${filename}`, buffer, {
          contentType: attachment.contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error("❌ [EMAIL-WEBHOOK] Error uploading attachment:", uploadError);
        continue;
      }

      // Get signed URL
      const { data: urlData, error: urlError } = await supabase.storage
        .from("project-files")
        .createSignedUrl(`${projectId}/${filename}`, 3600);

      if (urlError) {
        console.warn("Failed to generate signed URL for email attachment:", urlError);
      }

      // Add to files table
      const { error: dbError } = await supabase.from("files").insert({
        projectId: projectId,
        authorId: null, // Will be set when user views the file
        filePath: `${projectId}/${filename}`,
        fileName: attachment.filename,
        fileType: attachment.contentType,
        fileSize: buffer.length,
        uploadedAt: new Date().toISOString(),
        status: 1, // Pending review
      });

      if (dbError) {
        console.error("❌ [EMAIL-WEBHOOK] Error adding file to database:", dbError);
      } else {
        console.log("✅ [EMAIL-WEBHOOK] Uploaded attachment:", attachment.filename);
      }
    }
  } catch (error) {
    console.error("❌ [EMAIL-WEBHOOK] Error in uploadAttachments:", error);
  }
}

// Create initial discussion entry from email
async function createInitialDiscussion(
  projectId: number,
  userId: string,
  emailData: EmailWebhookData
) {
  try {
    console.log("💬 [EMAIL-WEBHOOK] Creating initial discussion for project:", projectId);
    if (!supabase) {
      console.error("❌ [EMAIL-WEBHOOK] Supabase client not initialized");
      return;
    }
    const { error } = await supabase.from("discussion").insert({
      projectId: projectId,
      authorId: userId,
      message: `Project created from email:\n\nSubject: ${emailData.subject}\n\n${emailData.text || emailData.html || "No email content"}`,
      internal: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ [EMAIL-WEBHOOK] Error creating discussion:", error);
    } else {
      console.log("✅ [EMAIL-WEBHOOK] Created initial discussion");
    }
  } catch (error) {
    console.error("❌ [EMAIL-WEBHOOK] Error in createInitialDiscussion:", error);
  }
}
