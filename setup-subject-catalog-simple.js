import { createClient } from "@supabase/supabase-js";

// Get Supabase credentials from environment
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ Missing Supabase credentials. Please set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
  );
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSubjectCatalog() {
  try {
    console.log("🔧 Setting up subject_catalog table...");

    // Create the table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS subject_catalog (
        id SERIAL PRIMARY KEY,
        subject TEXT NOT NULL UNIQUE,
        description TEXT,
        category VARCHAR(100) DEFAULT 'General',
        usage_count INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        created_by UUID REFERENCES auth.users(id)
      );
    `;

    console.log("📝 Creating subject_catalog table...");
    const { error: createError } = await supabase.rpc("exec_sql", { sql: createTableSQL });

    if (createError) {
      console.error("❌ Error creating table:", createError);
      return;
    }

    console.log("✅ Table created successfully");

    // Insert default subjects
    const defaultSubjects = [
      {
        subject: "Fire Protection Services Proposal",
        description: "General fire protection services proposal",
        category: "General",
      },
      {
        subject: "Fire Sprinkler System Installation",
        description: "Proposal for fire sprinkler system installation",
        category: "Installation",
      },
      {
        subject: "Fire Alarm System Upgrade",
        description: "Proposal for upgrading existing fire alarm systems",
        category: "Upgrade",
      },
      {
        subject: "Emergency Lighting Installation",
        description: "Proposal for emergency lighting system installation",
        category: "Installation",
      },
      {
        subject: "Fire Safety Inspection and Maintenance",
        description: "Proposal for ongoing fire safety inspection services",
        category: "Maintenance",
      },
      {
        subject: "Fire Suppression System Design",
        description: "Custom fire suppression system design proposal",
        category: "Design",
      },
      {
        subject: "Fire Door Installation and Certification",
        description: "Fire door installation and certification services",
        category: "Installation",
      },
      {
        subject: "Fire Extinguisher Service and Maintenance",
        description: "Fire extinguisher inspection and maintenance proposal",
        category: "Maintenance",
      },
      {
        subject: "Commercial Fire Protection System",
        description: "Comprehensive commercial fire protection proposal",
        category: "Commercial",
      },
      {
        subject: "Residential Fire Safety Solutions",
        description: "Residential fire safety system proposal",
        category: "Residential",
      },
    ];

    console.log("📝 Inserting default subjects...");
    const { error: insertError } = await supabase
      .from("subject_catalog")
      .upsert(defaultSubjects, { onConflict: "subject" });

    if (insertError) {
      console.error("❌ Error inserting default subjects:", insertError);
      return;
    }

    console.log("✅ Default subjects inserted successfully");
    console.log("🎉 Subject catalog setup completed!");
  } catch (error) {
    console.error("❌ Error setting up subject catalog:", error);
    process.exit(1);
  }
}

setupSubjectCatalog();
