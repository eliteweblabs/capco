import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Simple Cal.com Webhook Handler (Free)
 *
 * Handles webhooks from Cal.com for appointment changes
 * This works with the free Cal.com plan
 */

interface CalWebhookData {
  triggerEvent:
    | "BOOKING_CREATED"
    | "BOOKING_RESCHEDULED"
    | "BOOKING_CANCELLED"
    | "BOOKING_CONFIRMED";
  createdAt: string;
  payload: {
    uid: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
    attendees: Array<{
      email: string;
      name: string;
      timeZone: string;
    }>;
    organizer: {
      id: number;
      name: string;
      email: string;
      timeZone: string;
    };
    responses: Record<string, any>;
    metadata: Record<string, any>;
    status: "ACCEPTED" | "PENDING" | "CANCELLED" | "REJECTED";
    paid: boolean;
    paymentId?: string;
    cancellationReason?: string;
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: CalWebhookData = await request.json();
    console.log("📅 [CAL-WEBHOOK-SIMPLE] Received webhook:", body.triggerEvent, body.payload.uid);

    // Store appointment data in your database
    const { data, error } = await supabaseAdmin!.from("appointments").insert({
      calUid: body.payload.uid,
      eventTypeId: 1, // Default event type
      title: body.payload.title,
      description: body.payload.description,
      startTime: body.payload.startTime,
      endTime: body.payload.endTime,
      location: body.payload.location,
      status: body.payload.status,
      organizerId: body.payload.organizer.id,
      organizerName: body.payload.organizer.name,
      organizerEmail: body.payload.organizer.email,
      attendees: body.payload.attendees,
      responses: body.payload.responses,
      metadata: body.payload.metadata,
      paid: body.payload.paid,
      paymentId: body.payload.paymentId,
      cancellationReason: body.payload.cancellationReason,
      createdAt: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ [CAL-WEBHOOK-SIMPLE] Database error:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("✅ [CAL-WEBHOOK-SIMPLE] Appointment stored successfully");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [CAL-WEBHOOK-SIMPLE] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
