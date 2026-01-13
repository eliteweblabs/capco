/**
 * Test Anthropic Models API
 *
 * Test which models are available with the current API key
 *
 * GET /api/agent/test-models
 */

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";

export const GET: APIRoute = async () => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const client = new Anthropic({ apiKey });

    // Try to list available models or test a simple call
    // Note: Anthropic doesn't have a models.list() endpoint, so we'll test with a minimal call
    const testModels = [
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
      "claude-3-5-sonnet-20240620",
      "claude-3-5-sonnet-20241022",
      "claude-sonnet-4-5-20251124", // From web search
    ];

    const results: Array<{ model: string; status: string; error?: string }> = [];

    for (const model of testModels) {
      try {
        // Try a minimal API call to test if model exists
        const response = await client.messages.create({
          model: model,
          max_tokens: 10,
          messages: [{ role: "user", content: "test" }],
        });
        results.push({ model, status: "success" });
        // If one works, break and return it
        return new Response(
          JSON.stringify({
            success: true,
            workingModel: model,
            allResults: results,
            message: `Model ${model} is available and working!`,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error: any) {
        const errorMsg = error.message || error.error?.message || "Unknown error";
        results.push({
          model,
          status: "error",
          error: errorMsg.includes("404") ? "Model not found" : errorMsg.substring(0, 100),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: "No working models found",
        results,
        suggestion: "Check Anthropic API documentation for available models",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: "Failed to test models",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
