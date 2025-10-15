import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const { isAuth, currentUser, currentRole } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // First, verify the project exists and currentUser has access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, authorId, title")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check permissions - currentUser must own the project or be admin/staff
    const hasAccess =
      project.authorId === currentUser.id || ["Admin", "Staff"].includes(currentRole || "");

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Look for a proposal invoice for this project
    const { data: proposalInvoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, subject, status")
      .eq("projectId", projectId)
      .eq("status", "proposal")
      .single();

    if (invoiceError && invoiceError.code !== "PGRST116") {
      // PGRST116 means no rows found, which is okay
      console.error("Error finding proposal invoice:", invoiceError);
      return new Response(
        JSON.stringify({
          error: "Failed to find proposal invoice",
          details: invoiceError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        subject: proposalInvoice?.subject || null,
        hasProposalInvoice: !!proposalInvoice,
        invoiceId: proposalInvoice?.id || null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get proposal subject error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
