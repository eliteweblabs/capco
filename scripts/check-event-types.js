import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const calcomDb = new Pool({
  connectionString: process.env.CALCOM_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkEventTypes() {
  try {
    console.log("🔍 Checking available event types...");

    const eventTypes = await calcomDb.query(`
      SELECT id, title, slug, length, description
      FROM "EventType" 
      ORDER BY id ASC
    `);

    console.log("\n📋 Available Event Types:");
    eventTypes.rows.forEach((event, i) => {
      console.log(`\n${i + 1}. ID: ${event.id}`);
      console.log(`   Title: ${event.title}`);
      console.log(`   Slug: ${event.slug}`);
      console.log(`   Length: ${event.length} minutes`);
      console.log(`   Description: ${event.description || "None"}`);
      // console.log(`   Active: ${event.active ? "Yes" : "No"}`);
    });

    // Check which one VAPI is currently using
    console.log("\n🤖 VAPI is currently using the FIRST event type (ID: 1)");
    if (eventTypes.rows.length > 0) {
      const firstEvent = eventTypes.rows[0];
      console.log(`   Current: "${firstEvent.title}" (${firstEvent.length} min)`);
    }

    // Show how to change it
    console.log("\n📝 To change the event type for VAPI bookings:");
    console.log("1. Update the query in cal-integration.ts:");
    console.log('   FROM: SELECT id, length, title FROM "EventType" LIMIT 1');
    console.log(
      '   TO:   SELECT id, length, title FROM "EventType" WHERE id = [YOUR_PREFERRED_ID]'
    );
    console.log("\n2. Or create a new event type in Cal.com dashboard");
    console.log("3. Or modify the query to filter by title/slug");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await calcomDb.end();
  }
}

checkEventTypes();
