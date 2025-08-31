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
    const { email, created_at } = data;

    // Find the project associated with this email
    // You'll need to store email-to-project mapping when sending emails
    const { data: project, error } = await supabase
      .from("projects")
      .select("id, status, title")
      .eq(
        "author_id",
        (await supabase.from("profiles").select("id").eq("email", email).single())?.data?.id
      )
      .single();

    if (error || !project) {
      console.log("📧 [RESEND-WEBHOOK] No project found for email:", email);
      return;
    }

    // Update project status based on current status
    let newStatus = project.status;

    switch (project.status) {
      case 30: // Proposal Shipped
        newStatus = 40; // Proposal Viewed
        break;
      case 70: // Deposit Invoice Shipped
        newStatus = 80; // Deposit Invoice Viewed
        break;
      case 110: // Submittals Shipped
        newStatus = 120; // Submittals Viewed
        break;
      case 150: // Final Invoice Shipped
        newStatus = 160; // Final Invoice Viewed
        break;
      case 200: // Final Deliverables Shipped
        newStatus = 210; // Final Deliverables Viewed
        break;
      default:
        console.log("📧 [RESEND-WEBHOOK] No status update needed for status:", project.status);
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
      console.log("📧 [RESEND-WEBHOOK] Project status updated:", {
        projectId: project.id,
        oldStatus: project.status,
        newStatus,
        email,
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
