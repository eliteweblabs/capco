import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Payments DELETE API
 * Deletes payment records with proper authorization
 */
export const DELETE: APIRoute = async ({ request, cookies }) => {
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

    // Get the request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(JSON.stringify({ error: "Invalid request body format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { paymentId } = requestBody;

    if (!paymentId) {
      console.error("Payment ID is required");
      return new Response(JSON.stringify({ error: "Payment ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert paymentId to number if it's a string
    const paymentIdNum = typeof paymentId === "string" ? parseInt(paymentId, 10) : paymentId;

    if (isNaN(paymentIdNum)) {
      console.error("Invalid payment ID:", paymentId);
      return new Response(JSON.stringify({ error: "Invalid payment ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Payment ID:", paymentIdNum);

    // Check if payment exists and user has permission to delete it
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("id, createdBy, invoiceId, amount, paymentMethod")
      .eq("id", paymentIdNum)
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found:", paymentError);
      return new Response(JSON.stringify({ error: "Payment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check user's role and permissions
    const userRole = currentUser.profile?.role;
    const canDelete =
      userRole === "Admin" || userRole === "Staff" || payment.createdBy === currentUser.id;

    if (!canDelete) {
      console.error("Unauthorized to delete this payment");
      return new Response(JSON.stringify({ error: "Unauthorized to delete this payment" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete the payment
    console.log("Deleting payment...");
    const { error: deleteError } = await supabaseAdmin
      .from("payments")
      .delete()
      .eq("id", paymentIdNum);

    if (deleteError) {
      console.error("Failed to delete payment:", deleteError);
      return new Response(
        JSON.stringify({
          error: `Failed to delete payment: ${deleteError.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Payment deleted successfully");

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment has been deleted successfully",
        deletedPayment: {
          id: payment.id,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in delete-payment API:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to delete payment. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
