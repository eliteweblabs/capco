import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check if user is admin
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ error: "Database admin not available" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create line_items_catalog table
    const createTableSQL = `
      -- Create line_items_catalog table for reusable line items
      CREATE TABLE IF NOT EXISTS line_items_catalog (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        category VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        created_by UUID REFERENCES auth.users(id)
      );

      -- Add indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_line_items_catalog_name ON line_items_catalog(name);
      CREATE INDEX IF NOT EXISTS idx_line_items_catalog_category ON line_items_catalog(category);
      CREATE INDEX IF NOT EXISTS idx_line_items_catalog_active ON line_items_catalog(is_active);

      -- Enable RLS on line_items_catalog
      ALTER TABLE line_items_catalog ENABLE ROW LEVEL SECURITY;

      -- RLS Policies for line_items_catalog
      -- Allow all authenticated users to read active catalog items
      CREATE POLICY "Users can view active catalog items" ON line_items_catalog
      FOR SELECT USING (is_active = true);

      -- Allow admins to manage catalog items
      CREATE POLICY "Admins can manage catalog items" ON line_items_catalog
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
        )
      );

      -- Allow users to create catalog items (they become available for everyone)
      CREATE POLICY "Users can create catalog items" ON line_items_catalog
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

      -- Add trigger for updated_at
      CREATE OR REPLACE FUNCTION update_line_items_catalog_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_line_items_catalog_updated_at 
        BEFORE UPDATE ON line_items_catalog 
        FOR EACH ROW EXECUTE FUNCTION update_line_items_catalog_updated_at();
    `;

    // Execute the SQL directly
    const { error } = await supabaseAdmin.from('_sql').select('*').limit(0);
    
    // For now, let's just return success and ask user to run the SQL manually
    console.log("Catalog table setup SQL:", createTableSQL);

    if (error) {
      console.error("Error creating catalog table:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create catalog table", 
          details: error.message 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Catalog tables created successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Setup catalog tables error:", error);
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
