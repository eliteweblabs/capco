import type { APIRoute } from "astro";
import { SimpleProjectLogger } from "../../../lib/simple-logging";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { getApiBaseUrl } from "../../../lib/url-utils";

export const POST: APIRoute = async ({ request, cookies }) => {
  // console.log("📝 [CREATE-PROJECT] API route called!");

  try {
    const body = await request.json();
    console.log("📝 [CREATE-PROJECT] Received request body:", JSON.stringify(body, null, 2));

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
      });
    }

    // Get user from session using tokens
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      console.log("📝 [CREATE-PROJECT] Missing auth tokens");
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }

    // Set session
    const { data: session, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !session.session?.user) {
      console.log("📝 [CREATE-PROJECT] Session error:", sessionError);
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
      });
    }

    const userId = session.session.user.id;
    // Get user profile to determine role
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.log("📝 [CREATE-PROJECT] Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ error: "Failed to get user profile" }), {
        status: 500,
      });
    }

    // console.log("📝 [CREATE-PROJECT] User profile:", userProfile);

    let projectAuthorId: string;

    // Determine project author based on user role
    if (userProfile.role === "Client" && !body.authorId) {
      // If current user is a client, they are the project author
      projectAuthorId = userId;
      // console.log("📝 [CREATE-PROJECT] Client user - using their ID as author:", projectAuthorId);
    } else {
      // If current user is admin/staff, check if client exists or create new one
      const { firstName, lastName, companyName = "", email, authorId } = body;

      console.log("📝 [CREATE-PROJECT] Body:", body);
      // Check if we should use existing client or create new one
      if (authorId && authorId.trim()) {
        // Use existing client
        if (!supabaseAdmin) {
          return new Response(JSON.stringify({ error: "Database connection not available" }), {
            status: 500,
          });
        }
        projectAuthorId = authorId;
        // console.log("📝 [CREATE-PROJECT] Using existing client ID:", projectAuthorId);

        // Still check if profile needs updating even when using existing client
        // console.log("📝 [CREATE-PROJECT] Checking if profile needs updating for existing client");

        // Get current profile to compare with form data
        const { data: existingProfile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("id", projectAuthorId)
          .single();

        if (profileError) {
          console.error("📝 [CREATE-PROJECT] Error fetching current profile:", profileError);
        } else if (existingProfile) {
          // Check if any fields have changed
          const trimmedFirstName = firstName?.trim() || "";
          const trimmedLastName = lastName?.trim() || "";
          const trimmedCompanyName = companyName?.trim() || "";

          const hasChanges =
            existingProfile.firstName !== trimmedFirstName ||
            existingProfile.lastName !== trimmedLastName ||
            existingProfile.companyName !== trimmedCompanyName;

          // console.log("📝 [CREATE-PROJECT] Profile comparison for existing client:", {
          //   current: {
          //     firstName: existingProfile.firstName,
          //     lastName: existingProfile.lastName,
          //     companyName: existingProfile.companyName,
          //   },
          //   new: {
          //     firstName: trimmedFirstName,
          //     lastName: trimmedLastName,
          //     companyName: trimmedCompanyName,
          //   },
          //   hasChanges,
          // });

          if (hasChanges) {
            console.log("📝 [CREATE-PROJECT] Profile data has changed, updating profile:", {
              old: {
                firstName: existingProfile.firstName,
                lastName: existingProfile.lastName,
                companyName: existingProfile.companyName,
              },
              new: {
                firstName: trimmedFirstName,
                lastName: trimmedLastName,
                companyName: trimmedCompanyName,
              },
            });

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
            } else {
              // console.log("📝 [CREATE-PROJECT] Profile updated successfully");
              // console.log("📝 [CREATE-PROJECT] Updated profile data:", {
              //   firstName: trimmedFirstName,
              //   lastName: trimmedLastName,
              //   companyName: trimmedCompanyName,
              // });
            }
          } else {
            // console.log("📝 [CREATE-PROJECT] Profile data unchanged, no update needed");
          }
        }
      } else {
        // Validate required fields
        if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
          return new Response(
            JSON.stringify({
              error: "First name, last name, and email are required",
              details: "Please fill in all required fields for the client",
            }),
            { status: 400 }
          );
        }

        // Check if user with this email already exists
        // console.log("📝 [CREATE-PROJECT] Checking if user exists with email:", email);
        if (!supabaseAdmin) {
          return new Response(JSON.stringify({ error: "Database connection not available" }), {
            status: 500,
          });
        }
        const { data: existingUser, error: userCheckError } = await supabaseAdmin
          .from("profiles")
          .select("id, email, role")
          .eq("email", email.trim())
          .single();

        if (userCheckError && userCheckError.code !== "PGRST116") {
          // PGRST116 is "not found" error, which is expected if user doesn't exist
          console.error("📝 [CREATE-PROJECT] Error checking existing user:", userCheckError);
          return new Response(
            JSON.stringify({
              error: "Failed to check existing user",
              details: userCheckError.message,
            }),
            { status: 500 }
          );
        }

        if (existingUser) {
          // User exists, check if profile needs updating
          projectAuthorId = existingUser.id;

          const { data: existingProfile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("firstName, lastName, companyName")
            .eq("id", existingUser.id)
            .single();

          if (profileError) {
            console.error("📝 [CREATE-PROJECT] Error fetching current profile:", profileError);
          } else if (existingProfile) {
            // Check if any fields have changed
            const trimmedFirstName = firstName?.trim() || "";
            const trimmedLastName = lastName?.trim() || "";
            const trimmedCompanyName = companyName?.trim() || "";

            const hasChanges =
              existingProfile.firstName !== trimmedFirstName ||
              existingProfile.lastName !== trimmedLastName ||
              existingProfile.companyName !== trimmedCompanyName;

            if (hasChanges) {
              console.log("📝 [CREATE-PROJECT] Profile data has changed, updating profile:", {
                old: {
                  firstName: existingProfile.firstName,
                  lastName: existingProfile.lastName,
                  companyName: existingProfile.companyName,
                },
                new: {
                  firstName: firstName?.trim(),
                  lastName: lastName?.trim(),
                  companyName: companyName?.trim(),
                },
              });

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
              } else {
                (window as any).showModal(
                  "success",
                  `${trimmedCompanyName}Profile Updated", "Profile has been updated successfully!`,
                  2000
                );
              }
            } else {
              // console.log("📝 [CREATE-PROJECT] Profile data unchanged, no update needed");
            }
          }
          const authorProfile = existingProfile;
        } else {
          // User doesn't exist, create new client
          // console.log("📝 [CREATE-PROJECT] User doesn't exist, creating new client");

          try {
            // Call the create-user API to create the new client
            const baseUrl = getApiBaseUrl(request);

            // Create FormData for consistency with other forms
            const formData = new FormData();
            formData.append("firstName", firstName.trim());
            formData.append("lastName", lastName.trim());
            formData.append("companyName", companyName?.trim() || "");
            formData.append("email", email.trim());
            formData.append("role", "Client");

            const createUserResponse = await fetch(`${baseUrl}/api/user/new`, {
              method: "POST",
              headers: {
                Cookie: `sb-access-token=${cookies.get("sb-access-token")?.value}; sb-refresh-token=${cookies.get("sb-refresh-token")?.value}`,
              },
              body: formData,
            });

            const createUserResult = await createUserResponse.json();

            if (!createUserResponse.ok || !createUserResult.success) {
              console.error("📝 [CREATE-PROJECT] Failed to create client:", createUserResult);
              return new Response(
                JSON.stringify({
                  error: createUserResult.error || "Failed to create client",
                  details: createUserResult.details || "Please try again",
                }),
                { status: createUserResponse.status }
              );
            }

            // Use the created user's ID as the project author
            projectAuthorId = createUserResult.user.id;
            const authorProfile = createUserResult.user;
            // console.log(
            //   "📝 [CREATE-PROJECT] New client created successfully, ID:",
            //   projectAuthorId
            // );
          } catch (error) {
            console.error("📝 [CREATE-PROJECT] Error calling create-user endpoint:", error);
            return new Response(
              JSON.stringify({
                error: "Failed to create client",
                details: error instanceof Error ? error.message : "Unknown error",
              }),
              { status: 500 }
            );
          }
        }
      }
    }

    // Debug all button group fields
    // const buttonGroupFields = ["building", "project", "service", "requestedDocs"];

    // buttonGroupFields.forEach((fieldName) => {
    //   console.log(`📝 [CREATE-PROJECT] Debug ${fieldName} field:`, {
    //     value: body[fieldName],
    //     type: typeof body[fieldName],
    //     isArray: Array.isArray(body[fieldName]),
    //     stringified: Array.isArray(body[fieldName])
    //       ? JSON.stringify(body[fieldName])
    //       : body[fieldName],
    //   });
    // });

    // Prepare project data - use dynamic mapping like update-project API
    // Filter out user profile fields that don't belong in projects table
    const { companyName, firstName, lastName, email, ...updatestields } = body;

    // Start with filtered form data and add required fields
    const projectData = {
      ...updatestields, // Include only project-related form fields
      authorId: projectAuthorId,
      // Handle special cases for specific fields
      siteAccess: body.address ? body.address.match(/^[^,]+/)?.[0]?.trim() : null,
      exteriorBeacon: body.address ? body.address.match(/^[^,]+/)?.[0]?.trim() : null,
      title: body.title || body.address,
      address: body.address?.replace(/, USA$/, "") || body.address,
      architect: body.architect && body.architect.trim() !== "" ? body.architect.trim() : null,
      sqFt: body.sqFt && body.sqFt.trim() !== "" ? parseInt(body.sqFt) : null,
      newConstruction: body.newConstruction === "on" || body.newConstruction === true,
      units: body.units && body.units.trim() !== "" ? parseInt(body.units) : null,
      // Ensure button group fields are arrays
      building: body.building || [],
      project: body.project || [],
      tier: body.tier || [],
      service: body.service || [],
      requestedDocs: body.requestedDocs || [],
      status: 0, // Set initial status to 0, will be updated to 10 via update-status API to trigger emails
      createdAt: new Date().toISOString(), // Set creation timestamp
      updatedAt: new Date().toISOString(), // Set initial update timestamp
    };

    // console.log(
    //   "📝 [CREATE-PROJECT] Inserting project data:",
    //   JSON.stringify(projectData, null, 2)
    // );

    // SAFETY CHECK: Ensure project author is always a client
    // This prevents the issue where projects could be created with admin/staff authors
    // The check validates that the authorId corresponds to a user with role = 'Client'
    // console.log("📝 [CREATE-PROJECT] Safety check: Verifying project author role");
    const { data: authorProfile, error: authorCheckError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", projectAuthorId)
      .single();

    if (authorCheckError) {
      console.error(
        "📝 [CREATE-PROJECT] Safety check failed - could not verify author role:",
        authorCheckError
      );
      return new Response(
        JSON.stringify({
          error: "Failed to verify project author role",
          details: "Could not validate that the project author is a client",
        }),
        {
          status: 500,
        }
      );
    }

    if (authorProfile.role !== "Client") {
      console.error(
        "📝 [CREATE-PROJECT] SAFETY CHECK FAILED - Project author is not a client! e5EGRe6*uryetgre"
      );
      return new Response(
        JSON.stringify({
          error: "Project author must be a client",
          details: `Cannot create project with author role: ${authorProfile.role}. Only clients can be project authors.`,
        }),
        {
          status: 400,
        }
      );
    }

    // Create project
    const { data: projects, error } = await supabase
      .from("projects")
      .insert([projectData])
      .select();

    if (error) {
      console.error("📝 [CREATE-PROJECT] Database error: er#5erw3$Tr", error);

      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.details,
          code: error.code,
          hint: error.hint,
        }),
        {
          status: 500,
        }
      );
    }

    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({ error: "Failed to create project" }), {
        status: 500,
      });
    }

    const project = projects[0];

    // Get current user data for logging
    const currentUser = {
      id: userId,
      email: session.session.user.email,
      profile: userProfile,
    };

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
      // Don't fail the request if logging fails
    }

    // Enrich the project data to match get-project API format
    let enrichedProject = { ...project };

    try {
      // Get project author's profile data
      let projectAuthor = null;
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

      // Get assigned user's profile data if project has an assigned user
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

      // Initialize empty arrays for consistency with get-project API
      enrichedProject.projectFiles = [];
      enrichedProject.generatedDocuments = [];
      enrichedProject.commentCount = 0;
      enrichedProject.incompleteDiscussions = 0;
      enrichedProject.discussionRatio = "0/0";
      enrichedProject.punchlistItems = { completed: 0, total: 0 };
      enrichedProject.featuredImageData = null;
    } catch (enrichError) {
      console.error("Error enriching project data:", enrichError);
      // Continue with basic project data if enrichment fails
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
        },
      }
    );
  } catch (error) {
    console.error("📝 [CREATE-PROJECT] Catch block error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
