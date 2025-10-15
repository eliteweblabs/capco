import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Check Appointment Availability API
 *
 * Returns available time slots in a conversational format
 * Perfect for Vapi.ai to suggest specific times
 */

interface AvailabilityRequest {
  date?: string; // YYYY-MM-DD format
  startDate?: string;
  endDate?: string;
  duration?: number; // in minutes, default 60
}

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const date = url.searchParams.get("date");
    const duration = parseInt(url.searchParams.get("duration") || "60");

    // Generate available time slots
    const availableSlots = await generateAvailableSlots(date, undefined, undefined, duration);

    // Format for conversational response
    const conversationalResponse = formatAvailabilityResponse(availableSlots, date);

    return new Response(
      JSON.stringify({
        success: true,
        availableSlots,
        conversationalResponse,
        date: date || "next few days",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [APPOINTMENTS-AVAILABILITY] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

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

    const body: AvailabilityRequest = await request.json();
    const { date, startDate, endDate, duration = 60 } = body;

    // Generate available time slots
    const availableSlots = await generateAvailableSlots(date, startDate, endDate, duration);

    // Format for conversational response
    const conversationalResponse = formatAvailabilityResponse(availableSlots, date);

    return new Response(
      JSON.stringify({
        success: true,
        availableSlots,
        conversationalResponse,
        date: date || "next few days",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [APPOINTMENTS-AVAILABILITY] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

async function generateAvailableSlots(
  date?: string,
  startDate?: string,
  endDate?: string,
  duration: number = 60
) {
  // Define business hours (9 AM to 5 PM)
  const businessStart = 9;
  const businessEnd = 17;
  const slotDuration = duration / 60; // Convert to hours

  const availableSlots: Array<{
    date: string;
    time: string;
    datetime: string;
    available: boolean;
  }> = [];

  // If specific date provided, check that date
  if (date) {
    const slots = generateSlotsForDate(date, businessStart, businessEnd, slotDuration);
    availableSlots.push(...slots);
  } else {
    // Generate slots for next 7 days
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const dateStr = checkDate.toISOString().split("T")[0];

      const slots = generateSlotsForDate(dateStr, businessStart, businessEnd, slotDuration);
      availableSlots.push(...slots);
    }
  }

  // Check for existing appointments and mark slots as unavailable
  const existingAppointments = await getExistingAppointments(startDate, endDate);

  return availableSlots.map((slot) => ({
    ...slot,
    available: !isSlotBooked(slot, existingAppointments),
  }));
}

function generateSlotsForDate(
  date: string,
  businessStart: number,
  businessEnd: number,
  slotDuration: number
) {
  const slots: Array<{
    date: string;
    time: string;
    datetime: string;
    available: boolean;
  }> = [];

  for (let hour = businessStart; hour < businessEnd; hour += slotDuration) {
    const timeStr = formatTime(hour);
    const datetime = `${date}T${timeStr}:00Z`;

    slots.push({
      date,
      time: timeStr,
      datetime,
      available: true,
    });
  }

  return slots;
}

function formatTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

async function getExistingAppointments(startDate?: string, endDate?: string) {
  try {
    let query = supabaseAdmin!.from("appointments").select("startTime, endTime");

    if (startDate) {
      query = query.gte("startTime", startDate);
    }
    if (endDate) {
      query = query.lte("startTime", endDate);
    }

    const { data: appointments, error } = await query;

    if (error) {
      console.error("Error fetching existing appointments:", error);
      return [];
    }

    return appointments || [];
  } catch (error: any) {
    console.error("Error in getExistingAppointments:", error);
    return [];
  }
}

function isSlotBooked(
  slot: { datetime: string; time: string },
  existingAppointments: Array<{ startTime: string; endTime: string }>
): boolean {
  const slotStart = new Date(slot.datetime);

  return existingAppointments.some((appointment) => {
    const apptStart = new Date(appointment.startTime);
    const apptEnd = new Date(appointment.endTime);

    return slotStart >= apptStart && slotStart < apptEnd;
  });
}

function formatAvailabilityResponse(
  slots: Array<{ date: string; time: string; available: boolean }>,
  date?: string
): string {
  const availableSlots = slots.filter((slot) => slot.available);

  if (availableSlots.length === 0) {
    return "I'm sorry, but I don't have any available slots for that time period. Would you like me to check a different date?";
  }

  // Group slots by date
  const slotsByDate: { [key: string]: string[] } = {};
  availableSlots.forEach((slot) => {
    if (!slotsByDate[slot.date]) {
      slotsByDate[slot.date] = [];
    }
    slotsByDate[slot.date].push(slot.time);
  });

  // Create conversational response
  const responses: string[] = [];

  Object.entries(slotsByDate).forEach(([date, times]) => {
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    const monthDay = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric" });

    if (times.length === 1) {
      responses.push(`I have ${times[0]} available on ${dayName} the ${monthDay}`);
    } else if (times.length === 2) {
      responses.push(
        `How's ${dayName} the ${monthDay}? I have ${times[0]} and ${times[1]} available`
      );
    } else {
      const lastTime = times.pop();
      const timeList = times.join(", ") + `, and ${lastTime}`;
      responses.push(`I have several slots on ${dayName} the ${monthDay}: ${timeList}`);
    }
  });

  return responses.join(". ") + ". Which works best for you?";
}
