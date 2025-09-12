import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  try {
    const input = url.searchParams.get("input");
    const types = url.searchParams.get("types") || "address";
    const components = url.searchParams.get("components") || "country:us";
    const locationBias = url.searchParams.get("locationBias");

    if (!input) {
      return new Response(
        JSON.stringify({
          error: "Input parameter is required",
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

    // Build the Google Places API URL (Legacy Places API)
    const googleApiUrl = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    googleApiUrl.searchParams.set("input", input);
    googleApiUrl.searchParams.set("types", types);
    googleApiUrl.searchParams.set("components", components);
    googleApiUrl.searchParams.set("key", apiKey);

    // Add location bias if provided
    if (locationBias) {
      googleApiUrl.searchParams.set("locationbias", locationBias);
    }

    console.log("🔍 [PLACES-PROXY] Making request to Google Places API:", googleApiUrl.toString());

    // Make the request to Google Places API (Legacy API uses GET)
    const response = await fetch(googleApiUrl.toString());
    const data = await response.json();

    console.log("🔍 [PLACES-PROXY] Google Places API response:", {
      status: data.status,
      predictions: data.predictions?.length || 0,
    });

    // Return the response from Google Places API (legacy format)
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
    console.error("🚨 [PLACES-PROXY] Error:", error);

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
