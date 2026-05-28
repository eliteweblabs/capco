import type { APIRoute } from "astro";
import { getGoogleMapsApiKey } from "../../../lib/google-maps-api-key";

// Helper function to clean address by removing ", USA" suffix
function cleanAddress(address: string | undefined): string {
  if (!address) return "";
  return address.replace(/, USA$/i, "").trim();
}

const PLACES_AUTOCOMPLETE_FIELD_MASK =
  "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text";

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

    const apiKey = getGoogleMapsApiKey();

    if (!apiKey) {
      console.error(
        "🚨 [PLACES-PROXY] No API key — set GOOGLE_MAPS_API_KEY or GOOGLE_PLACES_API_KEY in .env"
      );
      return new Response(
        JSON.stringify({
          error: "Google Maps API key not configured",
          hint: "Set GOOGLE_MAPS_API_KEY or GOOGLE_PLACES_API_KEY in your environment",
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const googleApiUrl = new URL("https://places.googleapis.com/v1/places:autocomplete");

    const requestBody: Record<string, unknown> = {
      input: input,
    };

    if (components && components.includes("country:")) {
      const countryCode = components.split(":")[1];
      requestBody.includedRegionCodes = [countryCode];
    }

    if (types === "address") {
      requestBody.includedPrimaryTypes = ["street_address", "premise"];
    } else if (types) {
      requestBody.includedPrimaryTypes = [types];
    }

    const defaultBias =
      import.meta.env.GOOGLE_PLACES_DEFAULT_BIAS ||
      (typeof process !== "undefined" ? process.env.GOOGLE_PLACES_DEFAULT_BIAS : undefined);
    const biasSource = locationBias || defaultBias;
    if (defaultBias && !locationBias) {
      console.log("🔍 [PLACES-PROXY] Using GOOGLE_PLACES_DEFAULT_BIAS (no client bias)");
    }

    if (biasSource) {
      let lat: string | undefined;
      let lng: string | undefined;
      if (biasSource.includes("@")) {
        const parts = biasSource.split("@");
        [lat, lng] = parts[1].split(",");
      } else {
        [lat, lng] = biasSource.split(",");
      }

      const latNum = parseFloat(lat?.trim() ?? "");
      const lngNum = parseFloat(lng?.trim() ?? "");
      if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
        requestBody.locationBias = {
          circle: {
            center: {
              latitude: latNum,
              longitude: lngNum,
            },
            radius: 50000,
          },
        };
      }
    }

    const response = await fetch(googleApiUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": PLACES_AUTOCOMPLETE_FIELD_MASK,
      },
      body: JSON.stringify(requestBody),
    });
    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("🚨 [PLACES-PROXY] Google API error:", data);
      return new Response(
        JSON.stringify({
          status: "REQUEST_DENIED",
          predictions: [],
          errorMessage: data.error?.message || `Google Places API error (${response.status})`,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }

    const allPredictions =
      data.suggestions?.map((suggestion: { placePrediction?: { placeId?: string; text?: { text?: string } } }) => {
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

    const limitedPredictions = allPredictions.slice(0, maxResults);

    const legacyResponse = {
      status: "OK",
      predictions: limitedPredictions,
      errorMessage: null,
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
