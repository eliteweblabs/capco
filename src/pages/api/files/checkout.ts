import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Files CHECKOUT API
 *
 * Handles file checkout operations for version control
 *
 * POST Body:
 * - action: "checkout" | "checkin" | "cancel"
 * - fileId: number
 * - userId?: string (for checkout)
 * - assignedTo?: string (for checkout)
 * - notes?: string
 *
 * Example:
 * - POST /api/files/checkout { "action": "checkout", "fileId": 123, "userId": "456" }
 */

interface CheckoutData {
  action: "checkout" | "checkin" | "cancel";
  fileId: number;
  userId?: string;
  assignedTo?: string;
  notes?: string;
}

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

    const body = await request.json();
    const checkoutData: CheckoutData = body;

    // Validate required fields
    if (!checkoutData.action || !checkoutData.fileId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "action and fileId are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📁 [FILES-CHECKOUT] ${checkoutData.action} file:`, checkoutData.fileId);

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let result;

    switch (checkoutData.action) {
      case "checkout":
        if (!checkoutData.userId) {
          return new Response(JSON.stringify({ error: "User ID required for checkout" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Check if file is already checked out
        const { data: existingCheckout, error: checkoutError } = await supabaseAdmin
          .from("file_checkouts")
          .select("*")
          .eq("fileId", checkoutData.fileId)
          .eq("status", "checked_out")
          .single();

        if (checkoutError && checkoutError.code !== "PGRST116") {
          console.error("❌ [FILES-CHECKOUT] Error checking existing checkout:", checkoutError);
          return new Response(
            JSON.stringify({
              error: "Failed to check file status",
              details: checkoutError.message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        if (existingCheckout) {
          return new Response(
            JSON.stringify({
              error: "File is already checked out",
              details: `File is currently checked out by ${existingCheckout.checkedOutBy}`,
            }),
            { status: 409, headers: { "Content-Type": "application/json" } }
          );
        }

        // Create checkout record
        const { data: newCheckout, error: createError } = await supabaseAdmin
          .from("file_checkouts")
          .insert([
            {
              fileId: checkoutData.fileId,
              checkedOutBy: checkoutData.userId,
              assignedTo: checkoutData.assignedTo || checkoutData.userId,
              notes: checkoutData.notes || null,
              status: "checked_out",
              checkedOutAt: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (createError) {
          console.error("❌ [FILES-CHECKOUT] Error creating checkout:", createError);
          return new Response(
            JSON.stringify({
              error: "Failed to checkout file",
              details: createError.message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        result = {
          success: true,
          message: "File checked out successfully",
          checkout: newCheckout,
        };
        break;

      case "checkin":
        // Update checkout status to checked in
        const { data: checkinResult, error: checkinError } = await supabaseAdmin
          .from("file_checkouts")
          .update({
            status: "checked_in",
            checkedInAt: new Date().toISOString(),
            notes: checkoutData.notes || null,
          })
          .eq("fileId", checkoutData.fileId)
          .eq("status", "checked_out")
          .select()
          .single();

        if (checkinError) {
          console.error("❌ [FILES-CHECKOUT] Error checking in file:", checkinError);
          return new Response(
            JSON.stringify({
              error: "Failed to check in file",
              details: checkinError.message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        if (!checkinResult) {
          return new Response(
            JSON.stringify({
              error: "File is not currently checked out",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        result = {
          success: true,
          message: "File checked in successfully",
          checkout: checkinResult,
        };
        break;

      case "cancel":
        // Cancel checkout
        const { data: cancelResult, error: cancelError } = await supabaseAdmin
          .from("file_checkouts")
          .update({
            status: "cancelled",
            cancelledAt: new Date().toISOString(),
            notes: checkoutData.notes || null,
          })
          .eq("fileId", checkoutData.fileId)
          .eq("status", "checked_out")
          .select()
          .single();

        if (cancelError) {
          console.error("❌ [FILES-CHECKOUT] Error cancelling checkout:", cancelError);
          return new Response(
            JSON.stringify({
              error: "Failed to cancel checkout",
              details: cancelError.message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        if (!cancelResult) {
          return new Response(
            JSON.stringify({
              error: "File is not currently checked out",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        result = {
          success: true,
          message: "File checkout cancelled successfully",
          checkout: cancelResult,
        };
        break;

      default:
        return new Response(
          JSON.stringify({
            error: "Invalid action",
            details: "Action must be 'checkout', 'checkin', or 'cancel'",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    console.log(`✅ [FILES-CHECKOUT] ${checkoutData.action} completed successfully`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [FILES-CHECKOUT] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
