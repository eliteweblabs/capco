import type { APIRoute } from "astro";

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted
console.log("🚧 [DEAD-STOP-2024-12-19] places-autocomplete.ts accessed - may be unused");

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

    // Build the Google Places API URL (New Places API)
    const googleApiUrl = new URL("https://places.googleapis.com/v1/places:autocomplete");

    // Prepare request body for new API
    // For addresses, don't restrict primary types - let Google return all relevant results
    const requestBody: any = {
      input: input,
      includedRegionCodes: ["us"], // equivalent to components=country:us
      // Don't restrict includedPrimaryTypes for addresses to get better results
    };

    // Add location bias if provided
    if (locationBias) {
      // Handle both old format (circle:100@42.3601,-71.0589) and new format (42.3601,-71.0589)
      let lat, lng;
      if (locationBias.includes("@")) {
        // Old format: circle:100@42.3601,-71.0589
        const parts = locationBias.split("@");
        [lat, lng] = parts[1].split(",");
      } else {
        // New format: 42.3601,-71.0589
        [lat, lng] = locationBias.split(",");
      }

      requestBody.locationBias = {
        circle: {
          center: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
          },
          radius: 50000, // 50km radius
        },
      };
    }

    console.log(
      "🔍 [PLACES-PROXY] Making request to Google Places API (New):",
      googleApiUrl.toString()
    );

    // Make the request to Google Places API (New API uses POST)
    const response = await fetch(googleApiUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });
    const data = await response.json();

    console.log("🔍 [PLACES-PROXY] Google Places API response:", {
      status: data.error ? "ERROR" : "OK",
      suggestions: data.suggestions?.length || 0,
      fullResponse: data, // Log the full response to see what we're getting
    });

    // Convert new API response to legacy format for compatibility
    const legacyResponse = {
      status: data.error ? "REQUEST_DENIED" : "OK",
      predictions:
        data.suggestions?.map((suggestion: any) => ({
          place_id: suggestion.placePrediction?.placeId,
          description: suggestion.placePrediction?.text?.text,
          structured_formatting: {
            main_text: suggestion.placePrediction?.text?.text,
            secondary_text: suggestion.placePrediction?.text?.text,
          },
        })) || [],
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
