/**
 * Debug Memory Loading API
 * 
 * This endpoint helps debug what memory/knowledge is being loaded for the agent
 * GET /api/agent/debug-memory?projectId=123
 */

import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const GET: APIRoute = async ({ request, cookies, url }) => {
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

    const projectIdParam = url.searchParams.get("projectId");
    const projectId = projectIdParam ? parseInt(projectIdParam) : undefined;

    // Load knowledge base (same logic as agent)
    let knowledgeQuery = supabaseAdmin
      .from("ai_agent_knowledge")
      .select("id, title, content, category, priority, projectId, isActive")
      .eq("isActive", true);

    if (projectId) {
      knowledgeQuery = knowledgeQuery.or(`projectId.is.null,projectId.eq.${projectId}`);
    } else {
      knowledgeQuery = knowledgeQuery.is("projectId", null);
    }

    knowledgeQuery = knowledgeQuery
      .order("priority", { ascending: false })
      .order("createdAt", { ascending: false })
      .limit(50);

    const { data: knowledgeEntries, error: knowledgeError } = await knowledgeQuery;

    // Load project memory if projectId provided
    let projectMemory = null;
    if (projectId) {
      const { data: memory, error: memoryError } = await supabaseAdmin
        .from("ai_agent_project_memory")
        .select("purposeContext, currentState")
        .eq("projectId", projectId)
        .single();

      if (!memoryError) {
        projectMemory = memory;
      }
    }

    // Count total entries
    const { count: totalCount } = await supabaseAdmin
      .from("ai_agent_knowledge")
      .select("*", { count: "exact", head: true })
      .eq("isActive", true);

    const { count: activeCount } = await supabaseAdmin
      .from("ai_agent_knowledge")
      .select("*", { count: "exact", head: true })
      .eq("isActive", true);

    return new Response(
      JSON.stringify({
        success: true,
        debug: {
          projectId,
          userId: currentUser.id,
          knowledge: {
            loaded: knowledgeEntries?.length || 0,
            total: totalCount || 0,
            active: activeCount || 0,
            entries: knowledgeEntries || [],
            error: knowledgeError?.message || null,
          },
          projectMemory: {
            exists: !!projectMemory,
            data: projectMemory,
          },
          summary: {
            willLoadKnowledge: (knowledgeEntries?.length || 0) > 0,
            willLoadProjectMemory: !!projectMemory,
            totalMemorySize: JSON.stringify({
              knowledge: knowledgeEntries || [],
              projectMemory,
            }).length,
          },
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [AGENT-DEBUG-MEMORY] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to debug memory",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

