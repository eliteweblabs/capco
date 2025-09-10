import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser, role } = await checkAuth(cookies);
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

    const { projectId, subject } = await request.json();

    if (!projectId || subject === undefined) {
      return new Response(JSON.stringify({ error: "Project ID and subject are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate subject length
    if (subject.length > 200) {
      return new Response(JSON.stringify({ error: "Subject must be 200 characters or less" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // First, verify the project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, author_id, title")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check permissions - user must own the project or be admin/staff
    const hasAccess = project.author_id === user.id || ["Admin", "Staff"].includes(role);

    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Since subject is in invoices table, we need to find or create a "proposal invoice" for this project
    // console.log("Looking for existing proposal invoice for project:", projectId);

    // First, check if there's already a "proposal" type invoice for this project
    const { data: existingInvoice, error: findError } = await supabase
      .from("invoices")
      .select("id, subject, status")
      .eq("project_id", projectId)
      .eq("status", "proposal") // Assuming "proposal" is a status type
      .single();

    // console.log("Existing proposal invoice search:", { existingInvoice, findError });

    let invoiceId;
    let updatedInvoice;
    let updateError;

    if (existingInvoice) {
      // Update existing proposal invoice
      invoiceId = existingInvoice.id;
      // console.log("Updating existing proposal invoice:", invoiceId);

      const result = await supabase
        .from("invoices")
        .update({
          subject: subject.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId)
        .select("id, subject, status")
        .single();

      updatedInvoice = result.data;
      updateError = result.error;
    } else if (findError?.code === "PGRST116") {
      // No proposal invoice exists, create one
      // console.log("Creating new proposal invoice for project:", projectId);

      const result = await supabase
        .from("invoices")
        .insert({
          project_id: projectId,
          subject: subject.trim() || null,
          status: "proposal",
          total_amount: 0.0,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id, subject, status")
        .single();

      updatedInvoice = result.data;
      updateError = result.error;
      invoiceId = result.data?.id;
    } else {
      // Database error occurred
      console.error("Error finding proposal invoice:", findError);
      return new Response(
        JSON.stringify({
          error: "Failed to find or create proposal invoice",
          details: findError?.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // console.log("Invoice update result:", { updatedInvoice, updateError, invoiceId });

    if (updateError) {
      console.error("Error updating proposal subject:", updateError);
      // Check if it's a column missing error
      if (updateError.message?.includes("subject") || updateError.code === "42703") {
        return new Response(
          JSON.stringify({
            error: "Database column 'subject' not found in invoices table",
            details: "Please ensure the 'subject' column exists in the invoices table",
            migration_required: true,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Failed to update proposal subject",
          details: updateError.message,
          code: updateError.code,
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
        invoice: updatedInvoice,
        invoiceId: invoiceId,
        message: "Proposal subject updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Update proposal subject error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
