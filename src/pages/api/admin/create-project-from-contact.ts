/**
 * Admin: Create project from a contact form submission
 * POST /api/admin/create-project-from-contact
 * Body: { submissionId: number }
 *
 * Loads the contact submission, finds or creates the client (profile),
 * and creates a project. Admin-only.
 */

import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const internalSecret = request.headers.get("X-Internal-Secret");
    const expectedSecret =
      import.meta.env.INTERNAL_WEBHOOK_SECRET || import.meta.env.VAPI_WEBHOOK_SECRET;
    const isInternalCall = expectedSecret && internalSecret === expectedSecret;

    if (!isInternalCall) {
      const { isAuth, currentUser } = await checkAuth(cookies);
      if (!isAuth || !currentUser || currentUser?.profile?.role !== "Admin") {
        return new Response(
          JSON.stringify({ success: false, error: "Admin access required" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Database not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const submissionId = body.submissionId != null ? Number(body.submissionId) : null;
    console.log("[---ADMIN-CREATE-PROJECT-CONTACT] POST", { submissionId, isInternalCall });

    if (!submissionId || !Number.isInteger(submissionId)) {
      return new Response(
        JSON.stringify({ success: false, error: "submissionId (integer) required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: sub, error: subError } = await supabaseAdmin
      .from("contactSubmissions")
      .select("id, firstName, lastName, email, phone, company, address, message, submittedAt")
      .eq("id", submissionId)
      .single();

    if (subError || !sub) {
      return new Response(
        JSON.stringify({ success: false, error: "Contact submission not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const userEmail = (sub.email || "").trim().toLowerCase();
    const firstName = sub.firstName || "";
    const lastName = sub.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim() || "Contact";
    const userPhone = sub.phone || null;

    let userId: string;

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, name, phone")
      .eq("email", userEmail)
      .single();

    if (existingProfile) {
      userId = existingProfile.id;
      if (fullName || userPhone) {
        await supabaseAdmin
          .from("profiles")
          .update({
            ...(fullName && { name: fullName }),
            ...(userPhone && { phone: userPhone }),
          })
          .eq("id", userId);
      }
    } else {
      const tempPassword = Math.random().toString(36).slice(-12) + "Aa1!";
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        password: tempPassword,
        email_confirm: false,
        user_metadata: {
          firstName,
          lastName,
          full_name: fullName,
          phone: userPhone,
          source: "contact-form-admin",
        },
      });

      if (authError) {
        console.error("[---ADMIN-CREATE-PROJECT-CONTACT] createUser error:", authError);
        return new Response(
          JSON.stringify({ success: false, error: authError.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      userId = authData.user.id;
      await supabaseAdmin.from("profiles").insert({
        id: userId,
        email: userEmail,
        name: fullName,
        phone: userPhone,
        role: "Client",
      });
    }

    const cleanedAddress = (sub.address || "").replace(/,\s*USA$/i, "").trim() || "No address";
    const projectData = {
      authorId: userId,
      address: cleanedAddress,
      title: `Contact - ${fullName} - ${cleanedAddress}`.slice(0, 255),
      status: 1,
    };

    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .insert(projectData)
      .select()
      .single();

    if (projectError) {
      console.error("[---ADMIN-CREATE-PROJECT-CONTACT] project insert error:", projectError);
      return new Response(
        JSON.stringify({ success: false, error: projectError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[---ADMIN-CREATE-PROJECT-CONTACT] success", { projectId: project.id, title: project.title, createdNewUser: !existingProfile });
    return new Response(
      JSON.stringify({
        success: true,
        project: { id: project.id, title: project.title, authorId: project.authorId },
        clientExists: !!existingProfile,
        createdNewUser: !existingProfile,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[---ADMIN-CREATE-PROJECT-CONTACT] Error:", e);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
