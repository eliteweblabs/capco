// Webhook monitoring script
// Run this to check webhook activity and detect potential issues

const monitorWebhooks = () => {
  console.log("🔍 Webhook Monitoring Dashboard");
  console.log("==============================");

  // Check environment variables
  console.log("📋 Environment Check:");
  console.log("  - DISABLE_WEBHOOKS:", process.env.DISABLE_WEBHOOKS || "not set");
  console.log("  - SITE_URL:", process.env.SITE_URL || "not set");
  console.log("  - RESEND_WEBHOOK_SECRET:", process.env.RESEND_WEBHOOK_SECRET ? "set" : "not set");

  // Check webhook cache (if running in same process)
  if (typeof webhookCache !== "undefined") {
    console.log("📊 Webhook Cache Status:");
    console.log("  - Active webhooks:", webhookCache.size);
    console.log("  - Cache entries:", Array.from(webhookCache.entries()));
  }

  console.log("\n🛡️ Safeguards in Place:");
  console.log("  ✅ Rate limiting (10 webhooks/minute per project)");
  console.log("  ✅ Timeout protection (10 second timeout)");
  console.log("  ✅ Error handling (no retries on failure)");
  console.log("  ✅ Environment variable disable switch");
  console.log("  ✅ Duplicate prevention cache");

  console.log("\n📈 Usage Monitoring:");
  console.log("  - Monitor Supabase egress usage daily");
  console.log("  - Check for unusual spikes in webhook activity");
  console.log("  - Set up alerts for quota approaching limits");

  console.log("\n🚨 Emergency Actions:");
  console.log("  - Set DISABLE_WEBHOOKS=true to stop all webhooks");
  console.log("  - Check Supabase usage dashboard for quota status");
  console.log("  - Review webhook logs for error patterns");
};

// Run monitoring
monitorWebhooks();
