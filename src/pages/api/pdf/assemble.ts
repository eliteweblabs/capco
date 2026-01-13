import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import { replacePlaceholders } from "../../../lib/placeholder-utils";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const templateId = url.searchParams.get("templateId");
    const projectId = url.searchParams.get("projectId");
    const mode = url.searchParams.get("mode"); // 'pdf' or 'preview'

    if (!templateId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Template ID is required",
        }),
        { status: 400 }
      );
    }

    // console.log(`📄 [PDF-ASSEMBLE] Assembling template: ${templateId} for project: ${projectId}`);
    // console.log(`📄 [PDF-ASSEMBLE] Mode: ${mode}`);

    // Read templates configuration
    const templatesConfigPath = join(process.cwd(), "src/templates/pdf/templates.json");
    const templatesConfig = JSON.parse(readFileSync(templatesConfigPath, "utf-8"));

    // Find the template
    const template = templatesConfig.templates.find((t: any) => t.id === templateId);
    if (!template) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Template not found",
        }),
        { status: 404 }
      );
    }

    // Get comprehensive project data if projectId is provided
    let projectData: any = {};
    if (projectId) {
      try {
        // console.log(`📄 [PDF-ASSEMBLE] Fetching comprehensive data for project: ${projectId}`);

        if (!supabase) {
          console.warn("⚠️ [PDF-ASSEMBLE] Supabase client not available");
        } else {
          // Fetch project data
          const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .single();

          if (projectError) {
            console.error("❌ [PDF-ASSEMBLE] Error fetching project:", projectError);
          } else if (project) {
            // Fetch author profile
            let authorProfile = null;
            if (project.authorId) {
              const { data: author, error: authorError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", project.authorId)
                .single();

              if (!authorError && author) {
                authorProfile = author;
              }
            }

            // Fetch assigned staff profile
            let assignedStaff = null;
            if (project.assignedToId) {
              const { data: assignedToProfile, error: assignedError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", project.assignedToId)
                .single();

              if (!assignedError && assignedToProfile) {
                assignedStaff = assignedToProfile;
              }
            }

            // Fetch project status data
            let statusData = null;
            const { data: status, error: statusError } = await supabase
              .from("projectStatuses")
              .select("*")
              .eq("statusCode", project.status)
              .single();

            if (!statusError && status) {
              statusData = status;
            }

            // Fetch project files
            let files = [];
            const { data: projectFiles, error: filesError } = await supabase
              .from("files")
              .select("*")
              .eq("projectId", projectId)
              .eq("status", "active")
              .order("uploadedAt", { ascending: false });

            if (!filesError && projectFiles) {
              files = projectFiles;
            }

            // Create comprehensive placeholder data
            projectData = {
              ...project,
              authorProfile,
              assignedStaff,
              statusData,
              files,
            };

            // console.log(`✅ [PDF-ASSEMBLE] Successfully fetched comprehensive project data`);
          }
        }
      } catch (error) {
        console.warn("⚠️ [PDF-ASSEMBLE] Could not fetch project data:", error);
      }
    }

    // Read the base template file
    const templatePath = join(process.cwd(), "src/templates/pdf", template.file);
    let assembledHtml = readFileSync(templatePath, "utf-8");
    // console.log(`📄 [PDF-ASSEMBLE] Loaded template from: ${templatePath}`);
    // console.log(`📄 [PDF-ASSEMBLE] Template length: ${assembledHtml.length}`);

    // Replace component placeholders in the template
    if (template.components.header) {
      let headerHtml = "";
      for (const componentId of template.components.header) {
        const component = templatesConfig.components.find((c: any) => c.id === componentId);
        if (component) {
          const componentPath = join(process.cwd(), "src/templates/pdf", component.file);
          const componentHtml = readFileSync(componentPath, "utf-8");
          headerHtml += componentHtml + "\n";
        }
      }
      // Replace header placeholder
      const headerPlaceholderRegex =
        /<div class="component-placeholder header-placeholder">\[HEADER COMPONENTS\]<\/div>/g;
      const headerMatches = assembledHtml.match(headerPlaceholderRegex);
      // console.log(`📄 [PDF-ASSEMBLE] Header placeholder matches: ${headerMatches?.length || 0}`);
      assembledHtml = assembledHtml.replace(headerPlaceholderRegex, headerHtml);
      // console.log(`📄 [PDF-ASSEMBLE] Header HTML length: ${headerHtml.length}`);
    }

    // Replace content components
    if (template.components.content) {
      let contentHtml = "";
      for (const componentId of template.components.content) {
        const component = templatesConfig.components.find((c: any) => c.id === componentId);
        if (component) {
          const componentPath = join(process.cwd(), "src/templates/pdf", component.file);
          const componentHtml = readFileSync(componentPath, "utf-8");
          contentHtml += componentHtml + "\n";
        }
      }
      // Replace content placeholder
      assembledHtml = assembledHtml.replace(
        /<div class="component-placeholder content-placeholder">\[CONTENT COMPONENTS\]<\/div>/g,
        contentHtml
      );
    }

    // Replace footer components
    if (template.components.footer) {
      let footerHtml = "";
      for (const componentId of template.components.footer) {
        const component = templatesConfig.components.find((c: any) => c.id === componentId);
        if (component) {
          const componentPath = join(process.cwd(), "src/templates/pdf", component.file);
          const componentHtml = readFileSync(componentPath, "utf-8");
          footerHtml += componentHtml + "\n";
        }
      }
      // Replace footer placeholder
      assembledHtml = assembledHtml.replace(
        /<div class="component-placeholder footer-placeholder">\[FOOTER COMPONENTS\]<\/div>/g,
        footerHtml
      );
    }

    // Replace signature components
    if (template.components.signature) {
      let signatureHtml = "";
      for (const componentId of template.components.signature) {
        const component = templatesConfig.components.find((c: any) => c.id === componentId);
        if (component) {
          const componentPath = join(process.cwd(), "src/templates/pdf", component.file);
          const componentHtml = readFileSync(componentPath, "utf-8");
          signatureHtml += componentHtml + "\n";
        }
      }
      // Replace signature placeholder
      assembledHtml = assembledHtml.replace(/\[SIGNATURE COMPONENT\]/g, signatureHtml);
    }

    // console.log(`📄 [PDF-ASSEMBLE] Project data structure:`, Object.keys(projectData));
    // Replace placeholders with comprehensive project data
    const processedHtml = await replacePlaceholders(assembledHtml, { project: projectData }, false, request);

    // console.log(
    //   `✅ [PDF-ASSEMBLE] Template assembled and placeholders replaced, final length: ${processedHtml.length}`
    // );

    return new Response(processedHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "X-Frame-Options": "DENY", // Prevent embedding
        "X-Content-Type-Options": "nosniff", // Prevent MIME sniffing
        "Cache-Control": "no-cache, no-store, must-revalidate", // Prevent caching
      },
    });
  } catch (error: any) {
    console.error("❌ [PDF-ASSEMBLE] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "An unexpected error occurred",
        error: error.message,
      }),
      { status: 500 }
    );
  }
};
