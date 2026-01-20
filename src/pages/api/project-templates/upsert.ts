import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { currentUser } = await checkAuth(cookies);
    if (!currentUser || currentUser.profile?.role !== "Admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { id, type, title, message, internal, markCompleted, orderIndex, enabled, companyName } = body;

    // Validate required fields
    if (!type || !title || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, title, message" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate type
    if (type !== "punchlist" && type !== "discussion") {
      return new Response(
        JSON.stringify({ error: "Type must be either 'punchlist' or 'discussion'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let result;

    if (id) {
      // Update existing template
      const { data, error } = await supabaseAdmin
        .from("projectItemTemplates")
        .update({
          type,
          title,
          message,
          internal: internal ?? false,
          markCompleted: markCompleted ?? false,
          orderIndex: orderIndex ?? 0,
          enabled: enabled ?? true,
          companyName: companyName || "CAPCo Fire",
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("[project-templates] Update error:", error);
        return new Response(JSON.stringify({ error: "Failed to update template" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      result = data;
    } else {
      // Create new template
      const { data, error } = await supabaseAdmin
        .from("projectItemTemplates")
        .insert({
          type,
          title,
          message,
          internal: internal ?? false,
          markCompleted: markCompleted ?? false,
          orderIndex: orderIndex ?? 0,
          enabled: enabled ?? true,
          companyName: companyName || "CAPCo Fire",
          createdBy: currentUser.id,
        })
        .select()
        .single();

      if (error) {
        console.error("[project-templates] Insert error:", error);
        return new Response(JSON.stringify({ error: "Failed to create template" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      result = data;
    }

    return new Response(
      JSON.stringify({ success: true, template: result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[project-templates] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
