/**
 * POST /api/drawing-analyzer/analyze-metadata
 * Accepts a base64-encoded JPEG of a fire protection drawing and returns
 * a rich narrative summary extracted via Claude Vision.
 * Must be called on the ORIGINAL rendered image before any layer extraction.
 *
 * Tries models in capability order; falls back if a model is unavailable.
 */

import type { APIRoute } from "astro";

// Accuracy-first order: strongest vision model first (best at reading small title-block
// text → far less hallucination), cheaper models only as fallback if it's unavailable
// (the loop below falls through on 404/not_found). Per-call cost is small because we
// send ONE downscaled image, and the call only fires on an explicit user click — so this
// can't run up a background bill.
const VISION_MODELS = [
  "claude-opus-4-5",
  "claude-3-opus-20240229",
  "claude-3-haiku-20240307",
] as const;

const PROMPT = `You are analyzing a fire protection / life-safety sprinkler system drawing (CAD/PDF format).

CRITICAL ACCURACY RULES — read before answering:
- Transcribe ONLY text that is literally legible in THIS image. This is a transcription task, not a knowledge task.
- NEVER infer, guess, complete, autocorrect, or fill in any value from outside/world knowledge or from what is "typical" for such drawings.
- You have NO prior knowledge of any firm, address, phone number, license number, or project. If a value is not clearly readable in the image, you do not know it.
- The image is downscaled, so small title-block text is frequently UNREADABLE. When in doubt, leave it out. A shorter, fully-accurate summary is far better than a complete-looking one with fabricated details.

ABSOLUTE BANS — these are never worth the risk of hallucination, so NEVER output them under any circumstances, even if you think you can read them:
- NO street addresses, suite numbers, city/state/ZIP.
- NO phone, fax, or email.
- NO stamp/license/registration numbers.
If you find yourself about to write any of the above, omit it entirely. Do not include a "designer/engineer" or "company" bullet unless the firm/person name is unmistakably legible — and if you include it, give the NAME ONLY, with zero contact details.

Respond with ONLY a valid JSON object — no markdown fences, no explanation, just the raw JSON.
The object must have exactly two keys:

1. "summary" — a rich markdown narrative (use **bold headers**, bullet points) covering:
   - Project Overview: building/project name, occupancy, scale, floor depicted (NO addresses, NO phone numbers — see ABSOLUTE BANS)
   - System Design: system type, sprinkler head type & K-factor, design method, density/flow, water supply, pipe materials
   - Key Notes & Compliance: NFPA edition, state/local code, AHJ/fire dept submissions, special conditions (do NOT output license/registration numbers)
   - Sheet Details: sheet number, date/revision, panels on sheet
   Include a bullet ONLY when you can actually read its source text in the image. Omit any field you cannot read — do not write "not specified" guesses and do not fabricate. Skip an entire section if its text is absent or illegible.

2. "schedule" — null if the drawing has NO symbol/sprinkler schedule or head list at all.
   If ANY table, schedule, or list of sprinkler heads/devices is present, return it — even if
   some or all count values are missing.  Count values may appear as:
     - A dedicated CNT or QTY column in a table
     - A number written next to or below the symbol on the plan
     - A note such as "22 HEADS", "TOTAL: 54", "(4) SPRINKLERS"
     - A quantity listed elsewhere in the title block or general notes
   Search the ENTIRE drawing for count information; do not give up if the table column is blank.
   Return an array of objects, one per head type, with these keys (use null only if truly absent):
   {
     "sym": "symbol text or description",
     "count": <integer — search everywhere; null ONLY if absolutely no quantity found anywhere>,
     "position": "head position e.g. UPRIGHT, PENDANT, SIDEWALL",
     "finish": "finish e.g. BRASS, WHITE, CHROME",
     "temp": <integer temperature rating or null>,
     "k": <float K-factor or null>,
     "npt": "pipe thread size e.g. 1/2\\"",
     "mfg": "manufacturer name"
   }
   Include ONLY rows for sprinkler heads or suppression devices — skip pipe/legend rows.

3. "legend" — null if the drawing has NO symbol legend or key.
   If a LEGEND or KEY box is present (even without counts — just a visual key showing what each mark/symbol means),
   return an array of objects describing each entry:
   {
     "sym": "text representation of the symbol e.g. ⊗, ◄, filled circle, X, triangle, dashed line",
     "meaning": "what this symbol represents e.g. Upright Sprinkler Head, CPVC Pipe, Dry Pipe Valve",
     "category": "one of: sprinkler | pipe | valve | other"
   }
   Look for boxes labeled LEGEND, KEY, SYMBOL LIST, NOTES, or any table-like area that pairs a graphic mark with a text description.
   Include pipe line types (solid red = steel pipe, dashed = CPVC, etc.) as well as device symbols.
   This field is separate from "schedule" — a drawing may have both, one, or neither.

Example valid response (do not copy, just follow the structure):
{"summary":"**Project Overview**\\n- Building: ...\\n- Occupancy: ...","schedule":[{"sym":"⊗","count":22,"position":"Q/R UPRIGHT","finish":"BRASS","temp":155,"k":5.60,"npt":"1/2\\"","mfg":"RELIABLE"}],"legend":[{"sym":"⊗","meaning":"Upright Sprinkler Head","category":"sprinkler"},{"sym":"solid red line","meaning":"Black Steel Pipe","category":"pipe"}]}`;

// Final safety net: even if the model ignores the prompt, strip any summary line that
// looks like a street address, phone/fax/email, state+ZIP, or license/identity field.
// Dropping whole bullets (rather than redacting substrings) avoids leaving mangled text.
function scrubSensitive(text: string): string {
  if (!text) return text;
  const PHONE = /\(?\b\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}\b/;
  const EMAIL = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/;
  const ZIP = /\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/;
  const STREET =
    /\b\d{1,6}\s+[A-Za-z0-9.][A-Za-z0-9.\s]*\b(?:ST|STREET|AVE|AVENUE|RD|ROAD|BLVD|BOULEVARD|DR|DRIVE|LN|LANE|WAY|CT|COURT|PKWY|PARKWAY|HWY|HIGHWAY|SUITE|STE|CIRCLE|PLACE|TERRACE)\b/i;
  const IDENTITY =
    /^[\s>*\-•]*\**\s*(address|designer|engineer|architect|prepared by|company|firm|phone|tel|telephone|fax|email|e-mail|license|licence|registration|reg\.?\s*no|stamp)\b/i;
  const kept = text.split(/\r?\n/).filter((line) => {
    const t = line.trim();
    if (!t) return true; // keep blank lines for spacing
    if (IDENTITY.test(t)) return false;
    if (PHONE.test(t) || EMAIL.test(t) || ZIP.test(t) || STREET.test(t)) return false;
    return true;
  });
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { imageData } = body as { imageData?: string };
    if (!imageData) {
      return new Response(JSON.stringify({ error: "imageData required" }), { status: 400 });
    }

    // Match other API routes + astro.config Vite `define` (loads .env via loadEnv).
    const apiKey = process.env.ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 503,
      });
    }

    const Anthropic = await import("@anthropic-ai/sdk");
    const client = new Anthropic.default({ apiKey });

    // Strip data-URL prefix if present
    const base64 = imageData.replace(/^data:image\/[^;]+;base64,/, "");

    let summary: string | null = null;
    let schedule: object[] | null = null;
    let legend: object[] | null = null;
    let lastError: string = "No models available";

    for (const model of VISION_MODELS) {
      try {
        const response = await client.messages.create({
          model,
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "base64", media_type: "image/jpeg", data: base64 },
                },
                { type: "text", text: PROMPT },
              ],
            },
          ],
        });
        const raw = response.content[0]?.type === "text" ? response.content[0].text.trim() : null;
        if (!raw) continue;

        // Claude may wrap JSON in a markdown fence — strip it
        const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        try {
          const parsed = JSON.parse(jsonText);
          summary  = typeof parsed.summary === "string" ? parsed.summary : null;
          schedule = Array.isArray(parsed.schedule) ? parsed.schedule : null;
          legend   = Array.isArray(parsed.legend)   ? parsed.legend   : null;
        } catch {
          // Fallback: treat the whole response as a plain narrative summary
          summary = raw;
          schedule = null;
        }

        if (summary) break;
      } catch (modelErr: any) {
        lastError = modelErr?.message ?? String(modelErr);
        const isNotFound =
          modelErr?.status === 404 ||
          (lastError.includes("not_found") || lastError.includes("model"));
        if (!isNotFound) throw modelErr;
        console.warn(`[analyze-metadata] model ${model} unavailable, trying next`);
      }
    }

    if (!summary) {
      return new Response(JSON.stringify({ error: lastError }), { status: 503 });
    }

    summary = scrubSensitive(summary);

    return new Response(JSON.stringify({ summary, schedule, legend }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[analyze-metadata] error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Unknown error" }), {
      status: 500,
    });
  }
};
