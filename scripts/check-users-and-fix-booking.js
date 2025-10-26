import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const calcomDb = new Pool({
  connectionString: process.env.CALCOM_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkUsersAndFixBooking() {
  try {
    console.log("🔍 Checking users table...");

    // Check users table
    const users = await calcomDb.query(`
      SELECT id, name, email, username 
      FROM users 
      ORDER BY id ASC
      LIMIT 5
    `);

    console.log("👥 Users found:");
    users.rows.forEach((user, i) => {
      console.log(`  ${i + 1}. ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });

    if (users.rows.length === 0) {
      console.log("❌ No users found! This is why bookings don't show up properly.");
      console.log("\n📝 To fix:");
      console.log("1. Go to your Cal.com instance");
      console.log("2. Create a user account");
      console.log("3. Try booking again");
      process.exit(1);
    }

    const userId = users.rows[0].id;
    console.log(`\n✅ Using User ID: ${userId}`);

    // Get event type
    const eventType = await calcomDb.query('SELECT id, length, title FROM "EventType" LIMIT 1');
    const eventTypeId = eventType.rows[0].id;
    console.log(`✅ Using EventType ID: ${eventTypeId}`);

    // Create booking with proper user ID
    console.log("\n🧪 Creating booking with user ID...");
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60000); // Tomorrow
    const endTime = new Date(startTime.getTime() + eventType.rows[0].length * 60000);
    const uid = `vapi-booking-${Date.now()}`;

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
        `Test booking from VAPI integration with user`,
        startTime,
        endTime,
        eventTypeId,
        userId, // This is the key!
        "accepted",
        false,
        false,
        0,
        JSON.stringify({
          source: "vapi-debug",
          test: true,
          userId: userId,
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

    console.log("\n🎉 SUCCESS! This booking should now appear in Cal.com dashboard.");
    console.log(`📅 Booking ID: ${booking.id}`);
    console.log(`👤 User ID: ${userId}`);
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

checkUsersAndFixBooking();
