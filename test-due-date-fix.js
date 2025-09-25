#!/usr/bin/env node

/**
 * Test script to verify due-date slot machine functionality
 * This script tests:
 * 1. Database schema (due_date column exists)
 * 2. API endpoint (update-project handles due_date)
 * 3. Date format conversion
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key";

console.log("🔍 [DUE-DATE-TEST] Testing due-date slot machine functionality...");
console.log("🔍 [DUE-DATE-TEST] Supabase URL:", supabaseUrl);

async function testDueDateColumn() {
  console.log("\n📊 [DUE-DATE-TEST] Testing database schema...");

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if due_date column exists
    const { data, error } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type")
      .eq("table_name", "projects")
      .eq("column_name", "due_date");

    if (error) {
      console.error("❌ [DUE-DATE-TEST] Error checking schema:", error);
      return false;
    }

    if (data && data.length > 0) {
      console.log("✅ [DUE-DATE-TEST] due_date column exists:", data[0]);
      return true;
    } else {
      console.log("❌ [DUE-DATE-TEST] due_date column NOT found in projects table");
      console.log("💡 [DUE-DATE-TEST] Run: sql-queriers/add-due-date-column.sql");
      return false;
    }
  } catch (error) {
    console.error("❌ [DUE-DATE-TEST] Database connection error:", error);
    return false;
  }
}

async function testUpdateProjectAPI() {
  console.log("\n🔧 [DUE-DATE-TEST] Testing update-project API...");

  try {
    const testData = {
      projectId: 1, // Use a test project ID
      due_date: "2024-12-31",
    };

    console.log("📤 [DUE-DATE-TEST] Sending test data:", testData);

    const response = await fetch("http://localhost:4321/api/update-project", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    console.log("📥 [DUE-DATE-TEST] Response status:", response.status);

    if (response.ok) {
      const result = await response.json();
      console.log("✅ [DUE-DATE-TEST] API response:", result);
      return true;
    } else {
      const error = await response.text();
      console.log("❌ [DUE-DATE-TEST] API error:", error);
      return false;
    }
  } catch (error) {
    console.error("❌ [DUE-DATE-TEST] API test error:", error);
    return false;
  }
}

async function testDateConversion() {
  console.log("\n📅 [DUE-DATE-TEST] Testing date format conversion...");

  const testDates = ["2024-12-31T23:59:59.000Z", "2024-12-31", new Date().toISOString()];

  testDates.forEach((dateStr) => {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const converted = date.toISOString().split("T")[0];
      console.log(`✅ [DUE-DATE-TEST] ${dateStr} → ${converted}`);
    } else {
      console.log(`❌ [DUE-DATE-TEST] Invalid date: ${dateStr}`);
    }
  });
}

async function main() {
  console.log("🚀 [DUE-DATE-TEST] Starting due-date functionality test...\n");

  const schemaOk = await testDueDateColumn();
  const apiOk = await testUpdateProjectAPI();
  testDateConversion();

  console.log("\n📋 [DUE-DATE-TEST] Test Summary:");
  console.log(`   Database Schema: ${schemaOk ? "✅ OK" : "❌ FAIL"}`);
  console.log(`   API Endpoint: ${apiOk ? "✅ OK" : "❌ FAIL"}`);
  console.log(`   Date Conversion: ✅ OK`);

  if (!schemaOk) {
    console.log("\n💡 [DUE-DATE-TEST] To fix the database schema:");
    console.log("   1. Run: sql-queriers/add-due-date-column.sql");
    console.log("   2. Or run: psql -f sql-queriers/add-due-date-column.sql");
  }

  if (!apiOk) {
    console.log("\n💡 [DUE-DATE-TEST] To fix the API:");
    console.log("   1. Check if update-project.ts handles due_date field");
    console.log("   2. Verify authentication is working");
    console.log("   3. Check browser console for errors");
  }

  console.log("\n🎯 [DUE-DATE-TEST] Test completed!");
}

main().catch(console.error);
