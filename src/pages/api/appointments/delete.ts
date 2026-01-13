import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Appointments DELETE API for AI Virtual Agent
 *
 * DELETE Body:
 * - id: number (appointment ID to delete)
 * - calUid?: string (Cal.com UID for additional verification)
 *
 * Example:
 * - DELETE /api/appointments/delete { "id": 123 }
 * - DELETE /api/appointments/delete { "id": 123, "calUid": "abc123" }
 */

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { id, calUid } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Appointment ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`📅 [APPOINTMENTS-DELETE] Deleting appointment:`, id);

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if appointment exists
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .select("id, calUid, title, attendeeEmail, attendeeName")
      .eq("id", id)
      .single();

    if (appointmentError || !appointment) {
      return new Response(JSON.stringify({ error: "Appointment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify Cal.com UID if provided
    if (calUid && appointment.calUid !== calUid) {
      return new Response(JSON.stringify({ error: "Cal.com UID mismatch" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete the appointment
    const { error: deleteError } = await supabaseAdmin.from("appointments").delete().eq("id", id);

    if (deleteError) {
      console.error("❌ [APPOINTMENTS-DELETE] Error deleting appointment:", deleteError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete appointment",
          details: deleteError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [APPOINTMENTS-DELETE] Appointment deleted successfully:`, id);

    // Notify AI agent about appointment deletion
    await notifyAIAgent("appointment_deleted", {
      id: appointment.id,
      calUid: appointment.calUid,
      title: appointment.title,
      attendeeEmail: appointment.attendeeEmail,
      attendeeName: appointment.attendeeName,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Appointment deleted successfully",
        deletedAppointment: {
          id: appointment.id,
          title: appointment.title,
          attendeeEmail: appointment.attendeeEmail,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [APPOINTMENTS-DELETE] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Notify AI agent about appointment deletion
async function notifyAIAgent(eventType: string, appointment: any) {
  try {
    const aiWebhookUrl = import.meta.env.AI_AGENT_WEBHOOK_URL;

    if (!aiWebhookUrl) {
      console.log("📅 [APPOINTMENTS-DELETE] No AI agent webhook URL configured");
      return;
    }

    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      appointment: {
        id: appointment.id,
        calUid: appointment.calUid,
        title: appointment.title,
        attendeeEmail: appointment.attendeeEmail,
        attendeeName: appointment.attendeeName,
      },
    };

    const response = await fetch(aiWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.AI_AGENT_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("✅ [APPOINTMENTS-DELETE] AI agent notified successfully");
    } else {
      console.error("❌ [APPOINTMENTS-DELETE] Failed to notify AI agent:", response.status);
    }
  } catch (error) {
    console.error("❌ [APPOINTMENTS-DELETE] Error notifying AI agent:", error);
  }
}
