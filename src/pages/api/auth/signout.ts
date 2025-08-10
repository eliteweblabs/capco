import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { clearAuthCookies } from "../../../lib/auth-cookies";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  console.log("Signout endpoint called");

  // Check if Supabase is configured
  if (!supabase) {
    console.error("Supabase is not configured");
    return new Response("Supabase is not configured", { status: 500 });
  }

  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Supabase signout error:", error);
    } else {
      console.log("Supabase signout successful");
    }

    // Clear auth cookies regardless of Supabase response
    console.log("Clearing auth cookies...");
    clearAuthCookies(cookies);

    console.log("Signout complete, redirecting to home");
    return redirect("/");
  } catch (error) {
    console.error("Unexpected error in signout:", error);

    // Clear cookies even if there's an error
    clearAuthCookies(cookies);

    return redirect("/");
  }
};

export const GET: APIRoute = async ({ cookies, redirect }) => {
  // Handle GET requests for signout (for direct links)
  console.log("GET signout called");

  try {
    // Sign out from Supabase
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase signout error:", error);
      }
    }

    // Clear auth cookies
    clearAuthCookies(cookies);

    return redirect("/");
  } catch (error) {
    console.error("Error in GET signout:", error);
    clearAuthCookies(cookies);
    return redirect("/");
  }
};
