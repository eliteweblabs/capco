import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Appointments UPSERT API for AI Virtual Agent
 * 
 * Handles both creating new appointments and updating existing ones
 * 
 * POST Body:
 * - id?: number (if updating existing appointment)
 * - calUid?: string (Cal.com UID for linking)
 * - title: string
 * - description?: string
 * - startTime: string (ISO format)
 * - endTime: string (ISO format)
 * - timeZone: string
 * - attendeeEmail: string
 * - attendeeName: string
 * - location?: string
 * - status: string (ACCEPTED, PENDING, CANCELLED, etc.)
 * - eventType: string
 * - eventTypeSlug: string
 * - duration: number (minutes)
 * - hostName: string
 * - hostEmail: string
 * - metadata?: Record<string, any>
 * 
 * Examples:
 * - Create: POST /api/appointments/upsert { title, startTime, endTime, attendeeEmail, ... }
 * - Update: POST /api/appointments/upsert { id, title, startTime, endTime, ... }
 */

interface AppointmentData {
  id?: number;
  calUid?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  attendeeEmail: string;
  attendeeName: string;
  location?: string;
  status: string;
  eventType: string;
  eventTypeSlug: string;
  duration: number;
  hostName: string;
  hostEmail: string;
  metadata?: Record<string, any>;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const appointmentData: AppointmentData = body;

    // Validate required fields
    if (!appointmentData.title?.trim() || !appointmentData.startTime || !appointmentData.endTime) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "title, startTime, and endTime are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!appointmentData.attendeeEmail?.trim() || !appointmentData.attendeeName?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "attendeeEmail and attendeeName are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📅 [APPOINTMENTS-UPSERT] ${appointmentData.id ? 'Updating' : 'Creating'} appointment:`, appointmentData.title);

    if (!supabase || !supabaseAdmin) {
      return new Response(
        JSON.stringify({ error: "Database connection not available" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare appointment data
    const appointmentPayload = {
      calUid: appointmentData.calUid || null,
      title: appointmentData.title.trim(),
      description: appointmentData.description?.trim() || null,
      startTime: appointmentData.startTime,
      endTime: appointmentData.endTime,
      timeZone: appointmentData.timeZone || "UTC",
      attendeeEmail: appointmentData.attendeeEmail.trim(),
      attendeeName: appointmentData.attendeeName.trim(),
      location: appointmentData.location?.trim() || null,
      status: appointmentData.status || "PENDING",
      eventType: appointmentData.eventType || "General Appointment",
      eventTypeSlug: appointmentData.eventTypeSlug || "general",
      duration: appointmentData.duration || 60,
      hostName: appointmentData.hostName || "System",
      hostEmail: appointmentData.hostEmail || "system@example.com",
      metadata: appointmentData.metadata || null,
      updatedAt: new Date().toISOString(),
    };

    let result;
    let isUpdate = false;

    if (appointmentData.id) {
      // Update existing appointment
      const { data, error } = await supabaseAdmin
        .from("appointments")
        .update(appointmentPayload)
        .eq("id", appointmentData.id)
        .select()
        .single();

      if (error) {
        console.error("❌ [APPOINTMENTS-UPSERT] Error updating appointment:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to update appointment",
            details: error.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      result = data;
      isUpdate = true;
    } else {
      // Create new appointment
      const { data, error } = await supabaseAdmin
        .from("appointments")
        .insert([{
          ...appointmentPayload,
          createdAt: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error("❌ [APPOINTMENTS-UPSERT] Error creating appointment:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to create appointment",
            details: error.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      result = data;
    }

    console.log(`✅ [APPOINTMENTS-UPSERT] Appointment ${isUpdate ? 'updated' : 'created'} successfully:`, result.id);

    // Notify AI agent about appointment change
    await notifyAIAgent(isUpdate ? "appointment_updated" : "appointment_created", result);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: `Appointment ${isUpdate ? 'updated' : 'created'} successfully`,
      }),
      { status: isUpdate ? 200 : 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [APPOINTMENTS-UPSERT] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Notify AI agent about appointment changes
async function notifyAIAgent(eventType: string, appointment: any) {
  try {
    const aiWebhookUrl = import.meta.env.AI_AGENT_WEBHOOK_URL;
    
    if (!aiWebhookUrl) {
      console.log("📅 [APPOINTMENTS-UPSERT] No AI agent webhook URL configured");
      return;
    }

    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      appointment: {
        id: appointment.id,
        calUid: appointment.calUid,
        title: appointment.title,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        attendeeEmail: appointment.attendeeEmail,
        attendeeName: appointment.attendeeName,
        status: appointment.status,
        eventType: appointment.eventType,
      },
    };

    const response = await fetch(aiWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.AI_AGENT_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("✅ [APPOINTMENTS-UPSERT] AI agent notified successfully");
    } else {
      console.error("❌ [APPOINTMENTS-UPSERT] Failed to notify AI agent:", response.status);
    }
  } catch (error) {
    console.error("❌ [APPOINTMENTS-UPSERT] Error notifying AI agent:", error);
  }
}
