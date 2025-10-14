import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../lib/api-optimization";
import { checkAuth } from "../../lib/auth";

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Get current user
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    // Check permissions
    const userRole = currentUser.profile?.role?.toLowerCase();
    if (userRole !== "admin") {
      return createErrorResponse("Access denied - Admin access required", 403);
    }

    // Get query parameters
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider") || "plausible";
    const period = url.searchParams.get("period") || "30d";

    let analyticsData;

    switch (provider) {
      case "plausible":
        analyticsData = await fetchPlausibleData(period);
        break;
      case "google":
        analyticsData = await fetchGoogleAnalyticsData(period);
        break;
      case "custom":
        analyticsData = await fetchCustomAnalyticsData(period);
        break;
      default:
        return createErrorResponse("Invalid analytics provider", 400);
    }

    return createSuccessResponse(analyticsData, "Analytics data fetched successfully");
  } catch (error) {
    console.error("Analytics dashboard error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};

// Plausible Analytics integration
async function fetchPlausibleData(period: string) {
  const PLAUSIBLE_API_TOKEN = import.meta.env.PLAUSIBLE_API_TOKEN;

  if (!PLAUSIBLE_API_TOKEN) {
    throw new Error("Plausible API token not configured");
  }

  const response = await fetch("https://plausible.io/api/v1/stats/aggregate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PLAUSIBLE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_id: "capcofire.com",
      period,
      metrics: ["pageviews", "visitors", "bounce_rate", "visit_duration"],
    }),
  });

  if (!response.ok) {
    throw new Error(`Plausible API error: ${response.status}`);
  }

  return await response.json();
}

// Google Analytics integration (if you have GA4)
async function fetchGoogleAnalyticsData(period: string) {
  // This would require Google Analytics API setup
  // For now, return mock data
  return {
    provider: "google",
    period,
    data: {
      pageviews: 0,
      visitors: 0,
      bounce_rate: 0,
      message: "Google Analytics integration not configured",
    },
  };
}

// Custom analytics (using your own tracking)
async function fetchCustomAnalyticsData(period: string) {
  // This could query your own database for custom analytics
  // For now, return mock data
  return {
    provider: "custom",
    period,
    data: {
      pageviews: 0,
      visitors: 0,
      bounce_rate: 0,
      message: "Custom analytics not implemented",
    },
  };
}
