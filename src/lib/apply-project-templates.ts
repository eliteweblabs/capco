/**
 * Apply Project Templates
 * Creates punchlist and discussion items from templates when a new project is created
 */

import { supabaseAdmin } from "./supabase-admin";
import { replacePlaceholders, type PlaceholderData } from "./placeholder-utils";

export interface ApplyTemplatesResult {
  success: boolean;
  punchlistCount: number;
  discussionCount: number;
  errors: string[];
}

/**
 * Apply punchlist and discussion templates to a new project
 * @param projectId - The ID of the project to apply templates to
 * @param project - Optional full project object for better placeholder replacement
 */
export async function applyProjectTemplates(
  projectId: number,
  project?: any
): Promise<ApplyTemplatesResult> {
  const result: ApplyTemplatesResult = {
    success: false,
    punchlistCount: 0,
    discussionCount: 0,
    errors: [],
  };

  if (!supabaseAdmin) {
    result.errors.push("Database connection not available");
    return result;
  }

  try {
    // ⚠️ SAFEGUARD: Check if templates have already been applied
    // This prevents duplicate items if function is called multiple times
    const { data: existingPunchlist } = await supabaseAdmin
      .from("punchlist")
      .select("id")
      .eq("projectId", projectId)
      .limit(1);

    const { data: existingDiscussion } = await supabaseAdmin
      .from("discussion")
      .select("id")
      .eq("projectId", projectId)
      .limit(1);

    if (existingPunchlist && existingPunchlist.length > 0) {
      console.log(`⚠️ [apply-project-templates] Project ${projectId} already has punchlist items, skipping template application`);
      result.success = true; // Not an error, just already applied
      result.errors.push("Templates already applied to this project");
      return result;
    }

    if (existingDiscussion && existingDiscussion.length > 0) {
      console.log(`⚠️ [apply-project-templates] Project ${projectId} already has discussion items, skipping template application`);
      result.success = true; // Not an error, just already applied
      result.errors.push("Templates already applied to this project");
      return result;
    }

    console.log(`✅ [apply-project-templates] Project ${projectId} has no existing items, applying templates`);

    // Fetch the full project if not provided
    let fullProject = project;
    if (!fullProject) {
      const { data: projectData, error } = await supabaseAdmin
        .from("projects")
        .select(
          `
          *,
          authorProfile:profiles!projects_author_id_fkey(
            id,
            firstName,
            lastName,
            companyName,
            email,
            role
          ),
          assignedToProfile:profiles!projects_assigned_to_id_fkey(
            id,
            firstName,
            lastName,
            companyName,
            email,
            role
          )
        `
        )
        .eq("id", projectId)
        .single();

      if (error || !projectData) {
        result.errors.push(`Failed to fetch project: ${error?.message || "Not found"}`);
        return result;
      }

      fullProject = projectData;
    }

    // Prepare placeholder data
    const placeholderData: PlaceholderData = {
      project: {
        id: fullProject.id,
        address: fullProject.address,
        title: fullProject.title,
        description: fullProject.description,
        sqFt: fullProject.sqFt,
        newConstruction: fullProject.newConstruction,
        authorProfile: fullProject.authorProfile || {},
        assignedToProfile: fullProject.assignedToProfile || {},
      },
    };

    // Fetch enabled templates
    const { data: templates, error: templatesError } = await supabaseAdmin
      .from("projectItemTemplates")
      .select("*")
      .eq("enabled", true)
      .order("orderIndex", { ascending: true });

    if (templatesError) {
      result.errors.push(`Failed to fetch templates: ${templatesError.message}`);
      return result;
    }

    if (!templates || templates.length === 0) {
      console.warn("[apply-project-templates] No templates found");
      result.success = true; // Not an error, just no templates
      return result;
    }

    // Separate templates by type
    const punchlistTemplates = templates.filter((t) => t.type === "punchlist");
    const discussionTemplates = templates.filter((t) => t.type === "discussion");

    // Apply punchlist templates
    for (const template of punchlistTemplates) {
      try {
        // Replace placeholders in the message
        const processedMessage = await replacePlaceholders(template.message, placeholderData);

        const { error: insertError } = await supabaseAdmin.from("punchlist").insert({
          projectId: projectId,
          authorId: "bdaaa7d3-469d-4b1b-90d1-978e1be47a17", // System/admin user
          message: processedMessage,
          internal: template.internal || false,
          markCompleted: template.markCompleted || false,
          companyName: template.companyName || "CAPCo Fire",
        });

        if (insertError) {
          result.errors.push(`Failed to create punchlist item "${template.title}": ${insertError.message}`);
        } else {
          result.punchlistCount++;
        }
      } catch (error) {
        result.errors.push(
          `Error processing punchlist template "${template.title}": ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Apply discussion templates
    for (const template of discussionTemplates) {
      try {
        // Replace placeholders in the message
        const processedMessage = await replacePlaceholders(template.message, placeholderData);

        const { error: insertError } = await supabaseAdmin.from("discussion").insert({
          projectId: projectId,
          authorId: "bdaaa7d3-469d-4b1b-90d1-978e1be47a17", // System/admin user
          message: processedMessage,
          internal: template.internal || false,
          markCompleted: template.markCompleted || false,
          companyName: template.companyName || "CAPCo Fire",
        });

        if (insertError) {
          result.errors.push(
            `Failed to create discussion item "${template.title}": ${insertError.message}`
          );
        } else {
          result.discussionCount++;
        }
      } catch (error) {
        result.errors.push(
          `Error processing discussion template "${template.title}": ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Consider it a success if at least one template was applied without errors
    result.success = result.errors.length === 0 || (result.punchlistCount + result.discussionCount) > 0;

    console.log(`[apply-project-templates] Applied ${result.punchlistCount} punchlist and ${result.discussionCount} discussion items to project ${projectId}`);

    return result;
  } catch (error) {
    result.errors.push(
      `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return result;
  }
}
