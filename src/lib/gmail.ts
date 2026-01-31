/**
 * Gmail API Integration Library
 *
 * Handles Gmail OAuth, email fetching, sending, and management
 */

import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase configuration missing");
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  labelIds: string[];
  body?: string;
  isImportant?: boolean;
}

interface EmailPreferences {
  vipSenders: string[];
  blockedSenders: string[];
  announceAll: boolean;
  urgentKeywords: string[];
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  enabled: boolean;
}

/**
 * Get Gmail client for a user
 */
export async function getGmailClient(userId: string): Promise<gmail_v1.Gmail> {
  // Get tokens from database
  const { data: tokenData, error } = await supabase
    .from("gmail_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !tokenData) {
    throw new Error("Gmail not connected. Please authorize Gmail access first.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    `${process.env.PUBLIC_URL || "http://localhost:4321"}/api/auth/gmail/callback`
  );

  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_date: new Date(tokenData.expires_at).getTime(),
  });

  // Auto-refresh tokens
  oauth2Client.on("tokens", async (tokens) => {
    console.log("[GMAIL] Refreshing tokens for user:", userId);

    await supabase
      .from("gmail_tokens")
      .update({
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token || tokenData.refresh_token,
        expires_at: new Date(tokens.expiry_date!).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * Get unread emails
 */
export async function getUnreadEmails(userId: string, limit = 10): Promise<Email[]> {
  const gmail = await getGmailClient(userId);

  const response = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread",
    maxResults: limit,
  });

  if (!response.data.messages || response.data.messages.length === 0) {
    return [];
  }

  const emails = await Promise.all(
    response.data.messages.map(async (msg) => {
      const email = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
      });

      return parseEmail(email.data);
    })
  );

  return emails;
}

/**
 * Get new emails since timestamp
 */
export async function getNewEmailsSince(userId: string, sinceTimestamp: number): Promise<Email[]> {
  const gmail = await getGmailClient(userId);

  const afterSeconds = Math.floor(sinceTimestamp / 1000);
  const query = `is:unread after:${afterSeconds}`;

  const response = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 10,
  });

  if (!response.data.messages || response.data.messages.length === 0) {
    return [];
  }

  const emails = await Promise.all(
    response.data.messages.map(async (msg) => {
      const email = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
      });

      return parseEmail(email.data);
    })
  );

  return emails;
}

/**
 * Read a specific email
 */
export async function readEmail(userId: string, emailId: string): Promise<Email> {
  const gmail = await getGmailClient(userId);

  const email = await gmail.users.messages.get({
    userId: "me",
    id: emailId,
    format: "full",
  });

  const parsed = parseEmail(email.data);
  parsed.body = extractEmailBody(email.data.payload);

  return parsed;
}

/**
 * Send a new email
 */
export async function sendEmail(
  userId: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const gmail = await getGmailClient(userId);

  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    body,
  ].join("\n");

  const encodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedEmail,
    },
  });

  console.log(`[GMAIL] Sent email to ${to} for user ${userId}`);
}

/**
 * Reply to an email
 */
export async function replyToEmail(
  userId: string,
  emailId: string,
  replyBody: string
): Promise<void> {
  const gmail = await getGmailClient(userId);

  // Get original email
  const original = await gmail.users.messages.get({
    userId: "me",
    id: emailId,
  });

  const headers = original.data.payload?.headers || [];
  const originalFrom = headers.find((h) => h.name === "From")?.value || "";
  const originalSubject = headers.find((h) => h.name === "Subject")?.value || "";
  const messageId = headers.find((h) => h.name === "Message-ID")?.value || "";

  const replySubject = originalSubject.startsWith("Re:")
    ? originalSubject
    : `Re: ${originalSubject}`;

  const email = [
    `To: ${originalFrom}`,
    `Subject: ${replySubject}`,
    `In-Reply-To: ${messageId}`,
    `References: ${messageId}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    replyBody,
  ].join("\n");

  const encodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedEmail,
      threadId: original.data.threadId,
    },
  });

  console.log(`[GMAIL] Replied to email ${emailId} for user ${userId}`);
}

/**
 * Archive an email
 */
export async function archiveEmail(userId: string, emailId: string): Promise<void> {
  const gmail = await getGmailClient(userId);

  await gmail.users.messages.modify({
    userId: "me",
    id: emailId,
    requestBody: {
      removeLabelIds: ["INBOX"],
    },
  });

  console.log(`[GMAIL] Archived email ${emailId} for user ${userId}`);
}

/**
 * Mark email as read
 */
export async function markAsRead(userId: string, emailId: string): Promise<void> {
  const gmail = await getGmailClient(userId);

  await gmail.users.messages.modify({
    userId: "me",
    id: emailId,
    requestBody: {
      removeLabelIds: ["UNREAD"],
    },
  });

  console.log(`[GMAIL] Marked email ${emailId} as read for user ${userId}`);
}

/**
 * Mark email as unread
 */
export async function markAsUnread(userId: string, emailId: string): Promise<void> {
  const gmail = await getGmailClient(userId);

  await gmail.users.messages.modify({
    userId: "me",
    id: emailId,
    requestBody: {
      addLabelIds: ["UNREAD"],
    },
  });

  console.log(`[GMAIL] Marked email ${emailId} as unread for user ${userId}`);
}

/**
 * Get email preferences for a user
 */
export async function getEmailPreferences(userId: string): Promise<EmailPreferences> {
  const { data, error } = await supabase
    .from("email_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    // Return defaults if no preferences set
    return {
      vipSenders: [],
      blockedSenders: [],
      announceAll: false,
      urgentKeywords: ["urgent", "asap", "important", "critical", "immediate"],
      quietHoursEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      enabled: true,
    };
  }

  return {
    vipSenders: data.vip_senders || [],
    blockedSenders: data.blocked_senders || [],
    announceAll: data.announce_all || false,
    urgentKeywords: data.urgent_keywords || [],
    quietHoursEnabled: data.quiet_hours_enabled || false,
    quietHoursStart: data.quiet_hours_start || "22:00",
    quietHoursEnd: data.quiet_hours_end || "08:00",
    enabled: data.enabled !== false,
  };
}

/**
 * Check if an email is important based on user preferences
 */
export async function isImportantEmail(userId: string, email: Email): Promise<boolean> {
  const prefs = await getEmailPreferences(userId);

  if (!prefs.enabled) {
    return false;
  }

  // Check if in quiet hours
  if (prefs.quietHoursEnabled && isInQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd)) {
    return false;
  }

  // Check blocked senders
  if (
    prefs.blockedSenders.some((blocked) => email.from.toLowerCase().includes(blocked.toLowerCase()))
  ) {
    return false;
  }

  // If announce all is enabled, all emails are important
  if (prefs.announceAll) {
    return true;
  }

  // Check VIP senders
  if (prefs.vipSenders.some((vip) => email.from.toLowerCase().includes(vip.toLowerCase()))) {
    return true;
  }

  // Check urgent keywords in subject
  const subjectLower = email.subject.toLowerCase();
  if (prefs.urgentKeywords.some((keyword) => subjectLower.includes(keyword.toLowerCase()))) {
    return true;
  }

  // Check if Gmail marked it as important
  if (email.labelIds.includes("IMPORTANT")) {
    return true;
  }

  return false;
}

/**
 * Helper: Parse email from Gmail API response
 */
function parseEmail(message: gmail_v1.Schema$Message): Email {
  const headers = message.payload?.headers || [];

  return {
    id: message.id!,
    threadId: message.threadId!,
    from: headers.find((h) => h.name === "From")?.value || "",
    to: headers.find((h) => h.name === "To")?.value || "",
    subject: headers.find((h) => h.name === "Subject")?.value || "(No subject)",
    date: headers.find((h) => h.name === "Date")?.value || "",
    snippet: message.snippet || "",
    labelIds: message.labelIds || [],
  };
}

/**
 * Helper: Extract email body from payload
 */
function extractEmailBody(payload: any): string {
  if (!payload) return "";

  // If plain text body
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  // If HTML body
  if (payload.mimeType === "text/html" && payload.body?.data) {
    const html = Buffer.from(payload.body.data, "base64").toString("utf-8");
    // Strip HTML tags (basic - consider using a library for production)
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, "")
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // If multipart, recursively search
  if (payload.parts) {
    for (const part of payload.parts) {
      const body = extractEmailBody(part);
      if (body) return body;
    }
  }

  return "";
}

/**
 * Helper: Check if current time is in quiet hours
 */
function isInQuietHours(start: string, end: string): boolean {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = start.split(":").map(Number);
  const startTime = startHour * 60 + startMin;

  const [endHour, endMin] = end.split(":").map(Number);
  const endTime = endHour * 60 + endMin;

  if (startTime < endTime) {
    // Normal case: e.g., 22:00 to 08:00 next day
    return currentTime >= startTime || currentTime < endTime;
  } else {
    // Crosses midnight: e.g., 22:00 to 08:00
    return currentTime >= startTime && currentTime < endTime;
  }
}

/**
 * Helper: Extract name from email address
 */
export function extractName(emailAddress: string): string {
  // Format: "John Doe <john@example.com>" or just "john@example.com"
  const match = emailAddress.match(/^"?([^"<]+)"?\s*<?([^>]+)>?$/);
  if (match && match[1] && match[1].trim() !== match[2]) {
    return match[1].trim();
  }
  // Just return the email address
  return emailAddress.split("@")[0];
}

/**
 * Helper: Format date for voice
 */
export function formatDateForVoice(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}
