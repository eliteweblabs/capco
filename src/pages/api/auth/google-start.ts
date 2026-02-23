/**
 * Server-side Google OAuth start. Redirects to Supabase Google OAuth URL.
 * Use when client-side handleGoogleSignup is not available (e.g. module scripts don't load).
 * GET /api/auth/google-start?redirect=/project/dashboard
 */
import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

/** Use request URL for localhost; prefer RAILWAY_PUBLIC_DOMAIN in production so OAuth never redirects to localhost. */
function getOrigin(request: Request, url: URL): string {
  const railway =
    (typeof import.meta !== "undefined" && (import.meta.env?.RAILWAY_PUBLIC_DOMAIN as string)) ||
    (typeof process !== "undefined" && process.env.RAILWAY_PUBLIC_DOMAIN);
  const explicit =
    (typeof import.meta !== "undefined" && (import.meta.env?.PUBLIC_SITE_URL || import.meta.env?.SITE_URL)) ||
    (typeof process !== "undefined" && (process.env.PUBLIC_SITE_URL || process.env.SITE_URL));

  // Production: prefer RAILWAY_PUBLIC_DOMAIN so we never accidentally use localhost
  if (railway) {
    const origin = railway.startsWith("http") ? railway : `https://${railway}`;
    try {
      const parsed = new URL(origin);
      return parsed.origin;
    } catch {
      // fall through
    }
  }
  if (explicit) {
    try {
      const parsed = new URL(explicit.startsWith("http") ? explicit : `https://${explicit}`);
      return parsed.origin;
    } catch {
      // fall through
    }
  }

  // Request-derived origin (for local dev and when env not set)
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ||
    request.headers.get("x-forwarded-protocol") ||
    (url.protocol === "https:" ? "https" : "http");
  if (host) {
    const origin = `${proto}://${host}`;
    try {
      new URL(origin);
      return origin;
    } catch {
      // fall through
    }
  }
  if (url.origin && url.origin !== "null") {
    return url.origin;
  }

  const fallback = "http://localhost:4321";
  console.warn("[auth/google-start] getOrigin fallback to localhost – set RAILWAY_PUBLIC_DOMAIN or PUBLIC_SITE_URL for production");
  return fallback;
}

export const GET: APIRoute = async ({ url, redirect, request }) => {
  if (!supabase) {
    return new Response("Supabase not configured", { status: 500 });
  }
  const redirectTo = url.searchParams.get("redirect") || "/project/dashboard";
  const origin = getOrigin(request, url);
  const callbackUrl = `${origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;

  console.log("[auth/google-start] OAuth redirectTo:", callbackUrl, "| origin:", origin);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error) {
    console.error("[auth/google-start]", error.message);
    return redirect(`/auth/login?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
  }
  if (data?.url) {
    return redirect(data.url);
  }
  return redirect("/auth/login?error=oauth_failed");
};
