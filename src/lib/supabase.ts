import { createClient } from "@supabase/supabase-js";

// Use new Supabase API keys: PUBLIC_SUPABASE_PUBLISHABLE (replaces PUBLIC_SUPABASE_ANON_KEY)
// Fallback to legacy keys for backwards compatibility
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Debug logging (always log in production to help diagnose Railway issues)
// Use [--- prefix for server-side logs that should be visible in production
if (typeof window === "undefined") {
  const envCheck = {
    hasPublicUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
    hasPublishableKey: !!import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE,
    hasLegacyKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
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
