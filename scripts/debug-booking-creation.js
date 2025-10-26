import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const calcomDb = new Pool({
  connectionString: process.env.CALCOM_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function debugBooking() {
  try {
    console.log("🔍 Debugging booking creation...");

    // Check what fields are required vs nullable
    const columns = await calcomDb.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Booking'
      ORDER BY ordinal_position
    `);

    console.log("\n📋 Booking table columns:");
    columns.rows.forEach((col) => {
      const required = col.is_nullable === "NO" ? "REQUIRED" : "nullable";
      console.log(
        `  ${col.column_name}: ${col.data_type} (${required}) ${col.column_default ? `default: ${col.column_default}` : ""}`
      );
    });

    // Check existing bookings to see the pattern
    console.log("\n📅 Checking existing bookings...");
    const existingBookings = await calcomDb.query(`
      SELECT id, uid, title, "startTime", "endTime", status, "userId", "eventTypeId", paid, "isRecorded", "iCalSequence"
      FROM "Booking" 
      ORDER BY "createdAt" DESC 
      LIMIT 3
    `);

    console.log("Recent bookings:");
    existingBookings.rows.forEach((booking, i) => {
      console.log(`\n${i + 1}. Booking ID: ${booking.id}`);
      console.log(`   UID: ${booking.uid}`);
      console.log(`   Title: ${booking.title}`);
      console.log(`   Start: ${booking.startTime}`);
      console.log(`   End: ${booking.endTime}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   User ID: ${booking.userId}`);
      console.log(`   Event Type ID: ${booking.eventTypeId}`);
      console.log(`   Paid: ${booking.paid}`);
      console.log(`   Is Recorded: ${booking.isRecorded}`);
      console.log(`   iCal Sequence: ${booking.iCalSequence}`);
    });

    // Try creating a booking with ALL required fields
    console.log("\n🧪 Creating booking with all required fields...");
    const eventType = await calcomDb.query('SELECT id, length, title FROM "EventType" LIMIT 1');
    const users = await calcomDb.query('SELECT id FROM "User" LIMIT 1');

    if (eventType.rows.length === 0) {
      throw new Error("No event types found");
    }
    if (users.rows.length === 0) {
      throw new Error("No users found - this might be the issue!");
    }

    const eventTypeId = eventType.rows[0].id;
    const userId = users.rows[0].id;
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60000); // Tomorrow
    const endTime = new Date(startTime.getTime() + eventType.rows[0].length * 60000);
    const uid = `vapi-booking-${Date.now()}`;

    console.log(`Using EventType ID: ${eventTypeId}`);
    console.log(`Using User ID: ${userId}`);

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
        `VAPI Test Booking - ${eventType.rows[0].title}`,
        `Test booking from VAPI integration`,
        startTime,
        endTime,
        eventTypeId,
        userId, // This was missing!
        "accepted",
        false, // paid
        false, // isRecorded
        0, // iCalSequence
        JSON.stringify({
          source: "vapi-debug",
          test: true,
        }),
      ]
    );

    const booking = bookingResult.rows[0];
    console.log("✅ Booking created successfully:", booking);

    // Add attendee
    await calcomDb.query(
      `INSERT INTO "Attendee" (
        email,
        name,
        "timeZone",
        "bookingId"
      ) VALUES ($1, $2, $3, $4)`,
      ["test@example.com", "Test User", "UTC", booking.id]
    );
    console.log("✅ Attendee added");

    console.log("\n🎉 SUCCESS! Check your Cal.com dashboard now.");
    console.log(`📅 Booking ID: ${booking.id}`);
    console.log(
      `🔗 Dashboard: https://calcom-web-app-production-0b16.up.railway.app/bookings/upcoming`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  } finally {
    await calcomDb.end();
  }
}

debugBooking();
