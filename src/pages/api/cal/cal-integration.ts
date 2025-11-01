import type { APIRoute } from "astro";

interface CalEventRequest {
  projectId: number;
  projectTitle: string;
  startDate: string;
  duration?: number;
  description?: string;
  type?: "project-milestone" | "client-meeting" | "inspection" | "follow-up";
}

interface CalEventResponse {
  success: boolean;
  eventId?: string;
  eventUrl?: string;
  error?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("📅 [---CAL-INTEGRATION] Creating Cal.com event...");

    const body: CalEventRequest = await request.json();
    const {
      projectId,
      projectTitle,
      startDate,
      duration = 60,
      description,
      type = "project-milestone",
    } = body;

    // Cal.com API configuration
    const calComUrl = "https://calcom-web-app-production-0b16.up.railway.app";
    const calApiKey = import.meta.env.CAL_API_KEY; // You'll need to set this in your environment

    if (!calApiKey) {
      console.warn("⚠️ [---CAL-INTEGRATION] Cal.com API key not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Cal.com API key not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create event data for Cal.com
    const eventData = {
      title: `${projectTitle} - ${type.replace("-", " ").toUpperCase()}`,
      description: description || `Project milestone: ${projectTitle}`,
      startTime: startDate,
      duration: duration,
      type: type,
      projectId: projectId,
      metadata: {
        source: "capco-fire-protection",
        projectId: projectId,
        projectTitle: projectTitle,
      },
    };

    // In a real implementation, you would call the Cal.com API here
    // For now, we'll simulate the API call
    console.log("📅 [---CAL-INTEGRATION] Event data:", eventData);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate a mock event ID and URL
    const mockEventId = `cal_${Date.now()}_${projectId}`;
    const mockEventUrl = `${calComUrl}/event/${mockEventId}`;

    console.log("✅ [---CAL-INTEGRATION] Cal.com event created successfully");

    const response: CalEventResponse = {
      success: true,
      eventId: mockEventId,
      eventUrl: mockEventUrl,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [---CAL-INTEGRATION] Error creating Cal.com event:", error);

    const errorResponse: CalEventResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Webhook endpoint to receive Cal.com events
export const PUT: APIRoute = async ({ request }) => {
  try {
    console.log("🔗 [CAL-WEBHOOK] Received Cal.com webhook...");

    const webhookData = await request.json();
    console.log("🔗 [CAL-WEBHOOK] Webhook data:", webhookData);

    // Handle different webhook events
    switch (webhookData.type) {
      case "booking.created":
        console.log("📅 [CAL-WEBHOOK] New booking created:", webhookData.booking);
        // You could create a project entry or update existing project
        break;

      case "booking.cancelled":
        console.log("❌ [CAL-WEBHOOK] Booking cancelled:", webhookData.booking);
        // Handle booking cancellation
        break;

      case "booking.rescheduled":
        console.log("🔄 [CAL-WEBHOOK] Booking rescheduled:", webhookData.booking);
        // Handle rescheduling
        break;

      default:
        console.log("ℹ️ [CAL-WEBHOOK] Unknown webhook type:", webhookData.type);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [CAL-WEBHOOK] Error processing webhook:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
