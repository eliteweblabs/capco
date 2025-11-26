/**
 * API Route: Generate Document via AI Agent
 * POST /api/documents/generate
 * Adapted for Astro framework
 */

import type { APIRoute } from "astro";
import { FireProtectionAgent } from "../../../lib/ai/agent";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { checkAuth } from "../../../lib/auth";

interface GenerateDocumentRequest {
  projectId: number;
  templateId: string;
  projectData: Record<string, any>;
  requirements?: string[];
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
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

    const body: GenerateDocumentRequest = await request.json();
    const { projectId, templateId, projectData, requirements } = body;

    // Validate input
    if (!projectId || !templateId || !projectData) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: projectId, templateId, projectData",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, authorId, title")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error("❌ [DOCUMENTS-GENERATE] Project not found:", projectError);
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has access to this project (Admin or project author)
    const userRole = currentUser.profile?.role;
    const isAdmin = userRole === "Admin";
    const isAuthor = project.authorId === currentUser.id;

    if (!isAdmin && !isAuthor) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize AI agent
    const apiKey =
      import.meta.env.ANTHROPIC_API_KEY ||
      (typeof process !== "undefined" ? process.env.ANTHROPIC_API_KEY : undefined);

    if (!apiKey) {
      console.error("❌ [DOCUMENTS-GENERATE] AI API key not configured");
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const agent = new FireProtectionAgent(apiKey);

    console.log(`🤖 [DOCUMENTS-GENERATE] Generating document for project ${projectId}`);

    // Generate document
    const result = await agent.generateDocument({
      projectId,
      templateId,
      projectData,
      requirements,
    });

    // Get or create document template record
    let documentTemplateId: string | null = null;
    const { data: existingTemplate } = await supabaseAdmin
      .from("document_templates")
      .select("id")
      .eq("id", templateId)
      .single();

    if (existingTemplate) {
      documentTemplateId = existingTemplate.id;
    }

    // Save to Supabase documents table
    const { data: document, error: dbError } = await supabaseAdmin
      .from("ai_generated_documents")
      .insert({
        projectId: projectId,
        templateId: documentTemplateId,
        content: result.content,
        metadata: result.metadata,
        authorId: currentUser.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("❌ [DOCUMENTS-GENERATE] Database error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to save document" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Save AI generation history
    await supabaseAdmin.from("ai_generations").insert({
      documentId: document.id,
      prompt: `Generated document for project ${projectId}`,
      response: result.content,
      model: result.metadata.model,
      tokensUsed: result.metadata.tokensUsed,
    });

    console.log(`✅ [DOCUMENTS-GENERATE] Document generated successfully: ${document.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        document: {
          id: document.id,
          content: result.content,
          metadata: result.metadata,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [DOCUMENTS-GENERATE] Generation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate document",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

