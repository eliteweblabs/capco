import type { APIRoute } from "astro";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";
import { getApiBaseUrl } from "../../lib/url-utils";

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
    if (userProfile.role === "Client" && !body.author_id) {
      // If current user is a client, they are the project author
      projectAuthorId = userId;
      // console.log("📝 [CREATE-PROJECT] Client user - using their ID as author:", projectAuthorId);
    } else {
      // If current user is admin/staff, check if client exists or create new one
      const { first_name, last_name, company_name = "", email, author_id } = body;

      console.log("📝 [CREATE-PROJECT] Body:", body);
      // Check if we should use existing client or create new one
      if (author_id && author_id.trim()) {
        // Use existing client
        if (!supabaseAdmin) {
          return new Response(JSON.stringify({ error: "Database connection not available" }), {
            status: 500,
          });
        }
        projectAuthorId = author_id;
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
          const trimmedFirstName = first_name?.trim() || "";
          const trimmedLastName = last_name?.trim() || "";
          const trimmedCompanyName = company_name?.trim() || "";

          const hasChanges =
            existingProfile.first_name !== trimmedFirstName ||
            existingProfile.last_name !== trimmedLastName ||
            existingProfile.company_name !== trimmedCompanyName;

          // console.log("📝 [CREATE-PROJECT] Profile comparison for existing client:", {
          //   current: {
          //     first_name: existingProfile.first_name,
          //     last_name: existingProfile.last_name,
          //     company_name: existingProfile.company_name,
          //   },
          //   new: {
          //     first_name: trimmedFirstName,
          //     last_name: trimmedLastName,
          //     company_name: trimmedCompanyName,
          //   },
          //   hasChanges,
          // });

          if (hasChanges) {
            console.log("📝 [CREATE-PROJECT] Profile data has changed, updating profile:", {
              old: {
                first_name: existingProfile.first_name,
                last_name: existingProfile.last_name,
                company_name: existingProfile.company_name,
              },
              new: {
                first_name: trimmedFirstName,
                last_name: trimmedLastName,
                company_name: trimmedCompanyName,
              },
            });

            // Update the profile
            const { error: updateError } = await supabaseAdmin
              .from("profiles")
              .update({
                first_name: trimmedFirstName,
                last_name: trimmedLastName,
                company_name: trimmedCompanyName,
                updated_at: new Date().toISOString(),
              })
              .eq("id", projectAuthorId);

            if (updateError) {
              console.error("📝 [CREATE-PROJECT] Error updating profile:", updateError);
              // Don't fail the project creation, just log the error
            } else {
              // console.log("📝 [CREATE-PROJECT] Profile updated successfully");
              // console.log("📝 [CREATE-PROJECT] Updated profile data:", {
              //   first_name: trimmedFirstName,
              //   last_name: trimmedLastName,
              //   company_name: trimmedCompanyName,
              // });
            }
          } else {
            // console.log("📝 [CREATE-PROJECT] Profile data unchanged, no update needed");
          }
        }
      } else {
        // Validate required fields
        if (!first_name?.trim() || !last_name?.trim() || !email?.trim()) {
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
          // console.log("📝 [CREATE-PROJECT] User exists, using existing ID:", projectAuthorId);
          // console.log("📝 [CREATE-PROJECT] Existing user data:", existingUser);

          // Get current profile to compare with form data
          const { data: existingProfile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("first_name, last_name, company_name")
            .eq("id", existingUser.id)
            .single();

          if (profileError) {
            console.error("📝 [CREATE-PROJECT] Error fetching current profile:", profileError);
          } else if (existingProfile) {
            // Check if any fields have changed
            const trimmedFirstName = first_name?.trim() || "";
            const trimmedLastName = last_name?.trim() || "";
            const trimmedCompanyName = company_name?.trim() || "";

            const hasChanges =
              existingProfile.first_name !== trimmedFirstName ||
              existingProfile.last_name !== trimmedLastName ||
              existingProfile.company_name !== trimmedCompanyName;

            // console.log("📝 [CREATE-PROJECT] Profile comparison:", {
            //   current: {
            //     first_name: existingProfile.first_name,
            //     last_name: existingProfile.last_name,
            //     company_name: existingProfile.company_name,
            //   },
            //   new: {
            //     first_name: trimmedFirstName,
            //     last_name: trimmedLastName,
            //     company_name: trimmedCompanyName,
            //   },
            //   hasChanges,
            // });

            if (hasChanges) {
              console.log("📝 [CREATE-PROJECT] Profile data has changed, updating profile:", {
                old: {
                  first_name: existingProfile.first_name,
                  last_name: existingProfile.last_name,
                  company_name: existingProfile.company_name,
                },
                new: {
                  first_name: first_name?.trim(),
                  last_name: last_name?.trim(),
                  company_name: company_name?.trim(),
                },
              });

              // Update the profile
              const { error: updateError } = await supabaseAdmin
                .from("profiles")
                .update({
                  first_name: trimmedFirstName,
                  last_name: trimmedLastName,
                  company_name: trimmedCompanyName,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingUser.id);

              if (updateError) {
                console.error("📝 [CREATE-PROJECT] Error updating profile:", updateError);
                // Don't fail the project creation, just log the error
              } else {
                // console.log("📝 [CREATE-PROJECT] Profile updated successfully");
                // console.log("📝 [CREATE-PROJECT] Updated profile data:", {
                //   first_name: trimmedFirstName,
                //   last_name: trimmedLastName,
                //   company_name: trimmedCompanyName,
                // });
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
            const createUserResponse = await fetch(`${baseUrl}/api/create-user`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Cookie: `sb-access-token=${cookies.get("sb-access-token")?.value}; sb-refresh-token=${cookies.get("sb-refresh-token")?.value}`,
              },
              body: JSON.stringify({
                first_name: first_name.trim(),
                last_name: last_name.trim(),
                company_name: company_name?.trim() || "",
                email: email.trim(),
                role: "Client",
              }),
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
    // const buttonGroupFields = ["building", "project", "service", "requested_docs"];

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
    // Start with all form data and add required fields
    const projectData = {
      ...body, // Include all form fields dynamically
      author_id: projectAuthorId,
      // Handle special cases for specific fields
      title: body.title || body.address,
      address: body.address?.replace(/, USA$/, "") || body.address,
      architect: body.architect && body.architect.trim() !== "" ? body.architect.trim() : null,
      sq_ft: body.sq_ft && body.sq_ft.trim() !== "" ? parseInt(body.sq_ft) : null,
      new_construction: body.new_construction === "on" || body.new_construction === true,
      units: body.units && body.units.trim() !== "" ? parseInt(body.units) : null,
      // Ensure button group fields are arrays
      building: body.building || [],
      project: body.project || [],
      tier: body.tier || [],
      service: body.service || [],
      requested_docs: body.requested_docs || [],
      status: 0, // Set initial status to 0, will be updated to 10 via update-status API to trigger emails
      created_at: new Date().toISOString(), // Set creation timestamp
      updated_at: new Date().toISOString(), // Set initial update timestamp
    };

    console.log(
      "📝 [CREATE-PROJECT] Inserting project data:",
      JSON.stringify(projectData, null, 2)
    );

    // SAFETY CHECK: Ensure project author is always a client
    // This prevents the issue where projects could be created with admin/staff authors
    // The check validates that the author_id corresponds to a user with role = 'Client'
    console.log("📝 [CREATE-PROJECT] Safety check: Verifying project author role");
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
      console.error("📝 [CREATE-PROJECT] SAFETY CHECK FAILED - Project author is not a client!", {
        authorId: projectAuthorId,
        authorRole: authorProfile.role,
        expectedRole: "Client",
        currentUserRole: userProfile.role,
      });
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

    console.log("📝 [CREATE-PROJECT] ✅ Safety check passed - project author is a client:", {
      authorId: projectAuthorId,
      authorRole: authorProfile.role,
    });

    // Create project
    console.log("📝 [CREATE-PROJECT] About to insert project into database");
    const { data: projects, error } = await supabase
      .from("projects")
      .insert([projectData])
      .select();

    if (error) {
      console.error("📝 [CREATE-PROJECT] Database error:", error);
      console.error("📝 [CREATE-PROJECT] Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      console.error(
        "📝 [CREATE-PROJECT] Project data that failed:",
        JSON.stringify(projectData, null, 2)
      );
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

    // console.log("📝 [CREATE-PROJECT] Project created successfully:", {
    //   id: project.id,
    //   author_id: project.author_id,
    //   title: project.title,
    //   address: project.address,
    //   status: project.status,
    // });

    // Verify the project has the correct initial status
    // if (project.status !== 0) {
    //   console.error("📝 [CREATE-PROJECT] WARNING: Project created without status 0!", {
    //     actualStatus: project.status,
    //     expectedStatus: 0,
    //     projectId: project.id,
    //   });
    // } else {
    //   console.log(
    //     "📝 [CREATE-PROJECT] ✅ Project created with correct initial status:",
    //     project.status
    //   );
    // }

    // This will trigger proper email notifications for "Specs Received" status

    // console.log("📝 [CREATE-PROJECT] ==========================================");

    // Get current user data for logging
    const currentUser = {
      id: userId,
      email: session.session.user.email,
      profile: userProfile,
    };

    // Log the project creation
    try {
      await SimpleProjectLogger.addLogEntry(
        project.id,
        "project_created",
        currentUser,
        "Project was created",
        projectData
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
      if (project.author_id) {
        const { data: authorProfile, error: authorError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", project.author_id)
          .single();

        if (!authorError && authorProfile) {
          enrichedProject.authorProfile = authorProfile;
        }
      }

      // Get assigned user's profile data if project has an assigned user
      if (project.assigned_to_id) {
        const { data: assignedToProfile, error: assignedError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", project.assigned_to_id)
          .maybeSingle();

        if (!assignedError && assignedToProfile) {
          enrichedProject.assigned_to_id = assignedToProfile.id;
          enrichedProject.assignedToProfile = assignedToProfile;
        }
      }

      // Initialize empty arrays for consistency with get-project API
      enrichedProject.projectFiles = [];
      enrichedProject.generatedDocuments = [];
      enrichedProject.comment_count = 0;
      enrichedProject.incomplete_discussions = 0;
      enrichedProject.discussion_ratio = "0/0";
      enrichedProject.punchlistItems = { completed: 0, total: 0 };
      enrichedProject.featured_image_data = null;
    } catch (enrichError) {
      console.error("Error enriching project data:", enrichError);
      // Continue with basic project data if enrichment fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        project: enrichedProject,
        projectFiles: enrichedProject.projectFiles,
        generatedDocuments: enrichedProject.generatedDocuments,
        currentUser: currentUser,
        message: "Project created successfully",
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
