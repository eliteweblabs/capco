import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using the service role key
// Note: This file must ONLY be imported from server code (e.g., API routes)
const supabaseUrl = import.meta.env.DATABASE_URL;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          // For server-side usage: do not persist session or auto-refresh
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;
