/**
 * AI Agent Project Analysis API
 *
 * Analyze a project and provide insights
 *
 * POST /api/agent/analyze-project
 */

import type { APIRoute } from "astro";
import { UnifiedFireProtectionAgent } from "../../../lib/ai/unified-agent";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

interface AnalyzeProjectRequest {
  projectId: number;
}

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

    const body: AnalyzeProjectRequest = await request.json();
    const { projectId } = body;

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

    // Initialize AI agent
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const agent = new UnifiedFireProtectionAgent(apiKey);

    console.log(`📊 [AGENT-ANALYZE] Analyzing project ${projectId} for user ${currentUser.id}`);

    // Analyze project
    const response = await agent.analyzeProject(projectId);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: response.content,
        metadata: response.metadata,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [AGENT-ANALYZE] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to analyze project",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
