import type { APIRoute } from "astro";
import { Pool } from "pg";

// Cal.com database connection
const calcomDb = new Pool({
  connectionString: process.env.CALCOM_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const GET: APIRoute = async () => {
  try {
    console.log("🧪 [DB-TEST] Testing database connection and tables...");

    // Test basic connection
    const connectionTest = await calcomDb.query("SELECT 1 as test");
    console.log("✅ [DB-TEST] Basic connection test passed");

    // Get all tables
    const tablesResult = await calcomDb.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map((row) => ({
      name: row.table_name,
      type: row.table_type,
    }));

    console.log(
      `📋 [DB-TEST] Found ${tables.length} tables:`,
      tables.map((t) => t.name)
    );

    // Try to get some sample data from common Cal.com tables
    const sampleData: any = {};

    // Test users table
    try {
      const usersResult = await calcomDb.query(`
        SELECT id, name, email, username, role
        FROM users 
        LIMIT 5
      `);
      sampleData.users = usersResult.rows;
      console.log(`👥 [DB-TEST] Found ${usersResult.rows.length} users`);
    } catch (error) {
      console.log("⚠️ [DB-TEST] Users table not accessible:", error.message);
    }

    // Test User table (capitalized)
    try {
      const userResult = await calcomDb.query(`
        SELECT id, name, email, username, role
        FROM "User" 
        LIMIT 5
      `);
      sampleData.User = userResult.rows;
      console.log(`👤 [DB-TEST] Found ${userResult.rows.length} User records`);
    } catch (error) {
      console.log("⚠️ [DB-TEST] User table not accessible:", error.message);
    }

    // Test event types
    try {
      const eventTypesResult = await calcomDb.query(`
        SELECT id, title, slug, length
        FROM "EventType" 
        LIMIT 5
      `);
      sampleData.eventTypes = eventTypesResult.rows;
      console.log(`📅 [DB-TEST] Found ${eventTypesResult.rows.length} event types`);
    } catch (error) {
      console.log("⚠️ [DB-TEST] EventType table not accessible:", error.message);
    }

    // Test bookings
    try {
      const bookingsResult = await calcomDb.query(`
        SELECT id, title, startTime, endTime, status
        FROM "Booking" 
        LIMIT 5
      `);
      sampleData.bookings = bookingsResult.rows;
      console.log(`📝 [DB-TEST] Found ${bookingsResult.rows.length} bookings`);
    } catch (error) {
      console.log("⚠️ [DB-TEST] Booking table not accessible:", error.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        connection: "successful",
        tables: tables,
        sampleData: sampleData,
        message: `Database connection successful. Found ${tables.length} tables.`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [DB-TEST] Database test failed:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        connection: "failed",
        message: "Database connection failed. Check credentials and network access.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
