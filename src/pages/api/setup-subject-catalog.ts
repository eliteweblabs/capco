import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { role } = currentUser;

    // Only allow Admin/Staff to set up the catalog
    if (!["Admin", "Staff"].includes(role || "")) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🔧 Setting up subject_catalog table...");

    // Try to insert default subjects
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
      return new Response(
        JSON.stringify({
          error: "Failed to insert default subjects",
          details: insertError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Default subjects inserted successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subject catalog setup completed successfully",
        subjectsCount: defaultSubjects.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error setting up subject catalog:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
