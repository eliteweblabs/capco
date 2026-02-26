import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import {
  createSuperAdminToken,
  setSuperAdminCookie,
  type SuperAdminPayload,
} from "../../../lib/superadmin";

/**
 * POST /api/superadmin/activate
 * Body: { passphrase: string }
 * Sets SuperAdmin cookie if passphrase matches SUPERADMIN_SECRET and user is logged in.
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
    const passphrase = typeof body.passphrase === "string" ? body.passphrase : "";

    const secret =
      import.meta.env?.SUPERADMIN_SECRET ?? process.env?.SUPERADMIN_SECRET;
    if (!secret) {
      return new Response(
        JSON.stringify({ success: false, error: "SuperAdmin not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    if (passphrase !== secret) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid passphrase" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload: SuperAdminPayload | null = createSuperAdminToken(currentUser.id);
    if (!payload) {
      return new Response(
        JSON.stringify({ success: false, error: "Could not create token" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    setSuperAdminCookie(cookies, payload);

    return new Response(
      JSON.stringify({ success: true, message: "SuperAdmin activated" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[superadmin/activate]", e);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
