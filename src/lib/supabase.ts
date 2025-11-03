import { createClient } from "@supabase/supabase-js";

// Use new Supabase API keys: PUBLIC_SUPABASE_PUBLISHABLE (replaces PUBLIC_SUPABASE_ANON_KEY)
// Fallback to legacy keys for backwards compatibility
// For server-side, also check process.env as Railway might expose them there
const supabaseUrl =
  import.meta.env.PUBLIC_SUPABASE_URL ||
  (typeof process !== "undefined" ? process.env.PUBLIC_SUPABASE_URL : undefined);
const supabasePublishableKey =
  import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE ||
  (typeof process !== "undefined" ? process.env.PUBLIC_SUPABASE_PUBLISHABLE : undefined) ||
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
  (typeof process !== "undefined" ? process.env.PUBLIC_SUPABASE_ANON_KEY : undefined);

// Debug logging (always log in production to help diagnose Railway issues)
// Use [--- prefix for server-side logs that should be visible in production
if (typeof window === "undefined") {
  const envCheck = {
    hasPublicUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
    hasPublicUrlProcess: typeof process !== "undefined" ? !!process.env.PUBLIC_SUPABASE_URL : false,
    hasPublishableKey: !!import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE,
    hasPublishableKeyProcess:
      typeof process !== "undefined" ? !!process.env.PUBLIC_SUPABASE_PUBLISHABLE : false,
    hasLegacyKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    hasLegacyKeyProcess:
      typeof process !== "undefined" ? !!process.env.PUBLIC_SUPABASE_ANON_KEY : false,
    finalUrl: !!supabaseUrl,
    finalKey: !!supabasePublishableKey,
    urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "MISSING",
  };

  if (!supabaseUrl || !supabasePublishableKey) {
    console.error(
      "[---SUPABASE-CLIENT] Supabase not configured - missing environment variables:",
      envCheck
    );
  } else {
    console.log("[---SUPABASE-CLIENT] Supabase configured successfully:", {
      ...envCheck,
      urlPreview: supabaseUrl.substring(0, 30) + "...",
    });
  }
}

// Only create client if environment variables are available
export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          flowType: "pkce",
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      })
    : null;
