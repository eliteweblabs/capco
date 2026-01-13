import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

/**
 * Voice Assistant Remember API
 * Saves conversation to Supabase ai_agent_knowledge table
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const {
      title,
      content,
      category = "conversation_memory",
      tags = [],
      priority = 0,
    } = await request.json();

    if (!title || !content) {
      return new Response(JSON.stringify({ error: "Title and content are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SECRET ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.PUBLIC_SUPABASE_PUBLISHABLE;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [VOICE-ASSISTANT-REMEMBER] Supabase not configured");
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Insert into ai_agent_knowledge table
    const { data, error } = await supabase
      .from("ai_agent_knowledge")
      .insert({
        title: title.substring(0, 255), // Ensure title fits
        content: content,
        category: category,
        tags: Array.isArray(tags) ? tags : [], // Store tags as array
        isActive: true,
        priority: parseInt(priority, 10) || 0, // Use provided priority or default to 0
        projectId: null, // Global knowledge
      })
      .select()
      .single();

    if (error) {
      console.error("❌ [VOICE-ASSISTANT-REMEMBER] Error saving:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Failed to save conversation" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ [VOICE-ASSISTANT-REMEMBER] Conversation saved:", data.id);

    return new Response(
      JSON.stringify({
        success: true,
        id: data.id,
        message: "Conversation saved successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [VOICE-ASSISTANT-REMEMBER] Error:", error);

    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
