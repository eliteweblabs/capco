// import type { APIRoute } from "astro";
// import { supabase } from "../../lib/supabase";

// export const POST: APIRoute = async ({ request, cookies }) => {
//   try {
//     // console.log("🚨 [API] get-project-files API called at:", new Date().toISOString());
//     const { projectId } = await request.json();
//     // console.log("Project ID:", projectId);

//     if (!projectId) {
//       return new Response(JSON.stringify({ error: "Project ID is required" }), {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     if (!supabase) {
//       return new Response(JSON.stringify({ error: "Database not configured" }), {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Set up session from cookies
//     const accessToken = cookies.get("sb-access-token")?.value;
//     const refreshToken = cookies.get("sb-refresh-token")?.value;

//     // console.log("📡 [API] Auth check:", {
//     //   hasAccessToken: !!accessToken,
//     //   hasRefreshToken: !!refreshToken,
//     // });

//     if (accessToken && refreshToken) {
//       await supabase.auth.setSession({
//         access_token: accessToken,
//         refresh_token: refreshToken,
//       });
//     }

//     // Get current user
//     const {
//       data: { user },
//       error: userError,
//     } = await supabase.auth.getUser();

//     // console.log("User auth result:", { user: !!user, error: userError });

//     if (userError || !user) {
//       console.log("No authenticated user, returning demo response");
//       // Return empty files array for demo purposes when not authenticated
//       return new Response(
//         JSON.stringify({
//           files: [],
//           count: 0,
//           message: "No files available (demo mode - sign in for real files)",
//         }),
//         {
//           status: 200,
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     }

//     // Get user role
//     const { data: profile, error: profileError } = await supabase
//       .from("profiles")
//       .select("role")
//       .eq("id", user.id)
//       .single();

//     let userRole = "Client"; // Default role
//     if (!profileError && profile) {
//       userRole = profile.role || "Client";
//     } else if (profileError) {
//       console.error("Error fetching user profile:", profileError);
//       // Keep default role
//     }

//     // console.log("📡 [API] User role check:", {
//     //   userId: user.id,
//     //   userRole,
//     //   profileRole: profile?.role,
//     //   hasProfile: !!profile,
//     //   profileError: !!profileError,
//     // });

//     // console.log("📡 [API] Project access check for projectId:", projectId);

//     // First, get the project's featured_image field
//     const { data: project, error: projectError } = await supabase
//       .from("projects")
//       .select("featured_image_id")
//       .eq("id", parseInt(projectId))
//       .single();

//     const featuredImageId = project?.featured_image_id || null;

//     // Fetch files for the project
//     let query = supabase
//       .from("files")
//       .select("*")
//       .eq("project_id", parseInt(projectId))
//       .eq("status", "active")
//       .order("uploaded_at", { ascending: false });

//     // Apply RLS - Admins and Staff can see all files, Clients can only see their own projects
//     // console.log("📡 [API] Role check:", {
//     //   userRole,
//     //   isAdmin: userRole === "Admin",
//     //   isStaff: userRole === "Staff",
//     // });

//     if (userRole !== "Admin" && userRole !== "Staff") {
//       // Check project permissions based on user role
//       const { data: project, error: projectError } = await supabase
//         .from("projects")
//         .select("author_id, assigned_to_id")
//         .eq("id", projectId)
//         .single();

//       if (projectError || !project) {
//         console.log("🚨 [API] Project not found:", { projectId, error: projectError });
//         return new Response(JSON.stringify({ error: "Project not found" }), {
//           status: 404,
//           headers: { "Content-Type": "application/json" },
//         });
//       }

//       // console.log("📡 [API] Project found:", {
//       //   projectId,
//       //   authorId: project.author_id,
//       //   assignedToId: project.assigned_to_id,
//       //   hasAssignment: !!project.assigned_to_id,
//       // });

//       // Check access based on role
//       let hasAccess = false;

//       if (userRole === "Client") {
//         // Clients can only access their own projects
//         hasAccess = project.author_id === user.id;
//         // console.log("📡 [API] Client access check:", {
//         //   authorId: project.author_id,
//         //   userId: user.id,
//         //   hasAccess,
//         // });
//       }

//       if (!hasAccess) {
//         console.log("🚨 [API] Access denied for user:", {
//           userId: user.id,
//           userRole,
//           projectAuthorId: project.author_id,
//           projectAssignedToId: project.assigned_to_id,
//           isAssigned: project.assigned_to_id === user.id,
//           isAuthor: project.author_id === user.id,
//         });
//         return new Response(JSON.stringify({ error: "Access denied" }), {
//           status: 403,
//           headers: { "Content-Type": "application/json" },
//         });
//       } else {
//         // console.log("✅ [API] Access granted for user:", {
//         //   userId: user.id,
//         //   userRole,
//         //   projectAuthorId: project.author_id,
//         //   projectAssignedToId: project.assigned_to_id,
//         // });
//       }
//     }

//     const { data: files, error } = await query;

//     // console.log("Files fetch result:", {
//     //   filesCount: files?.length || 0,
//     //   error,
//     //   projectId,
//     //   userRole,
//     //   query:
//     //     "SELECT * FROM files WHERE project_id = ? AND status = 'active' ORDER BY uploaded_at DESC",
//     // });

//     // Log individual files for debugging
//     if (files && files.length > 0) {
//       // console.log(
//       //   "Files found:",
//       //   files.map((f) => ({
//       //     id: f.id,
//       //     file_name: f.file_name,
//       //     status: f.status,
//       //     project_id: f.project_id,
//       //   }))
//       // );
//     } else {
//       console.log("No files found for project:", projectId);
//     }

//     if (error) {
//       console.error("Error fetching project files:", error);
//       return new Response(
//         JSON.stringify({
//           error: "Failed to fetch project files",
//           details: error.message,
//         }),
//         {
//           status: 500,
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     }

//     // Generate signed URLs for files and add featured image status
//     const filesWithUrls = await Promise.all(
//       (files || []).map(async (file) => {
//         try {
//           if (!supabase) {
//             throw new Error("Supabase client not available");
//           }
//           // The file_path already includes the bucket name, so we need to extract just the path part
//           const pathWithoutBucket = file.file_path.replace(/^project-documents\//, "");

//           // For private buckets, use signed URLs
//           const { data, error } = await supabase.storage
//             .from("project-documents")
//             .createSignedUrl(pathWithoutBucket, 3600); // 1 hour expiry

//           if (error) {
//             console.warn(`Failed to generate signed URL for file ${file.file_name}:`, error);
//             return {
//               ...file,
//               public_url: null,
//               is_featured: file.id.toString() === featuredImageId?.toString(),
//             };
//           }

//           return {
//             ...file,
//             public_url: data.signedUrl,
//             is_featured: file.id === featuredImageId,
//           };
//         } catch (error) {
//           console.error(`Error generating URL for file ${file.file_name}:`, error);
//           return {
//             ...file,
//             public_url: null,
//             is_featured: file.id === featuredImageId,
//           };
//         }
//       })
//     );

//     return new Response(
//       JSON.stringify({
//         files: filesWithUrls,
//         count: filesWithUrls.length,
//       }),
//       {
//         status: 200,
//         headers: { "Content-Type": "application/json" },
//       }
//     );
//   } catch (error) {
//     console.error("Error in get-project-files API:", error);
//     return new Response(JSON.stringify({ error: "Internal server error" }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// };
