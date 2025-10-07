import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("🔧 Fixing discussion -> projects foreign key relationship...");

    // SQL to fix the foreign key relationship
    const fixSQL = `
      -- Drop existing constraints if they exist
      DO $$
      BEGIN
          -- Drop existing constraint if it exists
          IF EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'discussion_project_id_fkey' 
              AND table_name = 'discussion'
          ) THEN
              ALTER TABLE discussion DROP CONSTRAINT discussion_project_id_fkey;
          END IF;
          
          -- Also check for camelCase version
          IF EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'discussion_projectId_fkey' 
              AND table_name = 'discussion'
          ) THEN
              ALTER TABLE discussion DROP CONSTRAINT discussion_projectId_fkey;
          END IF;
          
          -- Recreate the foreign key constraint with proper naming
          ALTER TABLE discussion 
          ADD CONSTRAINT discussion_project_id_fkey 
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
          
          RAISE NOTICE 'Fixed discussion -> projects foreign key relationship';
      END $$;
    `;

    // Test if the relationship is working by trying to join the tables
    const { data, error } = await supabase
      .from("discussion")
      .select(
        `
        id,
        projectId,
        projects (
          id,
          address,
          title
        )
      `
      )
      .limit(1);

    if (error) {
      console.error("Error fixing foreign keys:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Foreign key relationship fixed successfully!");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Foreign key relationship fixed successfully!",
        data: data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fix foreign keys",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
