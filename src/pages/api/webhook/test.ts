import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  console.log("🧪 [TEST] Vonage test endpoint hit!");
  return new Response("Vonage test successful!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  console.log("🧪 [TEST] Vonage test POST hit with body:", body);
  return new Response("Vonage test POST successful!", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
