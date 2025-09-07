// src/pages/api/email-webhook.ts
// This file is used to handle email webhooks from the email provider
// It is used to create a new project from an email

import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

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

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("📧 [EMAIL-WEBHOOK] Received email webhook");

    const body = await request.json();
    console.log("📧 [EMAIL-WEBHOOK] Webhook body:", JSON.stringify(body, null, 2));

    // Parse the email data (adjust based on your webhook provider)
    const emailData: EmailWebhookData = parseWebhookData(body);

    if (!emailData.from || !emailData.subject) {
      console.error("❌ [EMAIL-WEBHOOK] Missing required email data");
      return new Response(
        JSON.stringify({ success: false, error: "Missing required email data" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("📧 [EMAIL-WEBHOOK] Processing email from:", emailData.from);
    console.log("📧 [EMAIL-WEBHOOK] Subject:", emailData.subject);

    // Step 1: Find or create user based on email
    const user = await findOrCreateUser(emailData.from);
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

    // Step 2: Extract project information from email
    const projectInfo = extractProjectInfo(emailData);
    console.log("📧 [EMAIL-WEBHOOK] Extracted project info:", projectInfo);

    // Step 3: Create new project
    const project = await createProjectFromEmail(user.id, projectInfo);
    if (!project) {
      console.error("❌ [EMAIL-WEBHOOK] Failed to create project");
      return new Response(JSON.stringify({ success: false, error: "Failed to create project" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Upload attachments as project documents
    if (emailData.attachments && emailData.attachments.length > 0) {
      await uploadAttachments(project.id, emailData.attachments);
    }

    // Step 5: Create initial discussion entry
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
  if (body["event-data"] && body["event-data"].message) {
    console.log("✅ [EMAIL-WEBHOOK] Detected Mailgun format");
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

// Find existing user or create new one
async function findOrCreateUser(email: string) {
  try {
    console.log("🔍 [EMAIL-WEBHOOK] Looking for user with email:", email);
    if (!supabase) {
      console.error("❌ [EMAIL-WEBHOOK] Supabase client not initialized");
      return null;
    }
    // First, check if user exists in profiles
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (existingProfile) {
      console.log("✅ [EMAIL-WEBHOOK] Found existing user:", existingProfile.id);
      return existingProfile;
    }

    // User doesn't exist, create new one
    console.log("🆕 [EMAIL-WEBHOOK] Creating new user for email:", email);

    // Extract name from email (you might want to parse the email headers for actual name)
    const name = email.split("@")[0];

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        email: email,
        name: name,
        company_name: name, // Default company name
        role: "Client", // Default role
        phone: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ [EMAIL-WEBHOOK] Error creating user:", createError);
      return null;
    }

    console.log("✅ [EMAIL-WEBHOOK] Created new user:", newProfile.id);
    return newProfile;
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
    sq_ft: sqft,
    new_construction: isNewConstruction,
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

// Create new project from email
async function createProjectFromEmail(userId: string, projectInfo: any) {
  try {
    console.log("🏗️ [EMAIL-WEBHOOK] Creating project for user:", userId);
    if (!supabase) {
      console.error("❌ [EMAIL-WEBHOOK] Supabase client not initialized");
      return null;
    }
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        author_id: userId,
        title: projectInfo.title,
        address: projectInfo.address,
        sq_ft: projectInfo.sqft,
        new_construction: projectInfo.newConstruction,
        status: 0, // Initial status
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("❌ [EMAIL-WEBHOOK] Error creating project:", error);
      return null;
    }

    console.log("✅ [EMAIL-WEBHOOK] Created project:", project.id);
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

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("project-files")
        .getPublicUrl(`${projectId}/${filename}`);

      // Add to files table
      const { error: dbError } = await supabase.from("files").insert({
        project_id: projectId,
        author_id: null, // Will be set when user views the file
        file_path: `${projectId}/${filename}`,
        file_name: attachment.filename,
        file_type: attachment.contentType,
        file_size: buffer.length,
        uploaded_at: new Date().toISOString(),
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
      project_id: projectId,
      author_id: userId,
      message: `Project created from email:\n\nSubject: ${emailData.subject}\n\n${emailData.text || emailData.html || "No email content"}`,
      internal: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
