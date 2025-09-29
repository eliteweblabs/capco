/**
 * API Optimization Utilities
 *
 * This module provides utilities to optimize API calls by accepting full objects
 * instead of making redundant database calls.
 */

import { checkAuth } from "./auth";

export interface OptimizedApiRequest {
  currentUser?: any;
  currentProject?: any;
  // Add other commonly passed objects as needed
}

/**
 * Helper function to get current user, either from request body or by calling checkAuth
 * @param cookies - Astro cookies object
 * @param body - Request body that may contain currentUser
 * @returns Promise<{currentUser: any, usedProvidedUser: boolean}>
 */
export async function getCurrentUser(
  cookies: any,
  body: OptimizedApiRequest
): Promise<{ currentUser: any; usedProvidedUser: boolean }> {
  if (body.currentUser && body.currentUser.id) {
    console.log("🚀 [API-OPTIMIZATION] Using provided currentUser, skipping checkAuth");
    return { currentUser: body.currentUser, usedProvidedUser: true };
  }

  console.log("🔄 [API-OPTIMIZATION] No currentUser provided, calling checkAuth");
  const { currentUser } = await checkAuth(cookies);
  return { currentUser, usedProvidedUser: false };
}

/**
 * Helper function to get current project, either from request body or by fetching from database
 * @param supabase - Supabase client
 * @param body - Request body that may contain currentProject
 * @param projectId - Project ID to fetch if currentProject not provided
 * @returns Promise<{currentProject: any, usedProvidedProject: boolean}>
 */
export async function getCurrentProject(
  supabase: any,
  body: OptimizedApiRequest,
  projectId?: number
): Promise<{ currentProject: any; usedProvidedProject: boolean }> {
  if (body.currentProject && body.currentProject.id) {
    console.log("🚀 [API-OPTIMIZATION] Using provided currentProject, skipping database fetch");
    return { currentProject: body.currentProject, usedProvidedProject: true };
  }

  if (projectId) {
    console.log("🔄 [API-OPTIMIZATION] No currentProject provided, fetching from database");
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch project: ${error.message}`);
    }

    return { currentProject: project, usedProvidedProject: false };
  }

  throw new Error("No currentProject provided and no projectId to fetch");
}

/**
 * Standardized response format for optimized APIs
 */
export interface OptimizedApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  optimizations?: {
    usedProvidedUser: boolean;
    usedProvidedProject: boolean;
  };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message: string = "Success",
  optimizations?: { usedProvidedUser: boolean; usedProvidedProject: boolean }
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      message,
      optimizations,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}
