import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

/**
 * Contact Form Submission Handler
 * POST /api/contact/submit
 * 
 * Handles contact form submissions from the multi-step contact form.
 * Auto-detects missing table and provides setup instructions.
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const formData = await request.formData();

    // Extract form fields
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
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
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

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

    // Try to save to database
    const { data, error } = await supabase
      .from("contact_submissions")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone || null,
        company: company || null,
        address: address || null,
        message: message,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[CONTACT] Database error:", error);
      
      // If table doesn't exist, provide setup instructions
      if (error.code === "42P01") {
        console.error("[CONTACT] ❌ Table 'contact_submissions' does not exist!");
        console.error("[CONTACT] 📋 Quick Setup - Run this SQL in Supabase SQL Editor:");
        console.error(`
CREATE TABLE contact_submissions (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  address TEXT,
  message TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert
CREATE POLICY "Anyone can insert contact submissions"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

-- Allow admins to view
CREATE POLICY "Admins can view all contact submissions"
  ON contact_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Add indexes
CREATE INDEX idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX idx_contact_submissions_submitted_at ON contact_submissions(submitted_at DESC);
        `);
        
        return new Response(
          JSON.stringify({
            success: false,
            error: "Database table not set up. Please run the SQL setup script.",
            details: "Check server logs for SQL commands or see sql-queriers/create-contact-submissions-table.sql",
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

    // TODO: Optional - Send email notification to admin/staff
    // You can integrate with your email service here

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
