import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { globalCompanyData } from "./global/global-company-data";
import { SMS_UTILS } from "../../lib/sms-utils";
import { supabaseAdmin } from "../../lib/supabase-admin";

/**
 * Contact Form Submit API
 * POST /api/contact-form-submit
 *
 * Handles contact form submissions from the multi-step contact form.
 * Auto-detects missing table and provides setup instructions.
 * Sends email notifications to admins and confirmation to submitter.
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const contentType = request.headers.get("Content-Type") || "";
    let firstName: string;
    let lastName: string;
    let email: string;
    let phone: string;
    let smsAlerts: boolean;
    let mobileCarrierRaw: string;
    let company: string;
    let address: string;
    let message: string;

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      firstName = (body.firstName as string) ?? "";
      lastName = (body.lastName as string) ?? "";
      email = (body.email as string) ?? "";
      phone = (body.phone as string) ?? "";
      smsAlerts = body.smsAlerts === true || body.smsAlerts === "true";
      mobileCarrierRaw = (body.mobileCarrier as string) ?? "";
      company = (body.company as string) ?? "";
      address = (body.address as string) ?? "";
      message = (body.message as string) ?? "";
    } else {
      const formData = await request.formData();
      firstName = (formData.get("firstName") as string) ?? "";
      lastName = (formData.get("lastName") as string) ?? "";
      email = (formData.get("email") as string) ?? "";
      phone = (formData.get("phone") as string) ?? "";
      smsAlerts = formData.get("smsAlerts") === "true";
      mobileCarrierRaw = (formData.get("mobileCarrier") as string) ?? "";
      company = (formData.get("company") as string) ?? "";
      address = (formData.get("address") as string) ?? "";
      message = (formData.get("message") as string) ?? "";
    }

    // Convert mobile carrier ID to gateway domain (same as RegisterForm)
    let mobileCarrier: string | null = null;
    if (smsAlerts && mobileCarrierRaw) {
      const carrierInfo = SMS_UTILS.getCarrierInfo(mobileCarrierRaw);
      if (carrierInfo) {
        mobileCarrier = `@${carrierInfo.gateway}`;
      } else if (mobileCarrierRaw.startsWith("@")) {
        // Already a gateway domain
        mobileCarrier = mobileCarrierRaw;
      }
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SECRET;

    if (!supabaseUrl || !supabaseKey) {
      console.error("[CONTACT-FORM-SUBMIT] Supabase credentials not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to save to database
    const { data, error } = await supabase
      .from("contactSubmissions")
      .insert({
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone || null,
        smsAlerts: smsAlerts,
        mobileCarrier: smsAlerts ? mobileCarrier : null,
        company: company || null,
        address: address || null,
        message: message,
        submittedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[CONTACT-FORM-SUBMIT] Database error:", error);

      // If table doesn't exist, provide setup instructions
      if (error.code === "42P01") {
        console.error("[CONTACT-FORM-SUBMIT] ❌ Table 'contactSubmissions' does not exist!");
        console.error("[CONTACT-FORM-SUBMIT] 📋 Quick Setup - Run this SQL in Supabase SQL Editor:");
        console.error(`
CREATE TABLE "contactSubmissions" (
  id SERIAL PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  "smsAlerts" BOOLEAN DEFAULT false,
  "mobileCarrier" TEXT,
  company TEXT,
  address TEXT,
  message TEXT NOT NULL,
  "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "contactSubmissions" ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert
CREATE POLICY "Anyone can insert contact submissions"
  ON "contactSubmissions" FOR INSERT
  WITH CHECK (true);

-- Allow admins to view
CREATE POLICY "Admins can view all contact submissions"
  ON "contactSubmissions" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Add indexes
CREATE INDEX "idx_contactSubmissions_email" ON "contactSubmissions"(email);
CREATE INDEX "idx_contactSubmissions_submittedAt" ON "contactSubmissions"("submittedAt" DESC);
        `);

        return new Response(
          JSON.stringify({
            success: false,
            error: "Database table not set up. Please run the SQL setup script.",
            details:
              "Check server logs for SQL commands or see sql-queriers/create-contactSubmissions-table.sql",
            setupRequired: true,
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to save contact form lead",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("[CONTACT-FORM-SUBMIT] Lead saved:", data);

    // Send in-app notifications to all Admin users
    if (supabaseAdmin) {
      try {
        const { data: admins } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("role", "Admin");

        const adminIds = admins?.map((a) => a.id).filter(Boolean) || [];

        if (adminIds.length > 0) {
          const { getBaseUrl } = await import("../../lib/url-utils");
          const notifBaseUrl = getBaseUrl(request);
          const notifications = adminIds.map((userId) => ({
            userId,
            title: "New Contact Form Lead",
            message: `${firstName} ${lastName} (${email}): ${message.slice(0, 100)}${message.length > 100 ? "…" : ""}`,
            type: "info" as const,
            priority: "high" as const,
            actionUrl: `${notifBaseUrl}/admin/contact-form-leads`,
            actionText: "View leads",
            viewed: false,
          }));

          const { error: notifError } = await supabaseAdmin
            .from("notifications")
            .insert(notifications);

          if (notifError) {
            console.error("[CONTACT-FORM-SUBMIT] ⚠️ In-app notification insert failed:", notifError);
          } else {
            console.log(
              `[CONTACT-FORM-SUBMIT] ✅ In-app notifications sent to ${adminIds.length} Admin user(s)`
            );
          }
        }
      } catch (notifErr) {
        console.error("[CONTACT-FORM-SUBMIT] ⚠️ In-app notification error:", notifErr);
      }
    }

    // Send email notifications
    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL;
    const fromName = import.meta.env.FROM_NAME;
    const companyData = await globalCompanyData();
    const { getBaseUrl } = await import("../../lib/url-utils");
    const baseUrl = getBaseUrl(request);

    if (emailApiKey && fromEmail) {
      try {
        // Get admin emails from profiles table
        const { data: admins } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("role", "Admin");

        const adminEmails = admins?.map((admin) => admin.email).filter(Boolean) || [];

        // Add website admin email if available and not already in list
        const websiteAdminEmail = companyData.globalCompanyEmail;
        if (websiteAdminEmail && !adminEmails.includes(websiteAdminEmail)) {
          adminEmails.push(websiteAdminEmail);
        }

        console.log(
          `[CONTACT-FORM-SUBMIT] Sending notifications to ${adminEmails.length} recipient(s):`,
          adminEmails
        );

        // Get friendly carrier name for display
        let carrierDisplayName = mobileCarrier;
        if (mobileCarrier && mobileCarrierRaw) {
          const carrierInfo = SMS_UTILS.getCarrierInfo(mobileCarrierRaw);
          if (carrierInfo) {
            carrierDisplayName = carrierInfo.name;
          }
        }

        // Admin email content for template ({{CONTENT}} in templates/email/template.html)
        const adminSubject = `🔔 New Contact Form Lead - ${firstName} ${lastName}`;
        const adminContent = `
          <h2>New Contact Form Lead</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ""}
          ${smsAlerts ? `<p><strong>SMS Alerts:</strong> Yes (updates only, no marketing)</p>` : ""}
          ${smsAlerts && carrierDisplayName ? `<p><strong>Mobile Carrier:</strong> ${carrierDisplayName}</p>` : ""}
          ${company ? `<p><strong>Company:</strong> ${company}</p>` : ""}
          ${address ? `<p><strong>Address:</strong> ${address}</p>` : ""}
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `;

        // Use delivery API so admin emails use templates/email/template.html (same as rest of project)
        await fetch(`${baseUrl}/api/delivery/update-delivery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usersToNotify: adminEmails,
            method: "email",
            emailSubject: adminSubject,
            emailContent: adminContent,
            buttonLink: `${baseUrl}/admin/contact-form-leads`,
            buttonText: "View contact form leads",
            trackLinks: false,
          }),
        });

        console.log(
          `[CONTACT-FORM-SUBMIT] ✅ Admin notification emails sent to ${adminEmails.length} admin(s) (via template)`
        );

        // Email confirmation to submitter using the existing template system
        const submitterSubject = `Thank you for contacting ${companyData.globalCompanyName}`;
        const submitterContent = `
          <p>Hi ${firstName},</p>
          <p>We received your message and will get back to you as soon as possible.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <strong>Your Message:</strong><br>
            ${message}
          </div>
          <p>If you need immediate assistance, please feel free to call us or visit our website.</p>
          <p>Best regards,<br>${companyData.globalCompanyName}</p>
        `;

        // Use the delivery system with the email template
        await fetch(`${baseUrl}/api/delivery/update-delivery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usersToNotify: [email],
            method: "email",
            emailSubject: submitterSubject,
            emailContent: submitterContent,
            buttonLink: `${baseUrl}/contact`,
            buttonText: "Visit Our Website",
            trackLinks: false,
          }),
        });

        console.log(`[CONTACT-FORM-SUBMIT] ✅ Confirmation email sent to ${email}`);
      } catch (emailError) {
        console.error("[CONTACT-FORM-SUBMIT] ⚠️ Email sending failed:", emailError);
        // Don't fail the whole request if email fails
      }
    } else {
      console.warn("[CONTACT-FORM-SUBMIT] ⚠️ Email not configured, skipping notifications");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Contact form submitted successfully",
        data: data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[CONTACT-FORM-SUBMIT] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
