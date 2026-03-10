import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * POST /api/log/form-failure
 *
 * Records client-side form submission failures for monitoring and admin review.
 * Called by formFailureLog() in debug-logger.ts when a form fails to submit.
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      formId?: string;
      formAction?: string;
      error: string;
      statusCode?: number;
      context?: Record<string, unknown>;
      userAgent?: string;
    };

    if (!body?.error || typeof body.error !== "string") {
      return new Response(JSON.stringify({ success: false, error: "Missing or invalid error" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Logging not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error } = await supabaseAdmin.from("formFailureLogs").insert({
      formId: body.formId ?? null,
      formAction: body.formAction ?? null,
      error: body.error,
      statusCode: body.statusCode ?? null,
      context: body.context ?? null,
      userAgent: body.userAgent ?? null,
    });

    if (error) {
      console.error("[FORM-FAILURE-LOG] Supabase insert error:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[FORM-FAILURE-LOG] API error:", e);
    return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
