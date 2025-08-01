import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  // Debug environment variables (be careful not to expose sensitive data in production)
  const envDebug = {
    EMAIL_PROVIDER:
      import.meta.env.EMAIL_PROVIDER || process.env.EMAIL_PROVIDER || "NOT_SET",
    EMAIL_API_KEY:
      import.meta.env.EMAIL_API_KEY || process.env.EMAIL_API_KEY
        ? "SET"
        : "NOT_SET",
    FROM_EMAIL:
      import.meta.env.FROM_EMAIL || process.env.FROM_EMAIL || "NOT_SET",
    FROM_NAME: import.meta.env.FROM_NAME || process.env.FROM_NAME || "NOT_SET",
    SUPABASE_URL:
      import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL
        ? "SET"
        : "NOT_SET",
    SUPABASE_ANON_KEY:
      import.meta.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
        ? "SET"
        : "NOT_SET",
    NODE_ENV: import.meta.env.NODE_ENV || process.env.NODE_ENV || "NOT_SET",
  };

  return new Response(
    JSON.stringify(
      {
        message: "Environment Variables Debug",
        variables: envDebug,
        astroEnv: {
          available: Object.keys(import.meta.env).filter(
            (key) =>
              key.startsWith("EMAIL_") ||
              key.startsWith("FROM_") ||
              key.startsWith("SUPABASE_"),
          ),
        },
      },
      null,
      2,
    ),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
};
