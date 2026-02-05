import type { APIRoute } from "astro";

// Helper function to clean address by removing ", USA" suffix
function cleanAddress(address: string | undefined): string {
  if (!address) return '';
  return address.replace(/, USA$/i, '').trim();
}

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted
console.log("🚧 [DEAD-STOP-2024-12-19] places-autocomplete.ts accessed - may be unused");

export const GET: APIRoute = async ({ url }) => {
  try {
    const input = url.searchParams.get("input");
    const types = url.searchParams.get("types") || "address";
    const components = url.searchParams.get("components") || "";
    const locationBias = url.searchParams.get("locationBias");
    const maxResults = parseInt(url.searchParams.get("maxResults") || "10");

    console.log("🔍 [PLACES-PROXY] Received parameters:", {
      input,
      types,
      components,
      locationBias,
      maxResults,
    });

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

    console.log("🔍 [PLACES-PROXY] API key:", apiKey);

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

    // Prepare request body for new API using passed parameters
    const requestBody: any = {
      input: input,
    };

    // Handle components parameter (e.g., "country:us" -> ["us"])
    if (components && components.includes("country:")) {
      const countryCode = components.split(":")[1];
      requestBody.includedRegionCodes = [countryCode];
    }

    // Handle types parameter if provided
    if (types && types !== "address") {
      requestBody.includedPrimaryTypes = [types];
    }

    // Add location bias: use client-provided, else env default (avoids server-IP bias e.g. DC/VA on Railway)
    const defaultBias = import.meta.env.GOOGLE_PLACES_DEFAULT_BIAS; // "lat,lng" e.g. "42.3601,-71.0589"
    const biasSource = locationBias || defaultBias;
    if (defaultBias && !locationBias) {
      console.log("🔍 [PLACES-PROXY] Using GOOGLE_PLACES_DEFAULT_BIAS (no client bias)");
    }

    if (biasSource) {
      let lat: string, lng: string;
      if (biasSource.includes("@")) {
        // Old format: circle:100@42.3601,-71.0589
        const parts = biasSource.split("@");
        [lat, lng] = parts[1].split(",");
      } else {
        // New format: 42.3601,-71.0589
        [lat, lng] = biasSource.split(",");
      }

      const latNum = parseFloat(lat?.trim());
      const lngNum = parseFloat(lng?.trim());
      if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
        requestBody.locationBias = {
          circle: {
            center: {
              latitude: latNum,
              longitude: lngNum,
            },
            radius: 50000, // 50km radius
          },
        };
      }
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
      totalSuggestions: data.suggestions?.length || 0,
      maxResults: maxResults,
      willReturn: Math.min(data.suggestions?.length || 0, maxResults),
      fullResponse: data, // Log the full response to see what we're getting
    });

    // Convert new API response to legacy format for compatibility
    const allPredictions =
      data.suggestions?.map((suggestion: any) => {
        const description = cleanAddress(suggestion.placePrediction?.text?.text);
        return {
          place_id: suggestion.placePrediction?.placeId,
          description: description,
          structured_formatting: {
            main_text: description,
            secondary_text: description,
          },
        };
      }) || [];

    // Limit results to maxResults parameter
    const limitedPredictions = allPredictions.slice(0, maxResults);

    const legacyResponse = {
      status: data.error ? "REQUEST_DENIED" : "OK",
      predictions: limitedPredictions,
      errorMessage: data.error?.message || null,
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
