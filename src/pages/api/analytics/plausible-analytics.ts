import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { checkAuth } from "../../../lib/auth";

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Get current user
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    // Check permissions - only Admin can access analytics
    const userRole = currentUser.profile?.role?.toLowerCase();
    if (userRole !== "admin") {
      return createErrorResponse("Access denied - Admin access required", 403);
    }

    // Get query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "30d";
    const metrics = url.searchParams.get("metrics") || "pageviews,visitors,bounce_rate";

    // Plausible API configuration
    const PLAUSIBLE_API_URL = "https://plausible.io/api/v1/stats/aggregate";
    const PLAUSIBLE_SITE_ID = "capcofire.com";
    const PLAUSIBLE_API_TOKEN = import.meta.env.PLAUSIBLE_API_TOKEN;

    if (!PLAUSIBLE_API_TOKEN) {
      return createErrorResponse("Plausible API token not configured", 500);
    }

    // Fetch analytics data from Plausible API
    const response = await fetch(PLAUSIBLE_API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PLAUSIBLE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      // Note: Plausible API doesn't support query params in URL, need to use POST
    });

    if (!response.ok) {
      console.error("Plausible API error:", response.status, response.statusText);
      return createErrorResponse("Failed to fetch analytics data", 500);
    }

    const data = await response.json();

    return createSuccessResponse(data, "Analytics data fetched successfully");
  } catch (error) {
    console.error("Analytics API error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};

// Alternative: POST method for more complex queries
export const POST: APIRoute = async ({ request, cookies }) => {
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

    const body = await request.json();
    const {
      period = "30d",
      metrics = "pageviews,visitors,bounce_rate",
      site_id = "capcofire.com",
    } = body;

    const PLAUSIBLE_API_URL = "https://plausible.io/api/v1/stats/aggregate";
    const PLAUSIBLE_API_TOKEN = import.meta.env.PLAUSIBLE_API_TOKEN;

    if (!PLAUSIBLE_API_TOKEN) {
      return createErrorResponse("Plausible API token not configured", 500);
    }

    // Fetch analytics data using POST method
    const response = await fetch(PLAUSIBLE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PLAUSIBLE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        site_id,
        period,
        metrics: metrics.split(","),
      }),
    });

    if (!response.ok) {
      console.error("Plausible API error:", response.status, response.statusText);
      return createErrorResponse("Failed to fetch analytics data", 500);
    }

    const data = await response.json();

    return createSuccessResponse(data, "Analytics data fetched successfully");
  } catch (error) {
    console.error("Analytics API error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
