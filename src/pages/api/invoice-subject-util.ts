import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../lib/api-optimization";
import { checkAuth } from "../../lib/auth";
import type { Subject } from "../../lib/database-interfaces";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";

// GET endpoint for fetching subjects
export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    // Get current user
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    if (!supabase) {
      return createErrorResponse("Database not configured", 500);
    }

    const searchTerm = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "";
    const limit = parseInt(url.searchParams.get("limit") || "20");

    let query = supabase
      .from("subjects")
      .select("id, title, description, category, usage_count, created_at")
      .eq("is_active", true)
      .order("usage_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply search filter
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Apply category filter
    if (category) {
      query = query.eq("category", category);
    }

    const { data: subjects, error } = await query;

    if (error) {
      console.error("Error fetching subjects:", error);
      return createErrorResponse("Failed to fetch subjects", 500);
    }

    // Get available categories
    const { data: categories } = await supabase
      .from("subjects")
      .select("category")
      .eq("is_active", true)
      .not("category", "is", null);

    const uniqueCategories = [...new Set(categories?.map((c) => c.category) || [])].sort();

    return createSuccessResponse(
      {
        subjects: subjects || [],
        categories: uniqueCategories,
        total: subjects?.length || 0,
      },
      "Subjects fetched successfully"
    );
  } catch (error) {
    console.error("Subject catalog GET error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    // Get current user
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    // Check permissions - only Admin and Staff can manage subjects
    const userRole = currentUser.profile?.role?.toLowerCase();
    if (userRole !== "admin" && userRole !== "staff") {
      return createErrorResponse("Access denied", 403);
    }

    if (!supabase) {
      return createErrorResponse("Database not configured", 500);
    }

    // Handle both new format (title, description, category) and legacy format (subject)
    const { title, description, category, subject: subjectParam } = body;
    const subjectTitle = title || subjectParam;

    // Validate required fields
    if (!subjectTitle || !subjectTitle.trim()) {
      return createErrorResponse("Subject title is required", 400);
    }

    // Validate title length
    if (subjectTitle.length > 500) {
      return createErrorResponse("Subject title must be 500 characters or less", 400);
    }

    console.log("📝 [UPDATE-SUBJECT] Creating/updating subject:", {
      title: subjectTitle.trim(),
      description,
      category,
      userId: currentUser.id,
    });

    // Check if subject already exists
    const { data: existingSubject, error: findError } = await supabase
      .from("subjects")
      .select("id, title, usage_count, description, category")
      .eq("title", subjectTitle.trim())
      .eq("is_active", true)
      .single();

    let subjectRecord: Subject;
    let isNewSubject = false;

    if (findError && findError.code === "PGRST116") {
      // Subject doesn't exist, create new one
      console.log("📝 [UPDATE-SUBJECT] Creating new subject");

      const { data: newSubject, error: createError } = await supabase
        .from("subjects")
        .insert({
          title: subjectTitle.trim(),
          description: description?.trim() || null,
          category: category?.trim() || null,
          usage_count: 1,
          is_active: true,
          created_by: currentUser.id,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating subject:", createError);
        return createErrorResponse("Failed to create subject", 500);
      }

      subjectRecord = newSubject;
      isNewSubject = true;
    } else if (findError) {
      // Database error occurred
      console.error("Error finding subject:", findError);
      return createErrorResponse("Failed to check existing subject", 500);
    } else {
      // Subject exists, update usage count
      console.log("📝 [UPDATE-SUBJECT] Updating existing subject usage count");

      const { data: updatedSubject, error: updateError } = await supabase
        .from("subjects")
        .update({
          usage_count: existingSubject.usage_count + 1,
          description: description?.trim() || existingSubject.description,
          category: category?.trim() || existingSubject.category,
        })
        .eq("id", existingSubject.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating subject:", updateError);
        return createErrorResponse("Failed to update subject", 500);
      }

      subjectRecord = updatedSubject;
    }

    // Log the subject creation/update
    await SimpleProjectLogger.addLogEntry(
      0, // System log for subject management
      "project_updated", // Use existing log type
      isNewSubject
        ? `New subject created: ${subjectRecord.title}`
        : `Subject usage updated: ${subjectRecord.title}`,
      { subject: subjectRecord.title, category: subjectRecord.category }
    );

    console.log("📝 [UPDATE-SUBJECT] Subject processed successfully:", {
      id: subjectRecord.id,
      title: subjectRecord.title,
      isNewSubject,
      usageCount: subjectRecord.usage_count,
    });

    return createSuccessResponse(
      {
        subject: subjectRecord,
        isNewSubject,
        usageCount: subjectRecord.usage_count,
      },
      isNewSubject ? "Subject created successfully" : "Subject usage updated successfully"
    );
  } catch (error) {
    console.error("❌ [UPDATE-SUBJECT] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
