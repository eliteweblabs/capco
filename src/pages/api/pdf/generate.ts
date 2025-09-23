import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      projectId,
      templateId,
      documentName,
      selectedComponents = [],
      customPlaceholders = {},
    } = body;

    if (!projectId || !templateId || !documentName) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Project ID, template ID, and document name are required",
        }),
        { status: 400 }
      );
    }

    console.log(`📄 [PDF-GENERATE] Starting PDF generation for project ${projectId}`);

    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Supabase client not initialized",
        }),
        { status: 500 }
      );
    }
    // Create document record
    const { data: document, error: docError } = await supabase
      .from("generated_documents")
      .insert({
        project_id: parseInt(projectId),
        template_id: parseInt(templateId),
        document_name: documentName,
        generation_status: "generating",
        generation_started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (docError) {
      console.error("❌ [PDF-GENERATE] Error creating document record:", docError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to create document record",
          error: docError.message,
        }),
        { status: 500 }
      );
    }

    try {
      // Fetch template
      const { data: template, error: templateError } = await supabase
        .from("pdf_templates")
        .select("*")
        .eq("id", templateId)
        .eq("is_active", true)
        .single();

      if (templateError || !template) {
        throw new Error("Template not found or inactive");
      }

      // Fetch project data and placeholders
      const dataResponse = await fetch(
        `${request.url.split("/api")[0]}/api/pdf/data?projectId=${projectId}`
      );
      const dataResult = await dataResponse.json();

      if (!dataResult.success) {
        throw new Error("Failed to fetch project data");
      }

      const { placeholders } = dataResult.data;

      // Merge custom placeholders
      const allPlaceholders = { ...placeholders, ...customPlaceholders };

      // Fetch selected components
      let components = [];
      if (selectedComponents.length > 0) {
        const { data: componentData, error: componentError } = await supabase
          .from("pdf_components")
          .select("*")
          .in("id", selectedComponents)
          .eq("is_active", true);

        if (componentError) {
          console.error("❌ [PDF-GENERATE] Error fetching components:", componentError);
        } else {
          components = componentData || [];
        }
      }

      // Replace placeholders in template HTML
      let htmlContent = template.html_content;

      // Replace all placeholders
      Object.entries(allPlaceholders).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        htmlContent = htmlContent.replace(new RegExp(placeholder, "g"), String(value || ""));
      });

      // Insert components into template
      const componentGroups = {
        header: components.filter((c) => c.component_type === "header"),
        content: components.filter(
          (c) => c.component_type === "section" || c.component_type === "content"
        ),
        footer: components.filter((c) => c.component_type === "footer"),
      };

      // Replace component placeholders
      Object.entries(componentGroups).forEach(([type, comps]) => {
        const placeholder = `[${type.toUpperCase()} COMPONENTS]`;
        const componentHTML = comps
          .map((comp) => {
            let compHTML = comp.html_content;
            // Replace placeholders in component HTML
            Object.entries(allPlaceholders).forEach(([key, value]) => {
              const placeholder = `{{${key}}}`;
              compHTML = compHTML.replace(new RegExp(placeholder, "g"), String(value || ""));
            });
            return compHTML;
          })
          .join("\n");

        htmlContent = htmlContent.replace(placeholder, componentHTML);
      });

      // For now, we'll return the HTML content
      // In a production environment, you would use a PDF generation library like Puppeteer
      // to convert the HTML to PDF and save it to storage

      const documentId = document.id;
      const fileName = `${documentName.replace(/[^a-zA-Z0-9]/g, "_")}_${documentId}.html`;
      const filePath = `/generated-documents/${fileName}`;

      // Update document record with completion
      const { error: updateError } = await supabase
        .from("generated_documents")
        .update({
          generation_status: "completed",
          generation_completed_at: new Date().toISOString(),
          file_path: filePath,
          file_size: htmlContent.length,
        })
        .eq("id", documentId);

      if (updateError) {
        console.error("❌ [PDF-GENERATE] Error updating document record:", updateError);
      }

      // Save document components
      if (components.length > 0) {
        const componentRecords = components.map((comp, index) => ({
          document_id: documentId,
          component_id: comp.id,
          insertion_point: comp.component_type,
          display_order: index,
        }));

        const { error: compError } = await supabase
          .from("document_components")
          .insert(componentRecords);

        if (compError) {
          console.error("❌ [PDF-GENERATE] Error saving document components:", compError);
        }
      }

      console.log(`✅ [PDF-GENERATE] Successfully generated document ${documentId}`);

      return new Response(
        JSON.stringify({
          success: true,
          document: {
            id: documentId,
            name: documentName,
            filePath,
            htmlContent,
            placeholders: allPlaceholders,
            components: components.map((c) => ({
              id: c.id,
              name: c.name,
              type: c.component_type,
            })),
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error: any) {
      console.error("❌ [PDF-GENERATE] Error during generation:", error);

      // Update document record with error
      await supabase
        .from("generated_documents")
        .update({
          generation_status: "failed",
          error_message: error.message,
          generation_completed_at: new Date().toISOString(),
        })
        .eq("id", document.id);

      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to generate PDF",
          error: error.message,
        }),
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ [PDF-GENERATE] Unexpected error:", error);
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
