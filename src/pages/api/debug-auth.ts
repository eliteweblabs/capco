import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ cookies }) => {
  console.log("🔍 [DEBUG-AUTH] Checking authentication status");

  try {
    const { supabase } = await import("../../lib/supabase");

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Supabase client not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get auth tokens from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    console.log("🔍 [DEBUG-AUTH] Auth tokens:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length || 0,
      refreshTokenLength: refreshToken?.length || 0,
    });

    if (!accessToken || !refreshToken) {
      return new Response(
        JSON.stringify({
          error: "No auth tokens found",
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Set up session
    const { data: session, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      console.error("🔍 [DEBUG-AUTH] Session error:", sessionError);
      return new Response(
        JSON.stringify({
          error: "Session error",
          sessionError: sessionError.message,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!session.session?.user) {
      return new Response(
        JSON.stringify({
          error: "No user in session",
          session: session,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const user = session.session.user;
    console.log("🔍 [DEBUG-AUTH] User authenticated:", {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
    });

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("🔍 [DEBUG-AUTH] Profile error:", profileError);
      return new Response(
        JSON.stringify({
          error: "Profile error",
          profileError: profileError.message,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Test storage access
    const { data: storageTest, error: storageError } = await supabase.storage
      .from("project-documents")
      .list("", { limit: 1 });

    console.log("🔍 [DEBUG-AUTH] Storage test:", {
      hasStorageAccess: !storageError,
      storageError: storageError?.message,
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        profile: profile,
        storage: {
          hasAccess: !storageError,
          error: storageError?.message,
        },
        session: {
          hasSession: !!session.session,
          expiresAt: session.session?.expires_at,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("🔍 [DEBUG-AUTH] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Unexpected error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
