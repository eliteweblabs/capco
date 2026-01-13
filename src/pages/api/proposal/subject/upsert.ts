import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../../lib/_api-optimization";
import { checkAuth } from "../../../../lib/auth";
import { SimpleProjectLogger } from "../../../../lib/simple-logging";
import { supabase } from "../../../../lib/supabase";

/**
 * Standardized Subject UPSERT API
 *
 * POST Body:
 * - title: string (required)
 * - description?: string
 * - category?: string
 * - subject?: string (legacy format)
 *
 * Examples:
 * - Create/Update: POST /api/proposal/subject/upsert { title: "Fire Protection", category: "design" }
 * - Legacy: POST /api/proposal/subject/upsert { subject: "Fire Protection" }
 */

interface Subject {
  id: number;
  title: string;
  usageCount: number;
  description?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
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
      return createErrorResponse("Database connection not available", 500);
    }

    const body = await request.json();
    const { title, description, category, subject: subjectParam } = body;
    const subjectTitle = title || subjectParam;

    // Validate required fields
    if (!subjectTitle?.trim()) {
      return createErrorResponse("Subject title is required", 400);
    }

    // Validate title length
    if (subjectTitle.length > 500) {
      return createErrorResponse("Subject title must be 500 characters or less", 400);
    }

    // Check if subject already exists
    const { data: existingSubject, error: findError } = await supabase
      .from("subjects")
      .select("id, title, usageCount, description, category")
      .eq("title", subjectTitle.trim())
      .eq("isActive", true)
      .single();

    let subjectRecord: Subject;
    let isNewSubject = false;

    if (findError && findError.code === "PGRST116") {
      // Create new subject
      const { data: newSubject, error: createError } = await supabase
        .from("subjects")
        .insert({
          title: subjectTitle.trim(),
          description: description?.trim() || null,
          category: category?.trim() || null,
          usageCount: 1,
          isActive: true,
          createdBy: currentUser.id,
        })
        .select()
        .single();

      if (createError) {
        return createErrorResponse("Failed to create subject", 500);
      }

      subjectRecord = newSubject;
      isNewSubject = true;
    } else if (findError) {
      return createErrorResponse("Failed to check existing subject", 500);
    } else {
      // Update existing subject
      const { data: updatedSubject, error: updateError } = await supabase
        .from("subjects")
        .update({
          usageCount: existingSubject.usageCount + 1,
          description: description?.trim() || existingSubject.description,
          category: category?.trim() || existingSubject.category,
        })
        .eq("id", existingSubject.id)
        .select()
        .single();

      if (updateError) {
        return createErrorResponse("Failed to update subject", 500);
      }

      subjectRecord = updatedSubject;
    }

    // Log the subject creation/update
    await SimpleProjectLogger.addLogEntry(
      0,
      "systemEvent",
      isNewSubject
        ? `New subject created: ${subjectRecord.title}`
        : `Subject usage updated: ${subjectRecord.title}`,
      { subject: subjectRecord.title, category: subjectRecord.category }
    );

    return createSuccessResponse(
      {
        subject: subjectRecord,
        isNewSubject,
        usageCount: subjectRecord.usageCount,
      },
      isNewSubject ? "Subject created successfully" : "Subject usage updated successfully"
    );
  } catch (error) {
    console.error("❌ [SUBJECT-UPSERT] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
