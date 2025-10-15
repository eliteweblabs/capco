import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication - Admin/Staff only
    const { currentUser, currentRole } = await checkAuth(cookies);
    if (!currentUser || !["Admin", "Staff"].includes(currentRole || "")) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { phoneNumber, carrier = "verizon", testMessage = "Test from CAPCo Fire" } = body;

    if (!phoneNumber) {
      return new Response(JSON.stringify({ error: "Phone number required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return new Response(JSON.stringify({ error: "Invalid phone number format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate SMS gateway email
    const carrierGateways: Record<string, string> = {
      verizon: "@vtext.com",
      att: "@txt.att.net",
      tmobile: "@tmomail.net",
      sprint: "@messaging.sprintpcs.com",
    };

    const gateway = carrierGateways[carrier] || "@vtext.com";
    const smsEmail = `${cleanPhone}${gateway}`;

    console.log(`🧪 [SMS-TEST] Testing SMS gateway: ${smsEmail}`);

    // Test different message formats
    const testFormats = [
      {
        name: "Minimal Format",
        payload: {
          from: "CAPCo Fire <noreply@capcofire.com>",
          to: smsEmail,
          subject: "", // No subject
          text: testMessage.substring(0, 160),
          headers: {
            "X-SMS-Gateway": "true",
            "Content-Type": "text/plain; charset=UTF-8",
          },
        },
      },
      {
        name: "Standard Format",
        payload: {
          from: "noreply@capcofire.com", // Plain email address
          to: smsEmail,
          subject: "Test",
          text: testMessage.substring(0, 160),
        },
      },
      {
        name: "Ultra-Minimal",
        payload: {
          from: "noreply@capcofire.com",
          to: smsEmail,
          text: testMessage.substring(0, 100), // Very short message
        },
      },
    ];

    const results = [];
    const emailApiKey = process.env.RESEND_API_KEY;

    if (!emailApiKey) {
      return new Response(JSON.stringify({ error: "Email API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Test each format
    for (const format of testFormats) {
      try {
        console.log(`🧪 [SMS-TEST] Testing ${format.name}:`, format.payload);

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${emailApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(format.payload),
        });

        const responseData = await response.text();

        results.push({
          format: format.name,
          success: response.ok,
          status: response.status,
          response: response.ok ? JSON.parse(responseData) : responseData,
          payload: format.payload,
        });

        console.log(`🧪 [SMS-TEST] ${format.name} result:`, {
          success: response.ok,
          status: response.status,
        });

        // Wait between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          format: format.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          payload: format.payload,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        phoneNumber: cleanPhone,
        smsEmail,
        carrier,
        gateway,
        testResults: results,
        recommendations: [
          "Use empty subject line for SMS gateways",
          "Keep messages under 160 characters",
          "Use consistent sender address (noreply@capcofire.com)",
          "Avoid HTML content in SMS messages",
          "Consider using plain email address (no display name) for sender",
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("🧪 [SMS-TEST] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
