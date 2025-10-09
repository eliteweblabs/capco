import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";
// Simple validation functions
// Import validateEmail from ux-utils (server-side API routes need explicit import)
import { validateEmail } from "../../lib/ux-utils";

const validateTime = (time: string): string | null => {
  return time ? null : "Time is required";
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate required fields
    const { name, email, company, phone, message, date, time } = body;

    if (!name || !email || !date || !time) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: name, email, date, and time are required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: emailError,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate date is not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    if (selectedDate < today) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Selected date cannot be in the past",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate time format
    const timeError = validateTime(time);
    if (timeError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: timeError,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Use Supabase admin client
    const supabase = supabaseAdmin;

    if (!supabase) {
      console.error("Supabase admin client not initialized");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error. Please try again later.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check if there's already a booking for the same date and time
    const { data: existingBooking, error: checkError } = await supabase
      .from("demoBookings")
      .select("id")
      .eq("preferredDate", date)
      .eq("preferredTime", time)
      .eq("status", "pending")
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error checking existing bookings:", checkError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to check booking availability",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (existingBooking) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "This time slot is already booked. Please select a different time.",
        }),
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Insert the demo booking
    const { data: booking, error: insertError } = await supabase
      .from("demoBookings")
      .insert([
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          company: company?.trim() || null,
          phone: phone?.trim() || null,
          message: message?.trim() || null,
          preferredDate: date,
          preferredTime: time,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting demo booking:", insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to save demo booking. Please try again.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Log successful booking for admin notification
    console.log("New demo booking created:", {
      id: booking.id,
      name: booking.name,
      email: booking.email,
      company: booking.company,
      date: booking.preferredDate,
      time: booking.preferredTime,
    });

    // Send email notifications
    try {
      await sendDemoBookingEmails(booking, request);
    } catch (emailError) {
      console.error("Error sending demo booking emails:", emailError);
      // Don't fail the booking if emails fail - just log the error
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Demo booking submitted successfully!",
        bookingId: booking.id,
        data: {
          name: booking.name,
          email: booking.email,
          date: booking.preferredDate,
          time: booking.preferredTime,
        },
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Demo booking API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error. Please try again later.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

// Function to send demo booking email notifications
async function sendDemoBookingEmails(booking: any, request: Request) {
  console.log("📧 [DEMO-BOOKING] Starting email notifications for booking:", booking.id);

  try {
    // Get admin emails and user IDs
    const adminData = await getAdminEmails();
    console.log("📧 [DEMO-BOOKING] Found admin emails:", adminData.emails);
    console.log("📧 [DEMO-BOOKING] Found admin user IDs:", adminData.userIds);

    // Get the base URL for links
    const currentUrl = new URL(request.url);
    const baseUrl = currentUrl.origin;

    // Send notification to admins
    if (adminData.emails.length > 0) {
      const adminEmailContent = `
        <h2>New Demo Booking Request</h2>
        <p>A new demo booking has been submitted through the website:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Name:</strong> ${booking.name}</li>
            <li><strong>Email:</strong> ${booking.email}</li>
            <li><strong>Company:</strong> ${booking.company || "Not provided"}</li>
            <li><strong>Phone:</strong> ${booking.phone || "Not provided"}</li>
            <li><strong>Preferred Date:</strong> ${booking.preferredDate}</li>
            <li><strong>Preferred Time:</strong> ${booking.preferredTime}</li>
            <li><strong>Booking ID:</strong> ${booking.id}</li>
          </ul>
        </div>

        ${
          booking.message
            ? `
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4>Additional Notes:</h4>
          <p style="margin: 0; font-style: italic;">"${booking.message}"</p>
        </div>
        `
            : ""
        }

        <p>Please review this booking and follow up with the customer to confirm the demo appointment.</p>
      `;

      const adminEmailResponse = await fetch(`${baseUrl}/api/update-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usersToNotify: adminData.emails,
          userIdsToNotify: adminData.userIds, // Add user IDs for internal notifications
          method: "demoBookingAdmin",
          emailSubject: `New Demo Request → ${booking.name}`,
          emailContent: adminEmailContent,
          buttonText: "View Dashboard",
          buttonLink: "/dashboard",
          notificationPreferences: {
            method: "internal",
            fallbackToEmail: true,
          },
        }),
      });

      if (adminEmailResponse.ok) {
        console.log("📧 [DEMO-BOOKING] Admin notification emails sent successfully");
      } else {
        console.error("📧 [DEMO-BOOKING] Failed to send admin notification emails");
      }
    }

    // Send confirmation email to customer
    const customerEmailContent = `
      <h2>Demo Booking Confirmation</h2>
      <p>Thank you for your interest in CAPCO Design Group!</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Your Demo Booking Details:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Name:</strong> ${booking.name}</li>
          <li><strong>Email:</strong> ${booking.email}</li>
          <li><strong>Company:</strong> ${booking.company || "Not provided"}</li>
          <li><strong>Preferred Date:</strong> ${booking.preferredDate}</li>
          <li><strong>Preferred Time:</strong> ${booking.preferredTime}</li>
          <li><strong>Booking ID:</strong> ${booking.id}</li>
        </ul>
      </div>

      <p>We have received your demo booking request and will contact you shortly to confirm the appointment details.</p>
      
      <p>In the meantime, feel free to explore our website to learn more about our fire protection solutions.</p>
      
      <p>If you have any questions or need to make changes to your booking, please don't hesitate to contact us.</p>
    `;

    const customerEmailResponse = await fetch(`${baseUrl}/api/update-delivery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usersToNotify: [booking.email],
        method: "demoBookingCustomer",
        emailSubject: "Demo Booking Confirmation - CAPCO Design Group",
        emailContent: customerEmailContent,
        buttonText: "Learn More",
        buttonLink: "/solutions",
      }),
    });

    if (customerEmailResponse.ok) {
      console.log("📧 [DEMO-BOOKING] Customer confirmation email sent successfully");
    } else {
      console.error("📧 [DEMO-BOOKING] Failed to send customer confirmation email");
    }
  } catch (error) {
    console.error("📧 [DEMO-BOOKING] Error in email notification process:", error);
    throw error;
  }
}

// Function to get admin email addresses
async function getAdminEmails(): Promise<{ emails: string[]; userIds: string[] }> {
  try {
    const response = await fetch(`${process.env.SITE_URL}/api/get-user-emails-by-role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roles: ["Admin"],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        emails: data.emails || [],
        userIds: data.userIds || [],
      };
    } else {
      console.error("Failed to get admin emails:", response.status);
      return { emails: [], userIds: [] };
    }
  } catch (error) {
    console.error("Error getting admin emails:", error);
    return { emails: [], userIds: [] };
  }
}

// Handle OPTIONS request for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
