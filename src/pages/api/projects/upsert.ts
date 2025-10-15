import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Standardized Projects UPSERT API
 *
 * Handles both creating new projects and updating existing ones
 *
 * POST Body:
 * - id?: number (if updating existing project)
 * - title: string
 * - address: string
 * - description?: string
 * - status?: number (default: 1)
 * - sqFt?: number
 * - newConstruction?: boolean
 * - authorId: string
 * - assignedToId?: string
 * - dueDate?: string (ISO format)
 * - building?: string
 * - service?: string
 *
 * Examples:
 * - Create: POST /api/projects/upsert { title, address, authorId }
 * - Update: POST /api/projects/upsert { id, title, address, status }
 */

interface ProjectData {
  id?: number;
  title: string;
  address: string;
  description?: string;
  status?: number;
  sqFt?: number;
  newConstruction?: boolean;
  authorId: string;
  assignedToId?: string;
  dueDate?: string;
  building?: string;
  service?: string;
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

    const body = await request.json();
    const projectData: ProjectData = body;

    // Validate required fields
    if (!projectData.title?.trim() || !projectData.address?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "title and address are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!projectData.authorId?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "authorId is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(
      `🏗️ [PROJECTS-UPSERT] ${projectData.id ? "Updating" : "Creating"} project:`,
      projectData.title
    );

    if (!supabase || !supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prepare project data
    const projectPayload = {
      title: projectData.title.trim(),
      address: projectData.address.trim(),
      description: projectData.description?.trim() || null,
      status: projectData.status || 1,
      sqFt: projectData.sqFt || null,
      newConstruction: projectData.newConstruction || false,
      authorId: projectData.authorId.trim(),
      assignedToId: projectData.assignedToId?.trim() || null,
      dueDate: projectData.dueDate || null,
      building: projectData.building?.trim() || null,
      service: projectData.service?.trim() || null,
      updatedAt: new Date().toISOString(),
    };

    let result;
    let isUpdate = false;

    if (projectData.id) {
      // Update existing project
      const { data, error } = await supabaseAdmin
        .from("projects")
        .update(projectPayload)
        .eq("id", projectData.id)
        .select()
        .single();

      if (error) {
        console.error("❌ [PROJECTS-UPSERT] Error updating project:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to update project",
            details: error.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      result = data;
      isUpdate = true;
    } else {
      // Create new project
      const { data, error } = await supabaseAdmin
        .from("projects")
        .insert([
          {
            ...projectPayload,
            createdAt: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("❌ [PROJECTS-UPSERT] Error creating project:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to create project",
            details: error.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      result = data;
    }

    console.log(
      `✅ [PROJECTS-UPSERT] Project ${isUpdate ? "updated" : "created"} successfully:`,
      result.id
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: `Project ${isUpdate ? "updated" : "created"} successfully`,
      }),
      { status: isUpdate ? 200 : 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ [PROJECTS-UPSERT] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
