/**
 * API Optimization Utilities - Improved Version
 *
 * This module provides utilities to optimize API calls by accepting validated objects
 * instead of making redundant database calls, with proper type safety and security.
 */

import type { User, Project, File } from "../types/database";

// Properly typed interfaces
export interface OptimizedApiRequest {
  currentUser?: User;
  currentProject?: Project;
  currentFile?: File;
  // Add other entities as needed
}

export interface OptimizationResult<T> {
  data: T;
  optimizations: {
    usedProvidedUser: boolean;
    usedProvidedProject: boolean;
    usedProvidedFile: boolean;
  };
}

/**
 * Get current user with validation
 */
export async function getCurrentUser(
  supabase: any,
  body: OptimizedApiRequest,
  userId?: string
): Promise<OptimizationResult<User>> {
  if (body.currentUser && body.currentUser.id) {
    // Validate the provided user is legitimate
    const isValidUser = await validateUser(supabase, body.currentUser.id);
    if (isValidUser) {
      console.log("🚀 [API-OPTIMIZATION] Using provided currentUser, skipping database fetch");
      return {
        data: body.currentUser,
        optimizations: {
          usedProvidedUser: true,
          usedProvidedProject: false,
          usedProvidedFile: false,
        },
      };
    }
  }

  if (userId) {
    console.log("🔄 [API-OPTIMIZATION] No valid currentUser provided, fetching from database");
    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return {
      data: user,
      optimizations: {
        usedProvidedUser: false,
        usedProvidedProject: false,
        usedProvidedFile: false,
      },
    };
  }

  throw new Error("No currentUser provided and no userId to fetch");
}

/**
 * Get current project with validation
 */
export async function getCurrentProject(
  supabase: any,
  body: OptimizedApiRequest,
  projectId?: number
): Promise<OptimizationResult<Project>> {
  if (body.currentProject && body.currentProject.id) {
    // Validate the provided project is legitimate
    const isValidProject = await validateProject(supabase, body.currentProject.id);
    if (isValidProject) {
      console.log("🚀 [API-OPTIMIZATION] Using provided currentProject, skipping database fetch");
      return {
        data: body.currentProject,
        optimizations: {
          usedProvidedUser: false,
          usedProvidedProject: true,
          usedProvidedFile: false,
        },
      };
    }
  }

  if (projectId) {
    console.log("🔄 [API-OPTIMIZATION] No valid currentProject provided, fetching from database");
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch project: ${error.message}`);
    }

    return {
      data: project,
      optimizations: {
        usedProvidedUser: false,
        usedProvidedProject: false,
        usedProvidedFile: false,
      },
    };
  }

  throw new Error("No currentProject provided and no projectId to fetch");
}

/**
 * Validate that a provided user is legitimate
 */
async function validateUser(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("profiles").select("id").eq("id", userId).single();

    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * Validate that a provided project is legitimate
 */
async function validateProject(supabase: any, projectId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
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
    usedProvidedFile: boolean;
  };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message: string = "Success",
  optimizations?: {
    usedProvidedUser: boolean;
    usedProvidedProject: boolean;
    usedProvidedFile: boolean;
  }
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

/**
 * Example usage in an API endpoint:
 *
 * export const POST: APIRoute = async ({ request, cookies }) => {
 *   const body = await request.json();
 *
 *   // Get user and project with optimization
 *   const userResult = await getCurrentUser(supabase, body, currentUser?.id);
 *   const projectResult = await getCurrentProject(supabase, body, projectId);
 *
 *   // Use the data
 *   const user = userResult.data;
 *   const project = projectResult.data;
 *
 *   // Return with optimization info
 *   return createSuccessResponse(
 *     { user, project },
 *     "Success",
 *     {
 *       usedProvidedUser: userResult.optimizations.usedProvidedUser,
 *       usedProvidedProject: projectResult.optimizations.usedProvidedProject,
 *       usedProvidedFile: false
 *     }
 *   );
 * };
 */
