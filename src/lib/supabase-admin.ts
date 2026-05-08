import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using the secret key (SUPABASE_SECRET)
// Note: This file must ONLY be imported from server code (e.g., API routes)
// For server-side, also check process.env as Railway might expose them there
const supabaseUrl =
  import.meta.env.PUBLIC_SUPABASE_URL ||
  (typeof process !== "undefined" ? process.env.PUBLIC_SUPABASE_URL : undefined) ||
  import.meta.env.SUPABASE_URI ||
  (typeof process !== "undefined" ? process.env.SUPABASE_URI : undefined);

// Prefer SUPABASE_SECRET; many hosts (e.g. Railway templates) use SUPABASE_SERVICE_ROLE_KEY only.
const supabaseSecretKey =
  import.meta.env.SUPABASE_SECRET ||
  (typeof process !== "undefined" ? process.env.SUPABASE_SECRET : undefined) ||
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
  (typeof process !== "undefined" ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined);

// Debug logging for server-side
if (typeof window === "undefined") {
  const envCheck = {
    hasSUPABASE_SECRET: !!(
      import.meta.env.SUPABASE_SECRET ||
      (typeof process !== "undefined" ? process.env.SUPABASE_SECRET : "")
    ),
    hasSUPABASE_SERVICE_ROLE_KEY: !!(
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
      (typeof process !== "undefined" ? process.env.SUPABASE_SERVICE_ROLE_KEY : "")
    ),
    finalUrl: !!supabaseUrl,
    finalServiceKey: !!supabaseSecretKey,
  };

  if (!supabaseUrl || !supabaseSecretKey) {
    console.error(
      "[---SUPABASE-ADMIN] Supabase admin client not configured — set PUBLIC_SUPABASE_URL and SUPABASE_SECRET (or SUPABASE_SERVICE_ROLE_KEY):",
      envCheck
    );
  } else {
    console.log("[---SUPABASE-ADMIN] Supabase admin client OK:", envCheck);
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
