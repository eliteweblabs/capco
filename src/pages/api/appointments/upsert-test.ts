import type { APIRoute } from "astro";

/**
 * Test Appointment Creation API (No Authentication Required)
 * For testing purposes only
 */

interface TestAppointmentData {
  title: string;
  description?: string;
  start: string;
  end: string;
  attendeeName: string;
  attendeeEmail: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: TestAppointmentData = await request.json();
    const { title, description, start, end, attendeeName, attendeeEmail } = body;

    // Validate required fields
    if (!title || !start || !end || !attendeeName || !attendeeEmail) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: title, start, end, attendeeName, attendeeEmail",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create mock appointment data
    const mockAppointment = {
      id: Math.floor(Math.random() * 10000),
      title,
      description: description || "Test appointment",
      startTime: start,
      endTime: end,
      attendeeName,
      attendeeEmail,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Simulate conversational response
    const conversationalResponse = `Perfect! I've scheduled your appointment for ${new Date(start).toLocaleDateString()} at ${new Date(start).toLocaleTimeString()}. You'll receive a confirmation email at ${attendeeEmail}.`;

    return new Response(
      JSON.stringify({
        success: true,
        appointment: mockAppointment,
        conversationalResponse,
        message: "Test appointment created successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [APPOINTMENTS-UPSERT-TEST] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
