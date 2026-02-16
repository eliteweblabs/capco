/**
 * Location Check-In API
 * Creates a notification to all Admins when Admin/Staff checks in or out at a location.
 * Uses browser geolocation (lat, lng) to include location in the notification.
 * Reverse geocodes coordinates to street address via Google Geocoding API.
 */
import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

function cleanAddress(address: string | undefined): string {
  if (!address) return "";
  return address.replace(/, USA$/i, "").trim();
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.results?.length > 0) {
    return cleanAddress(data.results[0].formatted_address);
  }
  return null;
}

interface CheckInRequest {
  action: "check_in" | "check_out";
  lat: number;
  lng: number;
  accuracy?: number; // meters
}

export const POST: APIRoute = async ({ request, cookies }): Promise<Response> => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const role = (currentUser as any)?.profile?.role;
    if (role !== "Admin" && role !== "Staff") {
      return new Response(JSON.stringify({ error: "Admin or Staff role required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: CheckInRequest = await request.json();
    const { action, lat, lng, accuracy } = body;

    if (!action || typeof lat !== "number" || typeof lng !== "number") {
      return new Response(
        JSON.stringify({ error: "action, lat, and lng are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userName =
      (currentUser as any)?.profile?.name ||
      (currentUser as any)?.profile?.firstName ||
      currentUser?.email ||
      "Unknown";

    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const timeStr = new Date().toLocaleString();
    const address = await reverseGeocode(lat, lng);
    const locationLabel = address || coords;

    const isCheckIn = action === "check_in";
    const title = isCheckIn ? "Location Check-In" : "Location Check-Out";
    const message = isCheckIn
      ? `${userName} checked in at ${timeStr}. ${locationLabel}`
      : `${userName} checked out at ${timeStr}. Last location: ${locationLabel}`;

    // Fetch all Admin users (exclude the current user if they're also Admin to avoid self-notify, or include - admins may want to see their own check-ins)
    const { data: adminUsers, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "Admin");

    if (usersError || !adminUsers?.length) {
      console.warn("📍 [CHECK-IN] No admins found:", usersError);
      return new Response(
        JSON.stringify({
          success: true,
          count: 0,
          message: "No admins to notify",
          address: address || undefined,
          location: address || undefined,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const notifications = adminUsers.map((admin) => ({
      userId: admin.id,
      title,
      message,
      type: "info",
      priority: "normal",
      actionUrl: mapsUrl,
      actionText: "View on Map",
      viewed: false,
      metadata: {
        action,
        lat,
        lng,
        accuracy: accuracy ?? null,
        userName,
        checkedInById: currentUser.id,
        timestamp: new Date().toISOString(),
      },
    }));

    const { error: insertError } = await supabaseAdmin.from("notifications").insert(notifications);

    if (insertError) {
      console.error("❌ [CHECK-IN] Error creating notifications:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create notification", details: insertError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: adminUsers.length,
        action,
        address: address || undefined,
        location: address || undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [CHECK-IN] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
