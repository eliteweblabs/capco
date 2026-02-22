/**
 * Returns public Supabase URL and anon key for client-side use (e.g. standalone form script).
 * Only returns values that are safe to expose (public env vars).
 */
export const prerender = false;

export async function GET() {
  const url =
    typeof process !== "undefined"
      ? (process.env.PUBLIC_SUPABASE_URL ?? "")
      : (import.meta.env?.PUBLIC_SUPABASE_URL ?? "");
  const key =
    typeof process !== "undefined"
      ? (process.env.PUBLIC_SUPABASE_PUBLISHABLE ?? "")
      : (import.meta.env?.PUBLIC_SUPABASE_PUBLISHABLE ?? "");
  return new Response(
    JSON.stringify({ url: url || "", key: key || "" }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
