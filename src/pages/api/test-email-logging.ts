import type { APIRoute } from "astro";
import { SimpleProjectLogger } from "../../lib/simple-logging";

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("🧪 [TEST-EMAIL-LOGGING] Testing email logging system");

  try {
    // Test logging to a project (use project ID 1 for testing)
    const testResult = await SimpleProjectLogger.addLogEntry(
      1, // Test project ID
      "emailSent",
      "Test email logging - This is a test log entry",
      {
        test: true,
        timestamp: new Date().toISOString(),
        method: "test",
      },
      cookies
    );

    console.log("🧪 [TEST-EMAIL-LOGGING] Test result:", testResult);

    if (testResult) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Email logging test successful",
          result: testResult,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Email logging test failed",
          result: testResult,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("🧪 [TEST-EMAIL-LOGGING] Test error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
