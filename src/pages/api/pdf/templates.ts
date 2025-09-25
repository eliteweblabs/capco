import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log(`📄 [PDF-TEMPLATES] Fetching available templates from files`);

    // Read templates configuration
    const templatesConfigPath = join(process.cwd(), "src/templates/pdf/templates.json");
    const templatesConfig = JSON.parse(readFileSync(templatesConfigPath, "utf-8"));

    // Process templates to include HTML content
    const templates = templatesConfig.templates.map((template: any) => {
      const templatePath = join(process.cwd(), "src/templates/pdf", template.file);
      const htmlContent = readFileSync(templatePath, "utf-8");

      return {
        id: template.id,
        name: template.name,
        description: template.description,
        html_content: htmlContent,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
        created_by_profile: null,
        components: template.components,
      };
    });

    console.log(`✅ [PDF-TEMPLATES] Found ${templates.length} templates`);

    return new Response(
      JSON.stringify({
        success: true,
        templates: templates,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("❌ [PDF-TEMPLATES] Unexpected error:", error);
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

export const POST: APIRoute = async ({ request }) => {
  if (!supabase) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Supabase client not initialized",
      }),
      { status: 500 }
    );
  }
  try {
    const body = await request.json();
    const { name, description, html_content } = body;

    if (!name || !html_content) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Name and HTML content are required",
        }),
        { status: 400 }
      );
    }

    console.log(`📄 [PDF-TEMPLATES] Creating new template: ${name}`);

    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Supabase client not initialized",
        }),
        { status: 500 }
      );
    }
    const { data: template, error } = await supabase
      .from("pdf_templates")
      .insert({
        name,
        description: description || null,
        html_content,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ [PDF-TEMPLATES] Error creating template:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to create template",
          error: error.message,
        }),
        { status: 500 }
      );
    }

    console.log(`✅ [PDF-TEMPLATES] Successfully created template: ${template.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        template,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("❌ [PDF-TEMPLATES] Unexpected error:", error);
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
