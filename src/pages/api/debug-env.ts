import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  // Get all environment variables that start with EMAIL, FROM, or common ones
  const envVars = Object.keys(process.env)
    .filter(
      (key) =>
        key.startsWith("EMAIL") ||
        key.startsWith("FROM") ||
        key.startsWith("SUPABASE") ||
        key.includes("PORT") ||
        key.includes("NODE_ENV"),
    )
    .reduce(
      (obj, key) => {
        // Hide sensitive data but show if it exists
        obj[key] = process.env[key] ? "***SET***" : "NOT SET";
        return obj;
      },
      {} as Record<string, string>,
    );

  const debug = {
    processEnv: envVars,
    importMetaEnv: {
      EMAIL_PROVIDER: import.meta.env.EMAIL_PROVIDER || "NOT SET",
      EMAIL_API_KEY: import.meta.env.EMAIL_API_KEY ? "***SET***" : "NOT SET",
      FROM_EMAIL: import.meta.env.FROM_EMAIL || "NOT SET",
      FROM_NAME: import.meta.env.FROM_NAME || "NOT SET",
    },
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    railwayEnv: process.env.RAILWAY_ENVIRONMENT || "NOT SET",
    allEnvKeys:
      Object.keys(process.env).length + " total environment variables",
  };

  return new Response(JSON.stringify(debug, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
