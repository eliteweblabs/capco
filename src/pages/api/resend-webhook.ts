import type { APIRoute } from "astro";
import crypto from "crypto";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  console.log("📧 [RESEND-WEBHOOK] Webhook received");
  console.log("📧 [RESEND-WEBHOOK] Headers:", Object.fromEntries(request.headers.entries()));

  // Verify webhook signature
  const signature = request.headers.get("resend-signature");
  const webhookSecret = import.meta.env.RESEND_WEBHOOK_SECRET;

  console.log("📧 [RESEND-WEBHOOK] Signature verification:", {
    hasSignature: !!signature,
    hasSecret: !!webhookSecret,
    signatureLength: signature?.length || 0,
  });

  if (!signature || !webhookSecret) {
    console.log("📧 [RESEND-WEBHOOK] Missing signature or secret");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    console.log("📧 [RESEND-WEBHOOK] Webhook body:", JSON.stringify(body, null, 2));

    // Verify webhook signature using HMAC
    const bodyString = JSON.stringify(body);
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(bodyString)
      .digest("hex");

    console.log("📧 [RESEND-WEBHOOK] Signature comparison:", {
      received: signature,
      expected: expectedSignature,
      matches: signature === expectedSignature,
    });

    if (signature !== expectedSignature) {
      console.log("📧 [RESEND-WEBHOOK] Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle different webhook events
    const { type, data } = body;

    switch (type) {
      case "email.delivered":
        console.log("📧 [RESEND-WEBHOOK] Email delivered:", data.email);
        break;

      case "email.opened":
        console.log("📧 [RESEND-WEBHOOK] Email opened:", data.email);
        await handleEmailOpened(data);
        break;

      case "email.clicked":
        console.log("📧 [RESEND-WEBHOOK] Email clicked:", data.email);
        await handleEmailClicked(data);
        break;

      case "email.bounced":
        console.log("📧 [RESEND-WEBHOOK] Email bounced:", data.email);
        break;

      default:
        console.log("📧 [RESEND-WEBHOOK] Unknown event type:", type);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("📧 [RESEND-WEBHOOK] Error processing webhook:", error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Handle email opened events
async function handleEmailOpened(data: any) {
  try {
    const { email, created_at, email_id } = data;
    console.log("📧 [RESEND-WEBHOOK] Processing email opened event:", { email, email_id, created_at });

    // Get project ID from email headers (set in email-delivery.ts)
    const projectId = data.headers?.["X-Project-ID"] || data.headers?.["x-project-id"];
    const currentStatus = data.headers?.["X-Project-Status"] || data.headers?.["x-project-status"];

    if (!projectId) {
      console.log("📧 [RESEND-WEBHOOK] No project ID found in email headers for:", email);
      return;
    }

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, status, title, address")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.log("📧 [RESEND-WEBHOOK] Project not found for ID:", projectId);
      return;
    }

    console.log("📧 [RESEND-WEBHOOK] Found project:", {
      id: project.id,
      title: project.title,
      address: project.address,
      currentStatus: project.status,
      emailStatus: currentStatus
    });

    // Update project status based on current status
    let newStatus = project.status;
    let statusUpdateReason = "";

    switch (project.status) {
      case 30: // Proposal Shipped
        newStatus = 40; // Proposal Viewed
        statusUpdateReason = "Proposal email opened";
        break;
      case 70: // Deposit Invoice Shipped
        newStatus = 80; // Deposit Invoice Viewed
        statusUpdateReason = "Deposit invoice email opened";
        break;
      case 110: // Submittals Shipped
        newStatus = 120; // Submittals Viewed
        statusUpdateReason = "Submittals email opened";
        break;
      case 150: // Final Invoice Shipped
        newStatus = 160; // Final Invoice Viewed
        statusUpdateReason = "Final invoice email opened";
        break;
      case 200: // Final Deliverables Shipped
        newStatus = 210; // Final Deliverables Viewed
        statusUpdateReason = "Final deliverables email opened";
        break;
      default:
        console.log("📧 [RESEND-WEBHOOK] No status update needed for status:", project.status);
        return;
    }

    // Only update if status actually changed
    if (newStatus === project.status) {
      console.log("📧 [RESEND-WEBHOOK] Status already at target:", project.status);
      return;
    }

    // Update project status
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id);

    if (updateError) {
      console.error("📧 [RESEND-WEBHOOK] Error updating project status:", updateError);
    } else {
      console.log("📧 [RESEND-WEBHOOK] ✅ Project status updated successfully:", {
        projectId: project.id,
        projectTitle: project.title,
        projectAddress: project.address,
        oldStatus: project.status,
        newStatus,
        reason: statusUpdateReason,
        email,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("📧 [RESEND-WEBHOOK] Error handling email opened:", error);
  }
}

// Handle email clicked events (for magic links)
async function handleEmailClicked(data: any) {
  try {
    const { email, url } = data;

    // If it's a magic link, you might want to track that separately
    if (url.includes("/project/")) {
      console.log("📧 [RESEND-WEBHOOK] Magic link clicked:", { email, url });
      // You could update a "last_accessed" timestamp here
    }
  } catch (error) {
    console.error("📧 [RESEND-WEBHOOK] Error handling email clicked:", error);
  }
}
