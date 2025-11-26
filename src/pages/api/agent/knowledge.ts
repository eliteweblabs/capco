/**
 * AI Agent Knowledge Base API
 * 
 * Manage knowledge base entries for the AI agent
 * 
 * GET /api/agent/knowledge - List knowledge entries
 * POST /api/agent/knowledge - Create knowledge entry
 * PUT /api/agent/knowledge?id={id} - Update knowledge entry
 * DELETE /api/agent/knowledge?id={id} - Delete knowledge entry
 */

import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

interface KnowledgeEntry {
  id?: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  priority?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

// GET - List knowledge entries
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    const isAdmin = profile?.role === "Admin";

    // Build query - include user's own entries even if inactive, and all active entries
    let query = supabaseAdmin
      .from("ai_agent_knowledge")
      .select("*")
      .or(`isActive.eq.true,authorId.eq.${currentUser.id}`)
      .order("priority", { ascending: false })
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq("category", category);
    }

    // Non-admins can only see active entries (RLS handles this)
    const { data: entries, error } = await query;

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        entries: entries || [],
        isAdmin,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [AGENT-KNOWLEDGE] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch knowledge entries",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// POST - Create knowledge entry
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: KnowledgeEntry = await request.json();
    const { title, content, category, tags, priority, metadata } = body;

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "Title and content are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { data: entry, error } = await supabaseAdmin
      .from("ai_agent_knowledge")
      .insert({
        title,
        content,
        category: category || null,
        tags: tags || [],
        priority: priority || 0,
        isActive: true,
        authorId: currentUser.id,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        entry,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [AGENT-KNOWLEDGE] Error:", error);
    console.error("❌ [AGENT-KNOWLEDGE] Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return new Response(
      JSON.stringify({
        error: "Failed to create knowledge entry",
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// PUT - Update knowledge entry
export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: Partial<KnowledgeEntry> = await request.json();

    // Check permissions (admin or owner)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    const isAdmin = profile?.role === "Admin";

    if (!isAdmin) {
      // Verify ownership
      const { data: existing } = await supabaseAdmin
        .from("ai_agent_knowledge")
        .select("authorId")
        .eq("id", id)
        .single();

      if (!existing || existing.authorId !== currentUser.id) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const { data: entry, error } = await supabaseAdmin
      .from("ai_agent_knowledge")
      .update({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        entry,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [AGENT-KNOWLEDGE] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update knowledge entry",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// DELETE - Delete knowledge entry
export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check permissions (admin or owner)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    const isAdmin = profile?.role === "Admin";

    if (!isAdmin) {
      // Verify ownership
      const { data: existing } = await supabaseAdmin
        .from("ai_agent_knowledge")
        .select("authorId")
        .eq("id", id)
        .single();

      if (!existing || existing.authorId !== currentUser.id) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const { error } = await supabaseAdmin
      .from("ai_agent_knowledge")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Knowledge entry deleted",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [AGENT-KNOWLEDGE] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to delete knowledge entry",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

