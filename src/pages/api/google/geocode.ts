import type { APIRoute } from "astro";

// Helper function to clean address by removing ", USA" suffix
function cleanAddress(address: string | undefined): string {
  if (!address) return "";
  return address.replace(/, USA$/i, "").trim();
}

/**
 * Geocoding API endpoint - converts coordinates to addresses
 * Handles both forward geocoding (address -> coordinates) and reverse geocoding (coordinates -> address)
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const latlng = url.searchParams.get("latlng");
    const address = url.searchParams.get("address");

    console.log("🌍 [GEOCODE] Received parameters:", { latlng, address });

    // Validate that we have either latlng or address
    if (!latlng && !address) {
      return new Response(
        JSON.stringify({
          error: "Either 'latlng' or 'address' parameter is required",
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

    // Try Geocoding API first for accurate reverse geocoding
    if (latlng) {
      const [lat, lng] = latlng.split(",");

      // First, try the Geocoding API for precise address
      const geocodingUrl = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      geocodingUrl.searchParams.set("latlng", latlng);
      geocodingUrl.searchParams.set("key", apiKey);

      console.log("🌍 [GEOCODE] Trying Geocoding API first for precise address");

      const geocodingResponse = await fetch(geocodingUrl.toString());
      const geocodingData = await geocodingResponse.json();

      // If Geocoding API works, use it (most accurate)
      if (geocodingData.status === "OK" && geocodingData.results?.length > 0) {
        console.log("✅ [GEOCODE] Geocoding API succeeded, returning precise addresses");

        const results = geocodingData.results.map((result: any) => {
          const cleanedAddress = cleanAddress(result.formatted_address);
          return {
            formatted_address: cleanedAddress,
            description: cleanedAddress,
            label: cleanedAddress,
            value: cleanedAddress,
            place_id: result.place_id,
            geometry: result.geometry,
          };
        });

        return new Response(
          JSON.stringify({
            status: "OK",
            results: results,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          }
        );
      }

      // If Geocoding API not enabled, fall back to Places API
      console.log("⚠️ [GEOCODE] Geocoding API not available, falling back to Places API");

      const placesUrl = new URL("https://places.googleapis.com/v1/places:searchNearby");

      const requestBody = {
        locationRestriction: {
          circle: {
            center: {
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
            },
            radius: 50, // Smaller radius for closer results
          },
        },
        maxResultCount: 10,
      };

      console.log("🌍 [GEOCODE] Making request to Google Places API (searchNearby)");

      const response = await fetch(placesUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.id",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      console.log("🌍 [GEOCODE] Google Places API response:", {
        status: data.error ? "ERROR" : "OK",
        totalResults: data.places?.length || 0,
      });

      if (data.error) {
        console.error("🚨 [GEOCODE] API error:", data);
        return new Response(
          JSON.stringify({
            error: `Geocoding failed: ${data.error.status}`,
            details: data.error.message || "Unknown error",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Convert Places API response to Geocoding API format for compatibility
      const results =
        data.places?.map((place: any) => {
          const cleanedAddress = cleanAddress(place.formattedAddress);
          return {
            formatted_address: cleanedAddress,
            description: cleanedAddress,
            label: cleanedAddress,
            value: cleanedAddress,
            place_id: place.id,
            geometry: {
              location: {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
              },
            },
          };
        }) || [];

      const geocodeResponse = {
        status: results.length > 0 ? "OK" : "ZERO_RESULTS",
        results: results,
      };

      return new Response(JSON.stringify(geocodeResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    } else if (address) {
      // For forward geocoding (address -> coordinates), use the autocomplete API
      const placesUrl = new URL("https://places.googleapis.com/v1/places:autocomplete");

      const requestBody = {
        input: address,
        includedPrimaryTypes: ["street_address", "premise"],
      };

      console.log("🌍 [GEOCODE] Making request to Google Places API (autocomplete)");

      const response = await fetch(placesUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      console.log("🌍 [GEOCODE] Google Places API response:", {
        status: data.error ? "ERROR" : "OK",
        totalResults: data.suggestions?.length || 0,
      });

      if (data.error) {
        console.error("🚨 [GEOCODE] API error:", data);
        return new Response(
          JSON.stringify({
            error: `Geocoding failed: ${data.error.status}`,
            details: data.error.message || "Unknown error",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Convert to geocoding format
      const results =
        data.suggestions?.map((suggestion: any) => {
          const cleanedAddress = cleanAddress(suggestion.placePrediction?.text?.text);
          return {
            formatted_address: cleanedAddress,
            place_id: suggestion.placePrediction?.placeId,
          };
        }) || [];

      const geocodeResponse = {
        status: results.length > 0 ? "OK" : "ZERO_RESULTS",
        results: results,
      };

      return new Response(JSON.stringify(geocodeResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
  } catch (error) {
    console.error("🚨 [GEOCODE] Error:", error);

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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
