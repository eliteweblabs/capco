import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { isAdminOrStaffOrSuperAdmin } from "../../../lib/user-utils";

/**
 * Tasks API
 * 
 * GET - List tasks (filterable by projectId, status, priority)
 * POST - Create a task manually
 * PATCH - Update task status
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const { currentUser, isAuth, currentRole } = await checkAuth(cookies);
    if (!isAuth) return createErrorResponse("Authentication required", 401);
    if (!isAdminOrStaffOrSuperAdmin(currentRole)) return createErrorResponse("Insufficient permissions", 403);

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    let query = supabaseAdmin
      .from("tasks")
      .select("*, emailLog(fromEmail, fromName, subject), clientMagicLinks:taskId(id, token, status)")
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (projectId) query = query.eq("projectId", parseInt(projectId));
    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);

    const { data, error } = await query;
    if (error) return createErrorResponse(error.message, 500);

    return createSuccessResponse({ tasks: data, count: data?.length || 0 });
  } catch (err: any) {
    return createErrorResponse(err.message, 500);
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { currentUser, isAuth, currentRole } = await checkAuth(cookies);
    if (!isAuth) return createErrorResponse("Authentication required", 401);
    if (!isAdminOrStaffOrSuperAdmin(currentRole)) return createErrorResponse("Insufficient permissions", 403);

    const body = await request.json();
    const { projectId, title, description, type, priority, assignedToId, assignedToName, dueDate } = body;

    if (!title || !type) return createErrorResponse("title and type are required");

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        projectId,
        title,
        description,
        type,
        priority: priority || "normal",
        assignedToId,
        assignedToName,
        dueDate,
        status: "pending",
      })
      .select()
      .single();

    if (error) return createErrorResponse(error.message, 500);
    return createSuccessResponse({ task: data });
  } catch (err: any) {
    return createErrorResponse(err.message, 500);
  }
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
  try {
    const { currentUser, isAuth, currentRole } = await checkAuth(cookies);
    if (!isAuth) return createErrorResponse("Authentication required", 401);
    if (!isAdminOrStaffOrSuperAdmin(currentRole)) return createErrorResponse("Insufficient permissions", 403);

    const body = await request.json();
    const { id, status, assignedToId, assignedToName, dueDate, priority } = body;

    if (!id) return createErrorResponse("id is required");

    const updates: any = { updatedAt: new Date().toISOString() };
    if (status) updates.status = status;
    if (status === "completed") updates.completedAt = new Date().toISOString();
    if (assignedToId !== undefined) updates.assignedToId = assignedToId;
    if (assignedToName !== undefined) updates.assignedToName = assignedToName;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (priority) updates.priority = priority;

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return createErrorResponse(error.message, 500);
    return createSuccessResponse({ task: data });
  } catch (err: any) {
    return createErrorResponse(err.message, 500);
  }
};
