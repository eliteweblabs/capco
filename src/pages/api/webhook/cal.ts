import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Cal.com Webhook Integration for AI Virtual Agent
 * 
 * Handles appointment booking, reading, and management for general public
 * 
 * Webhook Events:
 * - BOOKING_CREATED: New appointment booked
 * - BOOKING_CANCELLED: Appointment cancelled
 * - BOOKING_RESCHEDULED: Appointment rescheduled
 * - BOOKING_CONFIRMED: Appointment confirmed
 * 
 * AI Agent Capabilities:
 * - Read existing appointments
 * - Book new appointments
 * - Cancel appointments
 * - Reschedule appointments
 * - Check availability
 */

interface CalWebhookEvent {
  triggerEvent: string;
  createdAt: string;
  payload: {
    id: number;
    uid: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    timeZone: string;
    attendees: Array<{
      email: string;
      name: string;
      timeZone: string;
    }>;
    location?: string;
    metadata?: Record<string, any>;
    status: "ACCEPTED" | "PENDING" | "CANCELLED" | "REJECTED";
    eventType: {
      id: number;
      title: string;
      slug: string;
      length: number;
    };
    user: {
      id: number;
      username: string;
      name: string;
      email: string;
    };
  };
}

interface AppointmentData {
  calId: number;
  calUid: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  attendeeEmail: string;
  attendeeName: string;
  location?: string;
  status: string;
  eventType: string;
  eventTypeSlug: string;
  duration: number;
  hostName: string;
  hostEmail: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("📅 [CAL-WEBHOOK] Received Cal.com webhook");

    // Verify webhook signature (optional but recommended)
    const signature = request.headers.get("cal-signature");
    const webhookSecret = import.meta.env.CAL_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      // TODO: Implement signature verification
      console.log("🔐 [CAL-WEBHOOK] Signature verification would go here");
    }

    const event: CalWebhookEvent = await request.json();
    console.log("📅 [CAL-WEBHOOK] Event received:", event.triggerEvent);

    if (!supabase || !supabaseAdmin) {
      console.error("❌ [CAL-WEBHOOK] Database not available");
      return new Response(
        JSON.stringify({ error: "Database not available" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Process different event types
    switch (event.triggerEvent) {
      case "BOOKING_CREATED":
        await handleBookingCreated(event);
        break;
      case "BOOKING_CANCELLED":
        await handleBookingCancelled(event);
        break;
      case "BOOKING_RESCHEDULED":
        await handleBookingRescheduled(event);
        break;
      case "BOOKING_CONFIRMED":
        await handleBookingConfirmed(event);
        break;
      default:
        console.log("📅 [CAL-WEBHOOK] Unhandled event type:", event.triggerEvent);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [CAL-WEBHOOK] Error processing webhook:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Handle new booking creation
async function handleBookingCreated(event: CalWebhookEvent) {
  console.log("📅 [CAL-WEBHOOK] Processing booking creation:", event.payload.uid);

  const appointmentData: AppointmentData = {
    calId: event.payload.id,
    calUid: event.payload.uid,
    title: event.payload.title,
    description: event.payload.description,
    startTime: event.payload.startTime,
    endTime: event.payload.endTime,
    timeZone: event.payload.timeZone,
    attendeeEmail: event.payload.attendees[0]?.email || "",
    attendeeName: event.payload.attendees[0]?.name || "",
    location: event.payload.location,
    status: event.payload.status,
    eventType: event.payload.eventType.title,
    eventTypeSlug: event.payload.eventType.slug,
    duration: event.payload.eventType.length,
    hostName: event.payload.user.name,
    hostEmail: event.payload.user.email,
    metadata: event.payload.metadata,
    createdAt: event.createdAt,
    updatedAt: new Date().toISOString(),
  };

  // Store appointment in database
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert([appointmentData])
    .select()
    .single();

  if (error) {
    console.error("❌ [CAL-WEBHOOK] Error storing appointment:", error);
    throw error;
  }

  console.log("✅ [CAL-WEBHOOK] Appointment stored successfully:", data.id);

  // Send confirmation notification to AI agent
  await notifyAIAgent("booking_created", appointmentData);
}

// Handle booking cancellation
async function handleBookingCancelled(event: CalWebhookEvent) {
  console.log("📅 [CAL-WEBHOOK] Processing booking cancellation:", event.payload.uid);

  // Update appointment status
  const { error } = await supabaseAdmin
    .from("appointments")
    .update({
      status: "CANCELLED",
      updatedAt: new Date().toISOString(),
    })
    .eq("calUid", event.payload.uid);

  if (error) {
    console.error("❌ [CAL-WEBHOOK] Error updating appointment:", error);
    throw error;
  }

  console.log("✅ [CAL-WEBHOOK] Appointment cancelled successfully");

  // Notify AI agent
  await notifyAIAgent("booking_cancelled", { calUid: event.payload.uid });
}

// Handle booking rescheduling
async function handleBookingRescheduled(event: CalWebhookEvent) {
  console.log("📅 [CAL-WEBHOOK] Processing booking reschedule:", event.payload.uid);

  // Update appointment details
  const { error } = await supabaseAdmin
    .from("appointments")
    .update({
      startTime: event.payload.startTime,
      endTime: event.payload.endTime,
      timeZone: event.payload.timeZone,
      title: event.payload.title,
      description: event.payload.description,
      location: event.payload.location,
      updatedAt: new Date().toISOString(),
    })
    .eq("calUid", event.payload.uid);

  if (error) {
    console.error("❌ [CAL-WEBHOOK] Error updating appointment:", error);
    throw error;
  }

  console.log("✅ [CAL-WEBHOOK] Appointment rescheduled successfully");

  // Notify AI agent
  await notifyAIAgent("booking_rescheduled", { calUid: event.payload.uid });
}

// Handle booking confirmation
async function handleBookingConfirmed(event: CalWebhookEvent) {
  console.log("📅 [CAL-WEBHOOK] Processing booking confirmation:", event.payload.uid);

  // Update appointment status
  const { error } = await supabaseAdmin
    .from("appointments")
    .update({
      status: "CONFIRMED",
      updatedAt: new Date().toISOString(),
    })
    .eq("calUid", event.payload.uid);

  if (error) {
    console.error("❌ [CAL-WEBHOOK] Error updating appointment:", error);
    throw error;
  }

  console.log("✅ [CAL-WEBHOOK] Appointment confirmed successfully");

  // Notify AI agent
  await notifyAIAgent("booking_confirmed", { calUid: event.payload.uid });
}

// Notify AI agent about appointment changes
async function notifyAIAgent(eventType: string, data: any) {
  try {
    const aiWebhookUrl = import.meta.env.AI_AGENT_WEBHOOK_URL;
    
    if (!aiWebhookUrl) {
      console.log("📅 [CAL-WEBHOOK] No AI agent webhook URL configured");
      return;
    }

    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: data,
    };

    const response = await fetch(aiWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.AI_AGENT_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("✅ [CAL-WEBHOOK] AI agent notified successfully");
    } else {
      console.error("❌ [CAL-WEBHOOK] Failed to notify AI agent:", response.status);
    }
  } catch (error) {
    console.error("❌ [CAL-WEBHOOK] Error notifying AI agent:", error);
  }
}
