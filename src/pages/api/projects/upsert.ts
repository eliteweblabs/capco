import type { APIRoute } from "astro";
import { createErrorResponse } from "../../../lib/_api-optimization";
import { checkAuth } from "../../../lib/auth";
import { SimpleProjectLogger } from "../../../lib/simple-logging";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { getApiBaseUrl } from "../../../lib/url-utils";
import { applyProjectTemplates } from "../../../lib/apply-project-templates";
import { isClientOrSuperAdmin, isNotClientOrSuperAdmin } from "../../../lib/user-utils";

interface ProjectData {
  id?: number;
  title?: string;
  address?: string;
  authorId?: string;
  assignedToId?: string;
  sqFt?: number;
  units?: number;
  architect?: string;
  newConstruction?: boolean;
  building?: string[];
  project?: string[];
  tier?: string[];
  service?: string[];
  requestedDocs?: string[];
  status?: number;
  siteAccess?: string;
  exteriorBeacon?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserData {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  authorId?: string;
}

// Simple interface for project updates
interface ProjectUpdateFormData {
  [key: string]: any;
}

// Simple utility functions
const sanitizeFormData = (data: ProjectUpdateFormData) => data;
const validateProjectUpdate = (data: ProjectUpdateFormData) => [];
const mapFormDataToProject = (data: ProjectUpdateFormData) => data;

const isElevatedRole = (role?: string | null) => {
  const normalizedRole = role?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  return ["admin", "staff", "superadmin"].includes(normalizedRole);
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const traceId =
    request.headers.get("x-trace-id") ||
    `projects-upsert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const traceName = request.headers.get("x-trace-name") || "api.projects.upsert.post";
  console.log("📝 [CREATE-PROJECT] API route called!");

  try {
    const body = await request.json();
    console.log("📝 [CREATE-PROJECT] Received request body:", JSON.stringify(body, null, 2));

    if (!supabase) {
      return createErrorResponse("Database connection not available", 500);
    }

    // Get user from session using tokens
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Not authenticated", 401);
    }

    const userId = currentUser.id;
    const userProfile = currentUser.profile;

    if (!userProfile) {
      return createErrorResponse("Failed to get user profile", 500);
    }

    let projectAuthorId: string;

    // Determine project author based on user role
    if (isClientOrSuperAdmin(userProfile.role) && !body.authorId) {
      // If current user is a client, they are the project author
      projectAuthorId = userId;
    } else {
      // If current user is admin/staff, check if client exists or create new one
      const { firstName, lastName, companyName = "", email, authorId } = body as UserData;

      // Check if we should use existing client or create new one
      if (authorId && authorId.trim()) {
        // Use existing client
        if (!supabaseAdmin) {
          return createErrorResponse("Database connection not available", 500);
        }
        projectAuthorId = authorId;

        // Still check if profile needs updating even when using existing client
        const { data: existingProfile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("id", projectAuthorId)
          .single();

        if (!profileError && existingProfile) {
          // Check if any fields have changed
          const trimmedFirstName = firstName?.trim() || "";
          const trimmedLastName = lastName?.trim() || "";
          const trimmedCompanyName = companyName?.trim() || "";

          const hasChanges =
            existingProfile.firstName !== trimmedFirstName ||
            existingProfile.lastName !== trimmedLastName ||
            existingProfile.companyName !== trimmedCompanyName;

          if (hasChanges) {
            console.log("📝 [CREATE-PROJECT] Profile data has changed, updating profile");

            // Update the profile
            const { error: updateError } = await supabaseAdmin
              .from("profiles")
              .update({
                firstName: trimmedFirstName,
                lastName: trimmedLastName,
                companyName: trimmedCompanyName,
                updatedAt: new Date().toISOString(),
              })
              .eq("id", projectAuthorId);

            if (updateError) {
              console.error("📝 [CREATE-PROJECT] Error updating profile:", updateError);
              // Don't fail the project creation, just log the error
            }
          }
        }
      } else {
        // Validate required fields
        if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
          return createErrorResponse("First name, last name, and email are required", 400);
        }

        // Check if user with this email already exists
        if (!supabaseAdmin) {
          return createErrorResponse("Database connection not available", 500);
        }

        const { data: existingUser, error: userCheckError } = await supabaseAdmin
          .from("profiles")
          .select("id, email, role")
          .eq("email", email.trim())
          .single();

        if (userCheckError && userCheckError.code !== "PGRST116") {
          // PGRST116 is "not found" error, which is expected if user doesn't exist
          console.error("📝 [CREATE-PROJECT] Error checking existing user:", userCheckError);
          return createErrorResponse("Failed to check existing user", 500);
        }

        if (existingUser) {
          // User exists, check if profile needs updating
          projectAuthorId = existingUser.id;

          const { data: existingProfile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("firstName, lastName, companyName")
            .eq("id", existingUser.id)
            .single();

          if (!profileError && existingProfile) {
            // Check if any fields have changed
            const trimmedFirstName = firstName?.trim() || "";
            const trimmedLastName = lastName?.trim() || "";
            const trimmedCompanyName = companyName?.trim() || "";

            const hasChanges =
              existingProfile.firstName !== trimmedFirstName ||
              existingProfile.lastName !== trimmedLastName ||
              existingProfile.companyName !== trimmedCompanyName;

            if (hasChanges) {
              // Update the profile
              const { error: updateError } = await supabaseAdmin
                .from("profiles")
                .update({
                  firstName: trimmedFirstName,
                  lastName: trimmedLastName,
                  companyName: trimmedCompanyName,
                  updatedAt: new Date().toISOString(),
                })
                .eq("id", existingUser.id);

              if (updateError) {
                console.error("📝 [CREATE-PROJECT] Error updating profile:", updateError);
                // Don't fail the project creation, just log the error
              }
            }
          }
        } else {
          // User doesn't exist, create new client
          try {
            // Call the users/upsert API to create the new client
            const baseUrl = getApiBaseUrl(request);

            const createUserResponse = await fetch(`${baseUrl}/api/users/upsert`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Cookie: `sb-access-token=${cookies.get("sb-access-token")?.value}; sb-refresh-token=${cookies.get("sb-refresh-token")?.value}`,
                "x-trace-id": traceId,
                "x-trace-name": `${traceName}.createUser`,
              },
              body: JSON.stringify({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                companyName: companyName?.trim() || "",
                email: email.trim(),
                role: "Client",
              }),
            });

            const createUserResult = await createUserResponse.json();

            if (!createUserResponse.ok || !createUserResult.success) {
              console.error("📝 [CREATE-PROJECT] Failed to create client:", createUserResult);
              return createErrorResponse(
                createUserResult.error || "Failed to create client",
                createUserResponse.status
              );
            }

            // Use the created user's ID as the project author
            projectAuthorId = createUserResult.data.id;
          } catch (error) {
            console.error("📝 [CREATE-PROJECT] Error calling create-user endpoint:", error);
            return createErrorResponse("Failed to create client", 500);
          }
        }
      }
    }

    // Prepare project data
    const { companyName, firstName, lastName, email, ...updateFields } = body;

    const projectData: ProjectData = {
      ...updateFields,
      authorId: projectAuthorId,
      siteAccess: body.address ? body.address.match(/^[^,]+/)?.[0]?.trim() : null,
      exteriorBeacon: body.address ? body.address.match(/^[^,]+/)?.[0]?.trim() : null,
      title: body.title || body.address,
      address: body.address?.replace(/,\s*USA$/i, "").trim() || body.address,
      architect: body.architect && body.architect.trim() !== "" ? body.architect.trim() : null,
      sqFt: body.sqFt && body.sqFt.trim() !== "" ? parseInt(body.sqFt) : null,
      newConstruction: body.newConstruction === "on" || body.newConstruction === true,
      units: body.units && body.units.trim() !== "" ? parseInt(body.units) : null,
      building: body.building || [],
      project: body.project || [],
      tier: body.tier || [],
      service: body.service || [],
      requestedDocs: body.requestedDocs || [],
      status: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // SAFETY CHECK: Ensure project author is always a client
    const { data: authorProfile, error: authorCheckError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", projectAuthorId)
      .single();

    if (authorCheckError) {
      return createErrorResponse("Failed to verify project author role", 500);
    }

    if (isNotClientOrSuperAdmin(authorProfile.role)) {
      return createErrorResponse("Project author must be a client", 400);
    }

    // Use supabaseAdmin for Admin/Staff users to bypass RLS, regular supabase for Clients
    const hasElevatedAccess = isElevatedRole(userProfile.role);
    const dbClient = hasElevatedAccess && supabaseAdmin ? supabaseAdmin : supabase;

    if (!dbClient) {
      return createErrorResponse("Database connection not available", 500);
    }

    // Create project
    const { data: projects, error } = await dbClient
      .from("projects")
      .insert([projectData])
      .select();

    if (error) {
      console.error("📝 [CREATE-PROJECT] Database error:", error);
      return createErrorResponse(error.message, 500);
    }

    if (!projects || projects.length === 0) {
      return createErrorResponse("Failed to create project", 500);
    }

    const project = projects[0];

    // Log the project creation
    try {
      await SimpleProjectLogger.addLogEntry(
        project,
        "projectCreated",
        project.address ? project.address : "New Project was created",
        {
          ...projectData,
        }
      );
    } catch (logError) {
      console.error("Error logging project creation:", logError);
    }

    // Apply project templates (punchlist and discussion items)
    try {
      console.log(`📝 [CREATE-PROJECT] Applying templates to project ${project.id}`);
      const templateResult = await applyProjectTemplates(project.id, project);

      if (templateResult.success) {
        console.log(
          `✅ [CREATE-PROJECT] Applied ${templateResult.punchlistCount} punchlist and ${templateResult.discussionCount} discussion templates`
        );
      }

      if (templateResult.errors.length > 0) {
        console.warn(`⚠️ [CREATE-PROJECT] Template errors:`, templateResult.errors);
      }
    } catch (templateError) {
      console.error("❌ [CREATE-PROJECT] Error applying templates:", templateError);
      // Don't fail project creation if templates fail
    }

    // Enrich the project data
    let enrichedProject = { ...project };

    try {
      // Get project author's profile data
      if (project.authorId) {
        const { data: authorProfile, error: authorError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", project.authorId)
          .single();

        if (!authorError && authorProfile) {
          enrichedProject.authorProfile = authorProfile;
        }
      }

      // Get assigned user's profile data
      if (project.assignedToId) {
        const { data: assignedToProfile, error: assignedError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", project.assignedToId)
          .maybeSingle();

        if (!assignedError && assignedToProfile) {
          enrichedProject.assignedToId = assignedToProfile.id;
          enrichedProject.assignedToProfile = assignedToProfile;
        }
      }

      // Initialize empty arrays for consistency (will be populated by templates)
      enrichedProject.projectFiles = [];
      enrichedProject.generatedDocuments = [];
      enrichedProject.commentCount = 0;
      enrichedProject.incompleteDiscussions = 0;
      enrichedProject.discussionRatio = "0/0";
      enrichedProject.punchlistItems = { completed: 0, total: 0 };
      enrichedProject.featuredImageData = null;
    } catch (enrichError) {
      console.error("Error enriching project data:", enrichError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        project: enrichedProject,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "x-trace-id": traceId,
          "x-trace-name": traceName,
        },
      }
    );
  } catch (error) {
    console.error("📝 [CREATE-PROJECT] Catch block error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

export const PUT: APIRoute = async ({ request, cookies, params }) => {
  const traceId =
    request.headers.get("x-trace-id") ||
    `projects-upsert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const traceName = request.headers.get("x-trace-name") || "api.projects.upsert.put";
  console.log("🔧 [UPSERT-PROJECT] API called");
  try {
    const body = await request.json();
    console.log("🔧 [UPSERT-PROJECT] Request body:", body);

    // If no project ID in params, check body
    const projectId = params.id || body.id;
    const isUpdate = !!projectId;

    // If no ID at all, treat as POST/create
    if (!isUpdate) {
      console.log("🔧 [UPSERT-PROJECT] No project ID found, treating as create");
      return POST({ request, cookies, params } as Parameters<typeof POST>[0]);
    }

    console.log("🔧 [UPSERT-PROJECT] Project ID found, treating as update:", projectId);

    // Get current user
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    const userRole = currentUser.profile?.role?.toLowerCase();

    // Check permissions - only elevated roles can update projects
    if (!isElevatedRole(userRole)) {
      return createErrorResponse("Access denied", 403);
    }

    // PERFORMANCE: Skip fetching current project since we disabled logging
    // Get current project data for logging
    // const { data: currentProject, error: fetchError } = await supabase!
    //   .from("projects")
    //   .select("*")
    //   .eq("id", projectId)
    //   .single();

    // if (fetchError || !currentProject) {
    //   return createErrorResponse("Project not found", 404);
    // }

    // Sanitize and validate form data
    const sanitizedData = sanitizeFormData(body as ProjectUpdateFormData);
    const validationErrors = validateProjectUpdate(sanitizedData);

    if (validationErrors.length > 0) {
      return createErrorResponse(`Validation failed: ${validationErrors.join(", ")}`, 400);
    }

    // Map form data directly to database fields (no manual mapping!)
    const rawUpdate = mapFormDataToProject(sanitizedData);
    // Do not update primary key; id is only used for .eq()
    const { id: _omit, ...updateData } = rawUpdate as ProjectUpdateFormData & { id?: string };
    if (Object.keys(updateData).length === 0) {
      return createErrorResponse("No fields to update", 400);
    }
    console.log("🔧 [UPDATE-PROJECT] Mapped update data:", updateData);

    // Note: updatedAt is automatically set by PostgreSQL trigger

    // Use supabaseAdmin for Admin/Staff users to bypass RLS
    const dbClient = isElevatedRole(userRole) && supabaseAdmin ? supabaseAdmin : supabase;

    if (!dbClient) {
      return createErrorResponse("Database connection not available", 500);
    }

    const projectIdNum = typeof projectId === "string" ? parseInt(projectId, 10) : projectId;
    if (Number.isNaN(projectIdNum)) {
      return createErrorResponse("Invalid project ID", 400);
    }

    // Update the project
    const { data: project, error: updateError } = await dbClient
      .from("projects")
      .update(updateData)
      .eq("id", projectIdNum)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating project:", updateError);
      return createErrorResponse("Failed to update project", 500);
    }

    // PERFORMANCE: Disable logging for simple field updates to prevent 10+ second saves
    // Log the update asynchronously (don't block the response)
    // SimpleProjectLogger.addLogEntry(
    //   parseInt(projectId),
    //   "projectUpdated",
    //   "Project was updated",
    //   {
    //     oldData: currentProject,
    //     newData: project,
    //   }
    // ).catch((error) => {
    //   console.error("⚠️ [UPDATE-PROJECT] Failed to log update (non-critical):", error);
    // });

    return new Response(
      JSON.stringify({
        success: true,
        project: project,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "x-trace-id": traceId,
          "x-trace-name": traceName,
        },
      }
    );
  } catch (error) {
    console.error("❌ [UPDATE-PROJECT] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
};
