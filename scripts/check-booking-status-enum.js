import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const calcomDb = new Pool({
  connectionString: process.env.CALCOM_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkEnums() {
  try {
    console.log("🔍 Checking BookingStatus enum values...");

    const result = await calcomDb.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'BookingStatus'
      )
      ORDER BY enumsortorder
    `);

    console.log("\n✅ Valid BookingStatus values:");
    result.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. "${row.enumlabel}"`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await calcomDb.end();
  }
}

checkEnums();
