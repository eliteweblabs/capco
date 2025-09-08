import type { APIRoute } from "astro";
import crypto from "crypto";

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
    const { email } = data;
    console.log("📧 [RESEND-WEBHOOK] Processing email opened event:", { email });

    // Get project ID from email headers
    const projectId = data.headers?.["X-Project-ID"] || data.headers?.["x-project-id"];
    const currentStatus = data.headers?.["X-Project-Status"] || data.headers?.["x-project-status"];
    const authorId = data.headers?.["X-Author-ID"] || data.headers?.["x-author-id"];

    if (!projectId || !currentStatus || !authorId) {
      console.log(
        "📧 [RESEND-WEBHOOK] No project ID or status or author ID found in email headers for:",
        email
      );
      return;
    }

    // Determine next status based on current status (email opened)
    // let nextStatus: number;
    let nextStatus: number;
    switch (parseInt(currentStatus)) {
      case 30: // Proposal Sent
        nextStatus = 35; // Proposal Email Opened
        break;
      case 55: // Invoice Sent
        nextStatus = 60; // Invoice Viewed
        break;
      case 110: // Submittals Sent
        nextStatus = 115; // Submittals Viewed
        break;
      case 150: // Final Invoice Sent
        nextStatus = 155; // Final Invoice Viewed
        break;
      case 200: // Final Deliverables Sent
        nextStatus = 210; // Final Deliverables Viewed
        break;
      default:
        console.log("📧 [RESEND-WEBHOOK] No status update needed for status:", currentStatus);
        return;
    }

    console.log("📧 [RESEND-WEBHOOK] Updating status from", currentStatus, "to", nextStatus);

    // Call update-status API to handle the status update and all notifications
    const updateResponse = await fetch(
      `${import.meta.env.SITE_URL || "http://localhost:4321"}/api/update-status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: projectId,
          status: nextStatus, // Pass the next status to update to
          currentUserId: authorId,
          oldStatus: parseInt(currentStatus),
        }),
      }
    );

    if (updateResponse.ok) {
      console.log("📧 [RESEND-WEBHOOK] ✅ Status update triggered successfully");
    } else {
      console.error("📧 [RESEND-WEBHOOK] ❌ Status update failed:", await updateResponse.text());
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

// GET endpoint for testing webhook functionality
export const GET: APIRoute = async ({ request }) => {
  console.log("🧪 [RESEND-WEBHOOK] GET test endpoint called");

  // Simulate an email.opened event with correct webhook data structure
  const testEvent = {
    type: "email.opened",
    created_at: new Date().toISOString(),
    data: {
      email: "test@eliteweblabs.com",
      headers: {
        "X-Project-ID": "303",
        "X-Project-Status": "30",
        "X-Author-ID": "039566a7-1890-4603-b636-9b3248437eba",
      },
    },
  };

  console.log("🧪 [RESEND-WEBHOOK] Simulating email.opened event:", testEvent);

  // Call the handleEmailOpened function with test data
  await handleEmailOpened(testEvent.data);

  return new Response(
    JSON.stringify({
      message: "Test webhook event processed",
      event: testEvent,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
