import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { getValidSuperAdminFromCookie, createSuperAdminToken } from "../../../lib/superadmin";

/**
 * GET /api/superadmin/export
 * Returns a SuperAdmin token payload (signed) that can be saved and re-imported later.
 * Caller must already have a valid SuperAdmin cookie (or we could require passphrase to generate fresh - for now require active session).
 */
export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser?.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const hasCookie = getValidSuperAdminFromCookie(cookies, currentUser.id);
    const payload = createSuperAdminToken(currentUser.id);

    if (!payload) {
      return new Response(
        JSON.stringify({ success: false, error: "SuperAdmin not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        payload,
        token: JSON.stringify(payload),
        message: hasCookie
          ? "Save this token to re-import later"
          : "Token generated; set SUPERADMIN_SECRET to activate via passphrase first",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[superadmin/export]", e);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
