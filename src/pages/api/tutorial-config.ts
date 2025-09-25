import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set session
    const { data: session, error: sessionError } = await supabase!.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !session.session?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { userId, tutorialId } = body;

    if (!userId || !tutorialId) {
      return new Response(JSON.stringify({ error: "Missing userId or tutorialId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has permission to access this tutorial config
    if (session.session.user.id !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Try to get existing tutorial config
    const { data: existingConfig, error: fetchError } = await supabase!
      .from("tutorial_configs")
      .select("*")
      .eq("user_id", userId)
      .eq("tutorial_id", tutorialId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching tutorial config:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch tutorial config" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return existing config or create default
    if (existingConfig) {
      return new Response(JSON.stringify(existingConfig), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Create default config
      const defaultConfig = {
        user_id: userId,
        tutorial_id: tutorialId,
        completed: false,
        dismissed: false,
        last_step: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return new Response(JSON.stringify(defaultConfig), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in tutorial-config POST:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set session
    const { data: session, error: sessionError } = await supabase!.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !session.session?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { user_id, tutorial_id, completed, dismissed, last_step } = body;

    if (!user_id || !tutorial_id) {
      return new Response(JSON.stringify({ error: "Missing user_id or tutorial_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has permission to update this tutorial config
    if (session.session.user.id !== user_id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update or create tutorial config
    const { data: updatedConfig, error: updateError } = await supabase!
      .from("tutorial_configs")
      .upsert({
        user_id,
        tutorial_id,
        completed: completed || false,
        dismissed: dismissed || false,
        last_step: last_step || 0,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (updateError) {
      console.error("Error updating tutorial config:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update tutorial config" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updatedConfig), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in tutorial-config PUT:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set session
    const { data: session, error: sessionError } = await supabase!.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !session.session?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { userId, tutorialId } = body;

    if (!userId || !tutorialId) {
      return new Response(JSON.stringify({ error: "Missing userId or tutorialId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has permission to delete this tutorial config
    if (session.session.user.id !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete tutorial config
    const { error: deleteError } = await supabase!
      .from("tutorial_configs")
      .delete()
      .eq("user_id", userId)
      .eq("tutorial_id", tutorialId);

    if (deleteError) {
      console.error("Error deleting tutorial config:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete tutorial config" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in tutorial-config DELETE:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
