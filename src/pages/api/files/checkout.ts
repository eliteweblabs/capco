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

        // Check if file is already checked out (from files table columns)
        const { data: existingFile, error: fileCheckError } = await supabaseAdmin
          .from("files")
          .select("id, checkedOutBy, checkedOutAt")
          .eq("id", checkoutData.fileId)
          .single();

        if (fileCheckError) {
          console.error("❌ [FILES-CHECKOUT] Error checking file status:", fileCheckError);
          return new Response(
            JSON.stringify({
              error: "Failed to check file status",
              details: fileCheckError.message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        if (existingFile.checkedOutBy) {
          return new Response(
            JSON.stringify({
              error: "File is already checked out",
              details: `File is currently checked out`,
            }),
            { status: 409, headers: { "Content-Type": "application/json" } }
          );
        }

        // Update file record with checkout info
        const { data: checkedOutFile, error: checkoutError } = await supabaseAdmin
          .from("files")
          .update({
            checkedOutBy: checkoutData.userId,
            checkedOutAt: new Date().toISOString(),
            checkoutNotes: checkoutData.notes || null,
          })
          .eq("id", checkoutData.fileId)
          .select()
          .single();

        if (checkoutError) {
          console.error("❌ [FILES-CHECKOUT] Error checking out file:", checkoutError);
          return new Response(
            JSON.stringify({
              error: "Failed to checkout file",
              details: checkoutError.message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        result = {
          success: true,
          message: "File checked out successfully",
          file: checkedOutFile,
        };
        break;

      case "checkin":
        // Update file to clear checkout status
        const { data: checkinFile, error: checkinError } = await supabaseAdmin
          .from("files")
          .update({
            checkedOutBy: null,
            checkedOutAt: null,
            checkoutNotes: null,
          })
          .eq("id", checkoutData.fileId)
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

        if (!checkinFile) {
          return new Response(
            JSON.stringify({
              error: "File not found",
            }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        result = {
          success: true,
          message: "File checked in successfully",
          file: checkinFile,
        };
        break;

      case "cancel":
        // Same as checkin - clear checkout status
        const { data: cancelFile, error: cancelError } = await supabaseAdmin
          .from("files")
          .update({
            checkedOutBy: null,
            checkedOutAt: null,
            checkoutNotes: null,
          })
          .eq("id", checkoutData.fileId)
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

        if (!cancelFile) {
          return new Response(
            JSON.stringify({
              error: "File not found",
            }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        result = {
          success: true,
          message: "File checkout cancelled successfully",
          file: cancelFile,
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
