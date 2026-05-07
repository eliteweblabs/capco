/**
 * OAuth /auth/callback PKCE completion (browser only).
 * Built to public/scripts/auth-callback.js — same pattern as auth-google.js so prod never depends
 * on a page-specific Astro chunk that can 404.
 *
 * Do not import shared supabase-client.ts here: esbuild replaces only direct `import.meta.env.VAR`;
 * optional-chained `import.meta.env?.VAR` survives and becomes empty under IIFE.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function createAuthStorage(): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
} {
  return {
    getItem: (key: string): string | null => {
      try {
        const value = window.localStorage.getItem(key);
        if (key.includes("code-verifier") || key.includes("auth-token")) {
          console.log(`[SUPABASE-STORAGE] getItem(${key}):`, value ? "found" : "not found");
        }
        return value;
      } catch (error) {
        console.error(`[SUPABASE-STORAGE] Error reading ${key}:`, error);
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        window.localStorage.setItem(key, value);
        if (key.includes("code-verifier")) {
          console.log(`[SUPABASE-STORAGE] setItem(${key}): stored code verifier`);
        }
      } catch (error) {
        console.error(`[SUPABASE-STORAGE] Error writing ${key}:`, error);
      }
    },
    removeItem: (key: string): void => {
      try {
        window.localStorage.removeItem(key);
        if (key.includes("code-verifier")) {
          console.log(`[SUPABASE-STORAGE] removeItem(${key}): removed code verifier`);
        }
      } catch (error) {
        console.error(`[SUPABASE-STORAGE] Error removing ${key}:`, error);
      }
    },
  };
}

let callbackSupabaseSingleton: SupabaseClient | null = null;

/** Supabase browser client for PKCE callback only (embedded PUBLIC_* vars at bundle time). */
function getCallbacksSupabaseClient(): SupabaseClient | null {
  if (callbackSupabaseSingleton) {
    return callbackSupabaseSingleton;
  }

  const supabaseUrlFallback =
    typeof (globalThis as any).__PUBLIC_SUPABASE_URL__ === "string"
      ? (globalThis as any).__PUBLIC_SUPABASE_URL__
      : "";
  const supabaseKeyFallback =
    typeof (globalThis as any).__PUBLIC_SUPABASE_PUBLISHABLE__ === "string"
      ? (globalThis as any).__PUBLIC_SUPABASE_PUBLISHABLE__
      : "";

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || supabaseUrlFallback || "";
  const supabasePublishableKey =
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE || supabaseKeyFallback || "";

  if (!supabaseUrl || !supabasePublishableKey) {
    console.warn("[AUTH-CALLBACK] Supabase public URL/key missing after bundle");
    return null;
  }

  callbackSupabaseSingleton = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storage: createAuthStorage(),
      storageKey: `sb-${supabaseUrl.split("//")[1].split(".")[0]}-auth-token`,
    },
  });

  return callbackSupabaseSingleton;
}

type AuthCallbackWindow = Window & {
  __AUTH_CALLBACK_DATA?: {
    capturedCode: string | null;
    capturedError: string | null;
    capturedErrorDescription: string | null;
    capturedRedirect: string;
  };
  __authCallbackSlowTimeout?: ReturnType<typeof setTimeout>;
  __AUTH_CALLBACK_STALE_GUARD?: ReturnType<typeof setTimeout>;
};

const WD = globalThis as unknown as AuthCallbackWindow;
const _acd = WD.__AUTH_CALLBACK_DATA;
const capturedCode = _acd?.capturedCode ?? null;
const capturedError = _acd?.capturedError ?? null;
const capturedErrorDescription = _acd?.capturedErrorDescription ?? null;
const capturedRedirect = _acd?.capturedRedirect ?? "/project/dashboard";
const slowTimeout = WD.__authCallbackSlowTimeout;

function withDeadline<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let t: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    t = setTimeout(
      () =>
        reject(
          new Error(
            `${label} timed out after ${ms / 1000}s. Check DevTools Network for blocked or pending requests to your Supabase project (*.supabase.co) or /api/auth/callback.`
          )
        ),
      ms
    );
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(t)) as Promise<T>;
}

/** Run after inline script sets window.__AUTH_CALLBACK_DATA */
export async function runAuthCallbackClient(): Promise<void> {
  const supabase = getCallbacksSupabaseClient();

  if (!supabase) {
    console.error("[AUTH-CALLBACK] Failed to create Supabase client");
  } else {
    console.log("[AUTH-CALLBACK] Supabase client created, detectSessionInUrl should process URL");
  }

  async function handleCallback(): Promise<void> {
    console.log("[AUTH-CALLBACK] Environment check:", {
      hasPublicUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
      hasPublishableKey: !!import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE,
    });

    if (!supabase) {
      showError("Supabase configuration missing");
      return;
    }

    console.log("[AUTH-CALLBACK] Using pre-initialized Supabase client");

    let authStateSubscription: { unsubscribe: () => void } | null = null;

    const authStatePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (authStateSubscription) {
          authStateSubscription.unsubscribe();
        }
        reject(new Error("Auth state change timeout"));
      }, 15000);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        console.log(
          "[AUTH-CALLBACK] Auth state changed:",
          event,
          "INITIAL_SESSION",
          session?.user?.email || "undefined"
        );
        if (event === "SIGNED_IN" && session) {
          clearTimeout(timeout);
          if (authStateSubscription) {
            authStateSubscription.unsubscribe();
          }
          resolve(session);
        } else if (event === "TOKEN_REFRESHED" && session) {
          clearTimeout(timeout);
          if (authStateSubscription) {
            authStateSubscription.unsubscribe();
          }
          resolve(session);
        }
      });

      authStateSubscription = subscription;
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    console.log("[AUTH-CALLBACK] Manually checking for session...");
    const { data: initialSession } = await withDeadline(
      supabase.auth.getSession(),
      15000,
      "getSession()"
    );
    if (initialSession?.session) {
      console.log("[AUTH-CALLBACK] ✅ Session already exists from automatic detection!");
      const ac = new AbortController();
      const postTimer = setTimeout(() => ac.abort(), 45000);
      let response: Response;
      try {
        response = await fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: ac.signal,
          body: JSON.stringify({
            access_token: initialSession.session.access_token,
            refresh_token: initialSession.session.refresh_token,
            expires_in: initialSession.session.expires_in,
            token_type: initialSession.session.token_type || "bearer",
          }),
        });
      } finally {
        clearTimeout(postTimer);
      }

      if (response.ok) {
        clearTimeout(slowTimeout);
        console.log("[AUTH-CALLBACK] Authentication successful, redirecting...");
        await new Promise((resolve) => setTimeout(resolve, 300));
        const redirectUrl = capturedRedirect || "/project/dashboard";
        try {
          localStorage.removeItem("post-auth-redirect");
        } catch {
          /* ignore */
        }
        console.log("[AUTH-CALLBACK] Redirecting to:", redirectUrl);
        window.location.replace(redirectUrl);
        return;
      }
    }

    try {
      console.log("[AUTH-CALLBACK] Starting PKCE flow...");
      console.log("[AUTH-CALLBACK] Current URL:", window.location.href);
      console.log("[AUTH-CALLBACK] Current search params:", window.location.search);
      console.log("[AUTH-CALLBACK] Current hash:", window.location.hash);

      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      let code = capturedCode || urlParams.get("code") || hashParams.get("code");
      let error = capturedError || urlParams.get("error") || hashParams.get("error");
      let errorDescription =
        capturedErrorDescription ||
        urlParams.get("error_description") ||
        hashParams.get("error_description");

      if (!error) {
        const errorParam = urlParams.get("error") || hashParams.get("error");
        if (errorParam) error = errorParam;
      }

      console.log("[AUTH-CALLBACK] Extracted params:", {
        code: code ? `${code.substring(0, 20)}...` : null,
        error,
        errorDescription,
        hasQueryCode: !!urlParams.get("code"),
        hasHashCode: !!hashParams.get("code"),
      });

      if (error) {
        console.error("[AUTH-CALLBACK] OAuth error:", error, errorDescription);
        showError(`Authentication failed: ${errorDescription || error}`);
        setTimeout(() => {
          window.location.href = "/auth/login?error=oauth_failed";
        }, 3000);
        return;
      }

      if (!code) {
        console.error("[AUTH-CALLBACK] No authorization code in URL");
        showError("No authorization code received. Please check the browser console for details.");
        setTimeout(() => {
          window.location.href = "/auth/login?error=no_code";
        }, 5000);
        return;
      }

      if (
        code &&
        !window.location.search.includes("code=") &&
        !window.location.hash.includes("code=")
      ) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("code", code);
        window.history.replaceState({}, "", newUrl.toString());
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      let data: { session: import("@supabase/supabase-js").Session } | undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let exchangeError: any = null;

      console.log("[AUTH-CALLBACK] Exchanging code for session...");
      try {
        const exchangeResult = await withDeadline(
          supabase.auth.exchangeCodeForSession(code),
          25000,
          "exchangeCodeForSession (Google PKCE)"
        );
        data = exchangeResult.data;
        exchangeError = exchangeResult.error;
        if (data?.session && !exchangeError) {
          console.log("[AUTH-CALLBACK] ✅ Exchange succeeded immediately");
        } else if (exchangeError) {
          console.warn("[AUTH-CALLBACK] Initial exchange failed:", exchangeError.message);
        }
      } catch (err) {
        console.warn("[AUTH-CALLBACK] Initial exchange exception:", err);
        exchangeError = err instanceof Error ? err : new Error(String(err));
      }

      if (!data?.session) {
        console.log("[AUTH-CALLBACK] Trying automatic session detection...");
        try {
          const autoSession = await Promise.race([
            authStatePromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000)),
          ]).catch(() => null);
          if (autoSession) {
            data = { session: autoSession };
            exchangeError = null;
            console.log("[AUTH-CALLBACK] ✅ Session from auth state change");
          }
        } catch (_) {
          /* ignore */
        }

        if (!data?.session) {
          const { data: sessionData, error: sessionError } = await withDeadline(
            supabase.auth.getSession(),
            15000,
            "getSession() after PKCE"
          );
          if (sessionData?.session && !sessionError) {
            data = sessionData;
            exchangeError = null;
            console.log("[AUTH-CALLBACK] ✅ Session from getSession()");
          }
        }

        if (!data?.session && !exchangeError) {
          console.log("[AUTH-CALLBACK] Attempting manual exchangeCodeForSession...");
          try {
            const exchangeResult = await withDeadline(
              supabase.auth.exchangeCodeForSession(code),
              25000,
              "exchangeCodeForSession (retry)"
            );
            data = exchangeResult.data;
            exchangeError = exchangeResult.error;
          } catch (err) {
            exchangeError = err instanceof Error ? err : new Error(String(err));
          }
        }
      }

      if (!data?.session && !exchangeError) {
        console.log("[AUTH-CALLBACK] Checking getSession() and code verifier for manual exchange...");
        const { data: sessionData, error: sessionError } = await withDeadline(
          supabase.auth.getSession(),
          15000,
          "getSession() (manual path)"
        );
        if (sessionData?.session && !sessionError) {
          data = sessionData;
          exchangeError = null;
        } else {
          console.warn("[AUTH-CALLBACK] Automatic detection failed, attempting manual exchange...");
          console.warn("[AUTH-CALLBACK] This requires code_verifier to be stored by Supabase");

          const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
          if (supabaseUrl) {
            const supabaseProjectRef = supabaseUrl.split("//")[1].split(".")[0];

            const possibleKeys = [
              `sb-${supabaseProjectRef}-auth-token-code-verifier`,
              `sb-${supabaseProjectRef}-code-verifier`,
              `supabase.auth.token.code_verifier`,
              `supabase-auth-token-code-verifier`,
            ];

            let codeVerifier: string | null = null;
            let foundKey: string | null = null;

            for (const key of possibleKeys) {
              const value = localStorage.getItem(key);
              if (value) {
                codeVerifier = value;
                foundKey = key;
                break;
              }
            }

            console.log("[AUTH-CALLBACK] Code verifier check:", {
              checkedKeys: possibleKeys,
              foundKey: foundKey,
              found: !!codeVerifier,
              codeLength: code?.length || 0,
            });

            if (!codeVerifier) {
              console.error("[AUTH-CALLBACK] ❌ Code verifier not found in localStorage!");
              const allAuthKeys = Object.keys(localStorage).filter(
                (k) => k.includes("supabase") || k.includes("sb-") || k.includes("auth")
              );
              console.error("[AUTH-CALLBACK] Available localStorage keys:", allAuthKeys);
              console.warn(
                "[AUTH-CALLBACK] Proceeding anyway - Supabase may have stored verifier internally"
              );
            } else {
              console.log("[AUTH-CALLBACK] ✅ Code verifier found at key:", foundKey);
            }
          }

          if (!exchangeError) {
            try {
              console.log(
                "[AUTH-CALLBACK] Calling exchangeCodeForSession with code:",
                code?.substring(0, 20) + "..."
              );
              const exchangeResult = await withDeadline(
                supabase.auth.exchangeCodeForSession(code),
                25000,
                "exchangeCodeForSession (last resort)"
              );
              data = exchangeResult.data;
              exchangeError = exchangeResult.error;

              if (exchangeError) {
                console.error("[AUTH-CALLBACK] Manual exchange failed:", exchangeError);
              } else if (data?.session) {
                console.log("[AUTH-CALLBACK] ✅ Manual exchange succeeded!");
                console.log("[AUTH-CALLBACK] User:", data.session.user?.email);
              }
            } catch (err) {
              console.error("[AUTH-CALLBACK] Manual exchange exception:", err);
              exchangeError = err instanceof Error ? err : new Error("Unknown error");
            }
          }
        }
      }

      if (exchangeError) {
        console.error("[AUTH-CALLBACK] Session exchange error:", exchangeError);
        const errorMsg = exchangeError.message || "";

        if (errorMsg.includes("code verifier") || errorMsg.includes("Code verifier")) {
          console.warn(
            "[AUTH-CALLBACK] Code verifier missing - clearing auth state and redirecting"
          );

          const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
          if (supabaseUrl) {
            const supabaseProjectRef = supabaseUrl.split("//")[1].split(".")[0];
            const keysToRemove = Object.keys(localStorage).filter(
              (k) => k.includes(`sb-${supabaseProjectRef}`) || k.includes("supabase")
            );
            keysToRemove.forEach((k) => localStorage.removeItem(k));
            console.log("[AUTH-CALLBACK] Cleared stale localStorage keys:", keysToRemove);
          }

          showError(
            "Sign-in could not be completed (security code missing). Use “Try again with Google” below in this same tab, or start from the login page in one tab only."
          );
          const redirectNote = document.getElementById("error-redirect");
          if (redirectNote) redirectNote.textContent = "";
          const backLink = document.getElementById("back-link");
          if (backLink) backLink.classList.remove("hidden");
          return;
        }

        showError(`Session exchange failed: ${exchangeError.message}`);
        setTimeout(() => {
          window.location.href =
            "/auth/login?error=session_exchange_failed&message=" +
            encodeURIComponent(exchangeError.message || "");
        }, 5000);
        return;
      }

      if (!data?.session) {
        console.error("[AUTH-CALLBACK] No session created");
        showError("No session created");
        setTimeout(() => {
          window.location.href = "/auth/login?error=no_session";
        }, 3000);
        return;
      }

      console.log("[AUTH-CALLBACK] Session created successfully:", {
        userId: data.session.user?.id,
        email: data.session.user?.email,
      });

      console.log("[AUTH-CALLBACK] Sending tokens to server...");
      const ac2 = new AbortController();
      const postTimer2 = setTimeout(() => ac2.abort(), 45000);
      let response: Response;
      try {
        response = await fetch("/api/auth/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          signal: ac2.signal,
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_in: data.session.expires_in,
            token_type: data.session.token_type || "bearer",
          }),
        });
      } finally {
        clearTimeout(postTimer2);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[AUTH-CALLBACK] Server callback error:", response.status, errorText);
        let serverMsg = "Failed to set authentication cookies.";
        try {
          const j = JSON.parse(errorText);
          if (j && typeof j.error === "string") serverMsg = j.error;
        } catch {
          /* ignore */
        }
        showError(serverMsg);
        setTimeout(() => {
          window.location.href =
            "/auth/login?error=cookie_set_failed&message=" + encodeURIComponent(serverMsg);
        }, 3000);
        return;
      }

      console.log("[AUTH-CALLBACK] Authentication successful, redirecting to dashboard...");
      clearTimeout(slowTimeout);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const redirectUrl = capturedRedirect || "/project/dashboard";
      try {
        localStorage.removeItem("post-auth-redirect");
      } catch {
        /* ignore */
      }
      console.log("[AUTH-CALLBACK] Final redirect to:", redirectUrl);
      window.location.replace(redirectUrl);
    } catch (err) {
      console.error("[AUTH-CALLBACK] Unexpected error:", err);
      showError(`Unexpected error: ${err instanceof Error ? err.message : "Unknown error"}`);
      setTimeout(() => {
        window.location.href = "/auth/login?error=unexpected_error";
      }, 3000);
    }
  }

  function showError(message: string): void {
    clearTimeout(slowTimeout);
    if (WD.__AUTH_CALLBACK_STALE_GUARD) {
      clearTimeout(WD.__AUTH_CALLBACK_STALE_GUARD);
    }
    const loadingWrap = document.getElementById("loading-container");
    if (loadingWrap) loadingWrap.classList.add("hidden");
    const tooLong = document.getElementById("taking-too-long");
    if (tooLong) tooLong.classList.add("hidden");
    const errorContainer = document.getElementById("error");
    const errorMessage = document.getElementById("error-message");
    const backLink = document.getElementById("back-link");

    if (errorContainer && errorMessage) {
      errorMessage.textContent = message;
      errorContainer.classList.remove("hidden");
      setTimeout(() => {
        if (backLink) {
          backLink.classList.remove("hidden");
        }
      }, 2000);
    }
  }

  await handleCallback();
}

// IIFE entry for standalone bundle
void runAuthCallbackClient().catch((err) => {
  console.error("[AUTH-CALLBACK] Unhandled error:", err);
  const errorMessage = err instanceof Error ? err.message : "Sign-in failed. Please try again.";
  clearTimeout(WD.__authCallbackSlowTimeout);
  if (WD.__AUTH_CALLBACK_STALE_GUARD) {
    clearTimeout(WD.__AUTH_CALLBACK_STALE_GUARD);
  }
  const loadingWrap = document.getElementById("loading-container");
  if (loadingWrap) loadingWrap.classList.add("hidden");
  const tooLong = document.getElementById("taking-too-long");
  if (tooLong) tooLong.classList.add("hidden");
  const errorContainer = document.getElementById("error");
  const errorMsgEl = document.getElementById("error-message");
  if (errorContainer && errorMsgEl) {
    errorMsgEl.textContent = errorMessage;
    errorContainer.classList.remove("hidden");
  }
  setTimeout(() => {
    window.location.href = "/auth/login?error=unexpected_error";
  }, 3000);
});
