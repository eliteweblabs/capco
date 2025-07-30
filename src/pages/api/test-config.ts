import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async () => {
  const config = {
    hasSupabaseUrl: !!import.meta.env.SUPABASE_URL,
    hasSupabaseAnonKey: !!import.meta.env.SUPABASE_ANON_KEY,
    supabaseUrl: import.meta.env.SUPABASE_URL,
    supabaseAnonKey: import.meta.env.SUPABASE_ANON_KEY ? "***" : "missing",
    supabaseClient: !!supabase,
  };

  return new Response(JSON.stringify(config, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
