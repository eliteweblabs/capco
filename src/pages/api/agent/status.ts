/**
 * AI Agent Status API
 *
 * Check if AI agent is properly configured
 *
 * GET /api/agent/status
 */

import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Allow unauthenticated access for debugging (can restrict later)
    // const { isAuth, currentUser } = await checkAuth(cookies);
    // if (!isAuth || !currentUser) {
    //   return new Response(JSON.stringify({ error: "Authentication required" }), {
    //     status: 401,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // Check API key availability (without exposing the actual key)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const hasApiKey = !!apiKey;
    const apiKeyLength = apiKey?.length || 0;
    const apiKeyPrefix = apiKey ? apiKey.substring(0, 8) + "..." : "none";

    // Check all environment variables (for debugging)
    const allEnvKeys = Object.keys(process.env).sort();
    const anthropicKeys = allEnvKeys.filter((k) => k.includes("ANTHROPIC"));
    const apiKeys = allEnvKeys.filter((k) => k.includes("API") && k.includes("KEY"));

    return new Response(
      JSON.stringify({
        success: true,
        configured: hasApiKey,
        apiKey: {
          exists: hasApiKey,
          length: apiKeyLength,
          prefix: apiKeyPrefix,
          // Don't expose the actual key for security
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          railwayDomain: request ? new URL(request.url).origin : undefined,
        },
        debugging: {
          allAnthropicKeys: anthropicKeys,
          allApiKeys: apiKeys.slice(0, 10), // Limit to first 10
          totalEnvVars: allEnvKeys.length,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [AGENT-STATUS] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to check status",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
