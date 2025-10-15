import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Cal.com Webhook Handler
 *
 * Handles webhooks from Cal.com for appointment changes
 * Syncs with your internal database and notifies users
 */

interface CalWebhookData {
  triggerEvent:
    | "BOOKING_CREATED"
    | "BOOKING_RESCHEDULED"
    | "BOOKING_CANCELLED"
    | "BOOKING_CONFIRMED";
  createdAt: string;
  payload: {
    eventTypeId: number;
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
    console.log("📅 [CAL-WEBHOOK] Received webhook:", body.triggerEvent, body.payload.uid);

    // Verify webhook signature (optional but recommended)
    const signature = request.headers.get("cal-signature");
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error("❌ [CAL-WEBHOOK] Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle different event types
    switch (body.triggerEvent) {
      case "BOOKING_CREATED":
        return await handleBookingCreated(body.payload);
      case "BOOKING_RESCHEDULED":
        return await handleBookingRescheduled(body.payload);
      case "BOOKING_CANCELLED":
        return await handleBookingCancelled(body.payload);
      case "BOOKING_CONFIRMED":
        return await handleBookingConfirmed(body.payload);
      default:
        console.log("📅 [CAL-WEBHOOK] Unknown event type:", body.triggerEvent);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [CAL-WEBHOOK] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Verify webhook signature (implement based on Cal.com documentation)
function verifyWebhookSignature(payload: any, signature: string): boolean {
  // TODO: Implement signature verification
  // This should verify the webhook came from Cal.com
  return true; // Placeholder
}

// Handle booking created
async function handleBookingCreated(payload: any) {
  console.log("📅 [CAL-WEBHOOK] Booking created:", payload.uid);

  try {
    // Store in your database
    const { data, error } = await supabaseAdmin!.from("appointments").insert({
      calUid: payload.uid,
      eventTypeId: payload.eventTypeId,
      title: payload.title,
      description: payload.description,
      startTime: payload.startTime,
      endTime: payload.endTime,
      location: payload.location,
      status: payload.status,
      organizerId: payload.organizer.id,
      organizerName: payload.organizer.name,
      organizerEmail: payload.organizer.email,
      attendees: payload.attendees,
      responses: payload.responses,
      metadata: payload.metadata,
      paid: payload.paid,
      paymentId: payload.paymentId,
      createdAt: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ [CAL-WEBHOOK] Database error:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send notifications
    await sendBookingNotifications(payload, "created");

    console.log("✅ [CAL-WEBHOOK] Booking created successfully");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [CAL-WEBHOOK] Error handling booking created:", error);
    throw error;
  }
}

// Handle booking rescheduled
async function handleBookingRescheduled(payload: any) {
  console.log("📅 [CAL-WEBHOOK] Booking rescheduled:", payload.uid);

  try {
    // Update in your database
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({
        title: payload.title,
        description: payload.description,
        startTime: payload.startTime,
        endTime: payload.endTime,
        location: payload.location,
        status: payload.status,
        attendees: payload.attendees,
        responses: payload.responses,
        metadata: payload.metadata,
        updatedAt: new Date().toISOString(),
      })
      .eq("calUid", payload.uid);

    if (error) {
      console.error("❌ [CAL-WEBHOOK] Database error:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send notifications
    await sendBookingNotifications(payload, "rescheduled");

    console.log("✅ [CAL-WEBHOOK] Booking rescheduled successfully");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [CAL-WEBHOOK] Error handling booking rescheduled:", error);
    throw error;
  }
}

// Handle booking cancelled
async function handleBookingCancelled(payload: any) {
  console.log("📅 [CAL-WEBHOOK] Booking cancelled:", payload.uid);

  try {
    // Update in your database
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({
        status: "CANCELLED",
        cancellationReason: payload.cancellationReason,
        updatedAt: new Date().toISOString(),
      })
      .eq("calUid", payload.uid);

    if (error) {
      console.error("❌ [CAL-WEBHOOK] Database error:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send notifications
    await sendBookingNotifications(payload, "cancelled");

    console.log("✅ [CAL-WEBHOOK] Booking cancelled successfully");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [CAL-WEBHOOK] Error handling booking cancelled:", error);
    throw error;
  }
}

// Handle booking confirmed
async function handleBookingConfirmed(payload: any) {
  console.log("📅 [CAL-WEBHOOK] Booking confirmed:", payload.uid);

  try {
    // Update in your database
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({
        status: "CONFIRMED",
        updatedAt: new Date().toISOString(),
      })
      .eq("calUid", payload.uid);

    if (error) {
      console.error("❌ [CAL-WEBHOOK] Database error:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send notifications
    await sendBookingNotifications(payload, "confirmed");

    console.log("✅ [CAL-WEBHOOK] Booking confirmed successfully");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ [CAL-WEBHOOK] Error handling booking confirmed:", error);
    throw error;
  }
}

// Send booking notifications
async function sendBookingNotifications(payload: any, action: string) {
  try {
    // Create notification for organizer
    await supabaseAdmin!.from("notifications").insert({
      userId: payload.organizer.id,
      title: `Appointment ${action}`,
      message: `Your appointment "${payload.title}" has been ${action}`,
      type: "info",
      actionUrl: `/appointments/${payload.uid}`,
      metadata: {
        appointmentId: payload.uid,
        action: action,
        startTime: payload.startTime,
        endTime: payload.endTime,
      },
    });

    // Create notifications for attendees
    for (const attendee of payload.attendees) {
      await supabaseAdmin!.from("notifications").insert({
        userId: attendee.email, // Assuming email is used as user identifier
        title: `Appointment ${action}`,
        message: `Your appointment "${payload.title}" has been ${action}`,
        type: "info",
        actionUrl: `/appointments/${payload.uid}`,
        metadata: {
          appointmentId: payload.uid,
          action: action,
          startTime: payload.startTime,
          endTime: payload.endTime,
        },
      });
    }

    console.log("✅ [CAL-WEBHOOK] Notifications sent for", action);
  } catch (error: any) {
    console.error("❌ [CAL-WEBHOOK] Error sending notifications:", error);
  }
}
