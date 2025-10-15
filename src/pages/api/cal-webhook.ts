import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";

interface CalComWebhookPayload {
  triggerEvent:
    | "BOOKING_CREATED"
    | "BOOKING_CANCELLED"
    | "BOOKING_RESCHEDULED"
    | "BOOKING_CONFIRMED";
  payload: {
    booking: {
      id: number;
      uid: string;
      title: string;
      startTime: string;
      endTime: string;
      status: "PENDING" | "ACCEPTED" | "CANCELLED" | "REJECTED";
      description: string | null;
      location: string;
      attendees: Array<{
        email: string;
        name: string;
      }>;
      eventType: {
        id: number;
        title: string;
        slug: string;
      };
      user: {
        id: number;
        username: string;
        name: string;
        email: string;
      };
    };
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verify Cal.com webhook signature (IMPORTANT for security)
    const signature = request.headers.get("X-Cal-Signature-256");
    const calWebhookSecret = import.meta.env.CAL_WEBHOOK_SECRET;

    if (!signature || !calWebhookSecret) {
      console.warn("⚠️ [CAL-WEBHOOK] Missing signature or secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify webhook signature
    if (!verifyCalComSignature(request.body, signature, calWebhookSecret)) {
      console.warn("⚠️ [CAL-WEBHOOK] Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload: CalComWebhookPayload = await request.json();
    const { triggerEvent, payload: calComPayload } = payload;
    const booking = calComPayload.booking;

    console.log(`📡 [CAL-WEBHOOK] Received event: ${triggerEvent} for booking: ${booking.uid}`);

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let responseMessage = `Event ${triggerEvent} processed.`;

    switch (triggerEvent) {
      case "BOOKING_CREATED":
      case "BOOKING_CONFIRMED":
      case "BOOKING_RESCHEDULED":
        // Upsert appointment into our database
        const { data: upsertedAppointment, error: upsertError } = await supabaseAdmin
          .from("appointments")
          .upsert(
            {
              cal_id: booking.id,
              cal_uid: booking.uid,
              title: booking.title,
              start_time: booking.startTime,
              end_time: booking.endTime,
              status: booking.status,
              description: booking.description,
              location: booking.location,
              attendee_email: booking.attendees[0]?.email,
              attendee_name: booking.attendees[0]?.name,
              event_type: booking.eventType.title,
              cal_user_id: booking.user.id,
              cal_user_name: booking.user.name,
              cal_user_email: booking.user.email,
            },
            { onConflict: "cal_uid" }
          )
          .select()
          .single();

        if (upsertError) {
          console.error("❌ [CAL-WEBHOOK] Error upserting appointment:", upsertError);
          throw new Error(`Failed to upsert appointment: ${upsertError.message}`);
        }
        responseMessage = `Appointment ${upsertedAppointment.id} ${triggerEvent === "BOOKING_CREATED" ? "created" : "updated"}.`;

        // Create notification for admins/staff
        await createBookingNotification(upsertedAppointment, triggerEvent);
        break;

      case "BOOKING_CANCELLED":
        // Mark appointment as cancelled in our database
        const { data: cancelledAppointment, error: cancelError } = await supabaseAdmin
          .from("appointments")
          .update({ status: "CANCELLED" })
          .eq("cal_uid", booking.uid)
          .select()
          .single();

        if (cancelError) {
          console.error("❌ [CAL-WEBHOOK] Error cancelling appointment:", cancelError);
          throw new Error(`Failed to cancel appointment: ${cancelError.message}`);
        }
        responseMessage = `Appointment ${cancelledAppointment.id} cancelled.`;

        // Create cancellation notification
        if (cancelledAppointment) {
          await createBookingNotification(cancelledAppointment, triggerEvent);
        }
        break;

      default:
        console.warn(`⚠️ [CAL-WEBHOOK] Unhandled trigger event: ${triggerEvent}`);
        responseMessage = `Unhandled event: ${triggerEvent}.`;
        break;
    }

    return new Response(JSON.stringify({ success: true, message: responseMessage }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [CAL-WEBHOOK] Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Helper function to create booking notifications
async function createBookingNotification(appointment: any, eventType: string) {
  try {
    // Get admin and staff users
    const { data: adminStaffUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, email, firstName, lastName")
      .in("role", ["Admin", "Staff"]);

    if (!adminStaffUsers || adminStaffUsers.length === 0) {
      console.warn("⚠️ [CAL-WEBHOOK] No admin/staff users found for notification");
      return;
    }

    const notificationTitle =
      eventType === "BOOKING_CANCELLED"
        ? "Demo Appointment Cancelled"
        : "New Demo Appointment Booked";

    const notificationMessage =
      eventType === "BOOKING_CANCELLED"
        ? `Demo appointment with ${appointment.attendee_name} (${appointment.attendee_email}) has been cancelled.`
        : `New demo appointment booked with ${appointment.attendee_name} (${appointment.attendee_email}) for ${new Date(appointment.start_time).toLocaleDateString()}.`;

    // Create notifications for admin/staff
    const notifications = adminStaffUsers.map((user) => ({
      userId: user.id,
      title: notificationTitle,
      message: notificationMessage,
      type: eventType === "BOOKING_CANCELLED" ? "warning" : "info",
      priority: "normal",
      data: {
        appointmentId: appointment.id,
        calUid: appointment.cal_uid,
        eventType: eventType,
      },
      viewed: false,
    }));

    const { error: notificationError } = await supabaseAdmin
      .from("notifications")
      .insert(notifications);

    if (notificationError) {
      console.error("❌ [CAL-WEBHOOK] Error creating notifications:", notificationError);
    } else {
      console.log(
        `✅ [CAL-WEBHOOK] Created ${notifications.length} notifications for ${eventType}`
      );
    }
  } catch (error) {
    console.error("❌ [CAL-WEBHOOK] Error in createBookingNotification:", error);
  }
}

// Placeholder for Cal.com signature verification
// You should implement actual cryptographic verification here
function verifyCalComSignature(body: any, signature: string, secret: string): boolean {
  // TODO: Implement actual HMAC-SHA256 signature verification
  // This is a placeholder - you should verify the signature properly
  console.warn("⚠️ Cal.com webhook signature verification is not implemented.");
  return true; // DANGER: This should be false until implemented
}
