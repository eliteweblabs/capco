import { createClient } from "@supabase/supabase-js";

// Try PUBLIC_ first (for client-side)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Debug logging (always log in production to help diagnose Railway issues)
// Use [--- prefix for server-side logs that should be visible in production
if (typeof window === "undefined") {
  const envCheck = {
    hasPublicUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
    hasPublicKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    hasUrl: !!import.meta.env.SUPABASE_URL,
    hasKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    finalUrl: !!supabaseUrl,
    finalKey: !!supabaseAnonKey,
    urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "MISSING",
  };

  if (!supabaseUrl || !supabaseAnonKey) {
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
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          flowType: "pkce",
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      })
    : null;
