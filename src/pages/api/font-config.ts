import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  try {
    const fontFamily = process.env.FONT_FAMILY || "Outfit Variable";
    const fontFamilyFallback = process.env.FONT_FAMILY_FALLBACK || "sans-serif";

    return new Response(
      JSON.stringify({
        success: true,
        font: {
          primary: fontFamily,
          fallback: fontFamilyFallback,
          full: `"${fontFamily}", ${fontFamilyFallback}`,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("❌ [FONT-CONFIG] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to get font configuration",
        error: error.message,
      }),
      { status: 500 }
    );
  }
};
