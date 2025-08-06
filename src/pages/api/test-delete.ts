import type { APIRoute } from "astro";

export const DELETE: APIRoute = async ({ request }) => {
  try {
    console.log("Test delete API called");

    const requestBody = await request.json();
    console.log("Request body:", requestBody);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test delete endpoint working",
        receivedData: requestBody,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in test-delete API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
