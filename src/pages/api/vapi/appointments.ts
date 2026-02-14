import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { getApiBaseUrl } from "../../../lib/url-utils";

/**
 * Vapi.ai Appointments Integration (Internal System)
 *
 * Handles Vapi.ai webhook calls for appointment operations
 * Uses your internal database instead of external Cal.com API
 */

interface VapiAppointmentRequest {
  type: "appointment";
  action: "read" | "write" | "update" | "delete" | "availability";
  data?: any;
  appointmentId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
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

    const body: VapiAppointmentRequest = await request.json();
    const { action, data, appointmentId, userId, startDate, endDate } = body;

    console.log(`🤖 [VAPI-APPOINTMENTS] ${action} appointment request:`, { appointmentId, userId });

    switch (action) {
      case "read":
        return await handleReadAppointments(currentUser, appointmentId, startDate, endDate);
      case "write":
        return await handleCreateAppointment(currentUser, data);
      case "update":
        return await handleUpdateAppointment(currentUser, appointmentId, data);
      case "delete":
        return await handleDeleteAppointment(currentUser, appointmentId);
      case "availability":
        return await handleCheckAvailability(currentUser, data, request);
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("❌ [VAPI-APPOINTMENTS] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Read appointments
async function handleReadAppointments(
  currentUser: any,
  appointmentId?: string,
  startDate?: string,
  endDate?: string
) {
  try {
    if (appointmentId) {
      // Get specific appointment
      const { data: appointment, error } = await supabaseAdmin
        .from("appointments")
        .select("*")
        .eq("id", appointmentId)
        .single();

      if (error || !appointment) {
        return new Response(JSON.stringify({ error: "Appointment not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          appointment,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      // Get multiple appointments
      let query = supabaseAdmin!.from("appointments").select("*");

      // Add date filtering
      if (startDate) {
        query = query.gte("startTime", startDate);
      }
      if (endDate) {
        query = query.lte("startTime", endDate);
      }

      // Add user filtering based on role
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

      if (profile?.role === "Client") {
        query = query.eq("organizerId", currentUser.id);
      }

      const { data: appointments, error } = await query.order("startTime", { ascending: true });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          appointments: appointments || [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("❌ [VAPI-APPOINTMENTS] Read error:", error);
    return new Response(JSON.stringify({ error: "Failed to read appointments" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Create appointment
async function handleCreateAppointment(currentUser: any, data: any) {
  try {
    const { title, startTime, endTime, description, location, attendees } = data;

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
      status: "PENDING",
      organizerId: currentUser.id,
      organizerName: currentUser.name || "Unknown",
      organizerEmail: currentUser.email || "",
      calUid: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventTypeId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data: appointment, error } = await supabaseAdmin
      .from("appointments")
      .insert(appointmentData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        appointment,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [VAPI-APPOINTMENTS] Create error:", error);
    return new Response(JSON.stringify({ error: "Failed to create appointment" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Update appointment
async function handleUpdateAppointment(
  currentUser: any,
  appointmentId: string | undefined,
  data: any
) {
  try {
    if (!appointmentId) {
      return new Response(JSON.stringify({ error: "Appointment ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: appointment, error } = await supabaseAdmin
      .from("appointments")
      .update({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        appointment,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [VAPI-APPOINTMENTS] Update error:", error);
    return new Response(JSON.stringify({ error: "Failed to update appointment" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Delete appointment
async function handleDeleteAppointment(currentUser: any, appointmentId: string | undefined) {
  try {
    if (!appointmentId) {
      return new Response(JSON.stringify({ error: "Appointment ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error } = await supabaseAdmin!.from("appointments").delete().eq("id", appointmentId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Appointment deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [VAPI-APPOINTMENTS] Delete error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete appointment" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Check availability
async function handleCheckAvailability(currentUser: any, data: any, request: Request) {
  try {
    const { date, startDate, endDate, duration } = data;

    // Call the availability API - use request URL
    const baseUrl = getApiBaseUrl(request);
    const availabilityResponse = await fetch(`${baseUrl}/api/appointments/availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Note: In a real implementation, you'd need to pass authentication
      },
      body: JSON.stringify({
        date,
        startDate,
        endDate,
        duration: duration || 60,
      }),
    });

    if (!availabilityResponse.ok) {
      throw new Error(`Availability API error: ${availabilityResponse.status}`);
    }

    const availabilityData = await availabilityResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        availableSlots: availabilityData.availableSlots,
        conversationalResponse: availabilityData.conversationalResponse,
        date: availabilityData.date,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [VAPI-APPOINTMENTS] Availability error:", error);
    return new Response(JSON.stringify({ error: "Failed to check availability" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
