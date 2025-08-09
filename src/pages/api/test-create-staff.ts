import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    console.log("Test endpoint reached");
    
    // Test basic imports
    const { checkAuth } = await import("../../lib/auth");
    const { supabase } = await import("../../lib/supabase");
    
    console.log("Imports successful:", { 
      checkAuth: !!checkAuth, 
      supabase: !!supabase 
    });
    
    // Test auth check
    const authResult = await checkAuth(cookies);
    console.log("Auth result:", authResult);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Test endpoint working",
        authResult: {
          isAuth: authResult.isAuth,
          role: authResult.role,
          hasUser: !!authResult.user
        }
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Test endpoint failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    console.log("POST Test endpoint reached");
    
    // Test the actual create-staff logic step by step
    const { checkAuth } = await import("../../lib/auth");
    const { supabase } = await import("../../lib/supabase");
    
    // Step 1: Check auth
    const { isAuth, role } = await checkAuth(cookies);
    console.log("Auth check:", { isAuth, role });
    
    if (!isAuth || role !== "Admin") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unauthorized test" 
        }),
        { 
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    // Step 2: Parse body
    const body = await request.json();
    console.log("Body parsed:", body);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "POST test successful",
        receivedData: body
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
    
  } catch (error) {
    console.error('POST Test endpoint error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "POST test failed",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
