import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { globalCompanyData } from "../global/global-company-data";

/**
 * Contact Form Submission Handler
 * POST /api/contact/submit
 * 
 * Handles contact form submissions from the multi-step contact form.
 * Auto-detects missing table and provides setup instructions.
 * Sends email notifications to admins and confirmation to submitter.
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const formData = await request.formData();

    // Extract form fields
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const smsConsent = formData.get("smsConsent") === "true";
    const company = formData.get("company") as string;
    const address = formData.get("contact-address") as string;
    const message = formData.get("message") as string;

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
      console.error("[CONTACT] Supabase credentials not configured");
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

    // Check if user already exists by email
    let userId: string | null = null;
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, name, phone, companyName, smsConsent")
      .eq("email", email)
      .single();

    if (existingProfile) {
      // User exists - update their info if needed
      userId = existingProfile.id;
      
      const updates: any = {};
      if (firstName && lastName && `${firstName} ${lastName}` !== existingProfile.name) {
        updates.name = `${firstName} ${lastName}`;
      }
      if (phone && phone !== existingProfile.phone) {
        updates.phone = phone;
      }
      if (company && company !== existingProfile.companyName) {
        updates.companyName = company;
      }
      if (smsConsent !== existingProfile.smsConsent) {
        updates.smsConsent = smsConsent;
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from("profiles")
          .update(updates)
          .eq("id", userId);
        
        console.log("[CONTACT] Updated existing profile:", userId);
      }
    } else {
      // Create new profile for this contact (they'll need to sign up later)
      // Using a special UUID format for non-authenticated users
      const tempUserId = `contact-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: tempUserId,
          name: `${firstName} ${lastName}`,
          email: email,
          phone: phone || null,
          companyName: company || null,
          smsConsent: smsConsent,
          role: "Client",
          createdAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) {
        console.error("[CONTACT] Error creating profile:", profileError);
        // Continue anyway - profile creation is optional
      } else {
        userId = newProfile.id;
        console.log("[CONTACT] Created new profile:", userId);
      }
    }

    // Try to save to database
    const { data, error } = await supabase
      .from("contactSubmissions")
      .insert({
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone || null,
        smsConsent: smsConsent,
        company: company || null,
        address: address || null,
        message: message,
        userId: userId,
        submittedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[CONTACT] Database error:", error);
      
      // If table doesn't exist, provide setup instructions
      if (error.code === "42P01") {
        console.error("[CONTACT] ❌ Table 'contactSubmissions' does not exist!");
        console.error("[CONTACT] 📋 Quick Setup - Run this SQL in Supabase SQL Editor:");
        console.error(`
CREATE TABLE "contactSubmissions" (
  id SERIAL PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  "smsConsent" BOOLEAN DEFAULT false,
  company TEXT,
  address TEXT,
  message TEXT NOT NULL,
  "userId" TEXT,
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
CREATE INDEX "idx_contactSubmissions_userId" ON "contactSubmissions"("userId");
CREATE INDEX "idx_contactSubmissions_submittedAt" ON "contactSubmissions"("submittedAt" DESC);
        `);
        
        return new Response(
          JSON.stringify({
            success: false,
            error: "Database table not set up. Please run the SQL setup script.",
            details: "Check server logs for SQL commands or see sql-queriers/create-contactSubmissions-table.sql",
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
          error: "Failed to save contact submission",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("[CONTACT] Submission saved:", data);

    // Send email notifications
    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL;
    const fromName = import.meta.env.FROM_NAME;
    const companyData = await globalCompanyData();
    const baseUrl = new URL(request.url).origin;

    if (emailApiKey && fromEmail) {
      try {
        // Get admin emails from profiles table
        const { data: admins } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("role", "Admin");

        const adminEmails = admins?.map((admin) => admin.email).filter(Boolean) || [];

        // Email content for admins
        const adminSubject = `🔔 New Contact Form Submission - ${firstName} ${lastName}`;
        const adminHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
              .field { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
              .label { font-weight: bold; color: #2563eb; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Contact Form Submission</h1>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Name:</div>
                  ${firstName} ${lastName}
                </div>
                <div class="field">
                  <div class="label">Email:</div>
                  <a href="mailto:${email}">${email}</a>
                </div>
                ${phone ? `<div class="field"><div class="label">Phone:</div><a href="tel:${phone}">${phone}</a></div>` : ""}
                ${smsConsent ? `<div class="field"><div class="label">SMS Consent:</div>✅ Yes (Updates only, no marketing)</div>` : ""}
                ${company ? `<div class="field"><div class="label">Company:</div>${company}</div>` : ""}
                ${address ? `<div class="field"><div class="label">Address:</div>${address}</div>` : ""}
                <div class="field">
                  <div class="label">Message:</div>
                  ${message}
                </div>
                <a href="mailto:${email}" class="button">Reply to ${firstName}</a>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send email to each admin
        for (const adminEmail of adminEmails) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${emailApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${fromName} <${fromEmail}>`,
              to: adminEmail,
              subject: adminSubject,
              html: adminHtml,
            }),
          });
        }

        console.log(`[CONTACT] ✅ Admin notification emails sent to ${adminEmails.length} admin(s)`);

        // Email confirmation to submitter
        const submitterSubject = `Thank you for contacting ${companyData.globalCompanyName}`;
        const submitterHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
              .message-box { background: white; padding: 20px; border-radius: 4px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Thank You for Contacting Us!</h1>
              </div>
              <div class="content">
                <p>Hi ${firstName},</p>
                <p>We received your message and will get back to you as soon as possible.</p>
                <div class="message-box">
                  <strong>Your Message:</strong><br>
                  ${message}
                </div>
                <p>If you need immediate assistance, please feel free to call us or visit our website.</p>
                <p>Best regards,<br>${companyData.globalCompanyName}</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${emailApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: email,
            subject: submitterSubject,
            html: submitterHtml,
          }),
        });

        console.log(`[CONTACT] ✅ Confirmation email sent to ${email}`);
      } catch (emailError) {
        console.error("[CONTACT] ⚠️ Email sending failed:", emailError);
        // Don't fail the whole request if email fails
      }
    } else {
      console.warn("[CONTACT] ⚠️ Email not configured, skipping notifications");
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
    console.error("[CONTACT] Unexpected error:", error);
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
