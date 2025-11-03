import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using the secret key (replaces SUPABASE_ADMIN_KEY)
// Note: This file must ONLY be imported from server code (e.g., API routes)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URI;
// Use new SUPABASE_SECRET, fallback to legacy SUPABASE_ADMIN_KEY for backwards compatibility
const supabaseSecretKey = import.meta.env.SUPABASE_SECRET || import.meta.env.SUPABASE_ADMIN_KEY;

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
