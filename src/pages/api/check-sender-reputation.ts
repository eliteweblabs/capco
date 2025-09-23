import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Check authentication - Admin/Staff only
    const { currentUser, currentRole } = await checkAuth(cookies);
    if (!currentUser || !["Admin", "Staff"].includes(currentRole || "")) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const emailApiKey = process.env.RESEND_API_KEY;
    if (!emailApiKey) {
      return new Response(JSON.stringify({ error: "Resend API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      domain: "capcofire.com",
      checks: {},
      recommendations: [],
      reputation_status: "unknown",
    };

    // console.log("🔍 [REPUTATION-CHECK] Starting sender reputation analysis...");

    // 1. Check domain verification status
    try {
      const domainResponse = await fetch("https://api.resend.com/domains", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${emailApiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (domainResponse.ok) {
        const domainData = await domainResponse.json();
        const capcoFireDomain = domainData.data?.find((d: any) => d.name === "capcofire.com");

        results.checks.domain_verification = {
          status: capcoFireDomain ? "found" : "not_found",
          verified: capcoFireDomain?.status === "verified",
          records: capcoFireDomain?.records || [],
          details: capcoFireDomain || null,
        };

        if (!capcoFireDomain) {
          results.recommendations.push("Add capcofire.com domain to Resend dashboard");
          results.reputation_status = "poor";
        } else if (capcoFireDomain.status !== "verified") {
          results.recommendations.push("Complete domain verification in Resend dashboard");
          results.reputation_status = "poor";
        }
      } else {
        results.checks.domain_verification = {
          status: "api_error",
          error: await domainResponse.text(),
        };
      }
    } catch (error) {
      results.checks.domain_verification = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // 2. Check recent email activity and bounces
    try {
      const emailsResponse = await fetch("https://api.resend.com/emails?limit=100", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${emailApiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (emailsResponse.ok) {
        const emailsData = await emailsResponse.json();
        const emails = emailsData.data || [];

        // Analyze recent email patterns
        const smsGatewayEmails = emails.filter((email: any) =>
          email.to?.some((recipient: string) => recipient.includes("@vtext.com"))
        );

        const bouncedEmails = emails.filter((email: any) => email.last_event === "bounced");
        const smsGatewayBounces = smsGatewayEmails.filter(
          (email: any) => email.last_event === "bounced"
        );

        const bounceRate = emails.length > 0 ? (bouncedEmails.length / emails.length) * 100 : 0;
        const smsGatewayBounceRate =
          smsGatewayEmails.length > 0
            ? (smsGatewayBounces.length / smsGatewayEmails.length) * 100
            : 0;

        results.checks.email_activity = {
          total_emails_last_100: emails.length,
          sms_gateway_emails: smsGatewayEmails.length,
          total_bounces: bouncedEmails.length,
          sms_gateway_bounces: smsGatewayBounces.length,
          overall_bounce_rate: Math.round(bounceRate * 100) / 100,
          sms_gateway_bounce_rate: Math.round(smsGatewayBounceRate * 100) / 100,
          recent_sms_bounces: smsGatewayBounces.slice(0, 5).map((email: any) => ({
            to: email.to,
            subject: email.subject,
            created_at: email.created_at,
            last_event: email.last_event,
          })),
        };

        // Reputation assessment based on bounce rates
        if (bounceRate > 10) {
          results.reputation_status = "poor";
          results.recommendations.push(
            "High bounce rate detected - sender reputation likely damaged"
          );
        } else if (smsGatewayBounceRate > 50) {
          results.reputation_status = "sms_blocked";
          results.recommendations.push(
            "SMS gateway bounce rate is high - likely blocked by carriers"
          );
        } else if (bounceRate > 5) {
          results.reputation_status = "warning";
          results.recommendations.push("Moderate bounce rate - monitor sender reputation");
        } else {
          results.reputation_status =
            results.reputation_status === "unknown" ? "good" : results.reputation_status;
        }
      } else {
        results.checks.email_activity = {
          status: "api_error",
          error: await emailsResponse.text(),
        };
      }
    } catch (error) {
      results.checks.email_activity = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // 3. DNS Record Checks (basic validation)
    results.checks.dns_recommendations = {
      spf_record: "v=spf1 include:_spf.resend.com ~all",
      dmarc_record: "v=DMARC1; p=quarantine; rua=mailto:dmarc@capcofire.com",
      note: "Verify these records are set in your DNS",
    };

    // 4. Generate specific recommendations
    if (results.reputation_status === "sms_blocked" || results.reputation_status === "poor") {
      results.recommendations.push(
        "Consider using a different sender domain for SMS gateway emails"
      );
      results.recommendations.push("Implement gradual sending volume increase (IP warming)");
      results.recommendations.push(
        "Switch to dedicated SMS service (Twilio, AWS SNS) for critical notifications"
      );
    }

    results.recommendations.push("Monitor Resend dashboard for delivery analytics");
    results.recommendations.push("Set up webhook monitoring for bounce notifications");

    // 5. Recovery options
    results.recovery_options = {
      immediate: [
        "Use optimized SMS gateway format (already implemented)",
        "Test with alternative Verizon gateways (@vzwpix.com)",
        "Reduce SMS sending frequency",
      ],
      short_term: [
        "Complete domain verification if not done",
        "Set up proper DNS records (SPF, DKIM, DMARC)",
        "Monitor bounce rates daily",
      ],
      long_term: [
        "Consider dedicated SMS service integration",
        "Implement sender reputation monitoring",
        "Use separate domain for SMS notifications",
      ],
    };

    // console.log("✅ [REPUTATION-CHECK] Analysis complete:", results.reputation_status);

    return new Response(JSON.stringify(results, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("🔍 [REPUTATION-CHECK] Error:", error);
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
