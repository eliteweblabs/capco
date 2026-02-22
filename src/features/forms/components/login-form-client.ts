/**
 * Login form client logic. Loaded via <script client:load> from LoginForm.astro
 * so it is bundled as a normal module (not an Astro script chunk that can be empty in prod).
 */
import { getSupabaseClient } from "../../../lib/supabase-client";

function runOnLoad() {
  const urlParams = new URLSearchParams(window.location.search);
  const provider = urlParams.get("provider");
  if (provider === "google") {
    window.history.replaceState({}, document.title, "/auth/login");
    triggerGoogleOAuth();
    return;
  }

  const error = urlParams.get("error");
  const message = urlParams.get("message");

  if (error && (window as any).showNotice) {
    let errorMessage = message || "An error occurred during authentication";
    switch (error) {
      case "oauth_failed":
        errorMessage = "OAuth authentication failed. Please try again.";
        break;
      case "access_denied":
        errorMessage = "Access was denied. You may have cancelled the authentication process.";
        break;
      case "no_code":
        errorMessage = "No authorization code received from provider.";
        break;
      case "session_exchange_failed":
        errorMessage = "Failed to complete authentication. Please try again.";
        break;
      case "session_expired":
        errorMessage = message || "Your session has expired. Please sign in again.";
        break;
      case "cookie_set_failed":
        errorMessage =
          "Failed to set authentication cookies. Please check your browser settings.";
        break;
      case "unexpected_error":
        errorMessage = "An unexpected error occurred. Please try again.";
        break;
    }
    (window as any).showNotice({
      type: "error",
      title: "Authentication Error",
      message: errorMessage,
      persist: true,
    });
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

async function triggerGoogleOAuth(e?: Event) {
  if (e) e.preventDefault();

  const redirectDestination =
    (document.querySelector('input[name="redirect"]') as HTMLInputElement)?.value ||
    "/project/dashboard";

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
  if (supabaseUrl) {
    const supabaseProjectRef = supabaseUrl.split("//")[1].split(".")[0];
    const staleKeys = Object.keys(localStorage).filter(
      (k) => k.includes(`sb-${supabaseProjectRef}`) && !k.includes("code-verifier")
    );
    staleKeys.forEach((k) => localStorage.removeItem(k));
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    if ((window as any).showNotice) {
      (window as any).showNotice(
        "error",
        "Configuration Error",
        "Supabase is not configured. Please contact support."
      );
    }
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 200));

  const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectDestination)}`;

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error && (window as any).showNotice) {
      (window as any).showNotice("error", "Sign In Error", error.message);
    }
  } catch (err) {
    if ((window as any).showNotice) {
      (window as any).showNotice("error", "Sign In Error", "An unexpected error occurred");
    }
  }
}

(window as any).handleGoogleSignup = triggerGoogleOAuth;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runOnLoad);
} else {
  runOnLoad();
}

document.addEventListener("auth-google-request", () => triggerGoogleOAuth());

document.addEventListener(
  "click",
  (e) => {
    const btn = (e.target as HTMLElement).closest?.(
      '.provider-btn[data-provider="google"]'
    ) as HTMLButtonElement | null;
    if (btn && !btn.disabled) {
      e.stopImmediatePropagation();
      triggerGoogleOAuth(e as Event);
    }
  },
  true
);
