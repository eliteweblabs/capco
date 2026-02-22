/**
 * Single source of truth for Google (Supabase OAuth) sign-in.
 * PKCE runs in the browser; OAuth must be started here so code_verifier is in localStorage.
 * Use: startGoogleSignIn(redirectUrl) or load this script and use .provider-btn[data-provider="google"] / handleGoogleSignup.
 */
import { getSupabaseClient } from "./supabase-client";

const DEFAULT_REDIRECT = "/project/dashboard";

function getRedirectFromPage(): string {
  const input = document.querySelector('input[name="redirect"]') as HTMLInputElement | null;
  return input?.value?.trim() || DEFAULT_REDIRECT;
}

/**
 * Start Google OAuth. Call from button click or when ?provider=google on login page.
 * Redirect param is preserved in callback URL and used after success.
 */
export async function startGoogleSignIn(redirectDestination?: string): Promise<void> {
  const redirectTo = redirectDestination ?? getRedirectFromPage();

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
  if (supabaseUrl) {
    const projectRef = supabaseUrl.split("//")[1]?.split(".")[0] || "";
    const staleKeys = Object.keys(localStorage).filter(
      (k) => projectRef && k.includes(`sb-${projectRef}`) && !k.includes("code-verifier")
    );
    staleKeys.forEach((k) => localStorage.removeItem(k));
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    if (typeof (window as any).showNotice === "function") {
      (window as any).showNotice(
        "error",
        "Configuration Error",
        "Supabase is not configured. Please contact support."
      );
    }
    return;
  }

  await new Promise((r) => setTimeout(r, 200));

  const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;

  console.log("[AUTH-GOOGLE] Starting OAuth with callbackUrl:", callbackUrl);

  try {
    // Use skipBrowserRedirect to capture the generated URL for debugging, then navigate manually
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: { access_type: "offline", prompt: "consent" },
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error("[AUTH-GOOGLE] signInWithOAuth error:", error.message);
      if ((window as any).showNotice) {
        (window as any).showNotice("error", "Sign In Error", error.message);
      }
      return;
    }

    if (!data?.url) {
      console.error("[AUTH-GOOGLE] No OAuth URL returned from Supabase");
      if ((window as any).showNotice) {
        (window as any).showNotice("error", "Sign In Error", "Could not start Google sign-in. Please try again.");
      }
      return;
    }

    // Log the full OAuth URL so redirect_to can be verified in DevTools
    console.log("[AUTH-GOOGLE] OAuth URL generated:", data.url);
    const oauthUrl = new URL(data.url);
    const redirectToParam = oauthUrl.searchParams.get("redirect_to");
    console.log("[AUTH-GOOGLE] redirect_to parameter:", redirectToParam ?? "(not found — may be encoded in state)");

    window.location.href = data.url;
  } catch (err) {
    console.error("[AUTH-GOOGLE] Unexpected error:", err);
    if ((window as any).showNotice) {
      (window as any).showNotice("error", "Sign In Error", "An unexpected error occurred");
    }
  }
}

/** Show OAuth error from URL params (login/callback redirects). Call once on login page load. */
export function handleLoginPageQueryParams(): void {
  const params = new URLSearchParams(window.location.search);
  const provider = params.get("provider");
  const error = params.get("error");
  const message = params.get("message");

  if (provider === "google") {
    window.history.replaceState({}, document.title, window.location.pathname);
    startGoogleSignIn(params.get("redirect") || undefined);
    return;
  }

  if (error && typeof (window as any).showNotice === "function") {
    const messages: Record<string, string> = {
      oauth_failed: "OAuth authentication failed. Please try again.",
      access_denied: "Access was denied. You may have cancelled the authentication process.",
      no_code: "No authorization code received from provider.",
      session_exchange_failed: "Failed to complete authentication. Please try again.",
      session_expired: message || "Your session has expired. Please sign in again.",
      cookie_set_failed: "Failed to set authentication cookies. Please check your browser settings.",
      unexpected_error: "An unexpected error occurred. Please try again.",
    };
    (window as any).showNotice({
      type: "error",
      title: "Authentication Error",
      message: messages[error] || message || "An error occurred during authentication",
      persist: true,
    });
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

/** Attach global handler and click listener. Call once when script loads. */
function installGlobalHandler(): void {
  (window as any).handleGoogleSignup = (e?: Event) => {
    if (e) e.preventDefault();
    startGoogleSignIn();
  };

  document.addEventListener("auth-google-request", () => startGoogleSignIn());

  document.addEventListener(
    "click",
    (e) => {
      const btn = (e.target as HTMLElement).closest?.(
        '.provider-btn[data-provider="google"]'
      ) as HTMLButtonElement | null;
      if (btn && !btn.disabled) {
        e.stopImmediatePropagation();
        startGoogleSignIn();
      }
    },
    true
  );
}

installGlobalHandler();

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (window.location.pathname === "/auth/login") {
        handleLoginPageQueryParams();
      }
    });
  } else if (window.location.pathname === "/auth/login") {
    handleLoginPageQueryParams();
  }
}
