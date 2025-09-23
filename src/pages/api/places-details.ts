import type { APIRoute } from "astro";

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted
// console.log("🚧 [DEAD-STOP-2024-12-19] places-details.ts accessed - may be unused");

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

    // Build the Google Places API URL (New Places API)
    const googleApiUrl = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
    googleApiUrl.searchParams.set("fields", fields);

    // console.log(
      "🔍 [PLACES-DETAILS-PROXY] Making request to Google Places API (New):",
      googleApiUrl.toString()
    );

    // Make the request to Google Places API (New API)
    const response = await fetch(googleApiUrl.toString(), {
      headers: {
        "X-Goog-Api-Key": apiKey,
      },
    });
    const data = await response.json();

    // console.log("🔍 [PLACES-DETAILS-PROXY] Google Places API response:", {
      status: data.error ? "ERROR" : "OK",
      result: !!data,
    });

    // Convert new API response to legacy format for compatibility
    const legacyResponse = {
      status: data.error ? "REQUEST_DENIED" : "OK",
      result: data.error
        ? null
        : {
            formatted_address: data.formattedAddress,
            name: data.displayName?.text,
            address_components:
              data.addressComponents?.map((comp: any) => ({
                long_name: comp.longText,
                short_name: comp.shortText,
                types: comp.types,
              })) || [],
          },
      error_message: data.error?.message || null,
    };

    return new Response(JSON.stringify(legacyResponse), {
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
