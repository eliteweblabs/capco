import type { APIRoute } from "astro";
import { clearSuperAdminCookie } from "../../../lib/superadmin";

/**
 * POST /api/superadmin/deactivate
 * Clears the SuperAdmin cookie.
 */
export const POST: APIRoute = async ({ cookies }) => {
  try {
    clearSuperAdminCookie(cookies);
    return new Response(
      JSON.stringify({ success: true, message: "SuperAdmin deactivated" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[superadmin/deactivate]", e);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
