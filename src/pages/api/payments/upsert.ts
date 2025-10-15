import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Payments UPSERT API
 * Creates or updates payment records
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const {
      id,
      invoiceId,
      projectId,
      amount,
      paymentMethod,
      paymentReference,
      notes,
      paymentDate,
      status = "COMPLETED",
    } = body;

    // Validate required fields
    if (!invoiceId || !amount || !paymentMethod) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: invoiceId, amount, paymentMethod",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate amount is positive
    if (parseFloat(amount) <= 0) {
      return new Response(
        JSON.stringify({
          error: "Amount must be greater than 0",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if user has permission to create/update payments
    const userRole = currentUser.profile?.role;
    if (userRole === "Client") {
      // Clients can only create payments for their own projects
      // Check if the invoice belongs to a project they own
      const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from("invoices")
        .select("projectId, projects!inner(authorId)")
        .eq("id", invoiceId)
        .single();

      if (invoiceError || !invoice) {
        return new Response(
          JSON.stringify({
            error: "Invoice not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (invoice.projects.authorId !== currentUser.id) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized to create payments for this invoice",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    const paymentData = {
      invoiceId: parseInt(invoiceId),
      projectId: projectId ? parseInt(projectId) : null,
      amount: parseFloat(amount),
      paymentMethod,
      paymentReference: paymentReference || null,
      notes: notes || null,
      paymentDate: paymentDate || new Date().toISOString().split("T")[0],
      status,
      createdBy: currentUser.id,
      updatedAt: new Date().toISOString(),
    };

    let result;
    let isUpdate = false;

    if (id) {
      // Update existing payment
      const { data: existingPayment, error: fetchError } = await supabaseAdmin
        .from("payments")
        .select("id, createdBy")
        .eq("id", id)
        .single();

      if (fetchError || !existingPayment) {
        return new Response(
          JSON.stringify({
            error: "Payment not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Check permissions for update
      if (userRole === "Client" && existingPayment.createdBy !== currentUser.id) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized to update this payment",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const { data: updatedPayment, error: updateError } = await supabaseAdmin
        .from("payments")
        .update(paymentData)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating payment:", updateError);
        return new Response(
          JSON.stringify({
            error: "Failed to update payment",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      result = updatedPayment;
      isUpdate = true;
    } else {
      // Create new payment
      const { data: newPayment, error: createError } = await supabaseAdmin
        .from("payments")
        .insert({
          ...paymentData,
          createdAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating payment:", createError);
        return new Response(
          JSON.stringify({
            error: "Failed to create payment",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      result = newPayment;
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: result,
        message: isUpdate ? "Payment updated successfully" : "Payment created successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in payments upsert API:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
