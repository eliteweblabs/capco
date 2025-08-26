import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async () => {
  // Check if Supabase is configured
  if (!supabase) {
    return new Response(
      JSON.stringify({
        error: "Supabase is not configured",
      }),
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("guestbook")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      { status: 500 }
    );
  }

  return new Response(JSON.stringify(data));
};

export const POST: APIRoute = async ({ request }) => {
  // Check if Supabase is configured
  if (!supabase) {
    return new Response(
      JSON.stringify({
        error: "Supabase is not configured",
      }),
      { status: 500 }
    );
  }

  const { name, message } = await request.json();
  const { data, error } = await supabase.from("guestbook").insert({ name, message }).select();

  if (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      { status: 500 }
    );
  }

  return new Response(JSON.stringify(data));
};
