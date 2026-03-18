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

interface UserSelection {
  floorIndex: string;
  floorName: string;
  elementType: string;
  notes?: string;
  region?: { left: number; top: number; width: number; height: number };
  centerX?: number;
  centerY?: number;
}

interface AnalyzeDrawingRequest {
  imageUrls: string[];
  projectId?: number;
  scale?: string;
  userSelections?: UserSelection[];
}

type Confidence = "high" | "medium" | "low";

function normalizeConfidence(value: unknown): Confidence {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "low";
}

function normalizePositions(value: unknown): number[][] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) =>
      Array.isArray(entry) && entry.length >= 2
        ? [Number(entry[0] ?? 0), Number(entry[1] ?? 0)]
        : null
    )
    .filter((entry): entry is number[] => Array.isArray(entry));
}

function normalizeGroup(value: unknown): {
  count: number;
  positions: number[][];
  locations: string[];
  confidence: Confidence;
} {
  const obj = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    count: Number(obj.count ?? 0) || 0,
    positions: normalizePositions(obj.positions),
    locations: Array.isArray(obj.locations)
      ? obj.locations.filter((x): x is string => typeof x === "string")
      : [],
    confidence: normalizeConfidence(obj.confidence),
  };
}

function extractFirstJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;

    if (depth === 0) {
      return raw.slice(start, i + 1);
    }
  }

  return null;
}

function normalizeParsedDrawing(value: unknown): Record<string, unknown> {
  const obj = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const floorsRaw = Array.isArray(obj.floors) ? obj.floors : [];
  const floors = floorsRaw.map((floor, index) => {
    const floorObj =
      floor && typeof floor === "object"
        ? (floor as Record<string, unknown>)
        : ({} as Record<string, unknown>);
    return {
      name:
        typeof floorObj.name === "string" && floorObj.name.trim()
          ? floorObj.name
          : `Plan ${index + 1}`,
      pageIndex: Number(floorObj.pageIndex ?? index) || index,
      aspectRatio: Number(floorObj.aspectRatio ?? 1.4) || 1.4,
      pipeSegments: Array.isArray(floorObj.pipeSegments) ? floorObj.pipeSegments : [],
      sprinklerHeads: normalizeGroup(floorObj.sprinklerHeads),
      smokeAlarms: normalizeGroup(floorObj.smokeAlarms),
      otherEquipment: Array.isArray(floorObj.otherEquipment) ? floorObj.otherEquipment : [],
    };
  });

  return {
    summary: typeof obj.summary === "string" ? obj.summary : "",
    floors,
    pipeSegments: Array.isArray(obj.pipeSegments) ? obj.pipeSegments : [],
    sprinklerHeads: normalizeGroup(obj.sprinklerHeads),
    smokeAlarms: normalizeGroup(obj.smokeAlarms),
    otherEquipment: Array.isArray(obj.otherEquipment) ? obj.otherEquipment : [],
    materials: Array.isArray(obj.materials) ? obj.materials : [],
    uncertainties: Array.isArray(obj.uncertainties) ? obj.uncertainties : [],
  };
}

function parseAndNormalizeDrawingResponse(raw: string): {
  parsed: Record<string, unknown> | null;
  parseWarnings: string[];
} {
  const parseWarnings: string[] = [];
  const rawTrimmed = raw.trim();
  const primaryCandidate =
    rawTrimmed.startsWith("{") && rawTrimmed.endsWith("}")
      ? rawTrimmed
      : extractFirstJsonObject(rawTrimmed);

  if (!primaryCandidate) {
    parseWarnings.push("No JSON object found in model response.");
    return { parsed: null, parseWarnings };
  }

  try {
    const parsed = JSON.parse(primaryCandidate) as Record<string, unknown>;
    return { parsed: normalizeParsedDrawing(parsed), parseWarnings };
  } catch {
    parseWarnings.push("Detected JSON-like content but JSON.parse failed.");
    return { parsed: null, parseWarnings };
  }
}

function buildDrawingAnalysisPrompt(scale?: string, userSelections?: UserSelection[]): string {
  const scaleSection =
    scale && scale.trim()
      ? `

**IMPORTANT - DRAWING SCALE:** The user has specified this scale: "${scale.trim()}"

You MUST use this scale when reporting pipe lengths:
- PREFER dimensions that are explicitly labeled on the drawing over visual estimation. Use only labeled values when available.
- Convert labeled dimensions to real-world feet using the scale. Examples: 1" = 10'-0" means 1 inch on paper = 10 feet; 1:100 = 1 unit = 100 units real.
- Report all pipe lengths in real-world feet (e.g. "45 ft", "12.5 ft"). Include "ft" in every length value.
- Do NOT guess or estimate lengths. If no dimension is labeled, omit that segment or set confidence to "low" and note "not labeled".
- If scale is NTS (not to scale), report lengths as drawn and note "scale uncertain" in notes.`
      : "";

  const userSelectionsSection =
    userSelections && userSelections.length > 0
      ? `

**USER-PROVIDED REGIONS (use these to guide your analysis):**
The user has selected and identified these regions on the drawing. Use them as examples to find similar elements elsewhere and to inform your interpretation:
${userSelections
  .map(
    (s) =>
      `- ${s.elementType}${s.notes ? ` (${s.notes})` : ""} on ${s.floorName}: center ~${Math.round(s.centerX ?? 0)}%, ${Math.round(s.centerY ?? 0)}%`
  )
  .join("\n")}
`
      : "";

  return `Analyze these fire protection system drawings/diagrams.
${scaleSection}${userSelectionsSection}

Extract and identify the following, based on standard NFPA/fire protection conventions:

1. **Pipe lengths by diameter** – Line width often indicates pipe size (thicker = larger diameter).
   Look for: 2" pipe, 1-1/2" pipe, 1" pipe, etc. Use ONLY dimensions explicitly labeled on the drawing. Convert to real-world feet using the scale. Do not estimate.

2. **Sprinkler heads** – Standard sprinkler symbols (typically circles with cross or droplet iconography).
   Count and note locations if labeled.

3. **Smoke alarms/detectors** – Standard symbols (typically “D” shape or rectangle with indicator).
   Count and note locations.

4. **Other fire protection equipment** – Pull stations, horns, strobes, standpipes, FDC, etc.

5. **Materials** – Extract material callouts from the drawing: pipe materials (steel, CPVC, copper, galvanized, etc.), sprinkler head types, valve materials, insulation specs, drywall/sheetrock thickness, and any material schedules or legends. Add a top-level "materials" array: [{ "type": "pipe", "spec": "2\\" steel", "quantity": "45 ft", "notes": "main feed" }, ...].

Consider:
- **Line width** = pipe diameter (NFPA plans often use line weight for pipe size)
- **Color** = fire lines often red; domestic/cold gray
- **Symbols** = NFPA 170, NFPA 13/13R/13D symbol standards

**SPATIAL POSITIONS (required):** For each floor, you MUST provide positions so the drawing can be recreated as a schematic. Use normalized coordinates 0–100 (percentage of image width/height; origin top-left, x=right, y=down).
- **pipeSegments:** each segment MUST have "path": [[x1,y1],[x2,y2],...] — the polyline tracing that pipe run across the drawing. One segment can have 2+ points (e.g. main feed with bends). Use the approximate centerline of each pipe.
- **sprinklerHeads:** MUST have "positions": [[x,y],[x,y],...] — one [x,y] per sprinkler head, at the symbol center.
- **smokeAlarms:** MUST have "positions": [[x,y],...] — one [x,y] per smoke alarm.
- **otherEquipment:** each item MUST have "positions": [[x,y],...] — one [x,y] per unit of that type.
- **aspectRatio:** each floor MUST have "aspectRatio": number (e.g. 1.4 for 8.5x11) — width/height of the drawing as shown.

Return a structured JSON object with this exact structure (no markdown, no code block wrapper):

{
  "summary": "Brief 1-2 sentence overview of what the drawing shows",
  "floors": [
    {
      "name": "Basement",
      "pageIndex": 0,
      "aspectRatio": 1.4,
      "pipeSegments": [{ "diameter": "2\\"", "length": "45 ft", "notes": "main feed", "path": [[10,50],[40,50],[40,30]], "confidence": "high|medium|low" }],
      "sprinklerHeads": { "count": 12, "positions": [[20,20],[35,20],[50,20],...], "locations": [], "confidence": "high|medium|low" },
      "smokeAlarms": { "count": 4, "positions": [[15,80],[85,80],...], "locations": [], "confidence": "high|medium|low" },
      "otherEquipment": [{ "type": "pull station", "count": 2, "positions": [[5,50],[95,50]], "notes": "..." }]
    }
  ],
  "pipeSegments": [],
  "sprinklerHeads": { "count": 0, "positions": [], "locations": [], "confidence": "low" },
  "smokeAlarms": { "count": 0, "positions": [], "locations": [], "confidence": "low" },
  "otherEquipment": [],
  "materials": [{ "type": "pipe", "spec": "2\\" steel", "quantity": "45 ft", "notes": "main feed" }],
  "uncertainties": []
}

**IMPORTANT - floors array:** When multiple images/pages are provided, return one floor object per image. Use pageIndex 0, 1, 2... and name each (e.g. "Basement", "1st Floor", "2nd Floor"). When only one image, return a single floor with name "Plan" or the floor name if visible. Put all equipment counts, pipe segments, and their positions in the floor object, not at top level.

**Consistency:** Be conservative. Only include items you can clearly identify. Use the knowledge base context if provided—it may contain user corrections or project-specific guidance.
If the image is not a fire protection drawing (e.g., floor plan without sprinklers), say so in summary and return empty arrays.
Return ONLY valid JSON.`;
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

    const body: AnalyzeDrawingRequest = await request.json();
    const { imageUrls, projectId, scale, userSelections } = body;

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

    const prompt = buildDrawingAnalysisPrompt(scale, userSelections);

    const agent = new UnifiedFireProtectionAgent(apiKey);
    const response = await agent.processQuery({
      message: prompt,
      images: urls,
      context: {
        projectId: projectId ?? undefined,
        temperature: 0, // Reduce randomness for consistent, reproducible results
      },
    });

    const { parsed, parseWarnings } = parseAndNormalizeDrawingResponse(response.content);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          rawResponse: response.content,
          parsed,
          parseWarnings,
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
