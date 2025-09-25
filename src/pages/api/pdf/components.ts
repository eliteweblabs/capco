import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const templateId = url.searchParams.get("templateId");
    const componentType = url.searchParams.get("type");

    console.log(
      `📄 [PDF-COMPONENTS] Fetching components${templateId ? ` for template ${templateId}` : ""}${componentType ? ` of type ${componentType}` : ""}`
    );

    // Read templates configuration
    const templatesConfigPath = join(process.cwd(), "src/templates/pdf/templates.json");
    const templatesConfig = JSON.parse(readFileSync(templatesConfigPath, "utf-8"));

    let components = templatesConfig.components;

    // Filter by template if specified
    if (templateId) {
      const template = templatesConfig.templates.find((t: any) => t.id === templateId);
      if (template && template.components) {
        const allowedComponentIds = [
          ...(template.components.header || []),
          ...(template.components.content || []),
          ...(template.components.footer || []),
        ];
        components = components.filter((c: any) => allowedComponentIds.includes(c.id));
      }
    }

    // Filter by component type if specified
    if (componentType) {
      components = components.filter((c: any) => c.type === componentType);
    }

    // Process components to include HTML content
    const processedComponents = components.map((component: any) => {
      const componentPath = join(process.cwd(), "src/templates/pdf", component.file);
      const htmlContent = readFileSync(componentPath, "utf-8");

      return {
        id: component.id,
        name: component.name,
        description: component.description,
        html_content: htmlContent,
        component_type: component.type,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
      };
    });

    console.log(`✅ [PDF-COMPONENTS] Found ${processedComponents.length} components`);

    return new Response(
      JSON.stringify({
        success: true,
        components: processedComponents,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("❌ [PDF-COMPONENTS] Unexpected error:", error);
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
  try {
    const body = await request.json();
    const { name, description, html_content, component_type } = body;

    if (!name || !html_content || !component_type) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Name, HTML content, and component type are required",
        }),
        { status: 400 }
      );
    }

    console.log(`📄 [PDF-COMPONENTS] Creating new component: ${name}`);

    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Supabase client not initialized",
        }),
        { status: 500 }
      );
    }

    const { data: component, error } = await supabase
      .from("pdf_components")
      .insert({
        name,
        description: description || null,
        html_content,
        component_type,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ [PDF-COMPONENTS] Error creating component:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to create component",
          error: error.message,
        }),
        { status: 500 }
      );
    }

    console.log(`✅ [PDF-COMPONENTS] Successfully created component: ${component.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        component,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("❌ [PDF-COMPONENTS] Unexpected error:", error);
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
