import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Update current user's own profile
 * Allows authenticated users to update their own profile without Admin/Staff permissions
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Authentication required" 
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    let body;
    try {
      const bodyText = await request.text();
      
      if (!bodyText || bodyText.trim() === "") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Empty request body",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      body = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("❌ [USERS-UPDATE] JSON parse error:", parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate that body is an object
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request body format",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const {
      companyName,
      firstName,
      lastName,
      phone,
      smsAlerts,
      mobileCarrier,
    } = body;

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields",
          details: "firstName and lastName are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!supabase || !supabaseAdmin) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Database connection not available" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = currentUser.id;

    // Prepare update payload (only allow updating certain fields for own profile)
    const updatePayload: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim() || null,
      updatedAt: new Date().toISOString(),
    };

    // Add companyName if provided
    if (companyName !== undefined) {
      updatePayload.companyName = companyName?.trim() || "";
    }

    // Handle SMS alerts and mobile carrier
    if (smsAlerts !== undefined) {
      // Convert mobileCarrier to gateway domain if SMS alerts are enabled
      if (smsAlerts && mobileCarrier) {
        const { SMS_UTILS } = await import("../../../lib/sms-utils");
        const carrierInfo = SMS_UTILS.getCarrierInfo(mobileCarrier);
        if (carrierInfo) {
          updatePayload.mobileCarrier = `@${carrierInfo.gateway}`;
        } else if (mobileCarrier.startsWith("@")) {
          // Already a gateway domain
          updatePayload.mobileCarrier = mobileCarrier;
        } else {
          updatePayload.mobileCarrier = null;
        }
      } else {
        updatePayload.mobileCarrier = null;
      }
    }

    // Update the user's own profile
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("❌ [USERS-UPDATE] Error updating profile:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to update profile",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ [USERS-UPDATE] Profile updated successfully:", data.email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Profile updated successfully",
        data: data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [USERS-UPDATE] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

