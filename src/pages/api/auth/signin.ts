import type { Provider } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import { setAuthCookies } from "../../../lib/auth-cookies";
import { ensureUserProfile } from "../../../lib/auth-utils";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Check if Supabase is configured
  if (!supabase) {
    return new Response("Supabase is not configured", { status: 500 });
  }

  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const provider = formData.get("provider")?.toString();

  if (provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: `${import.meta.env.SITE_URL || "https://capcofire.com"}/api/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      return new Response(error.message, { status: 500 });
    }

    return redirect(data.url);
  }

  if (!email || !password) {
    return new Response("Email and password are required", { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  // Check if user has a profile, create one if not
  if (data.user) {
    console.log("Checking/creating profile for user:", data.user.id);
    await ensureUserProfile(data.user);
  }

  const { access_token, refresh_token } = data.session;

  // Use shared utility for consistent cookie handling
  setAuthCookies(cookies, access_token, refresh_token);

  return redirect("/dashboard");
};
