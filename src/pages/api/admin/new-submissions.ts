/**
 * Admin New Submissions API
 * GET /api/admin/new-submissions?since=ISO_TIMESTAMP
 *
 * Returns recent contact form submissions and MEP project submissions
 * for admin voice-assistant notifications. Admin-only.
 */

import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    const currentRole = currentUser?.profile?.role;

    if (!isAuth || !currentUser || currentRole !== "Admin") {
      return new Response(JSON.stringify({ success: false, error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sinceParam = url.searchParams.get("since");
    const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sinceIso = since.toISOString();

    const [contactResult, mepResult] = await Promise.all([
      supabaseAdmin
        .from("contactSubmissions")
        .select("id, firstName, lastName, email, company, message, submittedAt, createdAt")
        .gte("submittedAt", sinceIso)
        .order("submittedAt", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("projects")
        .select("id, title, address, authorId, createdAt")
        .gte("createdAt", sinceIso)
        .ilike("title", "MEP Project -%")
        .order("createdAt", { ascending: false })
        .limit(20),
    ]);

    const mepProjects = (mepResult.data || []) as Array<{
      id: number;
      title: string;
      address: string;
      authorId: string;
      createdAt: string;
    }>;
    const authorIds = [...new Set(mepProjects.map((p) => p.authorId))];
    const { data: profiles } =
      authorIds.length > 0
        ? await supabaseAdmin.from("profiles").select("id, name").in("id", authorIds)
        : { data: [] };
    const profileMap = new Map((profiles || []).map((r: any) => [r.id, r.name || "Unknown"]));
    const mepWithNames = mepProjects.map((p) => ({
      ...p,
      clientName: profileMap.get(p.authorId) || "Unknown",
    }));

    const contactError = contactResult.error;
    const mepError = mepResult.error;

    if (contactError) {
      console.warn("[---ADMIN-NEW-SUBMISSIONS] contactSubmissions error:", contactError.message);
    }
    if (mepError) {
      console.warn("[---ADMIN-NEW-SUBMISSIONS] projects (MEP) error:", mepError.message);
    }

    const contactSubmissions = contactResult.data || [];
    console.log("[---ADMIN-NEW-SUBMISSIONS] GET", {
      since: sinceIso,
      contactCount: contactSubmissions.length,
      mepCount: mepWithNames.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        contactSubmissions,
        mepProjects: mepWithNames,
        since: sinceIso,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[---ADMIN-NEW-SUBMISSIONS] Error:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
