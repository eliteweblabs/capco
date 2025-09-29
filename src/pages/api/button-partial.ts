import type { APIRoute } from "astro";
import { generateButtonHTML } from "../../lib/button-styles";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { text, variant, size, dataAttributes, type, href, target, disabled, loading } = body;

    // Use the centralized button styling function
    const buttonHTML = generateButtonHTML(
      text || "",
      {
        variant: variant || "primary",
        size: size || "sm",
        fullWidth: false,
      },
      dataAttributes || {}
    );

    return new Response(buttonHTML, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error generating button partial:", error);
    return new Response(JSON.stringify({ error: "Failed to generate button" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
