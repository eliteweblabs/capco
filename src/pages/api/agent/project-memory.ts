/**
 * AI Agent Project Memory API
 *
 * Manage project-specific memory (like Claude.ai's project memory)
 * Stores "Purpose & context" and "Current state" for each project
 *
 * GET /api/agent/project-memory?projectId={id} - Get project memory
 * POST /api/agent/project-memory - Create/update project memory
 * PUT /api/agent/project-memory?projectId={id} - Update project memory
 */

import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

interface ProjectMemoryRequest {
  projectId: number;
  purposeContext?: string;
  currentState?: string;
}

// GET - Get project memory
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
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify user has access to project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, authorId")
      .eq("id", parseInt(projectId))
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check permissions (Admin or project author)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    const isAdmin = profile?.role === "Admin";
    const isAuthor = project.authorId === currentUser.id;

    if (!isAdmin && !isAuthor) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get project memory
    const { data: memory, error } = await supabaseAdmin
      .from("ai_agent_project_memory")
      .select("*")
      .eq("projectId", parseInt(projectId))
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found, which is OK (no memory yet)
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        memory: memory || {
          projectId: parseInt(projectId),
          purposeContext: null,
          currentState: null,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [AGENT-PROJECT-MEMORY] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch project memory",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// POST/PUT - Create or update project memory
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

    const body: ProjectMemoryRequest = await request.json();
    const { projectId, purposeContext, currentState } = body;

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify user has access to project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, authorId")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check permissions (Admin or project author)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    const isAdmin = profile?.role === "Admin";
    const isAuthor = project.authorId === currentUser.id;

    if (!isAdmin && !isAuthor) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if memory exists
    const { data: existing } = await supabaseAdmin
      .from("ai_agent_project_memory")
      .select("id")
      .eq("projectId", projectId)
      .single();

    let memory;
    if (existing) {
      // Update existing
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("ai_agent_project_memory")
        .update({
          purposeContext: purposeContext !== undefined ? purposeContext : null,
          currentState: currentState !== undefined ? currentState : null,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      memory = updated;
    } else {
      // Create new
      const { data: created, error: createError } = await supabaseAdmin
        .from("ai_agent_project_memory")
        .insert({
          projectId,
          purposeContext: purposeContext || null,
          currentState: currentState || null,
          authorId: currentUser.id,
        })
        .select()
        .single();

      if (createError) throw createError;
      memory = created;
    }

    return new Response(
      JSON.stringify({
        success: true,
        memory,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [AGENT-PROJECT-MEMORY] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to save project memory",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// PUT - Alias for POST (same functionality)
export const PUT: APIRoute = async (context) => {
  return POST(context);
};
