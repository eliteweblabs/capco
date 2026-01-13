import type { APIRoute } from "astro";
import { Pool } from "pg";
import { getApiBaseUrl } from "../../../lib/url-utils";
// import { globalCompanyData } from "../../pages/api/global/global-company-data";

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
    const { action, calendarType = "calcom", ...params } = body;

    // calendarType is passed from webhook (extracted from URL query parameter in config files)
    const effectiveCalendarType = calendarType;

    console.log("🔗 [CAL-INTEGRATION] Received request:", {
      action,
      calendarType: effectiveCalendarType,
      params,
    });

    switch (action) {
      case "get_staff_schedule":
        return await handlegetStaffSchedule(params, effectiveCalendarType);

      case "get_users":
        return await handleGetUsers();

      case "get_event_types":
        return await handleGetEventTypes();

      case "get_availability":
        return await handleGetAvailability(params);

      case "create_booking":
        return await handleCreateBooking(params, effectiveCalendarType);

      case "get_bookings":
        return await handleGetBookings(params);

      case "cancel_booking":
        return await handleCancelBooking(params);

      case "get_database_url":
        return await handleGetDatabaseUrl();

      case "lookup_client":
        return await handleLookupClient(params);

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

// Helper function to get working hours from Cal.com Availability table
// Throws an error if availability cannot be found - NO FALLBACKS
async function getWorkingHours(
  userId: number,
  eventTypeId?: number,
  username?: string
): Promise<{
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}> {
  let availabilityResult: any = null;
  const errors: string[] = [];

  // If username provided, try to resolve userId from username first
  let resolvedUserId = userId;
  if (username && !userId) {
    try {
      // Try to find user by username
      let userQuery = `SELECT id FROM "User" WHERE username = $1`;
      let userResult = await calcomDb.query(userQuery, [username]);

      if (userResult.rows.length === 0) {
        // Try lowercase table
        userQuery = `SELECT id FROM users WHERE username = $1`;
        userResult = await calcomDb.query(userQuery, [username]);
      }

      if (userResult.rows.length > 0) {
        resolvedUserId = userResult.rows[0].id;
        console.log(
          `✅ [CAL-INTEGRATION] Resolved username "${username}" to userId ${resolvedUserId}`
        );
      }
    } catch (userError: any) {
      console.log(
        `⚠️ [CAL-INTEGRATION] Could not resolve username "${username}": ${userError.message}`
      );
    }
  }

  // Strategy 1: Try Availability table with PascalCase (modern Cal.com)
  try {
    // First try with eventTypeId filter if provided
    if (eventTypeId) {
      let query = `SELECT "startTime", "endTime", days FROM "Availability" WHERE "userId" = $1 AND ("eventTypeId" = $2 OR "eventTypeId" IS NULL) ORDER BY "eventTypeId" NULLS LAST LIMIT 1`;
      availabilityResult = await calcomDb.query(query, [resolvedUserId, eventTypeId]);
      if (availabilityResult.rows.length > 0) {
        console.log(
          `✅ [CAL-INTEGRATION] Found availability in "Availability" table (with eventTypeId filter)`
        );
      }
    }

    // If no result, try without eventTypeId filter (availability might not be event-specific)
    if (!availabilityResult || availabilityResult.rows.length === 0) {
      let query = `SELECT "startTime", "endTime", days FROM "Availability" WHERE "userId" = $1 ORDER BY "eventTypeId" NULLS LAST LIMIT 1`;
      availabilityResult = await calcomDb.query(query, [resolvedUserId]);
      if (availabilityResult.rows.length > 0) {
        console.log(`✅ [CAL-INTEGRATION] Found availability in "Availability" table (user-level)`);
      }
    }
  } catch (error: any) {
    errors.push(`"Availability" table: ${error.message}`);
  }

  // Strategy 2: Try availability table with snake_case (lowercase)
  if (!availabilityResult || availabilityResult.rows.length === 0) {
    try {
      let query = `SELECT start_time, end_time, days FROM availability WHERE user_id = $1`;
      const params: any[] = [resolvedUserId];

      if (eventTypeId) {
        query += ` AND (event_type_id = $2 OR event_type_id IS NULL)`;
        params.push(eventTypeId);
      }
      query += ` ORDER BY event_type_id NULLS LAST LIMIT 1`;

      availabilityResult = await calcomDb.query(query, params);
      if (availabilityResult.rows.length > 0) {
        console.log(`✅ [CAL-INTEGRATION] Found availability in availability table`);
        // Rename fields for consistent handling
        availabilityResult.rows[0].startTime = availabilityResult.rows[0].start_time;
        availabilityResult.rows[0].endTime = availabilityResult.rows[0].end_time;
      }
    } catch (error: any) {
      errors.push(`availability table: ${error.message}`);
    }
  }

  // Strategy 3: Try via EventType slug -> Availability (if availability is linked by event type slug)
  if ((!availabilityResult || availabilityResult.rows.length === 0) && eventTypeId) {
    try {
      // First get the event type slug
      let eventTypeSlugResult;
      try {
        eventTypeSlugResult = await calcomDb.query(`SELECT slug FROM "EventType" WHERE id = $1`, [
          eventTypeId,
        ]);
      } catch (e: any) {
        eventTypeSlugResult = await calcomDb.query(`SELECT slug FROM event_types WHERE id = $1`, [
          eventTypeId,
        ]);
      }

      if (eventTypeSlugResult.rows.length > 0) {
        const slug = eventTypeSlugResult.rows[0].slug;
        // Try availability linked to event type by slug/path
        try {
          const slugQuery = `
            SELECT "startTime", "endTime", days
            FROM "Availability"
            WHERE ("userId" = $1 OR "userId" IS NULL)
            AND ("eventTypeId" = $2 OR "eventTypeId" IN (SELECT id FROM "EventType" WHERE slug = $3))
            ORDER BY "eventTypeId" NULLS LAST
            LIMIT 1
          `;
          availabilityResult = await calcomDb.query(slugQuery, [resolvedUserId, eventTypeId, slug]);
          if (availabilityResult.rows.length > 0) {
            console.log(`✅ [CAL-INTEGRATION] Found availability via EventType slug: ${slug}`);
          }
        } catch (slugError: any) {
          // Try lowercase
          const slugQuery = `
            SELECT start_time, end_time, days
            FROM availability
            WHERE (user_id = $1 OR user_id IS NULL)
            AND (event_type_id = $2 OR event_type_id IN (SELECT id FROM event_types WHERE slug = $3))
            ORDER BY event_type_id NULLS LAST
            LIMIT 1
          `;
          availabilityResult = await calcomDb.query(slugQuery, [resolvedUserId, eventTypeId, slug]);
          if (availabilityResult.rows.length > 0) {
            console.log(
              `✅ [CAL-INTEGRATION] Found availability via event type slug (lowercase): ${slug}`
            );
            availabilityResult.rows[0].startTime = availabilityResult.rows[0].start_time;
            availabilityResult.rows[0].endTime = availabilityResult.rows[0].end_time;
          }
        }
      }
    } catch (error: any) {
      errors.push(`EventType slug relationship: ${error.message}`);
    }
  }

  // Strategy 4: Try via Schedule -> Availability (if EventType has schedule_id OR check user's default schedule)
  if ((!availabilityResult || availabilityResult.rows.length === 0) && eventTypeId) {
    try {
      // First try via EventType's scheduleId
      let scheduleQuery = `
        SELECT a."startTime", a."endTime", a.days
        FROM "EventType" et
        JOIN "Schedule" s ON et."scheduleId" = s.id
        JOIN "Availability" a ON s.id = a."scheduleId"
        WHERE et.id = $1 AND (a."userId" = $2 OR a."userId" IS NULL)
        ORDER BY a."eventTypeId" NULLS LAST
        LIMIT 1
      `;
      availabilityResult = await calcomDb.query(scheduleQuery, [eventTypeId, resolvedUserId]);
      if (availabilityResult.rows.length > 0) {
        console.log(`✅ [CAL-INTEGRATION] Found availability via EventType Schedule relationship`);
      } else {
        // If EventType has no scheduleId, try user's default schedule(s)
        scheduleQuery = `
          SELECT a."startTime", a."endTime", a.days
          FROM "Schedule" s
          JOIN "Availability" a ON s.id = a."scheduleId"
          WHERE s."userId" = $1
          ORDER BY a."eventTypeId" NULLS LAST, s.id
          LIMIT 1
        `;
        availabilityResult = await calcomDb.query(scheduleQuery, [resolvedUserId]);
        if (availabilityResult.rows.length > 0) {
          console.log(`✅ [CAL-INTEGRATION] Found availability via user's default Schedule`);
        }
      }
    } catch (error: any) {
      errors.push(`Schedule relationship: ${error.message}`);
    }
  }

  // Strategy 5: Try lowercase schedule relationship
  if ((!availabilityResult || availabilityResult.rows.length === 0) && eventTypeId) {
    try {
      const scheduleQuery = `
        SELECT a.start_time, a.end_time, a.days
        FROM event_types et
        JOIN schedules s ON et.schedule_id = s.id
        JOIN availability a ON s.id = a.schedule_id
        WHERE et.id = $1 AND (a.user_id = $2 OR a.user_id IS NULL)
        ORDER BY a.event_type_id NULLS LAST
        LIMIT 1
      `;
      availabilityResult = await calcomDb.query(scheduleQuery, [eventTypeId, resolvedUserId]);
      if (availabilityResult.rows.length > 0) {
        console.log(
          `✅ [CAL-INTEGRATION] Found availability via schedule relationship (lowercase)`
        );
        // Rename fields
        availabilityResult.rows[0].startTime = availabilityResult.rows[0].start_time;
        availabilityResult.rows[0].endTime = availabilityResult.rows[0].end_time;
      }
    } catch (error: any) {
      errors.push(`schedule relationship (lowercase): ${error.message}`);
    }
  }

  // If still no results, try to get diagnostic info
  if (!availabilityResult || availabilityResult.rows.length === 0) {
    let diagnosticInfo = `\n\nDiagnostic queries attempted:\n${errors.join("\n")}\n\n`;

    // Try to check what tables exist
    try {
      const tablesCheck = await calcomDb.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (table_name LIKE '%availability%' OR table_name LIKE '%Availability%' OR table_name LIKE '%schedule%' OR table_name LIKE '%Schedule%')
        ORDER BY table_name
      `);
      diagnosticInfo += `Available tables: ${tablesCheck.rows.map((r: any) => r.table_name).join(", ")}\n`;
    } catch (diagError: any) {
      diagnosticInfo += `Could not check tables: ${diagError.message}\n`;
    }

    // Check if EventType exists and has schedule_id
    if (eventTypeId) {
      try {
        const eventTypeCheck = await calcomDb.query(
          `
            SELECT id, "scheduleId", "userId" FROM "EventType" WHERE id = $1
          `,
          [eventTypeId]
        );
        if (eventTypeCheck.rows.length > 0) {
          diagnosticInfo += `EventType ${eventTypeId} exists: scheduleId=${eventTypeCheck.rows[0].scheduleId}, userId=${eventTypeCheck.rows[0].userId}\n`;
        }
      } catch (etError: any) {
        try {
          const eventTypeCheck = await calcomDb.query(
            `
              SELECT id, schedule_id, user_id FROM event_types WHERE id = $1
            `,
            [eventTypeId]
          );
          if (eventTypeCheck.rows.length > 0) {
            diagnosticInfo += `EventType ${eventTypeId} exists: schedule_id=${eventTypeCheck.rows[0].schedule_id}, user_id=${eventTypeCheck.rows[0].user_id}\n`;
          }
        } catch (etError2: any) {
          diagnosticInfo += `Could not check EventType: ${etError2.message}\n`;
        }
      }
    }

    // Check what's actually in the Availability table for this user
    try {
      // First, let's see the actual table structure
      const columnCheck = await calcomDb.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Availability' 
        ORDER BY ordinal_position
      `);
      diagnosticInfo += `Availability table columns: ${columnCheck.rows.map((r: any) => `${r.column_name} (${r.data_type})`).join(", ")}\n`;

      // Check for records with userId
      const availabilityCheck = await calcomDb.query(
        `SELECT COUNT(*) as count, 
         MIN("userId") as min_user_id, 
         MAX("userId") as max_user_id,
         COUNT(DISTINCT "userId") as distinct_users
         FROM "Availability" WHERE "userId" = $1`,
        [resolvedUserId]
      );
      if (availabilityCheck.rows.length > 0) {
        const stats = availabilityCheck.rows[0];
        diagnosticInfo += `Availability table stats for userId ${resolvedUserId}: count=${stats.count}, distinct_users=${stats.distinct_users}\n`;

        // If we have records, show a sample
        if (stats.count > 0) {
          const sampleCheck = await calcomDb.query(
            `SELECT id, "userId", "startTime", "endTime", days, "scheduleId", "eventTypeId" 
             FROM "Availability" 
             WHERE "userId" = $1 
             LIMIT 3`,
            [resolvedUserId]
          );
          diagnosticInfo += `Sample Availability records: ${JSON.stringify(sampleCheck.rows, null, 2)}\n`;
        }

        // If no records, check what userIds DO exist
        if (stats.count === 0) {
          const allAvailabilityCheck = await calcomDb.query(
            `SELECT DISTINCT "userId" FROM "Availability" LIMIT 10`
          );
          const userIds = allAvailabilityCheck.rows
            .map((r: any) => r.userId)
            .filter((id: any) => id !== null);
          diagnosticInfo += `Available userIds in Availability table: ${userIds.length > 0 ? userIds.join(", ") : "none found"}\n`;
        }
      }
    } catch (availError: any) {
      diagnosticInfo += `Could not check Availability table contents: ${availError.message}\n`;
    }

    // Also check if there are any Availability records at all (no userId filter)
    try {
      const anyAvailabilityCheck = await calcomDb.query(
        `SELECT COUNT(*) as count FROM "Availability"`
      );
      if (anyAvailabilityCheck.rows.length > 0) {
        diagnosticInfo += `Total Availability records in database: ${anyAvailabilityCheck.rows[0].count}\n`;
      }
    } catch (availError2: any) {
      diagnosticInfo += `Could not check total Availability count: ${availError2.message}\n`;
    }

    // Check Schedule table - availability might be linked via Schedule
    try {
      const scheduleCheck = await calcomDb.query(
        `SELECT id, name, "userId" FROM "Schedule" WHERE "userId" = $1 LIMIT 5`,
        [resolvedUserId]
      );
      if (scheduleCheck.rows.length > 0) {
        const scheduleIds = scheduleCheck.rows.map((r: any) => r.id).join(", ");
        diagnosticInfo += `Found ${scheduleCheck.rows.length} Schedule(s) for userId ${resolvedUserId}: ids=[${scheduleIds}]\n`;

        // Check if Availability is linked to these schedules
        for (const schedule of scheduleCheck.rows) {
          const availViaSchedule = await calcomDb.query(
            `SELECT COUNT(*) as count FROM "Availability" WHERE "scheduleId" = $1`,
            [schedule.id]
          );
          if (availViaSchedule.rows.length > 0 && availViaSchedule.rows[0].count > 0) {
            diagnosticInfo += `  Schedule ${schedule.id} (${schedule.name}) has ${availViaSchedule.rows[0].count} availability records\n`;
          }
        }
      } else {
        diagnosticInfo += `No Schedule records found for userId ${resolvedUserId}\n`;
      }
    } catch (scheduleError: any) {
      diagnosticInfo += `Could not check Schedule table: ${scheduleError.message}\n`;
    }

    throw new Error(
      `No availability found in Cal.com for userId ${resolvedUserId}${username ? ` (username: ${username})` : ""}${eventTypeId ? ` and eventTypeId ${eventTypeId}` : ""}. Please configure availability in Cal.com.${diagnosticInfo}`
    );
  }

  const availability = availabilityResult.rows[0];

  // Parse start_time and end_time (they're TIME types, e.g., "10:30:00" or "17:00:00")
  const startTime = availability.startTime;
  const endTime = availability.endTime;

  if (!startTime || !endTime) {
    throw new Error(
      `Availability record found but missing startTime or endTime. startTime: ${startTime}, endTime: ${endTime}`
    );
  }

  // Handle different time formats
  let startHour: number, startMinute: number;
  let endHour: number, endMinute: number;

  if (typeof startTime === "string") {
    // Parse "HH:MM:SS" or "HH:MM" format
    const parts = startTime.split(":");
    if (parts.length < 2) {
      throw new Error(`Invalid startTime format: ${startTime}. Expected HH:MM or HH:MM:SS`);
    }
    startHour = Number(parts[0]);
    startMinute = Number(parts[1]) || 0;

    if (isNaN(startHour) || isNaN(startMinute)) {
      throw new Error(`Invalid startTime format: ${startTime}. Could not parse hour or minute`);
    }
  } else if (startTime instanceof Date) {
    startHour = startTime.getUTCHours();
    startMinute = startTime.getUTCMinutes();
  } else {
    throw new Error(`Unexpected startTime type: ${typeof startTime}. Value: ${startTime}`);
  }

  if (typeof endTime === "string") {
    const parts = endTime.split(":");
    if (parts.length < 2) {
      throw new Error(`Invalid endTime format: ${endTime}. Expected HH:MM or HH:MM:SS`);
    }
    endHour = Number(parts[0]);
    endMinute = Number(parts[1]) || 0;

    if (isNaN(endHour) || isNaN(endMinute)) {
      throw new Error(`Invalid endTime format: ${endTime}. Could not parse hour or minute`);
    }
  } else if (endTime instanceof Date) {
    endHour = endTime.getUTCHours();
    endMinute = endTime.getUTCMinutes();
  } else {
    throw new Error(`Unexpected endTime type: ${typeof endTime}. Value: ${endTime}`);
  }

  console.log(
    `✅ [CAL-INTEGRATION] Found availability from Cal.com: ${startHour}:${startMinute.toString().padStart(2, "0")} - ${endHour}:${endMinute.toString().padStart(2, "0")}`
  );

  return { startHour, startMinute, endHour, endMinute };
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

// Get account info with real Cal.com availability
async function handlegetStaffSchedule(params: any = {}, calendarType: string = "calcom") {
  try {
    // Route to appropriate calendar handler based on calendar type
    switch (calendarType.toLowerCase()) {
      case "google":
        return await handleGoogleCalendarGetStaffSchedule(params);
      case "ical":
        return await handleICalGetStaffSchedule(params);
      case "calcom":
      default:
        return await handleCalComGetStaffSchedule(params);
    }
  } catch (error: any) {
    console.error("❌ [CAL-INTEGRATION] Error in handlegetStaffSchedule:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to get staff schedule",
        message: error.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Cal.com implementation
async function handleCalComGetStaffSchedule(params: any = {}) {
  try {
    const { username: usernameParam, calname } = params;
    // Support both username and calname parameters
    const providedUsername = usernameParam || calname;

    console.log(
      "📊 [CAL-INTEGRATION] Getting real account info from Cal.com...",
      providedUsername ? `for username: ${providedUsername}` : ""
    );

    // If username/calname is provided, resolve it to userId and find event types for that user
    let targetUserId: number | undefined;
    if (providedUsername) {
      try {
        // Try to find user by username
        let userQuery = `SELECT id FROM "User" WHERE username = $1`;
        let userResult = await calcomDb.query(userQuery, [providedUsername]);

        if (userResult.rows.length === 0) {
          // Try lowercase table
          userQuery = `SELECT id FROM users WHERE username = $1`;
          userResult = await calcomDb.query(userQuery, [providedUsername]);
        }

        if (userResult.rows.length > 0) {
          targetUserId = userResult.rows[0].id;
          console.log(
            `✅ [CAL-INTEGRATION] Resolved username "${providedUsername}" to userId ${targetUserId}`
          );
        } else {
          console.warn(
            `⚠️ [CAL-INTEGRATION] Could not resolve username "${providedUsername}", falling back to default event type`
          );
        }
      } catch (userError: any) {
        console.warn(
          `⚠️ [CAL-INTEGRATION] Error resolving username "${providedUsername}": ${userError.message}, falling back to default event type`
        );
      }
    }

    // Get the configured event type for VAPI bookings
    // IMPORTANT: This must match the calLink used in CalComBooking.astro (currently "capco/30min")
    // If VAPI_EVENT_TYPE_ID is not set, default to "capco/30min" to match the demo page
    const VAPI_EVENT_TYPE_ID = process.env.VAPI_EVENT_TYPE_ID || "capco/30min";
    let eventTypeResult: any = null;

    // If we have a targetUserId, find event types for that user
    if (targetUserId) {
      try {
        // Try PascalCase table first
        eventTypeResult = await calcomDb.query(
          `SELECT id, length, title, "userId", slug, "minimumBookingNotice", "minimumBookingNoticeUnit"
           FROM "EventType" 
           WHERE "userId" = $1
           ORDER BY id ASC
           LIMIT 1`,
          [targetUserId]
        );
      } catch (error: any) {
        // Try lowercase table
        eventTypeResult = await calcomDb.query(
          `SELECT id, length, title, user_id as "userId", slug, minimum_booking_notice as "minimumBookingNotice", minimum_booking_notice_unit as "minimumBookingNoticeUnit"
           FROM event_types 
           WHERE user_id = $1
           ORDER BY id ASC
           LIMIT 1`,
          [targetUserId]
        );
      }

      if (eventTypeResult.rows.length === 0) {
        console.warn(
          `⚠️ [CAL-INTEGRATION] No event types found for user ${targetUserId} (username: ${providedUsername}), falling back to default event type`
        );
        // Fall through to default event type lookup
        targetUserId = undefined;
        eventTypeResult = null;
      }
    }

    // If no username provided or no event types found for that user, use default event type lookup
    if (!targetUserId || !eventTypeResult || eventTypeResult.rows.length === 0) {
      // Check if it's a numeric ID or a slug/path
      if (/^\d+$/.test(VAPI_EVENT_TYPE_ID)) {
        // It's a numeric ID
        eventTypeResult = await calcomDb.query(
          `SELECT id, length, title, "userId", slug, "minimumBookingNotice", "minimumBookingNoticeUnit" FROM "EventType" WHERE id = $1`,
          [VAPI_EVENT_TYPE_ID]
        );
      } else {
        // It's a slug/path like "/capco/30min" - extract just the slug part or use full path
        // Remove leading/trailing slashes for matching
        const slugPattern = VAPI_EVENT_TYPE_ID.replace(/^\/+|\/+$/g, ""); // Remove leading/trailing slashes
        const slugParts = slugPattern.split("/"); // ["capco", "30min"]
        const lastPart = slugParts[slugParts.length - 1]; // "30min"

        // Try both PascalCase and snake_case table names
        try {
          eventTypeResult = await calcomDb.query(
            `SELECT id, length, title, "userId", slug, "minimumBookingNotice", "minimumBookingNoticeUnit"
             FROM "EventType" 
             WHERE slug = $1 
                OR slug = $2 
                OR slug LIKE $3 
                OR slug LIKE $4
             ORDER BY CASE 
               WHEN slug = $1 THEN 1
               WHEN slug = $2 THEN 2
               ELSE 3
             END
             LIMIT 1`,
            [VAPI_EVENT_TYPE_ID, slugPattern, `%/${lastPart}`, `%${lastPart}%`]
          );
        } catch (error: any) {
          // Try lowercase table
          eventTypeResult = await calcomDb.query(
            `SELECT id, length, title, user_id as "userId", slug, minimum_booking_notice as "minimumBookingNotice", minimum_booking_notice_unit as "minimumBookingNoticeUnit"
             FROM event_types 
             WHERE slug = $1 
                OR slug = $2 
                OR slug LIKE $3 
                OR slug LIKE $4
             ORDER BY CASE 
               WHEN slug = $1 THEN 1
               WHEN slug = $2 THEN 2
               ELSE 3
             END
             LIMIT 1`,
            [VAPI_EVENT_TYPE_ID, slugPattern, `%/${lastPart}`, `%${lastPart}%`]
          );
        }
      }
    }

    if (!eventTypeResult || eventTypeResult.rows.length === 0) {
      throw new Error(
        `No event types found in Cal.com${providedUsername ? ` for username: ${providedUsername}` : ""}${!providedUsername ? ` for ID/slug: ${VAPI_EVENT_TYPE_ID}` : ""}`
      );
    }

    const eventType = eventTypeResult.rows[0];
    const userId = eventType.userId;
    const eventLength = eventType.length || 30; // Default to 30 minutes

    // Get minimum booking notice from event type (defaults to 120 minutes if not set)
    const minimumBookingNotice = eventType.minimumBookingNotice || 120;
    const minimumBookingNoticeUnit = eventType.minimumBookingNoticeUnit || "minute";

    // Convert to minutes for calculation
    const minimumBookingNoticeMinutes =
      minimumBookingNoticeUnit === "hour" ? minimumBookingNotice * 60 : minimumBookingNotice;

    console.log(
      `⏰ [CAL-INTEGRATION] Minimum booking notice: ${minimumBookingNotice} ${minimumBookingNoticeUnit} (${minimumBookingNoticeMinutes} minutes)`
    );

    // Get username if available for better availability lookup (use provided username or lookup from userId)
    let username: string | undefined = providedUsername;
    try {
      let userResult = await calcomDb.query(`SELECT username FROM "User" WHERE id = $1`, [userId]);
      if (userResult.rows.length === 0) {
        userResult = await calcomDb.query(`SELECT username FROM users WHERE id = $1`, [userId]);
      }
      if (userResult.rows.length > 0) {
        username = userResult.rows[0].username;
      }
    } catch (e) {
      // Ignore - username lookup is optional
    }

    console.log(
      `📅 [CAL-INTEGRATION] Using EventType: id=${eventType.id}, slug=${eventType.slug}, userId=${userId}${username ? `, username=${username}` : ""}`
    );
    console.log(
      `🔍 [CAL-INTEGRATION] Event type lookup: VAPI_EVENT_TYPE_ID="${VAPI_EVENT_TYPE_ID}" resolved to EventType ID=${eventType.id}, slug="${eventType.slug}"`
    );

    // Get existing bookings for this event type to exclude them
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const existingBookingsResult = await calcomDb.query(
      `SELECT "startTime", "endTime" 
       FROM "Booking" 
       WHERE "eventTypeId" = $1 
       AND "userId" = $2 
       AND status != 'cancelled' 
       AND "startTime" >= $3 
       AND "startTime" <= $4 
       ORDER BY "startTime" ASC`,
      [eventType.id, userId, now, twoWeeksFromNow]
    );

    const existingBookings = existingBookingsResult.rows;
    console.log(`📅 [CAL-INTEGRATION] Found ${existingBookings.length} existing bookings`);

    // Get actual working hours from Cal.com availability
    const workingHours = await getWorkingHours(userId, eventType.id, username);
    console.log(
      `🕐 [CAL-INTEGRATION] Working hours: ${workingHours.startHour}:${workingHours.startMinute.toString().padStart(2, "0")} - ${workingHours.endHour}:${workingHours.endMinute.toString().padStart(2, "0")}`
    );

    // Generate available slots using actual working hours
    const slots: string[] = [];
    let currentDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Helper to check if a slot overlaps with existing bookings
    const isSlotAvailable = (slotStart: Date, slotEnd: Date): boolean => {
      return !existingBookings.some((booking: any) => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        // Check if slot overlaps with any existing booking
        return (
          (slotStart >= bookingStart && slotStart < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slotStart <= bookingStart && slotEnd >= bookingEnd)
        );
      });
    };

    // Generate slots until we have 10 available
    while (slots.length < 10 && currentDate <= twoWeeksFromNow) {
      const dayOfWeek = currentDate.getUTCDay();

      // Only business days (Monday=1 through Friday=5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Generate slots using actual working hours
        const startMinutes = workingHours.startHour * 60 + workingHours.startMinute;
        const endMinutes = workingHours.endHour * 60 + workingHours.endMinute;

        // Generate slots based on event length
        for (
          let totalMinutes = startMinutes;
          totalMinutes < endMinutes;
          totalMinutes += eventLength
        ) {
          const slotMinutes = totalMinutes % 60;
          const slotHour = Math.floor(totalMinutes / 60);

          const slotTime = new Date(
            Date.UTC(
              currentDate.getUTCFullYear(),
              currentDate.getUTCMonth(),
              currentDate.getUTCDate(),
              slotHour,
              slotMinutes,
              0,
              0
            )
          );

          // Only include future slots
          if (slotTime > now) {
            // Check minimum booking notice - slot must be at least X minutes in the future
            const timeUntilSlot = slotTime.getTime() - now.getTime();
            const minutesUntilSlot = timeUntilSlot / (1000 * 60);

            if (minutesUntilSlot >= minimumBookingNoticeMinutes) {
              const slotEnd = new Date(slotTime.getTime() + eventLength * 60 * 1000);

              // Don't exceed working hours end time
              const slotEndMinutes = slotEnd.getUTCHours() * 60 + slotEnd.getUTCMinutes();
              if (slotEndMinutes <= endMinutes) {
                // Check if slot is available (not overlapping with existing bookings)
                if (isSlotAvailable(slotTime, slotEnd)) {
                  slots.push(slotTime.toISOString());
                  if (slots.length >= 10) break;
                }
              }
            }
          }
        }
      }

      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    console.log(`✅ [CAL-INTEGRATION] Generated ${slots.length} available slots`);

    // Log the first few slots with full ISO strings for debugging
    if (slots.length > 0) {
      console.log(`📅 [CAL-INTEGRATION] First 3 slots (ISO):`, slots.slice(0, 3));
      slots.slice(0, 3).forEach((slot, idx) => {
        const date = new Date(slot);
        console.log(
          `📅 [CAL-INTEGRATION] Slot ${idx + 1}: ISO=${slot}, Year=${date.getUTCFullYear()}, Month=${date.getUTCMonth() + 1}, Day=${date.getUTCDate()}, Weekday=${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getUTCDay()]}`
        );
      });
    }

    // Format slots for speech - group by day for natural reading
    // IMPORTANT: Format times in America/New_York timezone so VAPI speaks Eastern time
    // This matches what users expect and what Cal.com displays
    let slotsList = "";
    let lastDay = "";

    slots.forEach((slot, index) => {
      const date = new Date(slot);
      const dayKey = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric", // Include year to avoid VAPI confusion
        timeZone: "America/New_York", // Use Eastern timezone for user-facing display
      });
      const timeOnly = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/New_York", // Use Eastern timezone for user-facing display
      });

      if (dayKey !== lastDay) {
        // New day - include full date with year
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
          eventType: eventType.title,
          existingBookingsCount: existingBookings.length,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [CAL-INTEGRATION] Error getting Cal.com account info:", error);
    const errorMessage = error.message || "Unknown error";
    return new Response(
      JSON.stringify({
        result: `I'm unable to check availability right now. ${errorMessage}`,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Google Calendar implementation for get_staff_schedule
async function handleGoogleCalendarGetStaffSchedule(params: any = {}) {
  try {
    const { username: usernameParam, calname } = params;
    const providedUsername = usernameParam || calname;

    console.log(
      "📊 [CAL-INTEGRATION] Getting staff schedule from Google Calendar...",
      providedUsername ? `for username: ${providedUsername}` : ""
    );

    // TODO: Implement Google Calendar API integration
    // This would use Google Calendar API to:
    // 1. Authenticate using service account or OAuth
    // 2. List calendars for the user/organization
    // 3. Get availability slots from free/busy API
    // 4. Format response similar to Cal.com format

    // Placeholder implementation
    const googleCalendarId = process.env.GOOGLE_CALENDAR_ID || providedUsername || "primary";
    const googleApiKey = process.env.GOOGLE_CALENDAR_API_KEY;

    if (!googleApiKey) {
      throw new Error(
        "Google Calendar API key not configured. Please set GOOGLE_CALENDAR_API_KEY environment variable."
      );
    }

    // Example: Use Google Calendar Freebusy API
    // const freebusyUrl = `https://www.googleapis.com/calendar/v3/freeBusy?key=${googleApiKey}`;
    // ... implementation here

    return new Response(
      JSON.stringify({
        result:
          "Google Calendar integration is not yet fully implemented. Please use Cal.com for now.",
        data: {
          calendarType: "google",
          message: "Google Calendar support coming soon",
        },
      }),
      {
        status: 501, // Not Implemented
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [CAL-INTEGRATION] Error getting Google Calendar account info:", error);
    return new Response(
      JSON.stringify({
        result: `I'm unable to check Google Calendar availability right now. ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// iCal implementation for get_staff_schedule
async function handleICalGetStaffSchedule(params: any = {}) {
  try {
    const { username: usernameParam, calname } = params;
    const providedUsername = usernameParam || calname;

    console.log(
      "📊 [CAL-INTEGRATION] Getting staff schedule from iCal...",
      providedUsername ? `for username: ${providedUsername}` : ""
    );

    // TODO: Implement iCal integration
    // This would:
    // 1. Fetch iCal feed URL (from environment or params)
    // 2. Parse iCal format (.ics file)
    // 3. Extract events and free/busy times
    // 4. Calculate available slots
    // 5. Format response similar to Cal.com format

    const icalUrl = process.env.ICAL_URL || params.icalUrl;

    if (!icalUrl) {
      throw new Error(
        "iCal URL not configured. Please set ICAL_URL environment variable or provide icalUrl parameter."
      );
    }

    // Example: Fetch and parse iCal
    // const icalResponse = await fetch(icalUrl);
    // const icalData = await icalResponse.text();
    // ... parse iCal format and extract availability

    return new Response(
      JSON.stringify({
        result: "iCal integration is not yet fully implemented. Please use Cal.com for now.",
        data: {
          calendarType: "ical",
          message: "iCal support coming soon",
        },
      }),
      {
        status: 501, // Not Implemented
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [CAL-INTEGRATION] Error getting iCal account info:", error);
    return new Response(
      JSON.stringify({
        result: `I'm unable to check iCal availability right now. ${error.message || "Unknown error"}`,
        error: error.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function handleGetAvailability(params: any) {
  const { dateFrom, dateTo } = params;
  console.log("📊 [CAL-INTEGRATION] Getting real availability from Cal.com:", { dateFrom, dateTo });

  try {
    // Get the configured event type for VAPI bookings
    // IMPORTANT: This must match the calLink used in CalComBooking.astro (currently "capco/30min")
    // If VAPI_EVENT_TYPE_ID is not set, default to "capco/30min" to match the demo page
    const VAPI_EVENT_TYPE_ID = process.env.VAPI_EVENT_TYPE_ID || "capco/30min";
    let eventTypeResult;

    // Check if it's a numeric ID or a slug/path
    if (/^\d+$/.test(VAPI_EVENT_TYPE_ID)) {
      // It's a numeric ID
      eventTypeResult = await calcomDb.query(
        `SELECT id, length, title, "userId", slug, "minimumBookingNotice", "minimumBookingNoticeUnit" FROM "EventType" WHERE id = $1`,
        [VAPI_EVENT_TYPE_ID]
      );
    } else {
      // It's a slug/path like "/capco/30min" - extract just the slug part or use full path
      // Remove leading/trailing slashes for matching
      const slugPattern = VAPI_EVENT_TYPE_ID.replace(/^\/+|\/+$/g, ""); // Remove leading/trailing slashes
      const slugParts = slugPattern.split("/"); // ["capco", "30min"]
      const lastPart = slugParts[slugParts.length - 1]; // "30min"

      // Try both PascalCase and snake_case table names
      try {
        eventTypeResult = await calcomDb.query(
          `SELECT id, length, title, "userId", slug, "minimumBookingNotice", "minimumBookingNoticeUnit"
           FROM "EventType" 
           WHERE slug = $1 
              OR slug = $2 
              OR slug LIKE $3 
              OR slug LIKE $4
           ORDER BY CASE 
             WHEN slug = $1 THEN 1
             WHEN slug = $2 THEN 2
             ELSE 3
           END
           LIMIT 1`,
          [VAPI_EVENT_TYPE_ID, slugPattern, `%/${lastPart}`, `%${lastPart}%`]
        );
      } catch (error: any) {
        // Try lowercase table
        eventTypeResult = await calcomDb.query(
          `SELECT id, length, title, user_id as "userId", slug, minimum_booking_notice as "minimumBookingNotice", minimum_booking_notice_unit as "minimumBookingNoticeUnit"
           FROM event_types 
           WHERE slug = $1 
              OR slug = $2 
              OR slug LIKE $3 
              OR slug LIKE $4
           ORDER BY CASE 
             WHEN slug = $1 THEN 1
             WHEN slug = $2 THEN 2
             ELSE 3
           END
           LIMIT 1`,
          [VAPI_EVENT_TYPE_ID, slugPattern, `%/${lastPart}`, `%${lastPart}%`]
        );
      }
    }

    if (eventTypeResult.rows.length === 0) {
      throw new Error(`No event types found in Cal.com for ID/slug: ${VAPI_EVENT_TYPE_ID}`);
    }

    const eventType = eventTypeResult.rows[0];
    const userId = eventType.userId;
    const eventLength = eventType.length || 30; // Default to 30 minutes

    // Get minimum booking notice from event type (defaults to 120 minutes if not set)
    const minimumBookingNotice = eventType.minimumBookingNotice || 120;
    const minimumBookingNoticeUnit = eventType.minimumBookingNoticeUnit || "minute";

    // Convert to minutes for calculation
    const minimumBookingNoticeMinutes =
      minimumBookingNoticeUnit === "hour" ? minimumBookingNotice * 60 : minimumBookingNotice;

    console.log(
      `⏰ [CAL-INTEGRATION] Minimum booking notice: ${minimumBookingNotice} ${minimumBookingNoticeUnit} (${minimumBookingNoticeMinutes} minutes)`
    );

    // Get username if available for better availability lookup
    let username: string | undefined;
    try {
      let userResult = await calcomDb.query(`SELECT username FROM "User" WHERE id = $1`, [userId]);
      if (userResult.rows.length === 0) {
        userResult = await calcomDb.query(`SELECT username FROM users WHERE id = $1`, [userId]);
      }
      if (userResult.rows.length > 0) {
        username = userResult.rows[0].username;
      }
    } catch (e) {
      // Ignore - username lookup is optional
    }

    console.log(
      `📅 [CAL-INTEGRATION] Using EventType: id=${eventType.id}, slug=${eventType.slug}, userId=${userId}${username ? `, username=${username}` : ""}`
    );
    console.log(
      `🔍 [CAL-INTEGRATION] Event type lookup: VAPI_EVENT_TYPE_ID="${VAPI_EVENT_TYPE_ID}" resolved to EventType ID=${eventType.id}, slug="${eventType.slug}"`
    );

    // Parse dates and work in UTC to avoid timezone issues
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    const now = new Date();

    // Get existing bookings for this event type in the date range to exclude them
    const existingBookingsResult = await calcomDb.query(
      `SELECT "startTime", "endTime" 
       FROM "Booking" 
       WHERE "eventTypeId" = $1 
       AND "userId" = $2 
       AND status != 'cancelled' 
       AND "startTime" >= $3 
       AND "startTime" <= $4 
       ORDER BY "startTime" ASC`,
      [eventType.id, userId, startDate, endDate]
    );

    const existingBookings = existingBookingsResult.rows;
    console.log(`📅 [CAL-INTEGRATION] Found ${existingBookings.length} existing bookings in range`);

    // Get actual working hours from Cal.com availability
    const workingHours = await getWorkingHours(userId, eventType.id, username);
    console.log(
      `🕐 [CAL-INTEGRATION] Working hours: ${workingHours.startHour}:${workingHours.startMinute.toString().padStart(2, "0")} - ${workingHours.endHour}:${workingHours.endMinute.toString().padStart(2, "0")}`
    );

    // Helper to check if a slot overlaps with existing bookings
    const isSlotAvailable = (slotStart: Date, slotEnd: Date): boolean => {
      return !existingBookings.some((booking: any) => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        // Check if slot overlaps with any existing booking
        return (
          (slotStart >= bookingStart && slotStart < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slotStart <= bookingStart && slotEnd >= bookingEnd)
        );
      });
    };

    const slots: string[] = [];

    // Iterate through each day in the range
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Get day of week (0=Sunday, 6=Saturday)
      const dayOfWeek = currentDate.getUTCDay();

      // Only business days (Monday=1 through Friday=5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Generate slots using actual working hours
        const startMinutes = workingHours.startHour * 60 + workingHours.startMinute;
        const endMinutes = workingHours.endHour * 60 + workingHours.endMinute;

        // Generate slots based on event length
        for (
          let totalMinutes = startMinutes;
          totalMinutes < endMinutes;
          totalMinutes += eventLength
        ) {
          const slotMinutes = totalMinutes % 60;
          const slotHour = Math.floor(totalMinutes / 60);

          const slot = new Date(
            Date.UTC(
              currentDate.getUTCFullYear(),
              currentDate.getUTCMonth(),
              currentDate.getUTCDate(),
              slotHour,
              slotMinutes,
              0,
              0
            )
          );

          // Only include future slots
          if (slot > now) {
            // Check minimum booking notice - slot must be at least X minutes in the future
            const timeUntilSlot = slot.getTime() - now.getTime();
            const minutesUntilSlot = timeUntilSlot / (1000 * 60);

            if (minutesUntilSlot >= minimumBookingNoticeMinutes) {
              const slotEnd = new Date(slot.getTime() + eventLength * 60 * 1000);

              // Don't exceed working hours end time
              const slotEndMinutes = slotEnd.getUTCHours() * 60 + slotEnd.getUTCMinutes();
              if (slotEndMinutes <= endMinutes) {
                // Check if slot is available (not overlapping with existing bookings)
                if (isSlotAvailable(slot, slotEnd)) {
                  slots.push(slot.toISOString());
                }
              }
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
  } catch (error: any) {
    console.error("❌ [CAL-INTEGRATION] Error getting availability:", error);
    const errorMessage = error.message || "Unknown error";
    return new Response(
      JSON.stringify({
        result: `I'm unable to check availability right now. ${errorMessage}`,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function handleCreateBooking(params: any, calendarType: string = "calcom") {
  try {
    // Route to appropriate calendar handler based on calendar type
    switch (calendarType.toLowerCase()) {
      case "google":
        return await handleGoogleCalendarCreateBooking(params);
      case "ical":
        return await handleICalCreateBooking(params);
      case "calcom":
      default:
        return await handleCalComCreateBooking(params);
    }
  } catch (error: any) {
    console.error("❌ [CAL-INTEGRATION] Error in handleCreateBooking:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create booking",
        message: error.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Cal.com implementation for create_booking
async function handleCalComCreateBooking(params: any) {
  const {
    start: startParam,
    name,
    email,
    smsReminderNumber,
    username: usernameParam,
    calname,
  } = params;
  // Support both username and calname parameters
  const username = usernameParam || calname;
  console.log("📝 [CAL-INTEGRATION] Creating booking in Cal.com:", {
    start: startParam,
    name,
    email,
    smsReminderNumber,
    username,
  });

  // Use a mutable variable for start so we can correct the year
  let start = startParam;

  // Log the raw start time format for debugging AM/PM issues
  if (typeof start === "string") {
    console.log(
      `🔍 [CAL-INTEGRATION] Raw start time format: "${start}" (length: ${start.length}, contains AM: ${start.includes("AM") || start.includes("am")}, contains PM: ${start.includes("PM") || start.includes("pm")})`
    );

    // Check for year in the date string
    const yearMatch = start.match(/(\d{4})/);
    if (yearMatch) {
      const yearInString = parseInt(yearMatch[1], 10);
      const currentYear = new Date().getUTCFullYear();
      if (yearInString < currentYear) {
        console.error(
          `⚠️ [CAL-INTEGRATION] WARNING: Date string contains past year ${yearInString}! Current year is ${currentYear}. This booking will be rejected.`
        );
      } else if (yearInString > currentYear + 1) {
        console.warn(
          `⚠️ [CAL-INTEGRATION] WARNING: Date string contains future year ${yearInString}! Current year is ${currentYear}.`
        );
      }
    }
  }

  // Parse start time - handle various formats including AM/PM
  let startDate: Date;
  // Store original for logging
  const originalStart = typeof start === "string" ? start : String(start);

  if (typeof start === "string") {
    // CRITICAL FIX: If VAPI sends a past year (like 2023), correct it to current year
    const currentYear = new Date().getUTCFullYear();
    const yearRegex = /^(\d{4})/; // Match year at start of string (more specific)
    const yearMatch = start.match(yearRegex);
    if (yearMatch) {
      const yearInString = parseInt(yearMatch[1], 10);
      if (yearInString < currentYear) {
        console.warn(
          `⚠️ [CAL-INTEGRATION] Correcting past year ${yearInString} to current year ${currentYear} in date string: "${start}"`
        );
        // Replace the year at the start of the string
        start = start.replace(yearRegex, currentYear.toString());
        console.log(`📅 [CAL-INTEGRATION] Corrected date string: "${start}"`);
      }
    }

    // Check if string contains AM/PM (case insensitive)
    const amPmMatch = start.match(/\s*(AM|PM|am|pm)\s*/i);

    if (amPmMatch) {
      // Handle AM/PM format - parse the time and convert to 24-hour format
      console.log(`🕐 [CAL-INTEGRATION] Detected AM/PM format in time string: "${start}"`);

      // Extract date and time parts
      // Examples: "2024-11-03 4:30 PM", "Mon, 3 Nov 2024 4:30 PM", "Monday at 4:30 PM", "4:30 PM", etc.
      const timeMatch = start.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        const minute = parseInt(timeMatch[2], 10);
        const isPM = /pm/i.test(timeMatch[3]);
        const originalHour = hour; // Store for validation

        // Convert to 24-hour format
        if (isPM && hour !== 12) {
          hour += 12; // 1 PM -> 13, 2 PM -> 14, etc.
        } else if (!isPM && hour === 12) {
          hour = 0; // 12 AM -> 0 (midnight)
        }

        // Extract date - try multiple formats
        let targetDate: Date | null = null;

        // 1. Try ISO date format (YYYY-MM-DD)
        const isoDateMatch = start.match(/(\d{4}-\d{2}-\d{2})/);
        if (isoDateMatch) {
          targetDate = new Date(isoDateMatch[1] + "T00:00:00Z");
          console.log(`📅 [CAL-INTEGRATION] Found ISO date: ${isoDateMatch[1]}`);
        } else {
          // 2. Try natural language date formats
          // Match patterns like "Mon, 3 Nov 2024" or "Monday, November 3, 2024" or "3 Nov 2024"
          const naturalDateMatch = start.match(
            /(?:Mon|Monday|Tue|Tuesday|Wed|Wednesday|Thu|Thursday|Fri|Friday|Sat|Saturday|Sun|Sunday)?\s*,?\s*(\d{1,2})\s+(Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)\s+(?:,?\s*)?(\d{4})?/i
          );

          if (naturalDateMatch) {
            const day = parseInt(naturalDateMatch[1], 10);
            const monthStr = naturalDateMatch[2].toLowerCase();
            const year = naturalDateMatch[3]
              ? parseInt(naturalDateMatch[3], 10)
              : new Date().getUTCFullYear();

            const monthMap: { [key: string]: number } = {
              jan: 0,
              january: 0,
              feb: 1,
              february: 1,
              mar: 2,
              march: 2,
              apr: 3,
              april: 3,
              may: 4,
              jun: 5,
              june: 5,
              jul: 6,
              july: 6,
              aug: 7,
              august: 7,
              sep: 8,
              september: 8,
              oct: 9,
              october: 9,
              nov: 10,
              november: 10,
              dec: 11,
              december: 11,
            };

            const month = monthMap[monthStr];
            if (month !== undefined) {
              targetDate = new Date(Date.UTC(year, month, day));
              console.log(
                `📅 [CAL-INTEGRATION] Found natural language date: ${day} ${monthStr} ${year} -> ${targetDate.toISOString().split("T")[0]}`
              );
            }
          }

          // 3. Try weekday names to find next occurrence
          if (!targetDate) {
            const weekdayMatch = start.match(
              /(Mon|Monday|Tue|Tuesday|Wed|Wednesday|Thu|Thursday|Fri|Friday|Sat|Saturday|Sun|Sunday)/i
            );
            if (weekdayMatch) {
              const weekdayStr = weekdayMatch[1].toLowerCase();
              const weekdayMap: { [key: string]: number } = {
                sun: 0,
                sunday: 0,
                mon: 1,
                monday: 1,
                tue: 2,
                tuesday: 2,
                wed: 3,
                wednesday: 3,
                thu: 4,
                thursday: 4,
                fri: 5,
                friday: 5,
                sat: 6,
                saturday: 6,
              };

              const targetWeekday = weekdayMap[weekdayStr];
              if (targetWeekday !== undefined) {
                // Find next occurrence of this weekday
                const today = new Date();
                const todayUTC = new Date(
                  Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
                );
                const daysUntil = (targetWeekday - todayUTC.getUTCDay() + 7) % 7;
                // If today is the weekday, look for next week unless it's later in the day
                const daysToAdd =
                  daysUntil === 0 ? (todayUTC.getUTCHours() >= hour ? 7 : 0) : daysUntil;
                targetDate = new Date(todayUTC);
                targetDate.setUTCDate(todayUTC.getUTCDate() + daysToAdd);
                console.log(
                  `📅 [CAL-INTEGRATION] Found weekday "${weekdayStr}" (${targetWeekday}), next occurrence: ${targetDate.toISOString().split("T")[0]} (in ${daysToAdd} days)`
                );
              }
            }
          }
        }

        // If we still don't have a date, use the next business day that matches working hours
        // This should rarely happen, but ensures we don't default to "today"
        if (!targetDate) {
          const today = new Date();
          const todayUTC = new Date(
            Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
          );
          // Use today if time hasn't passed, otherwise tomorrow
          targetDate = new Date(todayUTC);
          if (todayUTC.getUTCHours() >= hour) {
            targetDate.setUTCDate(todayUTC.getUTCDate() + 1);
          }
          console.log(
            `⚠️ [CAL-INTEGRATION] No date found in string, using: ${targetDate.toISOString().split("T")[0]} (today or tomorrow)`
          );
        }

        // CRITICAL: VAPI repeats times in Eastern timezone (America/New_York)
        // because we format availability slots in Eastern timezone
        // So when VAPI says "11:00 AM", it means 11:00 AM Eastern, not UTC
        // We need to parse it as Eastern time and convert to UTC for storage

        const year = targetDate.getUTCFullYear();
        const monthIdx = targetDate.getUTCMonth(); // 0-based (0-11)
        const day = targetDate.getUTCDate();
        const month = String(monthIdx + 1).padStart(2, "0");

        // Create date in Eastern timezone, then convert to UTC
        // Use a library-like approach: create a date string in Eastern timezone and parse it
        // Format: "YYYY-MM-DD HH:MM:SS" in Eastern time
        const easternDateString = `${year}-${month}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;

        // Parse as Eastern time by creating a date and using timezone offset
        // We'll use a workaround: create the date assuming it's UTC, then adjust for Eastern offset
        // EST is UTC-5, EDT is UTC-4 (DST runs roughly March-November)
        // For November, we're likely in EST (UTC-5) since DST ends first Sunday of November
        const tempDate = new Date(
          `${year}-${month}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`
        );

        // Check if DST is in effect for this date in Eastern timezone
        // Create a date object in Eastern timezone to determine offset
        // Use Intl.DateTimeFormat to get the timezone offset
        const easternFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "America/New_York",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        // Convert Eastern time to UTC
        // Strategy: Create a date string in Eastern timezone, then use Date to parse it
        // We'll create a date assuming the time is UTC, then calculate the offset and adjust

        // First, create a test date at the target time (assume UTC for now)
        const testDateUtc = new Date(Date.UTC(year, monthIdx, day, hour, minute, 0, 0));

        // Get what this UTC time would be in Eastern timezone
        const easternParts = easternFormatter.formatToParts(testDateUtc);
        const easternHourFromUtc = parseInt(
          easternParts.find((p) => p.type === "hour")?.value || "0"
        );

        // Calculate the offset: if UTC time shows as X in Eastern, and we want Y in Eastern,
        // then we need to adjust UTC by (Y - X) hours
        // Example: If 16:00 UTC = 11:00 Eastern, and we want 11:00 Eastern, we need 16:00 UTC
        // So offset = 11 - 11 = 0, meaning we use 16:00 UTC directly
        // But wait, that's backwards. Let's think differently:
        // If we want 11 AM Eastern, and 11 AM Eastern = 16:00 UTC (in EST), then offset = 16 - 11 = 5
        // So: UTC hour = Eastern hour + offset
        const offsetHours = hour - easternHourFromUtc;

        // If offset is negative, we need to add hours to UTC to get the Eastern time we want
        // Actually, let's use a more direct approach: try different UTC hours until we get the Eastern time we want
        let foundUtcHour = hour;
        for (let testUtcHour = hour; testUtcHour < hour + 10; testUtcHour++) {
          const testUtc = new Date(Date.UTC(year, monthIdx, day, testUtcHour, minute, 0, 0));
          const testEasternParts = easternFormatter.formatToParts(testUtc);
          const testEasternHour = parseInt(
            testEasternParts.find((p) => p.type === "hour")?.value || "0"
          );
          if (testEasternHour === hour) {
            foundUtcHour = testUtcHour;
            break;
          }
        }

        const utcDate = new Date(Date.UTC(year, monthIdx, day, foundUtcHour, minute, 0, 0));

        // Verify: the UTC date should display as the Eastern time we want
        const verifyEastern = easternFormatter.format(utcDate);
        console.log(
          `🕐 [CAL-INTEGRATION] Parsed "${hour}:${String(minute).padStart(2, "0")} ${isPM ? "PM" : "AM"}" Eastern time -> UTC: ${utcDate.toISOString()} (UTC hour: ${foundUtcHour}, verify Eastern: ${verifyEastern})`
        );

        startDate = utcDate;

        // Verify the weekday is correct
        const expectedWeekday = targetDate.getUTCDay();
        const actualWeekday = startDate.getUTCDay();
        if (expectedWeekday !== actualWeekday) {
          console.error(
            `⚠️ [CAL-INTEGRATION] WEEKDAY MISMATCH during date construction! Target date weekday: ${expectedWeekday}, Final date weekday: ${actualWeekday}. Date components: ${year}-${month}-${day} ${hour}:${minute} UTC`
          );
        }

        console.log(
          `🕐 [CAL-INTEGRATION] Converted AM/PM time "${start}" to UTC: ${startDate.toISOString()} (original: ${originalHour}:${String(minute).padStart(2, "0")} ${isPM ? "PM" : "AM"} -> ${hour}:${String(minute).padStart(2, "0")} 24-hour, date: ${year}-${month}-${day}, weekday: ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][actualWeekday]})`
        );
      } else {
        throw new Error(`Unable to parse AM/PM time format from: "${start}"`);
      }
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(start)) {
      // Check if it's datetime-local format (YYYY-MM-DDTHH:mm)
      // This is a datetime-local format - append 'Z' to treat as UTC
      // CRITICAL: Check if year is in the past and correct it
      const yearMatch = start.match(/^(\d{4})-/);
      if (yearMatch) {
        const yearInString = parseInt(yearMatch[1], 10);
        const currentYear = new Date().getUTCFullYear();
        if (yearInString < currentYear) {
          console.warn(
            `⚠️ [CAL-INTEGRATION] Correcting past year ${yearInString} to ${currentYear} in datetime string: "${start}"`
          );
          start = start.replace(/^\d{4}/, currentYear.toString());
        }
      }

      // WARNING: Check for suspicious early morning hours that might be PM times
      const hourMatch = start.match(/T(\d{2}):(\d{2})$/);
      if (hourMatch) {
        const hour = parseInt(hourMatch[1], 10);
        // If hour is between 1-5 AM, this might be a PM time that was incorrectly sent without AM/PM
        if (hour >= 1 && hour <= 5) {
          console.warn(
            `⚠️ [CAL-INTEGRATION] WARNING: Parsed time "${start}" has hour ${hour} (${hour}:${hourMatch[2]} AM UTC). This might be a PM time that was incorrectly formatted. The booking will be validated against working hours.`
          );
        }
      }
      startDate = new Date(start + "Z");
      console.log(
        `🕐 [CAL-INTEGRATION] Parsed datetime-local "${start}" as UTC: ${startDate.toISOString()}`
      );
    } else if (start.includes("T") && !start.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(start)) {
      // ISO string without timezone indicator - treat as UTC
      // WARNING: Check for suspicious early morning hours
      const hourMatch = start.match(/T(\d{2}):(\d{2})/);
      if (hourMatch) {
        const hour = parseInt(hourMatch[1], 10);
        if (hour >= 1 && hour <= 5) {
          console.warn(
            `⚠️ [CAL-INTEGRATION] WARNING: Parsed time "${start}" has hour ${hour} (${hour}:${hourMatch[2]} AM UTC). This might be a PM time that was incorrectly formatted. The booking will be validated against working hours.`
          );
        }
      }
      startDate = new Date(start + "Z");
      console.log(
        `🕐 [CAL-INTEGRATION] Parsed ISO string "${start}" as UTC: ${startDate.toISOString()}`
      );
    } else {
      // Already has timezone info (Z or +/-offset) - check for past year
      const yearMatch = start.match(/(\d{4})/);
      if (yearMatch) {
        const yearInString = parseInt(yearMatch[1], 10);
        const currentYear = new Date().getUTCFullYear();
        if (yearInString < currentYear) {
          console.warn(
            `⚠️ [CAL-INTEGRATION] Correcting past year ${yearInString} to ${currentYear} in ISO string: "${start}"`
          );
          // Replace first occurrence of the year
          start = start.replace(/^\d{4}/, currentYear.toString());
        }
      }

      startDate = new Date(start);
      const parsedHour = startDate.getUTCHours();
      if (parsedHour >= 1 && parsedHour <= 5) {
        console.warn(
          `⚠️ [CAL-INTEGRATION] WARNING: Parsed time "${start}" results in ${parsedHour}:${String(startDate.getUTCMinutes()).padStart(2, "0")} AM UTC. This might be a PM time that was incorrectly formatted. The booking will be validated against working hours.`
        );
      }
      console.log(
        `🕐 [CAL-INTEGRATION] Parsed datetime with timezone "${start}" as: ${startDate.toISOString()}`
      );
    }
  } else {
    // Already a Date object
    startDate = new Date(start);
    const parsedHour = startDate.getUTCHours();
    if (parsedHour >= 1 && parsedHour <= 5) {
      console.warn(
        `⚠️ [CAL-INTEGRATION] WARNING: Date object results in ${parsedHour}:${String(startDate.getUTCMinutes()).padStart(2, "0")} AM UTC. This might be a PM time that was incorrectly formatted.`
      );
    }
  }

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

  try {
    // If username/calname is provided, resolve it to userId and find event types for that user
    let targetUserId: number | undefined;
    if (username) {
      try {
        // Try to find user by username
        let userQuery = `SELECT id FROM "User" WHERE username = $1`;
        let userResult = await calcomDb.query(userQuery, [username]);

        if (userResult.rows.length === 0) {
          // Try lowercase table
          userQuery = `SELECT id FROM users WHERE username = $1`;
          userResult = await calcomDb.query(userQuery, [username]);
        }

        if (userResult.rows.length > 0) {
          targetUserId = userResult.rows[0].id;
          console.log(
            `✅ [CAL-INTEGRATION] Resolved username "${username}" to userId ${targetUserId}`
          );
        } else {
          console.warn(
            `⚠️ [CAL-INTEGRATION] Could not resolve username "${username}", falling back to default event type`
          );
        }
      } catch (userError: any) {
        console.warn(
          `⚠️ [CAL-INTEGRATION] Error resolving username "${username}": ${userError.message}, falling back to default event type`
        );
      }
    }

    // Get the configured event type for VAPI bookings (must include userId - the owner)
    // IMPORTANT: This must match the calLink used in CalComBooking.astro (currently "capco/30min")
    // If VAPI_EVENT_TYPE_ID is not set, default to "capco/30min" to match the demo page
    const VAPI_EVENT_TYPE_ID = process.env.VAPI_EVENT_TYPE_ID || "capco/30min";
    let eventTypeResult;

    // If we have a targetUserId, find event types for that user
    if (targetUserId) {
      try {
        // Try PascalCase table first
        eventTypeResult = await calcomDb.query(
          `SELECT id, length, title, "userId", slug, "minimumBookingNotice", "minimumBookingNoticeUnit"
           FROM "EventType" 
           WHERE "userId" = $1
           ORDER BY id ASC
           LIMIT 1`,
          [targetUserId]
        );
      } catch (error: any) {
        // Try lowercase table
        eventTypeResult = await calcomDb.query(
          `SELECT id, length, title, user_id as "userId", slug, minimum_booking_notice as "minimumBookingNotice", minimum_booking_notice_unit as "minimumBookingNoticeUnit"
           FROM event_types 
           WHERE user_id = $1
           ORDER BY id ASC
           LIMIT 1`,
          [targetUserId]
        );
      }

      if (eventTypeResult.rows.length === 0) {
        console.warn(
          `⚠️ [CAL-INTEGRATION] No event types found for user ${targetUserId} (username: ${username}), falling back to default event type`
        );
        // Fall through to default event type lookup
        targetUserId = undefined;
        eventTypeResult = null;
      }
    }

    // If no username provided or no event types found for that user, use default event type lookup
    if (!targetUserId || !eventTypeResult || eventTypeResult.rows.length === 0) {
      // Check if it's a numeric ID or a slug/path
      if (/^\d+$/.test(VAPI_EVENT_TYPE_ID)) {
        // It's a numeric ID
        eventTypeResult = await calcomDb.query(
          `SELECT id, length, title, "userId", slug, "minimumBookingNotice", "minimumBookingNoticeUnit" FROM "EventType" WHERE id = $1`,
          [VAPI_EVENT_TYPE_ID]
        );
      } else {
        // It's a slug/path like "/capco/30min" - extract just the slug part or use full path
        // Remove leading/trailing slashes for matching
        const slugPattern = VAPI_EVENT_TYPE_ID.replace(/^\/+|\/+$/g, ""); // Remove leading/trailing slashes
        const slugParts = slugPattern.split("/"); // ["capco", "30min"]
        const lastPart = slugParts[slugParts.length - 1]; // "30min"

        // Try both PascalCase and snake_case table names
        try {
          eventTypeResult = await calcomDb.query(
            `SELECT id, length, title, "userId", slug, "minimumBookingNotice", "minimumBookingNoticeUnit"
             FROM "EventType" 
             WHERE slug = $1 
                OR slug = $2 
                OR slug LIKE $3 
                OR slug LIKE $4
             ORDER BY CASE 
               WHEN slug = $1 THEN 1
               WHEN slug = $2 THEN 2
               ELSE 3
             END
             LIMIT 1`,
            [VAPI_EVENT_TYPE_ID, slugPattern, `%/${lastPart}`, `%${lastPart}%`]
          );
        } catch (error: any) {
          // Try lowercase table
          eventTypeResult = await calcomDb.query(
            `SELECT id, length, title, user_id as "userId", slug, minimum_booking_notice as "minimumBookingNotice", minimum_booking_notice_unit as "minimumBookingNoticeUnit"
             FROM event_types 
             WHERE slug = $1 
                OR slug = $2 
                OR slug LIKE $3 
                OR slug LIKE $4
             ORDER BY CASE 
               WHEN slug = $1 THEN 1
               WHEN slug = $2 THEN 2
               ELSE 3
             END
             LIMIT 1`,
            [VAPI_EVENT_TYPE_ID, slugPattern, `%/${lastPart}`, `%${lastPart}%`]
          );
        }
      }
    }

    if (!eventTypeResult || eventTypeResult.rows.length === 0) {
      throw new Error(
        `No event types found in Cal.com${username ? ` for username: ${username}` : ""}${!username ? ` for ID/slug: ${VAPI_EVENT_TYPE_ID}` : ""}`
      );
    }

    const eventType = eventTypeResult.rows[0];

    // Get username if available for better availability lookup (use provided username or lookup from userId)
    let resolvedUsername: string | undefined = username;
    if (!resolvedUsername) {
      try {
        let userResult = await calcomDb.query(`SELECT username FROM "User" WHERE id = $1`, [
          eventType.userId,
        ]);
        if (userResult.rows.length === 0) {
          userResult = await calcomDb.query(`SELECT username FROM users WHERE id = $1`, [
            eventType.userId,
          ]);
        }
        if (userResult.rows.length > 0) {
          resolvedUsername = userResult.rows[0].username;
        }
      } catch (e) {
        // Ignore - username lookup is optional
      }
    }

    console.log(
      `📅 [CAL-INTEGRATION] Using EventType for booking: id=${eventType.id}, slug=${eventType.slug}, userId=${eventType.userId}${resolvedUsername ? `, username=${resolvedUsername}` : ""}`
    );

    // Use the event type's owner (userId) - this ensures bookings show up in the correct user's calendar
    if (!eventType.userId) {
      throw new Error(
        "Event type has no owner (userId) - please ensure the event type is properly configured in Cal.com"
      );
    }
    const userId = eventType.userId;

    // Validate booking time is within working hours
    const workingHours = await getWorkingHours(eventType.userId, eventType.id, resolvedUsername);
    const bookingHour = startDate.getUTCHours();
    const bookingMinute = startDate.getUTCMinutes();
    const bookingTotalMinutes = bookingHour * 60 + bookingMinute;
    const startTotalMinutes = workingHours.startHour * 60 + workingHours.startMinute;
    const endTotalMinutes = workingHours.endHour * 60 + workingHours.endMinute;

    // Check if booking is in early morning hours (likely AM/PM conversion error)
    // Business hours are typically 8 AM - 6 PM, so times before 6 AM or after 10 PM are suspicious
    const suspiciousEarlyHour = bookingHour < 6; // Before 6 AM
    const suspiciousLateHour = bookingHour >= 22; // After 10 PM

    // CRITICAL: Reject bookings in the 1-5 AM range - these are almost certainly PM times that were incorrectly formatted
    // Most business appointments are between 8 AM - 6 PM, so 1-5 AM is a red flag
    if (bookingHour >= 1 && bookingHour <= 5) {
      const likelyPMHour = bookingHour + 12; // Convert to PM equivalent (e.g., 4:30 AM -> 4:30 PM = 16:30)
      throw new Error(
        `Invalid booking time: ${bookingHour}:${bookingMinute.toString().padStart(2, "0")} AM UTC is outside normal business hours and appears to be incorrectly formatted. ` +
          `If you intended ${bookingHour}:${bookingMinute.toString().padStart(2, "0")} PM, the correct UTC time would be ${likelyPMHour}:${bookingMinute.toString().padStart(2, "0")} UTC. ` +
          `Please check the time format. Valid booking times are between ${workingHours.startHour}:${workingHours.startMinute.toString().padStart(2, "0")} - ${workingHours.endHour}:${workingHours.endMinute.toString().padStart(2, "0")} UTC.`
      );
    }

    console.log(
      `🕐 [CAL-INTEGRATION] Booking validation: ${bookingHour}:${bookingMinute.toString().padStart(2, "0")} UTC (${bookingTotalMinutes} minutes) vs working hours ${workingHours.startHour}:${workingHours.startMinute.toString().padStart(2, "0")} - ${workingHours.endHour}:${workingHours.endMinute.toString().padStart(2, "0")} UTC (${startTotalMinutes}-${endTotalMinutes} minutes)`
    );

    if (bookingTotalMinutes < startTotalMinutes || bookingTotalMinutes >= endTotalMinutes) {
      let errorMessage = `Booking time ${bookingHour}:${bookingMinute.toString().padStart(2, "0")} UTC is outside working hours (${workingHours.startHour}:${workingHours.startMinute.toString().padStart(2, "0")} - ${workingHours.endHour}:${workingHours.endMinute.toString().padStart(2, "0")} UTC)`;

      // Add helpful message if time suggests AM/PM confusion
      if (suspiciousEarlyHour) {
        errorMessage += `. Note: The requested time appears to be in the early morning (${bookingHour}:${bookingMinute.toString().padStart(2, "0")} AM UTC). If you meant PM, please use 24-hour format or include AM/PM indicator.`;
      } else if (suspiciousLateHour) {
        errorMessage += `. Note: The requested time appears to be very late (${bookingHour}:${bookingMinute.toString().padStart(2, "0")} UTC). Please confirm the time is correct.`;
      }

      throw new Error(errorMessage);
    }

    // Calculate end time using the event type's actual length (in minutes)
    const eventLengthMinutes = eventType.length || 30; // Default to 30 minutes if not set
    const endDate = new Date(startDate.getTime() + eventLengthMinutes * 60000);

    // Validate end time doesn't exceed working hours
    const endHour = endDate.getUTCHours();
    const endMinute = endDate.getUTCMinutes();
    const bookingEndTotalMinutes = endHour * 60 + endMinute;

    if (bookingEndTotalMinutes > endTotalMinutes) {
      throw new Error(
        `Booking end time ${endHour}:${endMinute.toString().padStart(2, "0")} exceeds working hours end time (${workingHours.endHour}:${workingHours.endMinute.toString().padStart(2, "0")})`
      );
    }

    // Generate unique booking reference
    const uid = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Insert into Cal.com Booking table with all required fields
    // Detect actual column names in the Booking table
    let columnMap: {
      startTime: string;
      endTime: string;
      eventTypeId: string;
      userId: string;
      isRecorded: string;
      iCalSequence: string;
      timeZone?: string;
      references?: string;
      createdAt: string;
      updatedAt: string;
    };

    try {
      const columnCheck = await calcomDb.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Booking'
        AND column_name IN ('startTime', 'start_time', 'endTime', 'end_time', 'eventTypeId', 'event_type_id', 
                            'userId', 'user_id', 'isRecorded', 'is_recorded', 'iCalSequence', 'ical_sequence',
                            'timeZone', 'time_zone', 'references', 'createdAt', 'created_at', 'updatedAt', 'updated_at')
        ORDER BY column_name
      `);

      const columns = columnCheck.rows.map((r: any) => r.column_name);
      console.log(
        `📋 [CAL-INTEGRATION] Booking table columns found (from info_schema): ${columns.join(", ")}`
      );

      // Get actual column names from pg_attribute (preserves case)
      // Query all columns and filter in code for case-insensitive matching
      const actualColumns = await calcomDb.query(`
        SELECT attname 
        FROM pg_attribute 
        WHERE attrelid = '"Booking"'::regclass 
        AND attnum > 0 
        AND NOT attisdropped
      `);

      const actualColumnNames = actualColumns.rows.map((r: any) => r.attname);
      console.log(
        `📋 [CAL-INTEGRATION] Actual Booking columns (from pg_attribute): ${actualColumnNames.join(", ")}`
      );

      // Map column names based on what exists (using actual case)
      const findActualColumn = (variants: string[]): string => {
        for (const variant of variants) {
          const found = actualColumnNames.find(
            (c: string) => c.toLowerCase() === variant.toLowerCase()
          );
          if (found) return found;
        }
        // Default to camelCase if not found
        return variants[0];
      };

      columnMap = {
        startTime: findActualColumn(["startTime", "start_time"]),
        endTime: findActualColumn(["endTime", "end_time"]),
        eventTypeId: findActualColumn(["eventTypeId", "event_type_id"]),
        userId: findActualColumn(["userId", "user_id"]),
        isRecorded: findActualColumn(["isRecorded", "is_recorded"]),
        iCalSequence: findActualColumn(["iCalSequence", "ical_sequence"]),
        createdAt: findActualColumn(["createdAt", "created_at"]),
        updatedAt: findActualColumn(["updatedAt", "updated_at"]),
      };

      // Check if references column exists (it's optional)
      const referencesCol = findActualColumn(["references"]);
      if (
        referencesCol &&
        actualColumnNames.some((c: string) => c.toLowerCase() === referencesCol.toLowerCase())
      ) {
        columnMap.references =
          actualColumnNames.find((c: string) => c.toLowerCase() === referencesCol.toLowerCase()) ||
          referencesCol;
      }

      const timeZoneCol = findActualColumn(["timeZone", "time_zone"]);
      // Check if the column actually exists (findActualColumn might return default)
      if (
        timeZoneCol &&
        actualColumnNames.some((c: string) => c.toLowerCase() === timeZoneCol.toLowerCase())
      ) {
        columnMap.timeZone =
          actualColumnNames.find((c: string) => c.toLowerCase() === timeZoneCol.toLowerCase()) ||
          timeZoneCol;
      }

      // Quote column names that are camelCase (contain capital letters) or reserved keywords
      const quoteIfNeeded = (col: string) => {
        // Quote if it contains capital letters (camelCase) or is a reserved keyword
        if (/[A-Z]/.test(col) || col.toLowerCase() === "references") {
          return `"${col}"`;
        }
        return col;
      };

      columnMap.startTime = quoteIfNeeded(columnMap.startTime);
      columnMap.endTime = quoteIfNeeded(columnMap.endTime);
      columnMap.eventTypeId = quoteIfNeeded(columnMap.eventTypeId);
      columnMap.userId = quoteIfNeeded(columnMap.userId);
      columnMap.isRecorded = quoteIfNeeded(columnMap.isRecorded);
      columnMap.iCalSequence = quoteIfNeeded(columnMap.iCalSequence);
      if (columnMap.references) {
        columnMap.references = quoteIfNeeded(columnMap.references);
      }
      columnMap.createdAt = quoteIfNeeded(columnMap.createdAt);
      columnMap.updatedAt = quoteIfNeeded(columnMap.updatedAt);
      if (columnMap.timeZone) {
        columnMap.timeZone = quoteIfNeeded(columnMap.timeZone);
      }

      console.log(`✅ [CAL-INTEGRATION] Using column mapping:`, columnMap);
    } catch (colError: any) {
      console.log(
        `⚠️ [CAL-INTEGRATION] Could not check columns, using default PascalCase: ${colError.message}`
      );
      // Default to PascalCase (references is optional, will be checked separately)
      columnMap = {
        startTime: '"startTime"',
        endTime: '"endTime"',
        eventTypeId: '"eventTypeId"',
        userId: '"userId"',
        isRecorded: '"isRecorded"',
        iCalSequence: '"iCalSequence"',
        createdAt: '"createdAt"',
        updatedAt: '"updatedAt"',
      };
    }

    // Query valid BookingStatus enum values
    let validBookingStatus = "accepted"; // Default fallback (usually lowercase in Cal.com)
    try {
      const enumResult = await calcomDb.query(`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid 
          FROM pg_type 
          WHERE typname = 'BookingStatus'
        )
        ORDER BY enumsortorder
      `);

      const enumValues = enumResult.rows.map((r: any) => r.enumlabel);
      console.log(`📋 [CAL-INTEGRATION] Valid BookingStatus values: ${enumValues.join(", ")}`);

      // Prefer active statuses in order: accepted, pending, confirmed (case-insensitive)
      // Avoid cancelled or rejected as they hide bookings
      const preferredValues = ["accepted", "pending", "confirmed"];
      const activeStatus = preferredValues.find((v) =>
        enumValues.some((ev: string) => ev.toLowerCase() === v.toLowerCase())
      );

      if (activeStatus) {
        // Find the actual case from enum values
        validBookingStatus =
          enumValues.find((ev: string) => ev.toLowerCase() === activeStatus.toLowerCase()) ||
          activeStatus;
      } else {
        // Fallback: use first non-cancelled/rejected value, or first value
        validBookingStatus =
          enumValues.find((ev: string) => !["cancelled", "rejected"].includes(ev.toLowerCase())) ||
          enumValues[0] ||
          "accepted";
      }

      console.log(`✅ [CAL-INTEGRATION] Using BookingStatus: ${validBookingStatus}`);
    } catch (enumError: any) {
      console.log(
        `⚠️ [CAL-INTEGRATION] Could not query BookingStatus enum, using default: ${enumError.message}`
      );
      // Keep default
    }

    // Build INSERT statement using detected column names
    const columns = [
      "uid",
      "title",
      "description",
      columnMap.startTime,
      columnMap.endTime,
      columnMap.eventTypeId,
      columnMap.userId,
      "status",
      "paid",
      columnMap.isRecorded,
      columnMap.iCalSequence,
      "metadata",
    ];

    const values = [
      uid,
      `${eventType.title} with ${name}`,
      `Fire protection consultation booked via caller`,
      startDate,
      endDate,
      eventType.id,
      userId,
      validBookingStatus, // Dynamically determined valid enum value
      false,
      false,
      0,
      JSON.stringify({
        source: "vapi",
        customerName: name,
        customerEmail: email,
        customerPhone: smsReminderNumber,
      }),
    ];

    if (columnMap.timeZone) {
      columns.push(columnMap.timeZone);
      // Store timezone as America/New_York so Cal.com displays times correctly
      // The startTime/endTime are still stored in UTC, but timeZone tells Cal.com how to interpret them
      values.push("America/New_York");
    }

    if (columnMap.references) {
      columns.push(columnMap.references);
      values.push(null); // references is typically nullable
    }

    columns.push(columnMap.createdAt, columnMap.updatedAt);

    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

    const bookingResult = await calcomDb.query(
      `INSERT INTO "Booking" (
        ${columns.join(", ")}
      ) VALUES (${placeholders}, NOW(), NOW())
      RETURNING id, uid, ${columnMap.startTime} as "startTime", ${columnMap.endTime} as "endTime", status`,
      values
    );

    const booking = bookingResult.rows[0];
    console.log("✅ [CAL-INTEGRATION] Booking inserted into database:", booking.id);
    console.log(
      `✅ [CAL-INTEGRATION] Booking created with eventTypeId=${eventType.id} (slug="${eventType.slug}"), userId=${userId}, startTime=${startDate.toISOString()}`
    );

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

    // Format date using UTC methods to ensure accuracy
    // Use explicit UTC getters to avoid timezone conversion issues
    const utcYear = startDate.getUTCFullYear();
    const utcMonth = startDate.getUTCMonth(); // 0-11
    const utcDay = startDate.getUTCDate();
    const utcHour = startDate.getUTCHours();
    const utcMinute = startDate.getUTCMinutes();
    const utcWeekday = startDate.getUTCDay(); // 0=Sunday, 6=Saturday

    // Log the date components for debugging
    console.log(
      `📅 [CAL-INTEGRATION] Email date formatting - UTC date components: year=${utcYear}, month=${utcMonth + 1}, day=${utcDay}, hour=${utcHour}, minute=${utcMinute}, weekday index=${utcWeekday}`
    );
    console.log(
      `📅 [CAL-INTEGRATION] Email date formatting - startDate ISO: ${startDate.toISOString()}`
    );
    console.log(
      `📅 [CAL-INTEGRATION] Email date formatting - startDate local time: ${startDate.toLocaleString("en-US", { timeZone: "UTC" })}`
    );
    // Verify the date is actually what we expect
    const manualWeekdayCheck = new Date(Date.UTC(utcYear, utcMonth, utcDay)).getUTCDay();
    if (manualWeekdayCheck !== utcWeekday) {
      console.error(
        `⚠️ [CAL-INTEGRATION] WEEKDAY CALCULATION ERROR! Manual check: ${manualWeekdayCheck}, startDate.getUTCDay(): ${utcWeekday}`
      );
    }

    // Verify the weekday calculation first
    const weekdayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const calculatedWeekday = weekdayNames[utcWeekday];
    console.log(
      `📅 [CAL-INTEGRATION] Email date formatting - Calculated weekday: ${calculatedWeekday} (day index: ${utcWeekday})`
    );

    // Create date object for formatting in Eastern timezone
    // The startDate is already in UTC, we'll format it in Eastern timezone
    const dateForFormatting = startDate;

    // Use Intl.DateTimeFormat for reliable formatting in Eastern timezone
    // This matches what users expect and what Cal.com displays
    // IMPORTANT: Format in America/New_York timezone to match booking timezone
    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "America/New_York", // Use Eastern timezone for user-facing display
    });

    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York", // Use Eastern timezone for user-facing display
    });

    // Format time using Eastern timezone
    const formattedTime = timeFormatter.format(dateForFormatting);

    // ALWAYS use calculated weekday for reliability - manually construct the date string
    const monthFormatter = new Intl.DateTimeFormat("en-US", {
      month: "long",
      timeZone: "America/New_York", // Use Eastern timezone
    });
    const monthName = monthFormatter.format(dateForFormatting);

    // Get the day in Eastern timezone (might differ from UTC if crossing midnight)
    const easternDay = dateForFormatting.toLocaleDateString("en-US", {
      day: "numeric",
      timeZone: "America/New_York",
    });

    // Construct date string using calculated weekday and Eastern timezone
    const finalFormattedDate = `${calculatedWeekday}, ${monthName} ${easternDay}`;

    console.log(
      `📅 [CAL-INTEGRATION] Email date formatting - Using calculated weekday: ${calculatedWeekday}`
    );
    console.log(
      `📅 [CAL-INTEGRATION] Email date formatting - Final formatted date: ${finalFormattedDate}`
    );
    console.log(`📅 [CAL-INTEGRATION] Email date formatting - Formatted time: ${formattedTime}`);

    // Send confirmation email automatically
    try {
      console.log("📧 [CAL-INTEGRATION] Sending confirmation email...");

      const emailSubject = `Appointment Confirmation - ${finalFormattedDate}`;

      const emailContent = `
          <h2>Appointment Confirmation</h2>
          
          <p>Dear ${name},</p>
          
          <p>Thank you for scheduling your appointment with ${process.env.RAILWAY_PROJECT_NAME}. Here are the details:</p>
          
          <h3>Appointment Details</h3>
          <p><strong>Date:</strong> ${finalFormattedDate}</p>
          <p><strong>Time:</strong> ${formattedTime}</p>
          <p><strong>Duration:</strong> ${eventLengthMinutes} minute${eventLengthMinutes !== 1 ? "s" : ""}</p>
          <p><strong>Location:</strong> Online consultation</p>
          <p><strong>Meeting Type:</strong> Fire protection consultation</p>
          
          <p><strong>Important:</strong> If you can gather your project documents in advance, that will help to expedite our services.</p>
          
          <p>If you need to reschedule or have any questions, please don't hesitate to contact us.</p>
          
          <p>We look forward to meeting with you!</p>
          
          <p>Best regards,<br>
          ${process.env.RAILWAY_PROJECT_NAME}</p>
        `;

      // Send email using the existing update-delivery API - use request URL
      const baseUrl = getApiBaseUrl(request);
      const emailResponse = await fetch(`${baseUrl}/api/delivery/update-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usersToNotify: [email],
          method: "email",
          emailSubject: emailSubject,
          emailContent: emailContent,
          buttonText: "View Our Website",
          buttonLink: baseUrl,
          currentUser: null, // VAPI calls don't have user context
        }),
      });

      if (emailResponse.ok) {
        const emailResult = await emailResponse.json();
        console.log("✅ [CAL-INTEGRATION] Confirmation email sent successfully:", emailResult);
      } else {
        const errorText = await emailResponse.text();
        console.error("❌ [CAL-INTEGRATION] Failed to send confirmation email:", errorText);
      }
    } catch (emailError) {
      console.error("❌ [CAL-INTEGRATION] Error sending confirmation email:", emailError);
      // Don't fail the booking if email fails
    }

    // Format confirmation message for VAPI to speak - include mandatory follow-up phrases
    // VAPI will read this entire result verbatim, so include everything that should be said
    const confirmationMessage = `Your appointment has been confirmed for ${finalFormattedDate} at ${formattedTime}. You'll receive a confirmation email at ${email}. If you can gather your project documents in advance that will help to expedite services. Is there anything else I can help you with today?`;

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
    const errorMessage = error.message || "Unknown error";
    console.error("❌ [CAL-INTEGRATION] Error details:", {
      message: errorMessage,
      stack: error.stack,
      name: error.name,
    });
    return new Response(
      JSON.stringify({
        result: `I'm sorry, there was an error creating your booking: ${errorMessage}. Please try again or contact us directly.`,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Google Calendar implementation for create_booking
async function handleGoogleCalendarCreateBooking(params: any) {
  try {
    const {
      start: startParam,
      name,
      email,
      smsReminderNumber,
      username: usernameParam,
      calname,
    } = params;
    const username = usernameParam || calname;

    console.log("📝 [CAL-INTEGRATION] Creating booking in Google Calendar:", {
      start: startParam,
      name,
      email,
      smsReminderNumber,
      username,
    });

    // TODO: Implement Google Calendar API integration
    // This would use Google Calendar API to:
    // 1. Authenticate using service account or OAuth
    // 2. Create event in the specified calendar
    // 3. Add attendees (email)
    // 4. Set reminders (SMS if smsReminderNumber provided)
    // 5. Return confirmation

    const googleCalendarId = process.env.GOOGLE_CALENDAR_ID || username || "primary";
    const googleApiKey = process.env.GOOGLE_CALENDAR_API_KEY;

    if (!googleApiKey) {
      throw new Error(
        "Google Calendar API key not configured. Please set GOOGLE_CALENDAR_API_KEY environment variable."
      );
    }

    // Parse start time
    const startDate = new Date(startParam);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // Default 30 min duration

    // Example: Use Google Calendar Events API
    // const eventUrl = `https://www.googleapis.com/calendar/v3/calendars/${googleCalendarId}/events?key=${googleApiKey}`;
    // const eventData = {
    //   summary: `Appointment with ${name}`,
    //   start: { dateTime: startDate.toISOString() },
    //   end: { dateTime: endDate.toISOString() },
    //   attendees: [{ email }],
    //   reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 24 * 60 }] }
    // };
    // ... create event

    return new Response(
      JSON.stringify({
        result:
          "Google Calendar integration is not yet fully implemented. Please use Cal.com for now.",
        success: false,
        data: {
          calendarType: "google",
          message: "Google Calendar support coming soon",
        },
      }),
      {
        status: 501, // Not Implemented
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [CAL-INTEGRATION] Error creating Google Calendar booking:", error);
    return new Response(
      JSON.stringify({
        result: `I'm sorry, I couldn't book that appointment in Google Calendar. ${error.message || "Unknown error"}`,
        success: false,
        error: error.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// iCal implementation for create_booking
async function handleICalCreateBooking(params: any) {
  try {
    const {
      start: startParam,
      name,
      email,
      smsReminderNumber,
      username: usernameParam,
      calname,
    } = params;
    const username = usernameParam || calname;

    console.log("📝 [CAL-INTEGRATION] Creating booking in iCal:", {
      start: startParam,
      name,
      email,
      smsReminderNumber,
      username,
    });

    // TODO: Implement iCal integration
    // This would:
    // 1. Parse iCal feed URL (from environment or params)
    // 2. Create new event in iCal format
    // 3. Post/update iCal feed (if writable)
    // 4. Or use iCal-compatible API (like CalDAV)
    // 5. Return confirmation

    const icalUrl = process.env.ICAL_URL || params.icalUrl;

    if (!icalUrl) {
      throw new Error(
        "iCal URL not configured. Please set ICAL_URL environment variable or provide icalUrl parameter."
      );
    }

    // Parse start time
    const startDate = new Date(startParam);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // Default 30 min duration

    // Example: Generate iCal event
    // const icalEvent = `BEGIN:VEVENT
    // DTSTART:${formatICalDate(startDate)}
    // DTEND:${formatICalDate(endDate)}
    // SUMMARY:Appointment with ${name}
    // ATTENDEE:mailto:${email}
    // END:VEVENT`;
    // ... create/update iCal

    return new Response(
      JSON.stringify({
        result: "iCal integration is not yet fully implemented. Please use Cal.com for now.",
        success: false,
        data: {
          calendarType: "ical",
          message: "iCal support coming soon",
        },
      }),
      {
        status: 501, // Not Implemented
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [CAL-INTEGRATION] Error creating iCal booking:", error);
    return new Response(
      JSON.stringify({
        result: `I'm sorry, I couldn't book that appointment in iCal. ${error.message || "Unknown error"}`,
        success: false,
        error: error.message || "Unknown error",
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

// Lookup client by name or phone number (placeholder implementation)
async function handleLookupClient(params: any) {
  try {
    const { nameOrPhone } = params;
    console.log("🔍 [CAL-INTEGRATION] Looking up client:", nameOrPhone);

    // TODO: Replace with actual database lookup
    // For now, return placeholder data for testing

    // Mock client data for testing
    // In production, this would query your client database
    const mockClients: Array<{
      name: string;
      phone: string;
      email: string;
      preferredBarber: string;
      lastVisit: string;
    }> = [
      {
        name: "John Smith",
        phone: "+19781234567",
        email: "john.smith@example.com",
        preferredBarber: "Henry",
        lastVisit: "2024-11-01",
      },
      {
        name: "Sarah Johnson",
        phone: "+19787654321",
        email: "sarah.j@example.com",
        preferredBarber: "Abraham",
        lastVisit: "2024-10-28",
      },
      {
        name: "Mike Davis",
        phone: "+19785556677",
        email: "mike.davis@example.com",
        preferredBarber: "TJ",
        lastVisit: "2024-10-25",
      },
    ];

    // Normalize the search input
    const searchTerm = (nameOrPhone || "").toLowerCase().trim();

    // Try to find a matching client
    const foundClient = mockClients.find(
      (client) =>
        client.name.toLowerCase().includes(searchTerm) ||
        client.phone.replace(/\D/g, "").includes(searchTerm.replace(/\D/g, "")) ||
        searchTerm.includes(client.name.toLowerCase()) ||
        searchTerm.includes(client.phone.replace(/\D/g, ""))
    );

    if (foundClient) {
      console.log("✅ [CAL-INTEGRATION] Client found:", foundClient.name);
      return new Response(
        JSON.stringify({
          success: true,
          result: `I found your account! Your name is ${foundClient.name}, and I see you usually see ${foundClient.preferredBarber}. Your last visit was ${foundClient.lastVisit}. Would you like to book with ${foundClient.preferredBarber} again?`,
          data: {
            found: true,
            name: foundClient.name,
            email: foundClient.email,
            phone: foundClient.phone,
            preferredBarber: foundClient.preferredBarber,
            lastVisit: foundClient.lastVisit,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      console.log("⚠️ [CAL-INTEGRATION] Client not found for:", nameOrPhone);
      return new Response(
        JSON.stringify({
          success: true,
          result:
            "I don't see a record with that information. Let me collect your details for this appointment.",
          data: {
            found: false,
            message: "No client found with that information",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("❌ [CAL-INTEGRATION] Error looking up client:", error);
    return new Response(
      JSON.stringify({
        success: false,
        result:
          "I'm having trouble looking up your information right now. Let me collect your details for this appointment.",
        error: error.message || "Failed to lookup client",
        data: {
          found: false,
          message: "Error looking up client",
        },
      }),
      {
        status: 200, // Return 200 so VAPI can continue the conversation
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
