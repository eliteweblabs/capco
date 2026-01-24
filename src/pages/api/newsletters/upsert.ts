import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Newsletter Upsert API
 * Creates or updates a newsletter
 * Auto-detects missing table and provides setup instructions
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

    const data = await request.json();
    const {
      id,
      title,
      subject,
      content,
      recipientType,
      customRecipients,
      isActive,
      isDraft,
      deliverViaEmail,
      deliverViaSms,
      scheduledFor,
      isScheduled,
    } = data;

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate required fields
    if (!title || !subject || !content) {
      return new Response(JSON.stringify({ error: "Title, subject, and content are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (id) {
      // Update existing newsletter
      const { data: newsletter, error } = await supabaseAdmin
        .from("newsletters")
        .update({
          title,
          subject,
          content,
          recipientType: recipientType || "all",
          customRecipients: customRecipients || [],
          isActive: isActive !== undefined ? isActive : true,
          isDraft: isDraft !== undefined ? isDraft : true,
          deliverViaEmail: deliverViaEmail !== undefined ? deliverViaEmail : true,
          deliverViaSms: deliverViaSms !== undefined ? deliverViaSms : false,
          scheduledFor: scheduledFor || null,
          isScheduled: isScheduled !== undefined ? isScheduled : false,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        // Handle missing table error
        if (error.code === "42P01") {
          console.error("[NEWSLETTER-UPSERT] ❌ Table 'newsletters' does not exist!");
          console.error(
            "[NEWSLETTER-UPSERT] 📋 Quick Setup - Run this SQL in Supabase SQL Editor:"
          );
          console.error(`
CREATE TABLE newsletters (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  "recipientType" TEXT NOT NULL DEFAULT 'all',
  "customRecipients" TEXT[],
  "isActive" BOOLEAN DEFAULT true,
  "isDraft" BOOLEAN DEFAULT true,
  "deliverViaEmail" BOOLEAN DEFAULT true,
  "deliverViaSms" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "lastSentAt" TIMESTAMP WITH TIME ZONE,
  "sentCount" INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage newsletters
CREATE POLICY "Admins can manage newsletters"
  ON newsletters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Add indexes for better performance
CREATE INDEX idx_newsletters_active ON newsletters("isActive");
CREATE INDEX idx_newsletters_recipient_type ON newsletters("recipientType");
CREATE INDEX idx_newsletters_created_at ON newsletters("createdAt" DESC);
          `);

          return new Response(
            JSON.stringify({
              success: false,
              error: "Database table not set up. Please run the SQL setup script.",
              details:
                "Check server logs for SQL commands or see sql-queriers/create-newsletters-table.sql",
              setupRequired: true,
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        console.error("❌ [NEWSLETTER-UPSERT] Update error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update newsletter", details: error.message }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Newsletter updated successfully",
          data: newsletter,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      // Create new newsletter
      const { data: newsletter, error } = await supabaseAdmin
        .from("newsletters")
        .insert({
          title,
          subject,
          content,
          recipientType: recipientType || "all",
          customRecipients: customRecipients || [],
          isActive: isActive !== undefined ? isActive : true,
          isDraft: isDraft !== undefined ? isDraft : true,
          deliverViaEmail: deliverViaEmail !== undefined ? deliverViaEmail : true,
          deliverViaSms: deliverViaSms !== undefined ? deliverViaSms : false,
          scheduledFor: scheduledFor || null,
          isScheduled: isScheduled !== undefined ? isScheduled : false,
        })
        .select()
        .single();

      if (error) {
        // Handle missing table error
        if (error.code === "42P01") {
          console.error("[NEWSLETTER-UPSERT] ❌ Table 'newsletters' does not exist!");
          console.error(
            "[NEWSLETTER-UPSERT] 📋 Quick Setup - Run this SQL in Supabase SQL Editor:"
          );
          console.error(`
CREATE TABLE newsletters (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  "recipientType" TEXT NOT NULL DEFAULT 'all',
  "customRecipients" TEXT[],
  "isActive" BOOLEAN DEFAULT true,
  "isDraft" BOOLEAN DEFAULT true,
  "deliverViaEmail" BOOLEAN DEFAULT true,
  "deliverViaSms" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "lastSentAt" TIMESTAMP WITH TIME ZONE,
  "sentCount" INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage newsletters
CREATE POLICY "Admins can manage newsletters"
  ON newsletters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Add indexes for better performance
CREATE INDEX idx_newsletters_active ON newsletters("isActive");
CREATE INDEX idx_newsletters_recipient_type ON newsletters("recipientType");
CREATE INDEX idx_newsletters_created_at ON newsletters("createdAt" DESC);
          `);

          return new Response(
            JSON.stringify({
              success: false,
              error: "Database table not set up. Please run the SQL setup script.",
              details:
                "Check server logs for SQL commands or see sql-queriers/create-newsletters-table.sql",
              setupRequired: true,
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        console.error("❌ [NEWSLETTER-UPSERT] Insert error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to create newsletter", details: error.message }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Newsletter created successfully",
          data: newsletter,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("❌ [NEWSLETTER-UPSERT] Error:", error);
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
