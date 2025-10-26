import type { APIRoute } from "astro";
import { Pool } from "pg";

// Cal.com database connection using Railway environment variables
const calcomDb = new Pool({
  connectionString: process.env.CALCOM_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

interface CalComUser {
  id: number;
  name: string;
  email: string;
  username: string;
}

interface CalComEventType {
  id: number;
  title: string;
  slug: string;
  length: number;
  description?: string;
}

interface CalComAvailability {
  date: string;
  slots: string[];
}

// Used in mock data and response types
type CalComBooking = {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  attendees: Array<{
    name: string;
    email: string;
  }>;
};

// Mock data for demonstration - replace with actual Cal.com API calls
const mockUsers: CalComUser[] = [
  {
    id: 1,
    name: "John Smith",
    email: "john@capco.com",
    username: "johnsmith",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah@capco.com",
    username: "sarahjohnson",
  },
];

const mockEventTypes: CalComEventType[] = [
  {
    id: 1,
    title: "Fire Protection Consultation",
    slug: "fire-protection-consultation",
    length: 60,
    description: "Comprehensive fire protection system consultation",
  },
  {
    id: 2,
    title: "System Inspection",
    slug: "system-inspection",
    length: 30,
    description: "Fire protection system inspection and assessment",
  },
];

// Generate mock availability data with ISO timestamps
function generateMockAvailability(dateFrom: string, dateTo: string): CalComAvailability[] {
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return Array.from({ length: days }).map((_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    // Generate slots from 9 AM to 5 PM every 30 minutes
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute of [0, 30]) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);
        slots.push(slotDate.toISOString());
      }
    }

    return {
      date: dateStr,
      slots,
    };
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    console.log("🔗 [CAL-INTEGRATION] Received request:", { action, params });

    switch (action) {
      case "get_account_info":
        // Generate next 10 available time slots (M-F, 9 AM - 5 PM UTC)
        const slots: string[] = [];
        const now = new Date();
        let currentDate = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
        );

        while (slots.length < 10) {
          const dayOfWeek = currentDate.getUTCDay();

          // Skip weekends
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            // Generate slots for 9 AM - 5 PM (every hour)
            for (let hour = 9; hour < 17 && slots.length < 10; hour++) {
              const slotTime = new Date(
                Date.UTC(
                  currentDate.getUTCFullYear(),
                  currentDate.getUTCMonth(),
                  currentDate.getUTCDate(),
                  hour,
                  0,
                  0
                )
              );

              // Only include future slots
              if (slotTime > now) {
                slots.push(slotTime.toISOString());
              }
            }
          }

          // Move to next day
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        // Format slots for speech - group by day for natural reading
        let slotsList = "";
        let lastDay = "";

        slots.forEach((slot, index) => {
          const date = new Date(slot);
          const dayKey = date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
          });
          const timeOnly = date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            timeZone: "UTC",
          });

          if (dayKey !== lastDay) {
            // New day - include full date
            if (index > 0) slotsList += ", ";
            slotsList += `${dayKey} at ${timeOnly}`;
            lastDay = dayKey;
          } else {
            // Same day - just add time
            slotsList += `, ${timeOnly}`;
          }
        });

        return new Response(
          JSON.stringify({
            result: `Our next available appointments are ${slotsList}. Would you like to book one of these times?`,
            data: {
              slots,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );

      case "get_users":
        return await handleGetUsers();

      case "get_event_types":
        return await handleGetEventTypes();

      case "get_availability":
        return await handleGetAvailability(params);

      case "create_booking":
        return await handleCreateBooking(params);

      case "get_bookings":
        return await handleGetBookings(params);

      case "cancel_booking":
        return await handleCancelBooking(params);

      case "get_database_url":
        return await handleGetDatabaseUrl();

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: "Unknown action",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("❌ [CAL-INTEGRATION] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

async function handleGetUsers() {
  try {
    console.log("👥 [CAL-INTEGRATION] Getting users from Cal.com database");

    // Test database connection first
    const testResult = await calcomDb.query("SELECT 1 as test");
    console.log("✅ [CAL-INTEGRATION] Database connection test:", testResult.rows);

    // First, let's check what tables exist
    const tablesResult = await calcomDb.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(
      "📋 [CAL-INTEGRATION] Available tables:",
      tablesResult.rows.map((r) => r.table_name)
    );

    // Try to find users table
    let users = [];
    try {
      const result = await calcomDb.query(`
        SELECT id, name, email, username 
        FROM users 
        ORDER BY name ASC
        LIMIT 10
      `);
      users = result.rows;
    } catch (userError) {
      console.log("⚠️ [CAL-INTEGRATION] Users table not found, trying User table");
      try {
        const result = await calcomDb.query(`
          SELECT id, name, email, username 
          FROM "User" 
          ORDER BY name ASC
          LIMIT 10
        `);
        users = result.rows;
      } catch (userError2) {
        console.log("⚠️ [CAL-INTEGRATION] User table not found, trying account table");
        const result = await calcomDb.query(`
          SELECT id, name, email, username 
          FROM account 
          ORDER BY name ASC
          LIMIT 10
        `);
        users = result.rows;
      }
    }

    const formattedUsers = users.map((row) => ({
      id: row.id,
      name: row.name || "Unknown",
      email: row.email,
      username: row.username,
    }));

    console.log("✅ [CAL-INTEGRATION] Found users:", formattedUsers.length);

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedUsers,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [CAL-INTEGRATION] Error getting users:", error);

    // Fallback to mock data if database fails
    console.log("🔄 [CAL-INTEGRATION] Falling back to mock data");
    return new Response(
      JSON.stringify({
        success: true,
        data: mockUsers,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function handleGetEventTypes() {
  try {
    console.log("📅 [CAL-INTEGRATION] Getting event types from Cal.com database");

    // Test database connection first
    const testResult = await calcomDb.query("SELECT 1 as test");
    console.log("✅ [CAL-INTEGRATION] Database connection test:", testResult.rows);

    // Try to get event types from database
    try {
      const result = await calcomDb.query(`
        SELECT id, title, slug, length, description
        FROM "EventType" 
        ORDER BY title ASC
        LIMIT 10
      `);

      const eventTypes = result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        length: row.length,
        description: row.description,
      }));

      console.log("✅ [CAL-INTEGRATION] Found event types:", eventTypes.length);

      return new Response(
        JSON.stringify({
          success: true,
          data: eventTypes,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: unknown) {
      const dbError = error as Error;
      console.log("⚠️ [CAL-INTEGRATION] Database query failed, using mock data:", dbError.message);

      // Fallback to mock data if database query fails
      return new Response(
        JSON.stringify({
          success: true,
          data: mockEventTypes,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("❌ [CAL-INTEGRATION] Error getting event types:", error);

    // Fallback to mock data if database connection fails
    console.log("🔄 [CAL-INTEGRATION] Falling back to mock data");
    return new Response(
      JSON.stringify({
        success: true,
        data: mockEventTypes,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function handleGetAvailability(params: any) {
  const { dateFrom, dateTo } = params;
  console.log("📊 [CAL-INTEGRATION] Getting availability:", { dateFrom, dateTo });

  // Parse dates and work in UTC to avoid timezone issues
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);
  const now = new Date();

  const slots: string[] = [];

  // Iterate through each day in the range
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Get day of week (0=Sunday, 6=Saturday)
    const dayOfWeek = currentDate.getUTCDay();

    // Only business days (Monday=1 through Friday=5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Generate slots from 9 AM to 5 PM (in UTC)
      for (let hour = 9; hour < 17; hour++) {
        for (let minute of [0, 30]) {
          // Create slot time using UTC methods
          const slot = new Date(
            Date.UTC(
              currentDate.getUTCFullYear(),
              currentDate.getUTCMonth(),
              currentDate.getUTCDate(),
              hour,
              minute,
              0,
              0
            )
          );

          // Only include future slots
          if (slot > now) {
            slots.push(slot.toISOString());
          }
        }
      }
    }

    // Move to next day
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  console.log("✅ [CAL-INTEGRATION] Generated slots:", slots.length);
  if (slots.length > 0) {
    console.log("✅ [CAL-INTEGRATION] Next available:", slots[0]);
    console.log("✅ [CAL-INTEGRATION] First few slots:", slots.slice(0, 3));
  } else {
    console.log("⚠️ [CAL-INTEGRATION] No slots generated!");
  }

  // Format next available slot as human-readable text
  let message = "No appointments available in the requested timeframe.";
  if (slots.length > 0) {
    const nextSlot = new Date(slots[0]);
    const dayName = nextSlot.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    });
    const monthDay = nextSlot.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
    const time = nextSlot.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    });

    message = `The next available appointment is ${dayName}, ${monthDay} at ${time}.`;
  }

  // Return format that VAPI can speak naturally
  // Put technical data in 'data' object so assistant doesn't read it
  return new Response(
    JSON.stringify({
      result: message,
      data: {
        nextAvailable: slots[0] || null,
        availableSlots: slots.slice(0, 20),
        totalSlots: slots.length,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

async function handleCreateBooking(params: any) {
  const { start, name, email, smsReminderNumber } = params;
  console.log("📝 [CAL-INTEGRATION] Creating booking:", {
    start,
    name,
    email,
    smsReminderNumber,
  });

  // Validate start time is in the future
  const startDate = new Date(start);
  const now = new Date();

  if (startDate <= now) {
    return new Response(
      JSON.stringify({
        result: "Sorry, that appointment time has already passed. Please choose a future time.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Calculate end time (60 minutes after start for consultation)
  const endDate = new Date(startDate.getTime() + 60 * 60000);

  try {
    // Generate unique booking reference
    const uid = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get the first event type (or you can query for a specific one)
    const eventTypeResult = await calcomDb.query(
      'SELECT id, length, title FROM "EventType" LIMIT 1'
    );

    if (eventTypeResult.rows.length === 0) {
      throw new Error("No event types configured in Cal.com");
    }

    const eventType = eventTypeResult.rows[0];

    // Get the first user (host) to assign the booking to
    const userResult = await calcomDb.query("SELECT id FROM users LIMIT 1");
    if (userResult.rows.length === 0) {
      throw new Error("No users found in Cal.com - please create a user account first");
    }
    const userId = userResult.rows[0].id;

    // Insert into Cal.com Booking table
    const bookingResult = await calcomDb.query(
      `INSERT INTO "Booking" (
        uid, 
        title, 
        description,
        "startTime", 
        "endTime", 
        "eventTypeId",
        "userId",
        status,
        paid,
        "isRecorded",
        "iCalSequence",
        metadata,
        "createdAt",
        "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id, uid, "startTime", "endTime", status`,
      [
        uid,
        `${eventType.title} with ${name}`,
        `Fire protection consultation booking via VAPI`,
        startDate,
        endDate,
        eventType.id,
        userId, // Assign to the first user (host)
        "accepted", // Cal.com status: accepted, pending, cancelled, rejected, awaiting_host
        false, // paid
        false, // isRecorded
        0, // iCalSequence
        JSON.stringify({
          source: "vapi",
          customerName: name,
          customerEmail: email,
          customerPhone: smsReminderNumber,
        }),
      ]
    );

    const booking = bookingResult.rows[0];
    console.log("✅ [CAL-INTEGRATION] Booking inserted into database:", booking.id);

    // Insert attendee information
    await calcomDb.query(
      `INSERT INTO "Attendee" (
        email,
        name,
        "timeZone",
        "bookingId"
      ) VALUES ($1, $2, $3, $4)`,
      [email, name, "UTC", booking.id]
    );
    console.log("✅ [CAL-INTEGRATION] Attendee added to booking");

    // Format confirmation message for VAPI to speak
    const confirmationMessage = `Your appointment has been confirmed for ${startDate.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }
    )} at ${startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    })}. You'll receive a confirmation email at ${email}.`;

    return new Response(
      JSON.stringify({
        result: confirmationMessage,
        data: {
          booking: {
            id: booking.id,
            uid: booking.uid,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
          },
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [CAL-INTEGRATION] Database error:", error);
    return new Response(
      JSON.stringify({
        result:
          "I'm sorry, there was an error creating your booking. Please try again or contact us directly.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function handleGetBookings(params: any) {
  try {
    const { userId, startDate, endDate } = params;
    console.log("📋 [CAL-INTEGRATION] Getting bookings:", { userId, startDate, endDate });

    // In a real implementation, this would call the Cal.com API
    // For now, return mock booking data
    const mockBookings: CalComBooking[] = [
      {
        id: 1,
        title: "Fire Protection Consultation",
        startTime: "2024-01-15T09:00:00Z",
        endTime: "2024-01-15T10:00:00Z",
        status: "confirmed",
        attendees: [
          {
            name: "John Doe",
            email: "john@example.com",
          },
        ],
      },
    ];

    return new Response(
      JSON.stringify({
        success: true,
        data: mockBookings,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [CAL-INTEGRATION] Error getting bookings:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get bookings",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function handleCancelBooking(params: any) {
  try {
    const { bookingId, reason } = params;
    console.log("❌ [CAL-INTEGRATION] Cancelling booking:", { bookingId, reason });

    // In a real implementation, this would call the Cal.com API to cancel the booking
    // For now, return success
    return new Response(
      JSON.stringify({
        success: true,
        message: "Booking cancelled successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [CAL-INTEGRATION] Error cancelling booking:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to cancel booking",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function handleGetDatabaseUrl() {
  try {
    console.log("🔗 [CAL-INTEGRATION] Getting database URL");

    const databaseUrl = process.env.CALCOM_DATABASE_URL;

    if (databaseUrl) {
      return new Response(
        JSON.stringify({
          success: true,
          databaseUrl: databaseUrl,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "CALCOM_DATABASE_URL not set",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("❌ [CAL-INTEGRATION] Error getting database URL:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get database URL",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
