import type { APIRoute } from "astro";
import { checkAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const searchTerm = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "";
    const limit = parseInt(url.searchParams.get("limit") || "20");

    let query = supabase
      .from("subject_catalog")
      .select("id, subject, description, category, usage_count, created_at")
      .eq("is_active", true)
      .order("usage_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply search filter
    if (searchTerm) {
      query = query.or(`subject.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Apply category filter
    if (category) {
      query = query.eq("category", category);
    }

    const { data: subjects, error } = await query;

    if (error) {
      console.error("Error fetching subjects:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch subjects",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get available categories
    const { data: categories } = await supabase
      .from("subject_catalog")
      .select("category")
      .eq("is_active", true)
      .not("category", "is", null);

    const uniqueCategories = [...new Set(categories?.map((c) => c.category) || [])].sort();

    return new Response(
      JSON.stringify({
        success: true,
        subjects: subjects || [],
        categories: uniqueCategories,
        total: subjects?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Subject catalog GET error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser, role } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { subject, description, category } = await request.json();

    if (!subject || subject.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Subject is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (subject.length > 200) {
      return new Response(JSON.stringify({ error: "Subject must be 200 characters or less" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if subject already exists
    const { data: existing } = await supabase
      .from("subject_catalog")
      .select("id, usage_count")
      .eq("subject", subject.trim())
      .eq("is_active", true)
      .single();

    if (existing) {
      // Subject exists, increment usage count
      const { data: updated, error: updateError } = await supabase
        .from("subject_catalog")
        .update({
          usage_count: existing.usage_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating subject usage:", updateError);
        return new Response(
          JSON.stringify({
            error: "Failed to update subject usage",
            details: updateError.message,
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
          subject: updated,
          message: "Subject usage updated",
          isNew: false,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      // Create new subject
      const { data: newSubject, error: insertError } = await supabase
        .from("subject_catalog")
        .insert({
          subject: subject.trim(),
          description: description?.trim() || null,
          category: category?.trim() || "General",
          usage_count: 1,
          created_by: currentUser.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating subject:", insertError);
        return new Response(
          JSON.stringify({
            error: "Failed to create subject",
            details: insertError.message,
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
          subject: newSubject,
          message: "Subject created successfully",
          isNew: true,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Subject catalog POST error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser, role } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only allow Admin/Staff to update subjects
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

    const { id, subject, description, category, is_active } = await request.json();

    if (!id || !subject) {
      return new Response(JSON.stringify({ error: "ID and subject are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from("subject_catalog")
      .update({
        subject: subject.trim(),
        description: description?.trim() || null,
        category: category?.trim() || "General",
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating subject:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update subject",
          details: updateError.message,
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
        subject: updated,
        message: "Subject updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Subject catalog PUT error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
