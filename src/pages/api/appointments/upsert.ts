import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Create/Update Appointments API
 *
 * Creates or updates appointments in your database
 * Works without external Cal.com API
 */

interface AppointmentData {
  id?: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: Array<{
    email: string;
    name: string;
    timeZone?: string;
  }>;
  responses?: Record<string, any>;
  metadata?: Record<string, any>;
  status?: "PENDING" | "ACCEPTED" | "CANCELLED" | "REJECTED";
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: AppointmentData = await request.json();
    const {
      id,
      title,
      description,
      startTime,
      endTime,
      location,
      attendees,
      responses,
      metadata,
      status,
    } = body;

    if (!title || !startTime || !endTime) {
      return new Response(JSON.stringify({ error: "Title, startTime, and endTime are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const appointmentData = {
      title,
      description: description || "",
      startTime,
      endTime,
      location: location || "",
      attendees: attendees || [],
      responses: responses || {},
      metadata: metadata || {},
      status: status || "PENDING",
      organizerId: currentUser.id,
      organizerName: currentUser.email || "Unknown",
      organizerEmail: currentUser.email || "",
      calUid: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventTypeId: 1, // Default event type
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let result;
    let error;

    if (id) {
      // Update existing appointment
      const { data, error: updateError } = await supabaseAdmin!
        .from("appointments")
        .update({
          ...appointmentData,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      result = data;
      error = updateError;
    } else {
      // Create new appointment
      const { data, error: insertError } = await supabaseAdmin!
        .from("appointments")
        .insert(appointmentData)
        .select()
        .single();

      result = data;
      error = insertError;
    }

    if (error) {
      console.error("❌ [APPOINTMENTS-UPSERT] Database error:", error);
      return new Response(JSON.stringify({ error: "Database error", details: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        appointment: result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [APPOINTMENTS-UPSERT] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
