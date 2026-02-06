/**
 * AI Text Completion API (Cotypist-style)
 *
 * Returns a short continuation of the given text using the same LLM stack
 * (Anthropic) as the rest of the app. Use from an in-app editor for
 * inline autocomplete: Tab to accept suggestion.
 *
 * POST /api/ai/complete
 * Body: { text: string, maxTokens?: number }
 * Response: { completion: string }
 */

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";

const MAX_INPUT_LENGTH = 4000;
const DEFAULT_MAX_TOKENS = 80;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const maxTokens =
      typeof body?.maxTokens === "number" && body.maxTokens > 0 && body.maxTokens <= 200
        ? body.maxTokens
        : DEFAULT_MAX_TOKENS;

    if (!text) {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (text.length > MAX_INPUT_LENGTH) {
      return new Response(JSON.stringify({ error: "text too long" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const client = new Anthropic({ apiKey });
    const model = "claude-3-5-haiku-20241022";

    const systemPrompt = `You are a text completion assistant. Given the start of a message or paragraph, reply with ONLY the natural continuation—the next few words or sentence the user would likely type. Do not repeat the input, add quotes, or explain. Output nothing else.`;

    const userMessage = `Complete the following text. Reply with ONLY the continuation (no quotes, no explanation):\n\n${text}`;

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const block = response.content?.find((b) => b.type === "text");
    const completion = block && "text" in block ? String(block.text).trim() : "";

    return new Response(JSON.stringify({ completion }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[---AI-COMPLETE] Error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Completion failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
