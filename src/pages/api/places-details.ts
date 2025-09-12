import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  try {
    const placeId = url.searchParams.get("place_id");
    const fields = url.searchParams.get("fields") || "formatted_address,name,address_components";

    if (!placeId) {
      return new Response(
        JSON.stringify({
          error: "place_id parameter is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get API key from environment variables
    const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Google Maps API key not configured",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Build the Google Places API URL
    const googleApiUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    googleApiUrl.searchParams.set("place_id", placeId);
    googleApiUrl.searchParams.set("fields", fields);
    googleApiUrl.searchParams.set("key", apiKey);

    console.log(
      "🔍 [PLACES-DETAILS-PROXY] Making request to Google Places API:",
      googleApiUrl.toString()
    );

    // Make the request to Google Places API
    const response = await fetch(googleApiUrl.toString());
    const data = await response.json();

    console.log("🔍 [PLACES-DETAILS-PROXY] Google Places API response:", {
      status: data.status,
      result: !!data.result,
    });

    // Return the response from Google Places API
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("🚨 [PLACES-DETAILS-PROXY] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
