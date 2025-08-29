import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Supabase not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set up session from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    const results = {
      user: user ? { id: user.id, email: user.email } : null,
      userError: userError?.message || null,
      tests: {} as any
    };

    // Test 1: Try to list buckets (requires admin permissions)
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      results.tests.listBuckets = {
        success: !bucketsError,
        error: bucketsError?.message || null,
        bucketCount: buckets?.length || 0,
        bucketNames: buckets?.map(b => b.name) || []
      };
    } catch (error) {
      results.tests.listBuckets = {
        success: false,
        error: (error as Error).message,
        bucketCount: 0,
        bucketNames: []
      };
    }

    // Test 2: Try to access project-documents bucket directly
    try {
      const { data: files, error: listError } = await supabase.storage
        .from("project-documents")
        .list("", { limit: 1 });
      
      results.tests.accessProjectDocuments = {
        success: !listError,
        error: listError?.message || null,
        fileCount: files?.length || 0
      };
    } catch (error) {
      results.tests.accessProjectDocuments = {
        success: false,
        error: (error as Error).message,
        fileCount: 0
      };
    }

    // Test 3: Try to upload a small test file
    try {
      const testContent = "test file content";
      const testBlob = new Blob([testContent], { type: "text/plain" });
      const testFile = new File([testBlob], "test.txt", { type: "text/plain" });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("project-documents")
        .upload("test-upload.txt", testFile, {
          contentType: "text/plain",
          upsert: true
        });

      results.tests.testUpload = {
        success: !uploadError,
        error: uploadError?.message || null,
        uploadId: uploadData?.id || null
      };

      // Clean up test file
      if (uploadData?.id) {
        await supabase.storage
          .from("project-documents")
          .remove(["test-upload.txt"]);
      }
    } catch (error) {
      results.tests.testUpload = {
        success: false,
        error: (error as Error).message,
        uploadId: null
      };
    }

    return new Response(JSON.stringify(results, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Test failed",
      message: (error as Error).message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
