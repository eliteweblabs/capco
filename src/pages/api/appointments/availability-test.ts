import type { APIRoute } from "astro";

/**
 * Test Appointment Availability API (No Authentication Required)
 * For testing purposes only
 */

export const GET: APIRoute = async ({ url }) => {
  try {
    const date = url.searchParams.get("date");
    const duration = parseInt(url.searchParams.get("duration") || "60");

    // Generate mock available time slots
    const availableSlots = generateMockSlots(date, duration);

    return new Response(
      JSON.stringify({
        success: true,
        availableSlots,
        message: "Test availability data",
        date: date || "next few days",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [APPOINTMENTS-AVAILABILITY-TEST] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

function generateMockSlots(date?: string, duration: number = 60) {
  const slots: Array<{
    date: string;
    time: string;
    datetime: string;
    available: boolean;
  }> = [];

  // Use provided date or default to tomorrow
  const targetDate = date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Business hours: 9 AM to 5 PM
  const businessStart = 9;
  const businessEnd = 17;
  const slotDuration = duration / 60; // Convert to hours

  for (let hour = businessStart; hour < businessEnd; hour += slotDuration) {
    const timeStr = formatTime(hour);
    const datetime = `${targetDate}T${timeStr}:00Z`;

    slots.push({
      date: targetDate,
      time: timeStr,
      datetime,
      available: Math.random() > 0.3, // Randomly make some slots unavailable
    });
  }

  return slots;
}

function formatTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
