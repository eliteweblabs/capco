/**
 * Scheduled Newsletter Processor
 * Runs every minute to check for newsletters scheduled to be sent
 * Uses node-cron for scheduling
 */

import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET;

if (!supabaseUrl || !supabaseKey) {
  console.error("[NEWSLETTER-SCHEDULER] ❌ Supabase credentials not configured");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Process scheduled newsletters
 * Finds newsletters scheduled for now or earlier and sends them
 */
async function processScheduledNewsletters() {
  try {
    console.log("[NEWSLETTER-SCHEDULER] 🔍 Checking for scheduled newsletters...");

    // Get newsletters scheduled for now or earlier
    const { data: newsletters, error } = await supabase
      .from("newsletters")
      .select("*")
      .eq("isScheduled", true)
      .eq("isActive", true)
      .eq("isDraft", false)
      .lte("scheduledFor", new Date().toISOString())
      .order("scheduledFor", { ascending: true });

    if (error) {
      console.error("[NEWSLETTER-SCHEDULER] ❌ Error fetching scheduled newsletters:", error);
      return;
    }

    if (!newsletters || newsletters.length === 0) {
      console.log("[NEWSLETTER-SCHEDULER] ✅ No newsletters to send");
      return;
    }

    console.log(`[NEWSLETTER-SCHEDULER] 📧 Found ${newsletters.length} newsletter(s) to send`);

    // Process each newsletter
    for (const newsletter of newsletters) {
      console.log(`[NEWSLETTER-SCHEDULER] 📤 Sending newsletter: ${newsletter.title}`);

      try {
        // Call the send API endpoint
        const response = await fetch(
          `${process.env.PUBLIC_SITE_URL || "http://localhost:4321"}/api/newsletters/send`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: newsletter.id, isScheduled: true }),
          }
        );

        const result = await response.json();

        if (result.success) {
          console.log(
            `[NEWSLETTER-SCHEDULER] ✅ Sent: ${newsletter.title} (${result.successCount} recipients)`
          );

          // Mark as sent and unscheduled
          await supabase
            .from("newsletters")
            .update({
              isScheduled: false,
              lastSentAt: new Date().toISOString(),
            })
            .eq("id", newsletter.id);
        } else {
          console.error(
            `[NEWSLETTER-SCHEDULER] ❌ Failed to send: ${newsletter.title}`,
            result.error
          );
        }
      } catch (error) {
        console.error(
          `[NEWSLETTER-SCHEDULER] ❌ Error sending newsletter ${newsletter.id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("[NEWSLETTER-SCHEDULER] ❌ Error processing scheduled newsletters:", error);
  }
}

// Run every minute to check for scheduled newsletters
// Cron format: "* * * * *" = every minute
const task = cron.schedule("* * * * *", processScheduledNewsletters, {
  scheduled: true,
  timezone: "America/New_York", // Change to your timezone
});

console.log("[NEWSLETTER-SCHEDULER] 🚀 Newsletter scheduler started (runs every minute)");
console.log("[NEWSLETTER-SCHEDULER] ⏰ Timezone: America/New_York");

// Run immediately on start (optional)
processScheduledNewsletters();

// Keep the process running
process.on("SIGINT", () => {
  console.log("\n[NEWSLETTER-SCHEDULER] 🛑 Stopping scheduler...");
  task.stop();
  process.exit(0);
});

// Export for potential use in other modules
export { processScheduledNewsletters };
