import type { APIRoute } from "astro";
import { SimpleProjectLogger } from "../../../lib/simple-logging";
import { getCarrierInfo } from "../../../lib/sms-carriers";
import { supabase } from "../../../lib/supabase";

// Helper function to get gateway domain from carrier key
function getCarrierGateway(carrierKey: string | null): string | null {
  if (!carrierKey) return null;
  const carrier = getCarrierInfo(carrierKey);
  return carrier?.gateway || null;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { companyName, firstName, lastName, phone, smsAlerts, mobileCarrier } =
      await request.json();

    // Validate input
    if (!companyName || companyName.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Company name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Supabase not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the current user
    const accessToken = cookies.get("sb-access-token");
    const refreshToken = cookies.get("sb-refresh-token");

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set session to get current user
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken.value,
      refresh_token: refreshToken.value,
    });

    if (sessionError || !sessionData.session) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = sessionData.session.user.id;
    const userEmail = sessionData.session.user.email || "unknown";

    // Get current profile data for logging
    const { data: oldProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Update the profile
    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update({
        company_name: companyName.trim(),
        first_name: firstName.trim(),
        last_name: lastName?.trim() || null,
        phone: phone?.trim() || null,
        sms_alerts: smsAlerts,
        mobile_carrier: smsAlerts ? getCarrierGateway(mobileCarrier?.trim() || null) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Profile update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update profile" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update phone and SMS preferences in auth user metadata
    const authUpdateData: any = {};

    if (phone !== undefined) {
      authUpdateData.phone = phone?.trim() || null;
    }

    if (smsAlerts !== undefined) {
      authUpdateData.sms_alerts = smsAlerts;
    }

    if (mobileCarrier !== undefined) {
      // Convert carrier key to gateway domain
      const gatewayDomain = getCarrierGateway(mobileCarrier?.trim());
      authUpdateData.mobile_carrier = gatewayDomain;
    }

    if (Object.keys(authUpdateData).length > 0) {
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: authUpdateData,
      });

      if (authUpdateError) {
        console.error("Auth update error:", authUpdateError);
        // Don't fail the entire request if auth update fails
      }
    }

    // Log user profile update
    try {
      await SimpleProjectLogger.addLogEntry(
        0, // System log
        "user_registration",
        "User profile updated",
        { oldData: oldProfile, newData: profile }
      );
    } catch (logError) {
      console.error("Error logging profile update:", logError);
    }

    return new Response(
      JSON.stringify({
        message: "Profile updated successfully",
        profile: profile,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
