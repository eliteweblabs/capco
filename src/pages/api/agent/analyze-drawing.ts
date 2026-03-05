/**
 * Analyze Fire Protection Drawing API
 *
 * Accepts image URLs (from uploaded drawings) and uses Claude Vision to recognize
 * fire protection elements: pipe lengths by diameter, sprinkler heads, smoke alarms,
 * etc., based on line width, color, and NFPA symbol conventions.
 *
 * POST /api/agent/analyze-drawing
 */

import type { APIRoute } from "astro";
import { UnifiedFireProtectionAgent } from "../../../lib/ai/unified-agent";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

interface AnalyzeDrawingRequest {
  imageUrls: string[];
  projectId?: number;
}

const DRAWING_ANALYSIS_PROMPT = `Analyze these fire protection system drawings/diagrams.

Extract and identify the following, based on standard NFPA/fire protection conventions:

1. **Pipe lengths by diameter** – Line width often indicates pipe size (thicker = larger diameter).
   Look for: 2" pipe, 1-1/2" pipe, 1" pipe, etc. Estimate or note lengths where visible.

2. **Sprinkler heads** – Standard sprinkler symbols (typically circles with cross or droplet iconography).
   Count and note locations if labeled.

3. **Smoke alarms/detectors** – Standard symbols (typically “D” shape or rectangle with indicator).
   Count and note locations.

4. **Other fire protection equipment** – Pull stations, horns, strobes, standpipes, FDC, etc.

Consider:
- **Line width** = pipe diameter (NFPA plans often use line weight for pipe size)
- **Color** = fire lines often red; domestic/cold gray
- **Symbols** = NFPA 170, NFPA 13/13R/13D symbol standards

Return a structured JSON object with this exact structure (no markdown, no code block wrapper):

{
  "summary": "Brief 1-2 sentence overview of what the drawing shows",
  "pipeSegments": [
    { "diameter": "2\"", "length": "45 ft", "notes": "main feed", "confidence": "high|medium|low" }
  ],
  "sprinklerHeads": { "count": 12, "locations": ["..."] or [], "confidence": "high|medium|low" },
  "smokeAlarms": { "count": 4, "locations": ["..."] or [], "confidence": "high|medium|low" },
  "otherEquipment": [{ "type": "pull station", "count": 2, "notes": "..." }],
  "uncertainties": ["Any elements you couldn't confidently identify"]
}

If the image is not a fire protection drawing (e.g., floor plan without sprinklers), say so in summary and return empty arrays.
Return ONLY valid JSON.`;

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

    const body: AnalyzeDrawingRequest = await request.json();
    const { imageUrls, projectId } = body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return new Response(
        JSON.stringify({
          error: "imageUrls array is required and must contain at least one URL",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Limit to 10 images to avoid token/request limits (Claude allows up to 20)
    const urls = imageUrls
      .slice(0, 10)
      .filter((u) => typeof u === "string" && u.startsWith("http"));

    if (urls.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No valid image URLs provided. URLs must be http(s) and publicly accessible.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(
      `📐 [ANALYZE-DRAWING] Analyzing ${urls.length} image(s) for user ${currentUser.id}`,
      projectId ? `project ${projectId}` : ""
    );

    const agent = new UnifiedFireProtectionAgent(apiKey);
    const response = await agent.processQuery({
      message: DRAWING_ANALYSIS_PROMPT,
      images: urls,
      context: { projectId: projectId ?? undefined },
    });

    // Try to parse JSON from the response
    let analysis = response.content;
    let parsed: Record<string, unknown> | null = null;

    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      }
    } catch {
      // Keep raw content if parsing fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          rawResponse: response.content,
          parsed,
          metadata: response.metadata,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("❌ [ANALYZE-DRAWING] Error:", err);

    return new Response(
      JSON.stringify({
        error: "Failed to analyze drawing",
        message: err?.message ?? "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
