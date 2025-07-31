import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const config = {
    emailProvider: import.meta.env.EMAIL_PROVIDER || "not set",
    hasApiKey: !!import.meta.env.EMAIL_API_KEY,
    fromEmail: import.meta.env.FROM_EMAIL || "not set",
    fromName: import.meta.env.FROM_NAME || "not set",
    status: "Check environment variables above",
  };

  return new Response(JSON.stringify(config, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
