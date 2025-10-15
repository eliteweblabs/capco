import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";

/**
 * Vapi.ai Cal.com Integration API
 *
 * Handles Vapi.ai webhook calls for Cal.com operations
 * Supports reading/writing appointments, users, and availability
 */

interface VapiCalRequest {
  type: "appointment" | "user" | "availability" | "booking";
  action: "read" | "write" | "update" | "delete";
  data?: any;
  appointmentId?: string;
  userId?: string;
  eventTypeId?: string;
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

    const body: VapiCalRequest = await request.json();
    const { type, action, data, appointmentId, userId, eventTypeId } = body;

    console.log(`🤖 [VAPI-CAL] ${action} ${type} request:`, { appointmentId, userId, eventTypeId });

    // Route to appropriate handler
    switch (type) {
      case "appointment":
        return await handleAppointment(action, data, appointmentId, currentUser);
      case "user":
        return await handleUser(action, data, userId, currentUser);
      case "availability":
        return await handleAvailability(action, data, eventTypeId, currentUser);
      case "booking":
        return await handleBooking(action, data, currentUser);
      default:
        return new Response(JSON.stringify({ error: "Invalid type" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("❌ [VAPI-CAL] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Handle appointment operations
async function handleAppointment(
  action: string,
  data: any,
  appointmentId: string | undefined,
  currentUser: any
) {
  const calApiUrl = "https://calcom-web-app-production-fe0b.up.railway.app/api";

  switch (action) {
    case "read":
      if (!appointmentId) {
        // Get all appointments
        const response = await fetch(`${calApiUrl}/bookings`, {
          headers: {
            Authorization: `Bearer ${process.env.CAL_API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Cal.com API error: ${response.status}`);
        }

        const appointments = await response.json();
        return new Response(
          JSON.stringify({
            success: true,
            appointments: appointments.bookings || appointments,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        // Get specific appointment
        const response = await fetch(`${calApiUrl}/bookings/${appointmentId}`, {
          headers: {
            Authorization: `Bearer ${process.env.CAL_API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Cal.com API error: ${response.status}`);
        }

        const appointment = await response.json();
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
      }

    case "write":
    case "update":
      // Create or update appointment
      const bookingData = {
        eventTypeId: data.eventTypeId,
        start: data.start,
        end: data.end,
        responses: data.responses || {},
        metadata: data.metadata || {},
        timeZone: data.timeZone || "America/New_York",
        language: data.language || "en",
        ...(appointmentId && { id: appointmentId }),
      };

      const response = await fetch(`${calApiUrl}/bookings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error(`Cal.com API error: ${response.status}`);
      }

      const result = await response.json();
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

    case "delete":
      if (!appointmentId) {
        return new Response(JSON.stringify({ error: "Appointment ID required for deletion" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const deleteResponse = await fetch(`${calApiUrl}/bookings/${appointmentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.CAL_API_KEY}`,
        },
      });

      if (!deleteResponse.ok) {
        throw new Error(`Cal.com API error: ${deleteResponse.status}`);
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

    default:
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
  }
}

// Handle user operations
async function handleUser(action: string, data: any, userId: string | undefined, currentUser: any) {
  const calApiUrl = "https://calcom-web-app-production-fe0b.up.railway.app/api";

  switch (action) {
    case "read":
      if (!userId) {
        // Get all users
        const response = await fetch(`${calApiUrl}/users`, {
          headers: {
            Authorization: `Bearer ${process.env.CAL_API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Cal.com API error: ${response.status}`);
        }

        const users = await response.json();
        return new Response(
          JSON.stringify({
            success: true,
            users: users.users || users,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        // Get specific user
        const response = await fetch(`${calApiUrl}/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${process.env.CAL_API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Cal.com API error: ${response.status}`);
        }

        const user = await response.json();
        return new Response(
          JSON.stringify({
            success: true,
            user,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

    case "write":
      // Create user
      const userData = {
        username: data.username,
        email: data.email,
        name: data.name,
        bio: data.bio || "",
        timeZone: data.timeZone || "America/New_York",
        weekStart: data.weekStart || "Sunday",
        hideBranding: data.hideBranding || false,
        theme: data.theme || "light",
        completedOnboarding: data.completedOnboarding || false,
        twoFactorEnabled: data.twoFactorEnabled || false,
        locale: data.locale || "en",
        role: data.role || "USER",
      };

      const response = await fetch(`${calApiUrl}/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`Cal.com API error: ${response.status}`);
      }

      const result = await response.json();
      return new Response(
        JSON.stringify({
          success: true,
          user: result,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );

    case "update":
      if (!userId) {
        return new Response(JSON.stringify({ error: "User ID required for update" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const updateResponse = await fetch(`${calApiUrl}/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.CAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!updateResponse.ok) {
        throw new Error(`Cal.com API error: ${updateResponse.status}`);
      }

      const updateResult = await updateResponse.json();
      return new Response(
        JSON.stringify({
          success: true,
          user: updateResult,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );

    default:
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
  }
}

// Handle availability operations
async function handleAvailability(
  action: string,
  data: any,
  eventTypeId: string | undefined,
  currentUser: any
) {
  const calApiUrl = "https://calcom-web-app-production-fe0b.up.railway.app/api";

  switch (action) {
    case "read":
      if (!eventTypeId) {
        // Get all event types
        const response = await fetch(`${calApiUrl}/event-types`, {
          headers: {
            Authorization: `Bearer ${process.env.CAL_API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Cal.com API error: ${response.status}`);
        }

        const eventTypes = await response.json();
        return new Response(
          JSON.stringify({
            success: true,
            eventTypes: eventTypes.eventTypes || eventTypes,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        // Get specific event type availability
        const response = await fetch(`${calApiUrl}/event-types/${eventTypeId}/availability`, {
          headers: {
            Authorization: `Bearer ${process.env.CAL_API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Cal.com API error: ${response.status}`);
        }

        const availability = await response.json();
        return new Response(
          JSON.stringify({
            success: true,
            availability,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

    case "write":
    case "update":
      // Create or update availability
      const availabilityData = {
        days: data.days || [1, 2, 3, 4, 5], // Monday to Friday
        startTime: data.startTime || "09:00",
        endTime: data.endTime || "17:00",
        dateOverrides: data.dateOverrides || [],
        ...(eventTypeId && { eventTypeId }),
      };

      const response = await fetch(`${calApiUrl}/availability`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(availabilityData),
      });

      if (!response.ok) {
        throw new Error(`Cal.com API error: ${response.status}`);
      }

      const result = await response.json();
      return new Response(
        JSON.stringify({
          success: true,
          availability: result,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );

    default:
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
  }
}

// Handle booking operations
async function handleBooking(action: string, data: any, currentUser: any) {
  const calApiUrl = "https://calcom-web-app-production-fe0b.up.railway.app/api";

  switch (action) {
    case "read":
      // Get bookings for a specific date range
      const { start, end } = data;
      const params = new URLSearchParams();
      if (start) params.append("start", start);
      if (end) params.append("end", end);

      const response = await fetch(`${calApiUrl}/bookings?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${process.env.CAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Cal.com API error: ${response.status}`);
      }

      const bookings = await response.json();
      return new Response(
        JSON.stringify({
          success: true,
          bookings: bookings.bookings || bookings,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );

    case "write":
      // Create a new booking
      const bookingData = {
        eventTypeId: data.eventTypeId,
        start: data.start,
        end: data.end,
        responses: data.responses || {},
        metadata: data.metadata || {},
        timeZone: data.timeZone || "America/New_York",
        language: data.language || "en",
      };

      const bookingResponse = await fetch(`${calApiUrl}/bookings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!bookingResponse.ok) {
        throw new Error(`Cal.com API error: ${bookingResponse.status}`);
      }

      const result = await bookingResponse.json();
      return new Response(
        JSON.stringify({
          success: true,
          booking: result,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );

    default:
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
  }
}
