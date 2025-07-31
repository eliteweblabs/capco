import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const config = {
    emailProvider: process.env.EMAIL_PROVIDER || "not set",
    hasApiKey: !!process.env.EMAIL_API_KEY,
    fromEmail: process.env.FROM_EMAIL || "not set",
    fromName: process.env.FROM_NAME || "not set",
    status: "Check environment variables above",
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(config, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
