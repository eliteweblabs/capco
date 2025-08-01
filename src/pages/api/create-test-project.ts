import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!supabase) {
      // For demo purposes, create a mock project when database is not configured
      const mockProject = {
        id: Math.floor(Math.random() * 10000),
        description: `Demo Project - ${new Date().toLocaleString()}`,
        address: "123 Demo Street, Demo City",
        author_id: "demo-user",
        metadata: {
          status: "draft",
          createdBy: "demo-user",
          type: "demo",
          createdAt: new Date().toISOString(),
          isDemoProject: true,
        },
      };

      return new Response(
        JSON.stringify({
          success: true,
          project: mockProject,
          message: `Demo project created with ID: ${mockProject.id} (This is a demo - no database interaction)`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      // For demo purposes, create a mock project when not authenticated
      const mockProject = {
        id: Math.floor(Math.random() * 10000),
        description: `Demo Project - ${new Date().toLocaleString()}`,
        address: "123 Demo Street, Demo City",
        author_id: "demo-user",
        metadata: {
          status: "draft",
          createdBy: "demo-user",
          type: "demo",
          createdAt: new Date().toISOString(),
          isDemoProject: true,
        },
      };

      return new Response(
        JSON.stringify({
          success: true,
          project: mockProject,
          message: `Demo project created with ID: ${mockProject.id} (Demo mode - sign in for real database interaction)`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Create a test project
    const projectData = {
      author_id: user.id,
      description: `Test Project - ${new Date().toLocaleString()}`,
      address: "123 Test Street, Test City",
      metadata: {
        status: "draft",
        createdBy: user.id,
        type: "test",
        createdAt: new Date().toISOString(),
      },
    };

    const { data, error } = await supabase
      .from("projects")
      .insert([projectData])
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: `Failed to create project: ${error.message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        project: data,
        message: `Test project created with ID: ${data.id}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Create project API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
