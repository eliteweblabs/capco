import type { APIRoute } from "astro";

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

    // Use Places API for reverse geocoding (since Geocoding API may not be enabled)
    // Places API can do reverse geocoding by searching with coordinates as locationBias
    if (latlng) {
      const [lat, lng] = latlng.split(",");

      // Use Places API autocomplete with empty input to get nearby places
      const placesUrl = new URL("https://places.googleapis.com/v1/places:searchNearby");

      const requestBody = {
        locationRestriction: {
          circle: {
            center: {
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
            },
            radius: 100, // 100 meters radius
          },
        },
        maxResultCount: 10,
        // Don't specify types - get all nearby places/addresses
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
        data.places?.map((place: any) => ({
          formatted_address: place.formattedAddress,
          place_id: place.id,
          geometry: {
            location: {
              lat: parseFloat(lat),
              lng: parseFloat(lng),
            },
          },
        })) || [];

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
        data.suggestions?.map((suggestion: any) => ({
          formatted_address: suggestion.placePrediction?.text?.text,
          place_id: suggestion.placePrediction?.placeId,
        })) || [];

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
