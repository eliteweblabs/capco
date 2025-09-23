import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const templateId = url.searchParams.get("templateId");
    const componentType = url.searchParams.get("type");

    // // // console.log(
      `📄 [PDF-COMPONENTS] Fetching components${templateId ? ` for template ${templateId}` : ""}${componentType ? ` of type ${componentType}` : ""}`
    );

    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Supabase client not initialized",
        }),
        { status: 500 }
      );
    }
    let query;

    // If templateId is specified, join with template_component_mapping to get only components for that template
    if (templateId) {
      query = supabase
        .from("pdf_components")
        .select(
          `
          *,
          template_mapping:template_component_mapping!inner(
            insertion_point,
            display_order,
            is_required
          )
        `
        )
        .eq("is_active", true)
        .eq("template_mapping.template_id", templateId);
    } else {
      // If no templateId, get all components
      query = supabase.from("pdf_components").select("*").eq("is_active", true);
    }

    // Filter by component type if specified
    if (componentType) {
      query = query.eq("component_type", componentType);
    }

    const { data: components, error } = await query.order("name", { ascending: true });

    if (error) {
      console.error("❌ [PDF-COMPONENTS] Error fetching components:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to fetch components",
          error: error.message,
        }),
        { status: 500 }
      );
    }

    // // // console.log(`✅ [PDF-COMPONENTS] Found ${components?.length || 0} components`);

    return new Response(
      JSON.stringify({
        success: true,
        components: components || [],
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

    // // // console.log(`📄 [PDF-COMPONENTS] Creating new component: ${name}`);

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

    // // // console.log(`✅ [PDF-COMPONENTS] Successfully created component: ${component.id}`);

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
