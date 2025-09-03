#!/usr/bin/env node

/**
 * Resend IMAP Email Monitor
 *
 * This script monitors an email inbox and forwards incoming emails
 * to your webhook endpoint for automated project creation.
 *
 * Works with Resend custom domains or any email provider.
 */

import dotenv from "dotenv";
import Imap from "imap";
import { simpleParser } from "mailparser";
import fetch from "node-fetch";

// Load environment variables
dotenv.config();

// Configuration
const config = {
  user: process.env.EMAIL_USER || "projects@yourdomain.com",
  password: process.env.EMAIL_PASSWORD,
  host: process.env.EMAIL_HOST || "imap.gmail.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
  webhookUrl: process.env.WEBHOOK_URL || "http://localhost:4321/api/email-webhook",
  checkInterval: parseInt(process.env.CHECK_INTERVAL) || 5 * 60 * 1000, // 5 minutes
};

// Validate configuration
if (!config.password) {
  console.error("❌ EMAIL_PASSWORD environment variable is required");
  console.error("💡 Add EMAIL_PASSWORD=your-app-password to your .env file");
  process.exit(1);
}

console.log("🚀 [RESEND-IMAP] Starting email monitor...");
console.log(`📧 [RESEND-IMAP] Monitoring: ${config.user}`);
console.log(`🔗 [RESEND-IMAP] Webhook: ${config.webhookUrl}`);
console.log(`⏰ [RESEND-IMAP] Check interval: ${config.checkInterval / 1000} seconds`);

// Initialize IMAP connection
const imap = new Imap(config);

/**
 * Process an email and send it to the webhook
 */
async function processEmail(stream, info) {
  try {
    console.log(`📧 [RESEND-IMAP] Processing email: ${info.uid}`);

    const parsed = await simpleParser(stream);
    console.log(`📬 [RESEND-IMAP] Email subject: ${parsed.subject}`);
    console.log(`👤 [RESEND-IMAP] From: ${parsed.from?.text}`);
    console.log(`📎 [RESEND-IMAP] Attachments: ${parsed.attachments?.length || 0}`);

    // Prepare webhook data
    const webhookData = {
      from: parsed.from?.text || "",
      to: parsed.to?.text || "",
      subject: parsed.subject || "",
      text: parsed.text || "",
      html: parsed.html || "",
      attachments: (parsed.attachments || []).map((att) => ({
        filename: att.filename || "unknown",
        content: att.content.toString("base64"),
        contentType: att.contentType || "application/octet-stream",
      })),
      headers: parsed.headers || {},
    };

    // Send to webhook
    console.log(`📤 [RESEND-IMAP] Sending to webhook...`);
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Resend-IMAP-Monitor/1.0",
      },
      body: JSON.stringify(webhookData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ [RESEND-IMAP] Email processed successfully`);
      if (result.projectId) {
        console.log(`🏗️ [RESEND-IMAP] Project created with ID: ${result.projectId}`);
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ [RESEND-IMAP] Webhook failed: ${response.status} ${response.statusText}`);
      console.error(`🚨 [RESEND-IMAP] Error details: ${errorText}`);
    }
  } catch (error) {
    console.error(`❌ [RESEND-IMAP] Error processing email:`, error);
  }
}

/**
 * Check for new emails in the inbox
 */
function checkEmails() {
  console.log(`🔍 [RESEND-IMAP] Checking for new emails...`);

  imap.openBox("INBOX", false, (err, box) => {
    if (err) {
      console.error(`❌ [RESEND-IMAP] Error opening inbox:`, err);
      return;
    }

    // Search for unread emails
    imap.search(["UNSEEN"], (err, results) => {
      if (err) {
        console.error(`❌ [RESEND-IMAP] Error searching emails:`, err);
        return;
      }

      if (results.length === 0) {
        console.log(`📭 [RESEND-IMAP] No new emails found`);
        return;
      }

      console.log(`📬 [RESEND-IMAP] Found ${results.length} new email(s)`);

      // Fetch and process each email
      const fetch = imap.fetch(results, { bodies: "" });

      fetch.on("message", (msg, seqno) => {
        console.log(`📧 [RESEND-IMAP] Processing message ${seqno}`);

        msg.on("body", (stream, info) => {
          processEmail(stream, info);
        });

        msg.on("end", () => {
          console.log(`✅ [RESEND-IMAP] Finished processing message ${seqno}`);
        });
      });

      fetch.on("error", (err) => {
        console.error(`❌ [RESEND-IMAP] Fetch error:`, err);
      });

      fetch.on("end", () => {
        console.log(`🎯 [RESEND-IMAP] Finished processing all emails`);
      });
    });
  });
}

// IMAP event handlers
imap.once("ready", () => {
  console.log(`✅ [RESEND-IMAP] IMAP connection established`);
  console.log(`📧 [RESEND-IMAP] Connected to: ${config.host}`);

  // Initial check
  checkEmails();

  // Set up periodic checking
  setInterval(checkEmails, config.checkInterval);
  console.log(
    `⏰ [RESEND-IMAP] Periodic checking enabled (every ${config.checkInterval / 1000} seconds)`
  );
});

imap.once("error", (err) => {
  console.error(`❌ [RESEND-IMAP] IMAP connection error:`, err);
  process.exit(1);
});

imap.once("end", () => {
  console.log(`🔌 [RESEND-IMAP] IMAP connection ended`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log(`\n🛑 [RESEND-IMAP] Received SIGINT, shutting down gracefully...`);
  imap.end();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(`\n🛑 [RESEND-IMAP] Received SIGTERM, shutting down gracefully...`);
  imap.end();
  process.exit(0);
});

// Connect to IMAP server
console.log(`🔌 [RESEND-IMAP] Connecting to ${config.host}...`);
imap.connect();
