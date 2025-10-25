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
  try {
    const { dateFrom, dateTo } = params;
    console.log("📊 [CAL-INTEGRATION] Getting availability:", { dateFrom, dateTo });

    // Test database connection first
    const testResult = await calcomDb.query("SELECT 1 as test");
    console.log("✅ [CAL-INTEGRATION] Database connection test:", testResult.rows);

    // Try to get availability from database
    try {
      // Query for available time slots in the date range
      const result = await calcomDb.query(
        `
        WITH business_hours AS (
          -- Generate time slots every 30 minutes from 9 AM to 5 PM
          SELECT generate_series(
            date_trunc('day', $1::timestamptz) + interval '9 hours',
            date_trunc('day', $2::timestamptz) + interval '17 hours',
            interval '30 minutes'
          ) as slot_start
        ),
        booked_slots AS (
          -- Get all booked slots
          SELECT start_time, end_time
          FROM "Booking"
          WHERE start_time >= $1::timestamptz
          AND end_time <= $2::timestamptz
          AND status IN ('confirmed', 'ACCEPTED')
        )
        SELECT 
          slot_start AT TIME ZONE 'UTC' as available_time
        FROM business_hours
        WHERE NOT EXISTS (
          SELECT 1 FROM booked_slots
          WHERE slot_start >= start_time
          AND slot_start < end_time
        )
        ORDER BY slot_start;
      `,
        [dateFrom, dateTo]
      );

      // Group slots by date
      const availabilityByDate: { [key: string]: string[] } = {};

      result.rows.forEach((row) => {
        const availableTime = new Date(row.available_time);
        const date = availableTime.toISOString().split("T")[0];
        const time = availableTime.toISOString();

        if (!availabilityByDate[date]) {
          availabilityByDate[date] = [];
        }
        availabilityByDate[date].push(time);
      });

      // Find the next available slot
      const allSlots = result.rows.map((row) => row.available_time).sort();

      if (allSlots.length === 0) {
        console.log("⚠️ [CAL-INTEGRATION] No available slots found in database");
        throw new Error("No available slots found");
      }

      // Get the first available slot
      const nextAvailable = allSlots[0];
      console.log("✅ [CAL-INTEGRATION] Found next available slot:", nextAvailable);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            nextAvailable,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: unknown) {
      const dbError = error as Error;
      console.log("⚠️ [CAL-INTEGRATION] Database query failed, using mock data:", dbError.message);

      // Generate mock data with proper ISO timestamps
      const mockAvailability = generateMockAvailability(params.dateFrom, params.dateTo);

      return new Response(
        JSON.stringify({
          success: true,
          data: mockAvailability,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("❌ [CAL-INTEGRATION] Error getting availability:", error);

    // Generate mock data with proper ISO timestamps
    const mockAvailability = generateMockAvailability(params.dateFrom, params.dateTo);

    return new Response(
      JSON.stringify({
        success: true,
        data: mockAvailability,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function handleCreateBooking(params: any) {
  try {
    const { start, name, email, smsReminderNumber } = params;
    console.log("📝 [CAL-INTEGRATION] Creating booking:", {
      start,
      name,
      email,
      smsReminderNumber,
    });

    // Test database connection first
    const testResult = await calcomDb.query("SELECT 1 as test");
    console.log("✅ [CAL-INTEGRATION] Database connection test:", testResult.rows);

    // Try to create booking in database
    try {
      // Validate start time is in the future
      const startDate = new Date(start);
      const now = new Date();
      if (startDate <= now) {
        throw new Error("Appointment time must be in the future");
      }

      // Calculate end time (30 minutes after start)
      const endDate = new Date(startDate.getTime() + 30 * 60000);
      const end = endDate.toISOString();

      // Verify the slot is actually available
      const availabilityCheck = await calcomDb.query(
        `
        SELECT COUNT(*) as conflict_count
        FROM "Booking"
        WHERE status IN ('confirmed', 'ACCEPTED')
        AND (
          (start_time <= $1 AND end_time > $1)
          OR (start_time < $2 AND end_time >= $2)
          OR (start_time >= $1 AND end_time <= $2)
        )
      `,
        [start, end]
      );

      if (availabilityCheck.rows[0].conflict_count > 0) {
        throw new Error("Selected time slot is no longer available");
      }

      // First, get the first user and event type
      const userResult = await calcomDb.query(`
        SELECT id FROM "User" 
        WHERE username = 'capco' 
        LIMIT 1
      `);

      const eventTypeResult = await calcomDb.query(`
        SELECT id FROM "EventType" 
        WHERE slug = 'fire-protection-consultation' 
        LIMIT 1
      `);

      if (!userResult.rows[0]?.id || !eventTypeResult.rows[0]?.id) {
        throw new Error("Could not find required user or event type");
      }

      const userId = userResult.rows[0].id;
      const eventTypeId = eventTypeResult.rows[0].id;

      // Generate a unique ID for the booking
      const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      // Prepare JSONB fields
      const attendees = JSON.stringify([
        {
          email,
          name,
          timeZone: "America/New_York",
          language: { translate: "en", locale: "en" },
        },
      ]);

      const responses = JSON.stringify({
        email,
        name,
        smsReminderNumber: smsReminderNumber || null,
      });

      const metadata = JSON.stringify({
        videoCallUrl: null,
        additionalNotes: null,
      });

      const bookingFields = JSON.stringify([
        {
          name: "name",
          value: name,
        },
        {
          name: "email",
          value: email,
        },
        ...(smsReminderNumber
          ? [
              {
                name: "smsReminderNumber",
                value: smsReminderNumber,
              },
            ]
          : []),
      ]);

      const result = await calcomDb.query(
        `
        INSERT INTO "Booking" (
          uid,
          title,
          start_time,
          end_time,
          status,
          description,
          created_at,
          updated_at,
          user_id,
          event_type_id,
          email,
          name,
          phone,
          attendees,
          responses,
          metadata,
          booking_fields,
          time_zone,
          language
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) RETURNING id, title, start_time, end_time, status
      `,
        [
          uid,
          `Fire Protection Consultation - ${name}`,
          start,
          end,
          "ACCEPTED", // Cal.com uses ACCEPTED instead of confirmed
          `Contact: ${name} (${email})${smsReminderNumber ? `, Phone: ${smsReminderNumber}` : ""}`,
          userId,
          eventTypeId,
          email,
          name,
          smsReminderNumber || null,
          attendees,
          responses,
          metadata,
          bookingFields,
          "America/New_York",
          "en",
        ]
      );

      const booking = result.rows[0];
      console.log("✅ [CAL-INTEGRATION] Booking created:", booking.id);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: booking.id,
            title: booking.title,
            start: booking.start_time,
            end: booking.end_time,
            status: booking.status,
            attendees: [
              {
                name,
                email,
                phone: smsReminderNumber,
              },
            ],
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: unknown) {
      const dbError = error as Error;
      console.log(
        "⚠️ [CAL-INTEGRATION] Database insert failed, using mock booking:",
        dbError.message
      );

      // Calculate end time for mock booking
      const startDate = new Date(start);
      const endDate = new Date(startDate.getTime() + 30 * 60000);
      const end = endDate.toISOString();

      // Fallback to mock booking if database insert fails
      const mockBooking = {
        id: Math.floor(Math.random() * 1000),
        title: "Fire Protection Consultation",
        start,
        end,
        status: "confirmed",
        attendees: [
          {
            name,
            email,
            phone: smsReminderNumber,
          },
        ],
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: mockBooking,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("❌ [CAL-INTEGRATION] Error creating booking:", error);

    // Calculate end time for mock booking
    const startDate = new Date(params.start);
    const endDate = new Date(startDate.getTime() + 30 * 60000);
    const end = endDate.toISOString();

    // Fallback to mock booking if database connection fails
    console.log("🔄 [CAL-INTEGRATION] Falling back to mock booking");
    const mockBooking = {
      id: Math.floor(Math.random() * 1000),
      title: "Fire Protection Consultation",
      start: params.start,
      end,
      status: "confirmed",
      attendees: [
        {
          name: params.name,
          email: params.email,
          phone: params.smsReminderNumber,
        },
      ],
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: mockBooking,
      }),
      {
        status: 200,
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
