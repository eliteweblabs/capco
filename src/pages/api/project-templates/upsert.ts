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
    const { id, type, title, message, internal, markCompleted, orderIndex, enabled, companyName } =
      body;

    console.log("[project-templates] Request body:", JSON.stringify(body, null, 2));

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

    // Use upsert pattern - check if exists first, then upsert
    // This avoids errors and handles both create/update cases safely

    let existingTemplate = null;

    if (id) {
      // Check by id for updates
      const { data } = await supabaseAdmin
        .from("projectItemTemplates")
        .select("id")
        .eq("id", id)
        .maybeSingle();
      existingTemplate = data;
    } else {
      // Check by unique constraint for new templates (avoid duplicates)
      const { data } = await supabaseAdmin
        .from("projectItemTemplates")
        .select("id")
        .eq("type", type)
        .eq("title", title)
        .eq("companyName", companyName || "CAPCo Fire")
        .maybeSingle();
      existingTemplate = data;
    }

    const templateData: any = {
      type,
      title,
      message,
      internal: internal ?? false,
      markCompleted: markCompleted ?? false,
      orderIndex: orderIndex ?? 0,
      enabled: enabled ?? true,
      companyName: companyName || "CAPCo Fire",
    };

    // If template exists, include id for update; otherwise set createdBy for new record
    if (existingTemplate || id) {
      templateData.id = existingTemplate?.id || id;
    } else {
      templateData.createdBy = currentUser.id;
    }

    // Upsert: automatically inserts if not exists, updates if exists (based on id)
    const { data, error } = await supabaseAdmin
      .from("projectItemTemplates")
      .upsert(templateData, {
        onConflict: "id", // Use primary key for conflict resolution
      })
      .select()
      .single();

    if (error) {
      console.error("[project-templates] Upsert error:", error);
      return new Response(
        JSON.stringify({
          error: existingTemplate || id ? "Failed to update template" : "Failed to create template",
          details: error.message || error.code || "Unknown database error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = data;

    return new Response(JSON.stringify({ success: true, template: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[project-templates] Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
