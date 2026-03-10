/**
 * Extract a single field value from a cropped region of a fire protection drawing.
 * Used when the user selects a region on the drawing to refine/extract a specific value.
 *
 * POST /api/agent/extract-drawing-field
 * Body: { imageUrl: string, fieldType: string, scale?: string }
 */

import type { APIRoute } from "astro";
import { UnifiedFireProtectionAgent } from "../../../lib/ai/unified-agent";
import { checkAuth } from "../../../lib/auth";

const FIELD_PROMPTS: Record<string, string> = {
  'pipe-2"':
    'Extract the total length of 2" pipe in real-world feet from this region. Use the drawing scale. Return ONLY the value, e.g. "45 ft" or "12.5 ft". If nothing visible, return "—".',
  'pipe-1-1/2"':
    'Extract the total length of 1-1/2" pipe in real-world feet from this region. Use the drawing scale. Return ONLY the value, e.g. "30 ft". If nothing visible, return "—".',
  'pipe-1"':
    'Extract the total length of 1" pipe in real-world feet from this region. Use the drawing scale. Return ONLY the value. If nothing visible, return "—".',
  "pipe-other":
    'Extract the pipe length (and diameter if visible) from this region. Return ONLY the value. If nothing visible, return "—".',
  sprinkler:
    "Count sprinkler heads in this region. Return ONLY the number, e.g. 12. If none, return 0.",
  smoke:
    "Count smoke alarms/detectors in this region. Return ONLY the number, e.g. 4. If none, return 0.",
  pull: "Count pull stations in this region. Return ONLY the number. If none, return 0.",
  fdc: "Count FDC (Fire Dept connection) in this region. Return ONLY the number. If none, return 0.",
  horn: "Count horns/strobes in this region. Return ONLY the number. If none, return 0.",
  other:
    "Extract any numeric value or measurement from this region. Return ONLY the value. If nothing, return —.",
};

interface ExtractDrawingFieldRequest {
  imageUrl: string;
  fieldType: string;
  scale?: string;
}

function buildExtractPrompt(fieldType: string, scale?: string): string {
  const base = FIELD_PROMPTS[fieldType] || FIELD_PROMPTS.other;
  const scaleNote =
    scale && scale.trim()
      ? ` Drawing scale: ${scale.trim()}. Convert labeled dimensions to real-world units.`
      : "";
  return `This is a cropped region from a fire protection drawing.${scaleNote}

${base}

Respond with ONLY the extracted value—no explanation, no units unless the value is a length (then include "ft").`;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "AI API key not configured",
          hint: "Set ANTHROPIC_API_KEY in environment variables",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body: ExtractDrawingFieldRequest = await request.json();
    const { imageUrl, fieldType, scale } = body;

    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith("http")) {
      return new Response(
        JSON.stringify({
          error: "imageUrl is required and must be a valid http(s) URL",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const fType = (fieldType || "other").trim().toLowerCase();
    const prompt = buildExtractPrompt(fType, scale);

    const agent = new UnifiedFireProtectionAgent(apiKey);
    const response = await agent.processQuery({
      message: prompt,
      images: [imageUrl],
      context: { temperature: 0 },
    });

    const content = (response.content || "").trim();
    const value = content.replace(/^["']|["']$/g, "").trim() || "—";

    return new Response(
      JSON.stringify({
        success: true,
        value,
        rawResponse: response.content,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("❌ [EXTRACT-DRAWING-FIELD] Error:", err);

    return new Response(
      JSON.stringify({
        error: "Failed to extract field value",
        message: err?.message ?? "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
