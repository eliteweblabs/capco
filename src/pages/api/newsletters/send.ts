import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Newsletter Send API
 * Sends a newsletter to targeted recipients
 * Uses existing email infrastructure
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { currentUser } = await checkAuth(cookies);

    // Check if user is admin
    if (!currentUser || currentUser.profile?.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "Newsletter ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch newsletter
    const { data: newsletter, error: fetchError } = await supabaseAdmin
      .from("newsletters")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !newsletter) {
      return new Response(JSON.stringify({ error: "Newsletter not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if newsletter is active and not draft
    if (!newsletter.isActive) {
      return new Response(JSON.stringify({ error: "Newsletter is not active" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (newsletter.isDraft) {
      return new Response(JSON.stringify({ error: "Cannot send draft newsletter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get recipients based on recipientType
    let recipients: any[] = [];

    if (newsletter.recipientType === "custom" && newsletter.customRecipients?.length > 0) {
      // Custom recipients
      const { data: users, error: usersError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .in("id", newsletter.customRecipients);

      if (!usersError && users) {
        recipients = users;
      }
    } else if (newsletter.recipientType === "all") {
      // All users
      const { data: users, error: usersError } = await supabaseAdmin
        .from("profiles")
        .select("*");

      if (!usersError && users) {
        recipients = users;
      }
    } else {
      // Filter by role (staff, client, admin)
      const role = newsletter.recipientType.charAt(0).toUpperCase() + newsletter.recipientType.slice(1);
      const { data: users, error: usersError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("role", role);

      if (!usersError && users) {
        recipients = users;
      }
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL;
    const fromName = import.meta.env.FROM_NAME;

    if (!emailApiKey || !fromEmail) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let successCount = 0;
    let failureCount = 0;
    const errors: any[] = [];

    // Send to each recipient
    for (const recipient of recipients) {
      try {
        // Send via email if enabled and recipient has email
        if (newsletter.deliverViaEmail && recipient.email) {
          const emailPayload = {
            from: `${fromName} <${fromEmail}>`,
            to: recipient.email,
            subject: newsletter.subject,
            html: newsletter.content,
            text: newsletter.content.replace(/<[^>]*>/g, ""), // Strip HTML for plain text
          };

          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${emailApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailPayload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`📧 [NEWSLETTER-SEND] Failed to send email to ${recipient.email}:`, errorText);
            failureCount++;
            errors.push({ recipient: recipient.email, error: errorText });
          } else {
            successCount++;
          }
        }

        // Send via SMS if enabled and recipient has phone + carrier
        if (newsletter.deliverViaSms && recipient.phone && recipient.smsCarrier) {
          const smsGateway = `${recipient.phone}${recipient.smsCarrier}`;
          const smsContent = newsletter.content.replace(/<[^>]*>/g, "").substring(0, 250); // Strip HTML and limit length

          const smsPayload = {
            from: `${fromName} <${fromEmail}>`,
            to: smsGateway,
            subject: newsletter.subject.substring(0, 50), // Shorter for SMS
            text: smsContent,
          };

          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${emailApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(smsPayload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`📱 [NEWSLETTER-SEND] Failed to send SMS to ${smsGateway}:`, errorText);
            failureCount++;
            errors.push({ recipient: smsGateway, error: errorText });
          } else {
            successCount++;
          }
        }
      } catch (error) {
        console.error(`❌ [NEWSLETTER-SEND] Error sending to recipient:`, error);
        failureCount++;
        errors.push({
          recipient: recipient.email || recipient.phone,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Update newsletter stats
    await supabaseAdmin
      .from("newsletters")
      .update({
        lastSentAt: new Date().toISOString(),
        sentCount: (newsletter.sentCount || 0) + successCount,
      })
      .eq("id", id);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Newsletter sent to ${successCount} recipient(s)`,
        successCount,
        failureCount,
        totalRecipients: recipients.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [NEWSLETTER-SEND] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
