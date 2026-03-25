import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { isAdminOrStaffOrSuperAdmin } from "../../../lib/user-utils";
import { generateToken, buildMagicUrl, defaultExpiry, REQUIREMENT_TYPES } from "../../../lib/ops/magic-links";
import { sendSms } from "../../../lib/ops/twilio";

/**
 * Send Magic Link to Client
 *
 * POST Body:
 * - projectId: number
 * - clientName: string
 * - clientEmail?: string
 * - clientPhone?: string
 * - linkType: 'upload_docs' | 'review_approve' | 'fill_form'
 * - requirements?: string[] (requirement keys to request)
 * - channel: 'sms' | 'email' | 'both'
 * - message?: string (optional custom message)
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { currentUser, isAuth, currentRole } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }
    if (!isAdminOrStaffOrSuperAdmin(currentRole)) {
      return createErrorResponse("Insufficient permissions", 403);
    }

    const body = await request.json();
    const { projectId, clientName, clientEmail, clientPhone, linkType, requirements, channel, message } = body;

    if (!projectId || !linkType) {
      return createErrorResponse("projectId and linkType are required");
    }
    if (channel === "sms" && !clientPhone) {
      return createErrorResponse("clientPhone required for SMS delivery");
    }

    // Get project info
    const { data: project, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("id, title, address")
      .eq("id", projectId)
      .single();

    if (projErr || !project) {
      return createErrorResponse("Project not found", 404);
    }

    // Generate magic link
    const token = generateToken();
    const expiresAt = defaultExpiry(7);
    const magicUrl = buildMagicUrl(token);

    // Build page data based on link type
    const pageData: any = {
      projectTitle: project.title,
      projectAddress: project.address,
      clientName,
      linkType,
    };

    if (linkType === "upload_docs" && requirements?.length) {
      pageData.requirements = requirements.map((key: string) => ({
        key,
        ...(REQUIREMENT_TYPES[key] || { label: key, description: "" }),
      }));
    }

    // Insert magic link record
    const { data: magicLink, error: mlErr } = await supabaseAdmin
      .from("clientMagicLinks")
      .insert({
        token,
        projectId,
        clientEmail,
        clientPhone,
        clientName,
        linkType,
        pageData,
        status: "pending",
        expiresAt: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (mlErr) {
      console.error("[OPS] Magic link insert error:", mlErr);
      return createErrorResponse("Failed to create magic link", 500);
    }

    // Insert project requirements if provided
    if (linkType === "upload_docs" && requirements?.length) {
      const reqRows = requirements.map((key: string) => ({
        projectId,
        requirementKey: key,
        label: REQUIREMENT_TYPES[key]?.label || key,
        description: REQUIREMENT_TYPES[key]?.description || "",
        isRequired: true,
        isMet: false,
      }));

      await supabaseAdmin
        .from("projectRequirements")
        .upsert(reqRows, { onConflict: "projectId,requirementKey" });
    }

    // Send via chosen channel
    const projectLabel = project.address || project.title || `Project #${projectId}`;
    const smsBody = message
      || `Hi ${clientName || "there"}, we need a few items for ${projectLabel} to get started. Tap here: ${magicUrl}`;

    const deliveryResults: any = {};

    if (channel === "sms" || channel === "both") {
      const smsResult = await sendSms(clientPhone, smsBody);
      deliveryResults.sms = smsResult;

      // Log SMS
      await supabaseAdmin.from("smsLog").insert({
        toPhone: clientPhone,
        body: smsBody,
        twilioSid: smsResult.sid,
        status: smsResult.success ? "sent" : "failed",
        projectId,
        magicLinkId: magicLink.id,
        errorMessage: smsResult.error,
      });
    }

    if (channel === "email" || channel === "both") {
      // TODO: integrate with existing email system
      deliveryResults.email = { success: false, error: "Email delivery not yet implemented" };
    }

    // Schedule follow-ups (Day 2, Day 5, Day 10)
    const now = new Date();
    const followUps = [
      { days: 2, level: 1, template: "friendly_reminder" },
      { days: 5, level: 2, template: "firm_followup" },
      { days: 10, level: 3, template: "escalate_to_admin" },
    ];

    const followUpRows = followUps.map((f) => {
      const scheduled = new Date(now);
      scheduled.setDate(scheduled.getDate() + f.days);
      return {
        taskId: null,
        magicLinkId: magicLink.id,
        projectId,
        targetType: "client",
        targetEmail: clientEmail,
        targetPhone: clientPhone,
        targetName: clientName,
        channel: clientPhone ? "sms" : "email",
        scheduledAt: scheduled.toISOString(),
        escalationLevel: f.level,
        messageTemplate: f.template,
        status: "scheduled",
      };
    });

    await supabaseAdmin.from("followUps").insert(followUpRows);

    return createSuccessResponse({
      magicLink: {
        id: magicLink.id,
        url: magicUrl,
        token,
        expiresAt,
      },
      delivery: deliveryResults,
      followUpsScheduled: followUps.length,
    });
  } catch (err: any) {
    console.error("[OPS] send-magic-link error:", err);
    return createErrorResponse(err.message || "Internal error", 500);
  }
};
