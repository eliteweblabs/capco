import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import {
  verifySuperAdminPayload,
  setSuperAdminCookie,
  type SuperAdminPayload,
} from "../../../lib/superadmin";

/**
 * POST /api/superadmin/import
 * Body: { payload: SuperAdminPayload } or { token: string } (JSON string of payload)
 * Verifies the payload signature and sets the SuperAdmin cookie for the current user if it matches.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser?.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json().catch(() => ({}));
    let payload: SuperAdminPayload | null = null;

    if (body.payload && typeof body.payload === "object") {
      payload = body.payload as SuperAdminPayload;
    } else if (typeof body.token === "string") {
      try {
        payload = JSON.parse(body.token) as SuperAdminPayload;
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid token format" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (!payload?.userId || !payload?.exp || !payload?.sig) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (payload.userId !== currentUser.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Token was created for a different user",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!verifySuperAdminPayload(payload)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    setSuperAdminCookie(cookies, payload);

    return new Response(
      JSON.stringify({ success: true, message: "SuperAdmin imported" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[superadmin/import]", e);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
