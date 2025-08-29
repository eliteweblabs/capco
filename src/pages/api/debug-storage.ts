import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async () => {
  try {
    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Supabase client not configured",
          details: {
            hasSupabaseUrl: !!import.meta.env.SUPABASE_URL,
            hasSupabaseAnonKey: !!import.meta.env.SUPABASE_ANON_KEY,
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const diagnostics = {
      // Environment check
      environment: {
        hasSupabaseUrl: !!import.meta.env.SUPABASE_URL,
        hasSupabaseAnonKey: !!import.meta.env.SUPABASE_ANON_KEY,
        supabaseUrl: import.meta.env.SUPABASE_URL ? 
          `${import.meta.env.SUPABASE_URL.substring(0, 30)}...` : "Not set",
      },

      // Storage bucket check
      storage: {
        buckets: [] as any[],
        bucketErrors: [] as string[],
      },

      // Database tables check
      database: {
        filesTable: null as any,
        filesTableError: null as string | null,
      }
    };

    // Check available storage buckets
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        diagnostics.storage.bucketErrors.push(`Failed to list buckets: ${bucketsError.message}`);
      } else {
        diagnostics.storage.buckets = buckets || [];
      }
    } catch (error) {
      diagnostics.storage.bucketErrors.push(`Exception listing buckets: ${(error as Error).message}`);
    }

    // Check specific buckets mentioned in code
    const expectedBuckets = ["project-documents", "documents"];
    for (const bucketName of expectedBuckets) {
      try {
        const { data: files, error } = await supabase.storage.from(bucketName).list();
        if (error) {
          diagnostics.storage.bucketErrors.push(`Bucket "${bucketName}": ${error.message}`);
        } else {
          console.log(`Bucket "${bucketName}" accessible, contains ${files?.length || 0} files`);
        }
      } catch (error) {
        diagnostics.storage.bucketErrors.push(`Bucket "${bucketName}" exception: ${(error as Error).message}`);
      }
    }

    // Check files table
    try {
      const { data: files, error: filesError } = await supabase
        .from("files")
        .select("*")
        .limit(5);
      
      if (filesError) {
        diagnostics.database.filesTableError = filesError.message;
      } else {
        diagnostics.database.filesTable = {
          exists: true,
          recordCount: files?.length || 0,
          sampleRecords: files?.slice(0, 2) || []
        };
      }
    } catch (error) {
      diagnostics.database.filesTableError = `Exception: ${(error as Error).message}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        diagnostics,
        recommendations: [
          "Check if 'project-documents' bucket exists in Supabase Storage",
          "Verify RLS policies on storage buckets",
          "Ensure 'files' table exists with correct schema",
          "Check if user has proper permissions for storage operations"
        ]
      }, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Storage debug error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Storage debug failed",
        message: (error as Error).message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
