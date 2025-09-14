// JavaScript script to generate status slugs from status names
// Run this with: node generate-status-slugs.js

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin access

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  console.log("Please set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to generate slug from status name
function generateStatusSlug(statusName) {
  if (!statusName) return null;

  return statusName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .trim();
}

async function generateStatusSlugs() {
  try {
    console.log("🔄 Fetching project statuses...");

    // Fetch all project statuses
    const { data: statuses, error: fetchError } = await supabase
      .from("project_statuses")
      .select("status_code, client_status_name, admin_status_name");

    if (fetchError) {
      console.error("❌ Error fetching statuses:", fetchError);
      return;
    }

    console.log(`📊 Found ${statuses.length} statuses to process`);

    // Generate slugs for each status
    const updates = statuses.map((status) => {
      const clientSlug = generateStatusSlug(status.client_status_name);
      const adminSlug = generateStatusSlug(status.admin_status_name);

      console.log(`📝 Status ${status.status_code}:`);
      console.log(`   Client: "${status.client_status_name}" → "${clientSlug}"`);
      console.log(`   Admin:  "${status.admin_status_name}" → "${adminSlug}"`);

      return {
        status_code: status.status_code,
        client_status_slug: clientSlug,
        admin_status_slug: adminSlug,
      };
    });

    // Update all statuses with generated slugs
    console.log("\n🔄 Updating database with generated slugs...");

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("project_statuses")
        .update({
          client_status_slug: update.client_status_slug,
          admin_status_slug: update.admin_status_slug,
        })
        .eq("status_code", update.status_code);

      if (updateError) {
        console.error(`❌ Error updating status ${update.status_code}:`, updateError);
      } else {
        console.log(`✅ Updated status ${update.status_code}`);
      }
    }

    console.log("\n🎉 Status slug generation complete!");

    // Verify the results
    console.log("\n📋 Final results:");
    const { data: finalStatuses, error: verifyError } = await supabase
      .from("project_statuses")
      .select(
        "status_code, client_status_name, client_status_slug, admin_status_name, admin_status_slug"
      )
      .order("status_code");

    if (verifyError) {
      console.error("❌ Error verifying results:", verifyError);
    } else {
      finalStatuses.forEach((status) => {
        console.log(`Status ${status.status_code}:`);
        console.log(`  Client: "${status.client_status_name}" → "${status.client_status_slug}"`);
        console.log(`  Admin:  "${status.admin_status_name}" → "${status.admin_status_slug}"`);
      });
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the script
generateStatusSlugs();
