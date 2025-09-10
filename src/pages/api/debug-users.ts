// import type { APIRoute } from "astro";
// import { supabase } from "../../lib/supabase";
// import { supabaseAdmin } from "../../lib/supabase-admin";

// export const GET: APIRoute = async ({ request, cookies }) => {
//   try {
//     // console.log("🔍 [DEBUG-USERS] Debug API called");

//     if (!supabase || !supabaseAdmin) {
//       return new Response(JSON.stringify({ error: "Database not configured" }), {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Set up session from cookies
//     const accessToken = cookies.get("sb-access-token")?.value;
//     const refreshToken = cookies.get("sb-refresh-token")?.value;

//     if (accessToken && refreshToken) {
//       await supabase.auth.setSession({
//         access_token: accessToken,
//         refresh_token: refreshToken,
//       });
//     }

//     // Get current user to check permissions
//     const {
//       data: { user },
//       error: userError,
//     } = await supabase.auth.getUser();

//     if (userError || !user) {
//       return new Response(JSON.stringify({ error: "Not authenticated" }), {
//         status: 401,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Check if user is admin
//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("role")
//       .eq("id", user.id)
//       .single();

//     if (profile?.role !== "Admin") {
//       return new Response(JSON.stringify({ error: "Admin access required" }), {
//         status: 403,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Get all users from auth.users table
//     const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

//     if (authError) {
//       console.error("🔍 [DEBUG-USERS] Auth users error:", authError);
//       return new Response(JSON.stringify({ error: "Failed to get auth users" }), {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Get all profiles
//     const { data: profiles, error: profilesError } = await supabase
//       .from("profiles")
//       .select("id, first_name, last_name, company_name, role, created_at");

//     if (profilesError) {
//       console.error("🔍 [DEBUG-USERS] Profiles error:", profilesError);
//       return new Response(JSON.stringify({ error: "Failed to get profiles" }), {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Check for the specific email
//     const targetEmail = "sen@eliteweblabs.com";
//     const authUser = authUsers.users.find(
//       (u) => u.email && u.email.toLowerCase() === targetEmail.toLowerCase()
//     );
//     const profile = profiles?.find((p) => p.id === authUser?.id);

//     const result = {
//       targetEmail,
//       authUsers: {
//         total: authUsers.users.length,
//         emails: authUsers.users
//           .map((u) => ({
//             email: u.email,
//             id: u.id,
//             emailConfirmed: u.email_confirmed_at,
//             createdAt: u.created_at,
//           }))
//           .slice(0, 10), // Show first 10 for privacy
//       },
//       profiles: {
//         total: profiles?.length || 0,
//         profiles:
//           profiles?.slice(0, 10).map((p) => ({
//             id: p.id,
//             name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.company_name,
//             role: p.role,
//             createdAt: p.created_at,
//           })) || [],
//       },
//       targetUser: {
//         found: !!authUser,
//         authUser: authUser
//           ? {
//               email: authUser.email,
//               id: authUser.id,
//               emailConfirmed: authUser.email_confirmed_at,
//               createdAt: authUser.created_at,
//             }
//           : null,
//         profile: profile
//           ? {
//               id: profile.id,
//               name:
//                 `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
//                 profile.company_name,
//               role: profile.role,
//               createdAt: profile.created_at,
//             }
//           : null,
//       },
//     };

//     return new Response(JSON.stringify(result, null, 2), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     console.error("🔍 [DEBUG-USERS] Error:", error);
//     return new Response(JSON.stringify({ error: "Internal server error" }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// };
