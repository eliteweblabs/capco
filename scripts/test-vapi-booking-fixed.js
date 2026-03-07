import "dotenv/config";
import fetch from "node-fetch";

const RAILWAY_PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN;

async function testVapiBooking() {
  try {
    console.log("🧪 Testing VAPI booking with fixed user ID...");

    const response = await fetch(`${RAILWAY_PUBLIC_DOMAIN}/api/vapi/cal-integration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Vapi-System": "true",
      },
      body: JSON.stringify({
        action: "create_booking",
        start: new Date(Date.now() + 25 * 60 * 60000).toISOString(), // 25 minutes from now
        name: "Test Customer",
        email: "test@example.com",
        phone: "+1234567890",
      }),
    });

    const data = await response.json();
    console.log("📋 Response:", JSON.stringify(data, null, 2));

    if (data.result) {
      console.log("\n✅ SUCCESS! Booking created via VAPI API");
      console.log("📅 Check your Cal.com dashboard now:");
      console.log("🔗 https://calcom-web-app-production-0b16.up.railway.app/bookings/upcoming");
    } else {
      console.log("❌ Failed to create booking");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testVapiBooking();
