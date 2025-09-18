import type { APIRoute } from "astro";

// 🚧 DEPRECATED - 2024-12-19: This endpoint is deprecated
// Use /api/project-statuses instead for unified status handling
console.log(
  "🚧 [DEPRECATED-2024-12-19] get-project-statuses.ts accessed - use /api/project-statuses instead"
);

export const GET: APIRoute = async ({ request, cookies }) => {
  // Redirect to the new unified API
  const url = new URL(request.url);
  const newUrl = new URL("/api/project-statuses", url.origin);

  // Forward query parameters
  url.searchParams.forEach((value, key) => {
    newUrl.searchParams.set(key, value);
  });

  try {
    const response = await fetch(newUrl.toString(), {
      method: "GET",
      headers: {
        Cookie: request.headers.get("Cookie") || "",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    // Transform to match old format for backward compatibility
    if (data.success) {
      return new Response(
        JSON.stringify({
          statuses: data.statuses,
          statusLabels: data.statusesMap,
          success: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("🏗️ [API] Error redirecting to unified API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
