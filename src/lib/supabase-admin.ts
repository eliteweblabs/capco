import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using the secret key (SUPABASE_SECRET)
// Note: This file must ONLY be imported from server code (e.g., API routes)
// For server-side, also check process.env as Railway might expose them there
const supabaseUrl =
  import.meta.env.PUBLIC_SUPABASE_URL ||
  (typeof process !== "undefined" ? process.env.PUBLIC_SUPABASE_URL : undefined) ||
  import.meta.env.SUPABASE_URI ||
  (typeof process !== "undefined" ? process.env.SUPABASE_URI : undefined);

// Use SUPABASE_SECRET (Railway template uses SUPABASE_SERVICE_ROLE_KEY)
const supabaseSecretKey =
  import.meta.env.SUPABASE_SECRET ||
  (typeof process !== "undefined"
    ? process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
    : undefined);

// Debug logging for server-side
if (typeof window === "undefined") {
  const envCheck = {
    hasSecretKey: !!import.meta.env.SUPABASE_SECRET,
    hasSecretKeyProcess: typeof process !== "undefined" ? !!process.env.SUPABASE_SECRET : false,
    finalUrl: !!supabaseUrl,
    finalKey: !!supabaseSecretKey,
  };

  if (!supabaseUrl || !supabaseSecretKey) {
    console.error(
      "[---SUPABASE-ADMIN] Supabase admin client not configured - missing environment variables:",
      envCheck
    );
  } else {
    console.log("[---SUPABASE-ADMIN] Supabase admin client configured successfully:", envCheck);
  }
}

export const supabaseAdmin =
  supabaseUrl && supabaseSecretKey
    ? createClient(supabaseUrl, supabaseSecretKey, {
        auth: {
          // For server-side usage: do not persist session or auto-refresh
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;
