import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async ({ request }) => {
  console.log("📡 [API] GET /api/get-project called");

  try {
    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get role and user_id from headers
    const role = request.headers.get("role");
    const userId = request.headers.get("user_id");

    console.log("📡 [API] Role:", role, "User ID:", userId);

    if (!role || !userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Role and user_id are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Build query based on role
    let query = supabase.from("projects").select("*");

    if (role === "Admin") {
      // Admin gets all projects
      console.log("📡 [API] Admin role - fetching all projects");
    } else if (role === "Staff") {
      // Staff gets projects where assigned_to matches user_id
      console.log("📡 [API] Staff role - fetching projects assigned to user:", userId);
      query = query.eq("assigned_to_id", userId);
    } else {
      // Client gets projects where author_id matches user_id
      console.log("📡 [API] Client role - fetching projects authored by user:", userId);
      query = query.eq("author_id", userId);
    }

    // Execute query
    const { data: projects, error } = await query.order("updated_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching projects:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("📡 [API] Projects fetched before author lookup:", projects?.length);

    // Get unique author IDs for batch profile lookup
    const authorIds = [...new Set(projects?.map(p => p.author_id).filter(Boolean))] || [];
    
    let authorProfiles = [];
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", authorIds);
      
      authorProfiles = profiles || [];
    }

    // Create a map for quick author name lookup
    const authorNameMap = new Map();
    authorProfiles.forEach(profile => {
      authorNameMap.set(profile.id, profile.name);
    });

    // Add author names to projects
    const processedProjects = projects?.map(project => ({
      ...project,
      author_name: authorNameMap.get(project.author_id) || null
    })) || [];

    console.log("📡 [API] Projects fetched:", processedProjects.length);

    return new Response(
      JSON.stringify({
        success: true,
        projects: processedProjects,
        count: processedProjects.length,
        role: role,
        user_id: userId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get projects error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch projects",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// import type { APIRoute } from "astro";
// import { supabase } from "../../lib/supabase";

// export const GET: APIRoute = async ({ request, params }) => {
//   console.log("📡 [API] GET /api/get-project called");

//   try {
//     console.log("📡 [API] Checking Supabase configuration...");

//     if (!supabase) {
//       console.log("📡 [API] Supabase not configured, returning error");
//       return new Response(
//         JSON.stringify({
//           success: false,
//           error: "Database not configured",
//         }),
//         {
//           status: 500,
//           headers: { "Content-Type": "application/json" },
//         },
//       );
//     }

//     // In your API endpoint
//     const role = request.headers.get("role");
//     console.log("📡 [API] Role:", role);
//     // Get the project ID from the URL
//     // const url = new URL(request.url);
//     // const projectId = url.searchParams.get("id");

//     // console.log("📡 [API] Project ID from URL:", projectId);

//     // if (!projectId) {
//     //   console.log("📡 [API] No project ID provided");
//     //   return new Response(
//     //     JSON.stringify({
//     //       success: false,
//     //       error: "Project ID is required",
//     //     }),
//     //     {
//     //       status: 400,
//     //       headers: { "Content-Type": "application/json" },
//     //     },
//     //   );
//     // }

//     // console.log("📡 [API] Getting current user...");

//     // Get current user to verify permissions
//     // const {
//     //   data: { user },
//     //   error: userError,
//     // } = await supabase.auth.getUser();

//     // console.log("📡 [API] User auth result:", {
//     //   hasUser: !!user,
//     //   userId: user?.id || null,
//     //   userEmail: user?.email || null,
//     //   hasError: !!userError,
//     //   errorMessage: userError?.message || null,
//     // });

//     // if (userError || !user) {
//     //   console.log("📡 [API] No authenticated user, returning error");
//     //   return new Response(
//     //     JSON.stringify({
//     //       success: false,
//     //       error: "Authentication required",
//     //     }),
//     //     {
//     //       status: 401,
//     //       headers: { "Content-Type": "application/json" },
//     //     },
//     //   );
//     // }

//     console.log("📡 [API] Getting user profile for role...");

//     // Get user profile to check role
//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("role")
//       .eq("id", user.id)
//       .single();

//     const userRole = profile?.role;
//     console.log("📡 [API] User role:", userRole);

//     console.log("📡 [API] Fetching project data...");

//     // Build the query based on user role
//     let query = supabase.from("projects").select("*").eq("id", projectId);

//     // If user is not Admin/Staff, they can only access their own projects
//     if (userRole !== "Admin" && userRole !== "Staff") {
//       console.log("📡 [API] Client user, filtering by author_id:", user.id);
//       query = query.eq("author_id", user.id);
//     } else {
//       console.log(
//         "📡 [API] Admin/Staff user, getting project without author filter",
//       );
//     }

//     const { data: project, error } = await query.single();

//     console.log("📡 [API] Project query result:", {
//       hasProject: !!project,
//       projectId: project?.id || null,
//       hasError: !!error,
//       errorMessage: error?.message || null,
//     });

//     if (error) {
//       console.error("📡 [API] Project fetch error:", error);

//       if (error.code === "PGRST116") {
//         // No rows returned
//         return new Response(
//           JSON.stringify({
//             success: false,
//             error: "Project not found or access denied",
//           }),
//           {
//             status: 404,
//             headers: { "Content-Type": "application/json" },
//           },
//         );
//       }

//       return new Response(
//         JSON.stringify({
//           success: false,
//           error: error.message,
//         }),
//         {
//           status: 500,
//           headers: { "Content-Type": "application/json" },
//         },
//       );
//     }

//     if (!project) {
//       console.log("📡 [API] No project found");
//       return new Response(
//         JSON.stringify({
//           success: false,
//           error: "Project not found",
//         }),
//         {
//           status: 404,
//           headers: { "Content-Type": "application/json" },
//         },
//       );
//     }

//     console.log("📡 [API] Project found, fetching additional metadata...");

//     // Fetch user data for the project
//     let projectWithMetadata = { ...project };

//     try {
//       // Get author profile
//       if (project.author_id) {
//         const { data: authorProfile } = await supabase
//           .from("profiles")
//           .select("id, name, phone, role")
//           .eq("id", project.author_id)
//           .single();

//         if (authorProfile) {
//           projectWithMetadata.author_name = authorProfile.name;
//           projectWithMetadata.author_phone = authorProfile.phone;
//           projectWithMetadata.author_role = authorProfile.role;
//         }
//       }

//       // Get assigned user profile (if assigned)
//       if (project.assigned_to_id) {
//         const { data: assignedProfile } = await supabase
//           .from("profiles")
//           .select("id, name, phone, role")
//           .eq("id", project.assigned_to_id)
//           .single();

//         if (assignedProfile) {
//           projectWithMetadata.assigned_to_name = assignedProfile.name;
//           projectWithMetadata.assigned_to_phone = assignedProfile.phone;
//           projectWithMetadata.assigned_to_role = assignedProfile.role;
//         }
//       }

//       // Get user emails via admin API
//       const { data: authUsers, error: authError } =
//         await supabase.auth.admin.listUsers();

//       if (!authError && authUsers?.users) {
//         const emailMap = new Map();
//         const avatarMap = new Map();

//         authUsers.users.forEach((authUser) => {
//           emailMap.set(authUser.id, authUser.email);
//           avatarMap.set(authUser.id, authUser.user_metadata?.avatar_url);
//         });

//         // Add email data
//         if (project.author_id) {
//           projectWithMetadata.author_email = emailMap.get(project.author_id);
//           projectWithMetadata.author_avatar = avatarMap.get(project.author_id);
//         }

//         if (project.assigned_to_id) {
//           projectWithMetadata.assigned_to_email = emailMap.get(
//             project.assigned_to_id,
//           );
//           projectWithMetadata.assigned_to_avatar = avatarMap.get(
//             project.assigned_to_id,
//           );
//         }
//       }

//       // Get project files count
//       const { count: filesCount } = await supabase
//         .from("files")
//         .select("*", { count: "exact", head: true })
//         .eq("project_id", project.id);

//       projectWithMetadata.files_count = filesCount || 0;

//       // Get latest files
//       const { data: latestFiles } = await supabase
//         .from("files")
//         .select("id, file_path, uploaded_at, status")
//         .eq("project_id", project.id)
//         .order("uploaded_at", { ascending: false })
//         .limit(5);

//       projectWithMetadata.latest_files = latestFiles || [];
//     } catch (metadataError) {
//       console.warn("📡 [API] Error fetching metadata:", metadataError);
//       // Continue without metadata if there's an error
//     }

//     console.log("📡 [API] Returning project data:", {
//       projectId: projectWithMetadata.id,
//       hasMetadata: !!projectWithMetadata.author_name,
//       filesCount: projectWithMetadata.files_count,
//     });

//     return new Response(
//       JSON.stringify({
//         success: true,
//         project: projectWithMetadata,
//         message: "Project data retrieved successfully",
//       }),
//       {
//         status: 200,
//         headers: { "Content-Type": "application/json" },
//       },
//     );
//   } catch (error) {
//     console.error("📡 [API] Unexpected error in get-project:", error);
//     return new Response(
//       JSON.stringify({
//         success: false,
//         error: error instanceof Error ? error.message : "Unknown error",
//       }),
//       {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       },
//     );
//   }
// };
