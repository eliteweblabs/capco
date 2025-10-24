import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.DATABASE_URL;
const supabaseAnonKey =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

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
