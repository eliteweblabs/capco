import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

// Email webhook handler for automatic project creation
export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("📧 [EMAIL-WEBHOOK] Received email webhook");

    // Parse the incoming email data (format depends on email service)
    const emailData = await parseEmailWebhook(request);

    if (!emailData) {
      return new Response(JSON.stringify({ error: "Invalid email data" }), {
        status: 400,
      });
    }

    console.log("📧 [EMAIL-WEBHOOK] Parsed email:", {
      from: emailData.from,
      subject: emailData.subject,
      hasAttachments: emailData.attachments?.length > 0,
    });

    // Extract project details from email
    const projectDetails = await extractProjectDetails(emailData);

    if (!projectDetails) {
      console.log("📧 [EMAIL-WEBHOOK] Could not extract project details from email");
      return new Response(
        JSON.stringify({
          message: "Email received but could not parse project details",
        }),
        {
          status: 200,
        }
      );
    }

    // Find or create user based on email
    const user = await findOrCreateUser(emailData.from);

    if (!user) {
      console.log("📧 [EMAIL-WEBHOOK] Could not find or create user");
      return new Response(
        JSON.stringify({
          error: "Could not identify user from email",
        }),
        {
          status: 400,
        }
      );
    }

    // Create the project
    const project = await createProjectFromEmail(user.id, projectDetails, emailData);

    if (!project) {
      console.log("📧 [EMAIL-WEBHOOK] Failed to create project");
      return new Response(
        JSON.stringify({
          error: "Failed to create project from email",
        }),
        {
          status: 500,
        }
      );
    }

    console.log("✅ [EMAIL-WEBHOOK] Successfully created project:", project.id);

    // Optionally send confirmation email
    await sendConfirmationEmail(emailData.from, project);

    return new Response(
      JSON.stringify({
        success: true,
        projectId: project.id,
        message: "Project created successfully from email",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [EMAIL-WEBHOOK] Error processing email:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error processing email",
      }),
      {
        status: 500,
      }
    );
  }
};

// Parse email webhook based on service provider
async function parseEmailWebhook(request: Request): Promise<EmailData | null> {
  try {
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      // Handle JSON webhook (SendGrid, Mailgun, etc.)
      const data = await request.json();
      return parseJsonEmailData(data);
    } else if (contentType?.includes("multipart/form-data")) {
      // Handle form data webhook
      const formData = await request.formData();
      return parseFormEmailData(formData);
    } else {
      // Handle raw email data
      const text = await request.text();
      return parseRawEmailData(text);
    }
  } catch (error) {
    console.error("Error parsing email webhook:", error);
    return null;
  }
}

// Parse JSON email data (SendGrid format)
function parseJsonEmailData(data: any): EmailData | null {
  try {
    // SendGrid webhook format
    if (data.length && data[0]) {
      const email = data[0];
      return {
        from: email.from || email.envelope?.from,
        to: email.to || email.envelope?.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
        attachments: email.attachments || [],
        timestamp: new Date(email.timestamp * 1000),
        messageId: email.sg_message_id || email.message_id,
      };
    }

    // Generic JSON format
    return {
      from: data.from,
      to: data.to,
      subject: data.subject,
      text: data.text || data.body,
      html: data.html,
      attachments: data.attachments || [],
      timestamp: new Date(data.timestamp || Date.now()),
      messageId: data.messageId || data.id,
    };
  } catch (error) {
    console.error("Error parsing JSON email data:", error);
    return null;
  }
}

// Parse form data email (Mailgun format)
function parseFormEmailData(formData: FormData): EmailData | null {
  try {
    return {
      from: (formData.get("sender") as string) || (formData.get("from") as string),
      to: (formData.get("recipient") as string) || (formData.get("to") as string),
      subject: formData.get("subject") as string,
      text: (formData.get("body-plain") as string) || (formData.get("text") as string),
      html: (formData.get("body-html") as string) || (formData.get("html") as string),
      attachments: [], // Handle attachments if needed
      timestamp: new Date(),
      messageId: formData.get("Message-Id") as string,
    };
  } catch (error) {
    console.error("Error parsing form email data:", error);
    return null;
  }
}

// Parse raw email data
function parseRawEmailData(text: string): EmailData | null {
  try {
    // Basic email parsing - you might want to use a proper email parser library
    const lines = text.split("\n");
    const headers: { [key: string]: string } = {};
    let bodyStart = 0;

    // Parse headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === "") {
        bodyStart = i + 1;
        break;
      }

      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).toLowerCase();
        const value = line.substring(colonIndex + 1).trim();
        headers[key] = value;
      }
    }

    const body = lines.slice(bodyStart).join("\n");

    return {
      from: headers["from"] || "",
      to: headers["to"] || "",
      subject: headers["subject"] || "",
      text: body,
      html: "",
      attachments: [],
      timestamp: new Date(headers["date"] || Date.now()),
      messageId: headers["message-id"] || "",
    };
  } catch (error) {
    console.error("Error parsing raw email data:", error);
    return null;
  }
}

// Extract project details from email content
async function extractProjectDetails(emailData: EmailData): Promise<ProjectDetails | null> {
  try {
    const content = emailData.text || emailData.html || "";
    const subject = emailData.subject || "";

    // Extract address/title from subject or content
    const address = extractAddress(subject, content);
    if (!address) {
      console.log("No address found in email");
      return null;
    }

    // Extract other project details using patterns
    const details: ProjectDetails = {
      address,
      owner: extractOwnerName(emailData.from, content),
      owner_email: extractEmail(emailData.from),
      architect: extractArchitect(content),
      sq_ft: extractSquareFootage(content),
      description: extractDescription(content),
      new_construction: extractNewConstruction(content),
      building: extractBuildingType(content),
      service: extractService(content),
      project: extractProjectTypes(content),
      requested_docs: extractRequestedDocs(content),
    };

    console.log("📧 Extracted project details:", details);
    return details;
  } catch (error) {
    console.error("Error extracting project details:", error);
    return null;
  }
}

// Helper functions for extracting specific data
function extractAddress(subject: string, content: string): string | null {
  // Look for address patterns in subject first
  const subjectMatch = subject.match(/(?:project|fire|address|location)[:\s]+([^\n\r]+)/i);
  if (subjectMatch) {
    return subjectMatch[1].trim();
  }

  // Look for address patterns in content
  const addressPatterns = [
    /address[:\s]+([^\n\r]+)/i,
    /location[:\s]+([^\n\r]+)/i,
    /project[:\s]+([^\n\r]+)/i,
    /building[:\s]+([^\n\r]+)/i,
  ];

  for (const pattern of addressPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // If no specific pattern, use subject as fallback
  return subject.trim() || null;
}

function extractOwnerName(fromEmail: string, content: string): string {
  // Extract name from email address
  const emailMatch = fromEmail.match(/^([^<]+)<(.+)>$|^(.+)$/);
  if (emailMatch) {
    const name = emailMatch[1] || emailMatch[3];
    if (name && !name.includes("@")) {
      return name.trim().replace(/['"]/g, "");
    }
  }

  // Look for owner patterns in content
  const ownerPatterns = [
    /owner[:\s]+([^\n\r]+)/i,
    /client[:\s]+([^\n\r]+)/i,
    /contact[:\s]+([^\n\r]+)/i,
  ];

  for (const pattern of ownerPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // Default to email username
  return fromEmail.split("@")[0].replace(/[._]/g, " ");
}

function extractEmail(fromEmail: string): string {
  const emailMatch = fromEmail.match(/<(.+)>$|^(.+)$/);
  return emailMatch ? emailMatch[1] || emailMatch[2] : fromEmail;
}

function extractArchitect(content: string): string | null {
  const match = content.match(/architect[:\s]+([^\n\r]+)/i);
  return match ? match[1].trim() : null;
}

function extractSquareFootage(content: string): number | null {
  const patterns = [
    /(\d+(?:,\d+)*)\s*(?:sq\.?\s*ft|square\s*feet|sf)/i,
    /square\s*footage[:\s]+(\d+(?:,\d+)*)/i,
    /size[:\s]+(\d+(?:,\d+)*)\s*(?:sq\.?\s*ft|sf)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return parseInt(match[1].replace(/,/g, ""));
    }
  }
  return null;
}

function extractDescription(content: string): string {
  // Use first paragraph or first 200 characters as description
  const paragraphs = content.split("\n\n");
  const firstParagraph = paragraphs[0] || content;
  return firstParagraph.substring(0, 200).trim();
}

function extractNewConstruction(content: string): boolean {
  return /new\s+construction|new\s+build/i.test(content);
}

function extractBuildingType(content: string): string | null {
  const types = [
    "residential",
    "commercial",
    "mixed use",
    "mercantile",
    "storage",
    "warehouse",
    "institutional",
  ];
  for (const type of types) {
    if (new RegExp(type, "i").test(content)) {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }
  return null;
}

function extractService(content: string): string | null {
  const services = ["pump & tank", "2' copper", "4' ductile", "6' ductile"];
  for (const service of services) {
    if (new RegExp(service.replace(/[()]/g, "\\$&"), "i").test(content)) {
      return service;
    }
  }
  return null;
}

function extractProjectTypes(content: string): string[] {
  const types = ["sprinkler", "alarm", "mechanical", "electrical", "plumbing", "civil engineering"];
  const found: string[] = [];

  for (const type of types) {
    if (new RegExp(type, "i").test(content)) {
      found.push(type.charAt(0).toUpperCase() + type.slice(1));
    }
  }
  return found;
}

function extractRequestedDocs(content: string): string[] {
  const docs = ["narrative", "sprinkler", "alarm", "nfpa 241", "iebc", "ibc"];
  const found: string[] = [];

  for (const doc of docs) {
    if (new RegExp(doc, "i").test(content)) {
      found.push(doc.toUpperCase());
    }
  }
  return found;
}

// Find existing user or create new one
async function findOrCreateUser(emailAddress: string): Promise<{ id: string } | null> {
  try {
    if (!supabase) return null;

    const email = extractEmail(emailAddress);

    // First try to find existing user by email using admin API
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching auth users:", authError);
      return null;
    }

    // Find user by email
    const existingUser = authUsers.users?.find((user) => user.email === email);

    if (existingUser) {
      console.log("📧 Found existing user:", existingUser.id);
      return { id: existingUser.id };
    }

    // Create new user if not found
    console.log("📧 Creating new user for email:", email);

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: {
        name: extractOwnerName(emailAddress, ""),
        created_via: "email_webhook",
      },
    });

    if (createError || !newUser.user) {
      console.error("Error creating user:", createError);
      return null;
    }

    // Create profile for new user
    const { error: profileError } = await supabase.from("profiles").insert({
      id: newUser.user.id,
      name: extractOwnerName(emailAddress, ""),
      role: "Client",
    });

    if (profileError) {
      console.error("Error creating profile:", profileError);
    }

    console.log("✅ Created new user and profile:", newUser.user.id);
    return { id: newUser.user.id };
  } catch (error) {
    console.error("Error in findOrCreateUser:", error);
    return null;
  }
}

// Create project from email data
async function createProjectFromEmail(
  userId: string,
  projectDetails: ProjectDetails,
  emailData: EmailData
): Promise<{ id: number } | null> {
  try {
    if (!supabase) return null;

    const projectData = {
      author_id: userId,
      address: projectDetails.address,
      owner: projectDetails.owner,
      architect: projectDetails.architect,
      sq_ft: projectDetails.sq_ft,
      description: `${projectDetails.description}\n\n[Created from email: ${emailData.subject}]`,
      new_construction: projectDetails.new_construction,
      building: projectDetails.building,
      project: JSON.stringify(projectDetails.project),
      service: projectDetails.service,
      requested_docs: JSON.stringify(projectDetails.requested_docs),
      status: 1, // Default status
      created_via: "email",
      source_email: emailData.messageId,
    };

    console.log("📧 Creating project with data:", projectData);

    const { data: projects, error } = await supabase
      .from("projects")
      .insert([projectData])
      .select();

    if (error) {
      console.error("Error creating project:", error);
      return null;
    }

    if (!projects || projects.length === 0) {
      console.error("No project returned after creation");
      return null;
    }

    return { id: projects[0].id };
  } catch (error) {
    console.error("Error in createProjectFromEmail:", error);
    return null;
  }
}

// Send confirmation email
async function sendConfirmationEmail(
  recipientEmail: string,
  project: { id: number }
): Promise<void> {
  try {
    // Here you would integrate with your email service to send confirmation
    console.log(`📧 Would send confirmation email to ${recipientEmail} for project ${project.id}`);

    // Example integration with email service
    // await emailService.send({
    //   to: recipientEmail,
    //   subject: `Project Created: #${project.id}`,
    //   template: 'project-confirmation',
    //   data: { projectId: project.id }
    // });
  } catch (error) {
    console.error("Error sending confirmation email:", error);
  }
}

// Type definitions
interface EmailData {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments: any[];
  timestamp: Date;
  messageId: string;
}

interface ProjectDetails {
  address: string;
  owner: string;
  owner_email: string;
  architect: string | null;
  sq_ft: number | null;
  description: string;
  new_construction: boolean;
  building: string | null;
  service: string | null;
  project: string[];
  requested_docs: string[];
}
