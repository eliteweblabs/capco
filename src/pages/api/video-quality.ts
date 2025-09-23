import type { APIRoute } from "astro";

// 🚧 DEAD STOP - 2024-12-19: Potentially unused API endpoint
// If you see this log after a few days, this endpoint can likely be deleted
// console.log("🚧 [DEAD-STOP-2024-12-19] video-quality.ts accessed - may be unused");

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Get video source from query parameter
    const videoSource = url.searchParams.get("source") || "uhd_30fps";

    // Get connection hints from headers
    const userAgent = request.headers.get("user-agent") || "";
    const connectionType = request.headers.get("save-data") || "";
    const acceptEncoding = request.headers.get("accept-encoding") || "";

    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );

    // Determine quality based on connection hints
    let quality = "medium"; // default

    if (connectionType === "on") {
      // User has data saver enabled
      quality = "low";
    } else if (isMobile) {
      // Mobile devices get lower quality by default
      quality = "low";
    } else {
      // Desktop - could be enhanced with more sophisticated detection
      quality = "medium";
    }

    // Dynamically generate video URLs based on source
    const videoUrls = {
      low: `/videos/${videoSource}_low.mp4`,
      medium: `/videos/${videoSource}_medium.mp4`,
      high: `/videos/${videoSource}_high.mp4`,
      original: `/videos/${videoSource}.mp4`,
    };

    return new Response(
      JSON.stringify({
        quality,
        url: videoUrls[quality as keyof typeof videoUrls],
        videoSource,
        isMobile,
        connectionType: connectionType || "unknown",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300", // Cache for 5 minutes
        },
      }
    );
  } catch (error) {
    console.error("Error determining video quality:", error);

    return new Response(
      JSON.stringify({
        quality: "medium",
        url: "/videos/uhd_30fps_medium.mp4",
        error: "Failed to determine optimal quality",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
