import type { APIRoute } from "astro";
import { Pool } from "pg";
import { ensureProtocol } from "../../../lib/url-utils";
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
    const { action, ...params } = body;

    console.log("🔗 [CAL-INTEGRATION] Received request:", { action, params });

    switch (action) {
      case "get_account_info":
        return await handleGetAccountInfo();

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
async function handleGetAccountInfo() {
  try {
    console.log("📊 [CAL-INTEGRATION] Getting real account info from Cal.com...");

    // Get the configured event type for VAPI bookings
    // Try by ID first, then by slug if VAPI_EVENT_TYPE_ID looks like a slug
    const VAPI_EVENT_TYPE_ID = process.env.VAPI_EVENT_TYPE_ID || "2";
    let eventTypeResult;

    // Check if it's a numeric ID or a slug/path
    if (/^\d+$/.test(VAPI_EVENT_TYPE_ID)) {
      // It's a numeric ID
      eventTypeResult = await calcomDb.query(
        `SELECT id, length, title, "userId", slug FROM "EventType" WHERE id = $1`,
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
          `SELECT id, length, title, "userId", slug 
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
          `SELECT id, length, title, user_id as "userId", slug 
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

      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    console.log(`✅ [CAL-INTEGRATION] Generated ${slots.length} available slots`);

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
    console.error("❌ [CAL-INTEGRATION] Error getting account info:", error);
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

async function handleGetAvailability(params: any) {
  const { dateFrom, dateTo } = params;
  console.log("📊 [CAL-INTEGRATION] Getting real availability from Cal.com:", { dateFrom, dateTo });

  try {
    // Get the configured event type for VAPI bookings
    // Try by ID first, then by slug if VAPI_EVENT_TYPE_ID looks like a slug
    const VAPI_EVENT_TYPE_ID = process.env.VAPI_EVENT_TYPE_ID || "2";
    let eventTypeResult;

    // Check if it's a numeric ID or a slug/path
    if (/^\d+$/.test(VAPI_EVENT_TYPE_ID)) {
      // It's a numeric ID
      eventTypeResult = await calcomDb.query(
        `SELECT id, length, title, "userId", slug FROM "EventType" WHERE id = $1`,
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
          `SELECT id, length, title, "userId", slug 
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
          `SELECT id, length, title, user_id as "userId", slug 
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

async function handleCreateBooking(params: any) {
  const { start, name, email, smsReminderNumber } = params;
  console.log("📝 [CAL-INTEGRATION] Creating booking:", {
    start,
    name,
    email,
    smsReminderNumber,
  });

  // Parse start time - if it's a datetime-local format without timezone, treat as UTC
  // datetime-local inputs are in format "YYYY-MM-DDTHH:mm" (no timezone)
  let startDate: Date;
  if (typeof start === "string") {
    // Check if it's datetime-local format (YYYY-MM-DDTHH:mm)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(start)) {
      // This is a datetime-local format - append 'Z' to treat as UTC
      startDate = new Date(start + "Z");
      console.log(
        `🕐 [CAL-INTEGRATION] Parsed datetime-local "${start}" as UTC: ${startDate.toISOString()}`
      );
    } else if (start.includes("T") && !start.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(start)) {
      // ISO string without timezone indicator - treat as UTC
      startDate = new Date(start + "Z");
      console.log(
        `🕐 [CAL-INTEGRATION] Parsed ISO string "${start}" as UTC: ${startDate.toISOString()}`
      );
    } else {
      // Already has timezone info (Z or +/-offset)
      startDate = new Date(start);
      console.log(
        `🕐 [CAL-INTEGRATION] Parsed datetime with timezone "${start}" as: ${startDate.toISOString()}`
      );
    }
  } else {
    // Already a Date object
    startDate = new Date(start);
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
    // Get the configured event type for VAPI bookings (must include userId - the owner)
    const VAPI_EVENT_TYPE_ID = process.env.VAPI_EVENT_TYPE_ID || "2";
    let eventTypeResult;

    // Check if it's a numeric ID or a slug/path
    if (/^\d+$/.test(VAPI_EVENT_TYPE_ID)) {
      // It's a numeric ID
      eventTypeResult = await calcomDb.query(
        `SELECT id, length, title, "userId", slug FROM "EventType" WHERE id = $1`,
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
          `SELECT id, length, title, "userId", slug 
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
          `SELECT id, length, title, user_id as "userId", slug 
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

    // Get username if available for better availability lookup
    let username: string | undefined;
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
        username = userResult.rows[0].username;
      }
    } catch (e) {
      // Ignore - username lookup is optional
    }

    console.log(
      `📅 [CAL-INTEGRATION] Using EventType for booking: id=${eventType.id}, slug=${eventType.slug}, userId=${eventType.userId}${username ? `, username=${username}` : ""}`
    );

    // Use the event type's owner (userId) - this ensures bookings show up in the correct user's calendar
    if (!eventType.userId) {
      throw new Error(
        "Event type has no owner (userId) - please ensure the event type is properly configured in Cal.com"
      );
    }
    const userId = eventType.userId;

    // Validate booking time is within working hours
    const workingHours = await getWorkingHours(eventType.userId, eventType.id, username);
    const bookingHour = startDate.getUTCHours();
    const bookingMinute = startDate.getUTCMinutes();
    const bookingTotalMinutes = bookingHour * 60 + bookingMinute;
    const startTotalMinutes = workingHours.startHour * 60 + workingHours.startMinute;
    const endTotalMinutes = workingHours.endHour * 60 + workingHours.endMinute;

    console.log(
      `🕐 [CAL-INTEGRATION] Booking validation: ${bookingHour}:${bookingMinute.toString().padStart(2, "0")} UTC (${bookingTotalMinutes} minutes) vs working hours ${workingHours.startHour}:${workingHours.startMinute.toString().padStart(2, "0")} - ${workingHours.endHour}:${workingHours.endMinute.toString().padStart(2, "0")} UTC (${startTotalMinutes}-${endTotalMinutes} minutes)`
    );

    if (bookingTotalMinutes < startTotalMinutes || bookingTotalMinutes >= endTotalMinutes) {
      throw new Error(
        `Booking time ${bookingHour}:${bookingMinute.toString().padStart(2, "0")} UTC is outside working hours (${workingHours.startHour}:${workingHours.startMinute.toString().padStart(2, "0")} - ${workingHours.endHour}:${workingHours.endMinute.toString().padStart(2, "0")} UTC)`
      );
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
      `Fire protection consultation booking via VAPI`,
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
      values.push("UTC");
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

    // Send confirmation email automatically
    try {
      console.log("📧 [CAL-INTEGRATION] Sending confirmation email...");

      const emailSubject = `Appointment Confirmation - ${startDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })}`;

      const emailContent = `
          <h2>Appointment Confirmation</h2>
          
          <p>Dear ${name},</p>
          
          <p>Thank you for scheduling your appointment with ${process.env.RAILWAY_PROJECT_NAME}. Here are the details:</p>
          
          <h3>Appointment Details</h3>
          <p><strong>Date:</strong> ${startDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
          })}</p>
          <p><strong>Time:</strong> ${startDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            timeZone: "UTC",
          })}</p>
          <p><strong>Duration:</strong> ${eventLengthMinutes} minute${eventLengthMinutes !== 1 ? "s" : ""}</p>
          <p><strong>Location:</strong> Online consultation</p>
          <p><strong>Meeting Type:</strong> Fire protection consultation</p>
          
          <p><strong>Important:</strong> If you can gather your project documents in advance, that will help to expedite our services.</p>
          
          <p>If you need to reschedule or have any questions, please don't hesitate to contact us.</p>
          
          <p>We look forward to meeting with you!</p>
          
          <p>Best regards,<br>
          ${process.env.RAILWAY_PROJECT_NAME}</p>
        `;

      // Send email using the existing update-delivery API
      const baseUrl = ensureProtocol(process.env.RAILWAY_PUBLIC_DOMAIN || "http://localhost:4321");
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
