import type { APIRoute } from "astro";

/**
 * NFPA 25 Wet Pipe Sprinkler Systems ITM form submission.
 * POST /api/nfpa25/wet-pipe-itm
 *
 * Receives form data from the multi-step Wet Pipe ITM form.
 * Extend this to persist to Supabase, generate PDF, or notify admins.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = typeof value === "string" ? value : (value as File).name ?? "";
    });

    // TODO: persist to Supabase (e.g. nfpa25_submissions or projects), generate PDF, or email
    console.log("[NFPA25] Wet Pipe ITM submission:", Object.keys(data));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Inspection form submitted successfully.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[NFPA25] Wet Pipe ITM submit error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to submit form",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
