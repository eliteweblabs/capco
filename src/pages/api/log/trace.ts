import type { APIRoute } from "astro";
import { SimpleProjectLogger } from "../../../lib/simple-logging";

interface TracePayload {
  phase?: "start" | "end" | "error";
  traceId?: string;
  name?: string;
  durationMs?: number;
  payload?: Record<string, unknown>;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as TracePayload;
    const phase = body.phase || "start";
    const traceId = body.traceId || "unknown-trace";
    const name = body.name || "unknown";

    const message =
      phase === "end"
        ? `[TRACE][end] ${name} (${traceId}) ${body.durationMs ?? 0}ms`
        : phase === "error"
          ? `[TRACE][error] ${name} (${traceId}) ${body.durationMs ?? 0}ms`
          : `[TRACE][start] ${name} (${traceId})`;

    await SimpleProjectLogger.addLogEntry(0, phase === "error" ? "error" : "systemEvent", message, {
      trace: true,
      phase,
      traceId,
      name,
      durationMs: body.durationMs ?? null,
      payload: body.payload ?? null,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[TRACE-LOG] API error:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
