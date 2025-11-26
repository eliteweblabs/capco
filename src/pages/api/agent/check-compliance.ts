/**
 * AI Agent Compliance Check API
 * 
 * Check project compliance against NFPA standards
 * 
 * POST /api/agent/check-compliance
 */

import type { APIRoute } from "astro";
import { UnifiedFireProtectionAgent } from "../../../lib/ai/unified-agent";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

interface CheckComplianceRequest {
  projectId: number;
  standard?: string; // Optional: specific NFPA standard to check (e.g., "NFPA 13")
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

    const body: CheckComplianceRequest = await request.json();
    const { projectId, standard } = body;

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
    const apiKey =
      import.meta.env.ANTHROPIC_API_KEY ||
      (typeof process !== "undefined" ? process.env.ANTHROPIC_API_KEY : undefined);

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const agent = new UnifiedFireProtectionAgent(apiKey);

    console.log(`✅ [AGENT-COMPLIANCE] Checking compliance for project ${projectId}`);

    // Check compliance
    const response = await agent.checkCompliance(projectId, standard);

    return new Response(
      JSON.stringify({
        success: true,
        compliance: response.content,
        metadata: response.metadata,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [AGENT-COMPLIANCE] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to check compliance",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

