import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const calcomDb = new Pool({
  connectionString: process.env.CALCOM_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testBooking() {
  try {
    console.log("🔍 Testing Cal.com database connection...");

    // Test connection
    const testResult = await calcomDb.query("SELECT 1 as test");
    console.log("✅ Database connected:", testResult.rows);

    // Check EventType table
    console.log("\n📋 Checking EventType table...");
    const eventTypeResult = await calcomDb.query(
      'SELECT id, length, title, slug FROM "EventType" LIMIT 5'
    );
    console.log("EventTypes found:", eventTypeResult.rows);

    if (eventTypeResult.rows.length === 0) {
      console.error("❌ No event types found! You need to create an event type in Cal.com first.");
      console.log("\n📝 To fix:");
      console.log("1. Go to your Cal.com instance");
      console.log("2. Create an event type (e.g., '30 min meeting')");
      console.log("3. Try again");
      process.exit(1);
    }

    // Check Booking table structure
    console.log("\n📋 Checking Booking table structure...");
    const bookingColumns = await calcomDb.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Booking'
      ORDER BY ordinal_position
    `);
    console.log("Booking columns:");
    bookingColumns.rows.forEach((col) => {
      console.log(
        `  - ${col.column_name} (${col.data_type}) ${col.is_nullable === "YES" ? "nullable" : "required"}`
      );
    });

    // Try creating a test booking
    console.log("\n🧪 Attempting to create test booking...");
    const eventType = eventTypeResult.rows[0];
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60000); // Tomorrow
    const endTime = new Date(startTime.getTime() + eventType.length * 60000);
    const uid = `test-booking-${Date.now()}`;

    const bookingResult = await calcomDb.query(
      `INSERT INTO "Booking" (
        uid, 
        title, 
        description,
        "startTime", 
        "endTime", 
        "eventTypeId",
        status,
        metadata,
        "createdAt",
        "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, uid, "startTime", "endTime", status`,
      [
        uid,
        `Test Booking - ${eventType.title}`,
        `Test booking from VAPI integration script`,
        startTime,
        endTime,
        eventType.id,
        "accepted",
        JSON.stringify({
          source: "vapi-test",
          test: true,
        }),
      ]
    );

    const booking = bookingResult.rows[0];
    console.log("✅ Test booking created:", booking);

    // Add attendee
    console.log("\n👤 Adding test attendee...");
    await calcomDb.query(
      `INSERT INTO "Attendee" (
        email,
        name,
        "timeZone",
        "bookingId"
      ) VALUES ($1, $2, $3, $4)`,
      ["test@example.com", "Test User", "UTC", booking.id]
    );
    console.log("✅ Test attendee added");

    console.log("\n✨ SUCCESS! Booking system is working.");
    console.log(`📅 Check your Cal.com dashboard for booking ID: ${booking.id}`);

    // Clean up test booking
    console.log("\n🧹 Cleaning up test booking...");
    await calcomDb.query('DELETE FROM "Attendee" WHERE "bookingId" = $1', [booking.id]);
    await calcomDb.query('DELETE FROM "Booking" WHERE id = $1', [booking.id]);
    console.log("✅ Test booking cleaned up");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    console.error("\nFull error details:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
    process.exit(1);
  } finally {
    await calcomDb.end();
  }
}

testBooking();
