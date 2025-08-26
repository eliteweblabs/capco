import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!supabase) {
      // For demo purposes, create a mock project when database is not configured
      const mockProject = {
        id: Math.floor(Math.random() * 10000),
        title: "Demo Project",
        description: `Demo Project - ${new Date().toLocaleString()}`,
        address: "123 Demo Street, Demo City",
        author_id: "demo-user",
        status: 10, // SPECS_RECEIVED
        sq_ft: 1500,
        new_construction: false,
        building: { type: "commercial", floors: 2 },
        project: { isDemoProject: true, createdAt: new Date().toISOString() },
        service: { type: "fire_protection" },
        requested_docs: ["plans", "specifications"],
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
        }
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
        title: "Demo Project",
        description: `Demo Project - ${new Date().toLocaleString()}`,
        address: "123 Demo Street, Demo City",
        author_id: "demo-user",
        status: 10, // SPECS_RECEIVED
        sq_ft: 1500,
        new_construction: false,
        building: { type: "commercial", floors: 2 },
        project: { isDemoProject: true, createdAt: new Date().toISOString() },
        service: { type: "fire_protection" },
        requested_docs: ["plans", "specifications"],
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
        }
      );
    }

    // Create a test project
    const projectData = {
      author_id: user.id,
      title: "Test Project",
      description: `Test Project - ${new Date().toLocaleString()}`,
      address: "123 Test Street, Test City",
      status: 0, // assuming 0 = draft
      sq_ft: 2000,
      new_construction: true,
      building: { type: "office", floors: 3 },
      project: {
        createdBy: user.id,
        type: "test",
        createdAt: new Date().toISOString(),
      },
      service: { type: "fire_protection", scope: "full_system" },
      requested_docs: ["architectural_plans", "mep_drawings"],
    };

    const { data, error } = await supabase.from("projects").insert([projectData]).select().single();

    if (error) {
      return new Response(JSON.stringify({ error: `Failed to create project: ${error.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
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
      }
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
      }
    );
  }
};
