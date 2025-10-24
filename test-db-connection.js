/**
 * Test Cal.com Database Connection
 * This script tests the database connection string format
 */

import { Pool } from "pg";

const connectionString =
  "postgresql://postgres:xifiuamYNxidNaquKPxegVlyztMwLIGy@postgres-production-5af06.up.railway.app:5432/railway";

console.log("🧪 Testing Cal.com database connection...");
console.log("Connection string:", connectionString.replace(/:[^:@]+@/, ":***@")); // Hide password

const calcomDb = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testConnection() {
  try {
    console.log("📡 Attempting to connect to database...");

    // Test basic connection
    const result = await calcomDb.query("SELECT 1 as test");
    console.log("✅ Basic connection test passed:", result.rows[0]);

    // Test getting tables
    const tablesResult = await calcomDb.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`📋 Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    // Test users table
    try {
      const usersResult = await calcomDb.query(`
        SELECT id, name, email, username 
        FROM users 
        LIMIT 5
      `);
      console.log(`👥 Found ${usersResult.rows.length} users in 'users' table`);
      usersResult.rows.forEach((user) => {
        console.log(`  - ${user.name} (${user.email})`);
      });
    } catch (error) {
      console.log("⚠️ 'users' table not found, trying 'User' table...");

      try {
        const userResult = await calcomDb.query(`
          SELECT id, name, email, username 
          FROM "User" 
          LIMIT 5
        `);
        console.log(`👤 Found ${userResult.rows.length} users in 'User' table`);
        userResult.rows.forEach((user) => {
          console.log(`  - ${user.name} (${user.email})`);
        });
      } catch (error2) {
        console.log("❌ Neither 'users' nor 'User' table found");
        console.log("Error:", error2.message);
      }
    }

    console.log("🎉 Database connection test completed successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error("Error:", error.message);
    console.error("Code:", error.code);

    if (error.code === "ECONNREFUSED") {
      console.log(
        "💡 This is expected - Railway databases are not accessible from external networks"
      );
      console.log("💡 Deploy to Railway to test the database connection");
    } else if (error.code === "ENOTFOUND") {
      console.log("💡 DNS resolution failed - check the hostname");
    } else if (error.code === "ETIMEDOUT") {
      console.log("💡 Connection timed out - check network access");
    }
  } finally {
    await calcomDb.end();
  }
}

testConnection();
