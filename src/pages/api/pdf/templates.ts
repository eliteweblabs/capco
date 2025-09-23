import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const GET: APIRoute = async ({ request }) => {
  try {
    // console.log(`📄 [PDF-TEMPLATES] Fetching available templates`);

    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Supabase client not initialized",
        }),
        { status: 500 }
      );
    }
    const { data: templates, error } = await supabase
      .from("pdf_templates")
      .select(
        `
        *,
        created_by_profile:profiles!pdf_templates_created_by_fkey(
          first_name,
          last_name,
          company_name
        )
      `
      )
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("❌ [PDF-TEMPLATES] Error fetching templates:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to fetch templates",
          error: error.message,
        }),
        { status: 500 }
      );
    }

    // console.log(`✅ [PDF-TEMPLATES] Found ${templates?.length || 0} templates`);

    return new Response(
      JSON.stringify({
        success: true,
        templates: templates || [],
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

    // console.log(`📄 [PDF-TEMPLATES] Creating new template: ${name}`);

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

    // console.log(`✅ [PDF-TEMPLATES] Successfully created template: ${template.id}`);

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
