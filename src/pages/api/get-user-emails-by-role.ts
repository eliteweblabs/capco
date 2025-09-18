import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request }) => {
  console.log("📧 [GET-USER-EMAILS-BY-ROLE] API called");

  try {
    const body = await request.json();
    const { roles, userIds } = body;

    // console.log("📧 [GET-USER-EMAILS-BY-ROLE] Request data:", {
    //   roles: roles || [],
    //   userIds: userIds || [],
    // });

    const emails = [];
    let roleUsers: any[] = []; // Initialize roleUsers outside the if block

    // Get emails by roles
    if (roles && roles.length > 0) {
      // console.log("📧 [GET-USER-EMAILS-BY-ROLE] Fetching emails for roles:", roles);

      if (!supabaseAdmin || !supabase) {
        return new Response(JSON.stringify({ error: "Database connection not available" }), {
          status: 500,
        });
      }
      // Get user data by roles
      const { data: fetchedRoleUsers, error: roleError } = await supabaseAdmin
        .from("profiles")
        .select(
          `
          id, 
          first_name, 
          last_name, 
          company_name, 
          role,
          email
        `
        )
        .in("role", roles);

      // If no email in profiles, try to get from auth.users
      if (fetchedRoleUsers && fetchedRoleUsers.length > 0) {
        roleUsers = fetchedRoleUsers; // Assign to the outer scope variable
        const userIds = fetchedRoleUsers.map((user) => user.id);
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

        if (authUsers && authUsers.users) {
          // Match profiles with auth users
          for (const user of roleUsers) {
            if (!user.email) {
              const authUser = authUsers.users.find((au) => au.id === user.id);
              if (authUser && authUser.email) {
                user.email = authUser.email;
              }
            }
          }
        }
      }

      if (roleError) {
        console.error("📧 [GET-USER-EMAILS-BY-ROLE] Error fetching users by roles:", roleError);
      } else if (fetchedRoleUsers) {
        roleUsers = fetchedRoleUsers; // Assign to the outer scope variable
        // console.log("📧 [GET-USER-EMAILS-BY-ROLE] Found users by roles:", roleUsers);
        for (const user of roleUsers) {
          try {
            if (user.email) {
              emails.push(user.email);
            }
          } catch (error) {
            console.error(
              `📧 [GET-USER-EMAILS-BY-ROLE] Error getting email for user ${user.id}:`,
              error
            );
          }
        }
      }
    }

    // Get emails by specific user IDs
    if (userIds && userIds.length > 0) {
      // console.log("📧 [GET-USER-EMAILS-BY-ROLE] Fetching emails for user IDs:", userIds);

      if (!supabaseAdmin) {
        return new Response(JSON.stringify({ error: "Database connection not available" }), {
          status: 500,
        });
      }

      const { data: users, error: usersError } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      if (usersError) {
        console.error("📧 [GET-USER-EMAILS-BY-ROLE] Error fetching users by IDs:", usersError);
      } else if (users) {
        for (const user of users) {
          if (user.email) {
            emails.push(user.email);
            // console.log(
            //   `📧 [GET-USER-EMAILS-BY-ROLE] Found email for user ID ${user.id}: ${user.email}`
            // );
          } else {
            console.log(`📧 [GET-USER-EMAILS-BY-ROLE] No email found for user ID ${user.id}`);
          }
        }
      }
    }

    // Remove duplicates
    const uniqueEmails = [...new Set(emails)];

    // console.log("📧 [GET-USER-EMAILS-BY-ROLE] Final unique emails:", uniqueEmails);

    // Also return the full user data for staff dropdowns
    const staffUsers = roleUsers || [];

    return new Response(
      JSON.stringify({
        success: true,
        emails: uniqueEmails,
        count: uniqueEmails.length,
        staffUsers: staffUsers,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("📧 [GET-USER-EMAILS-BY-ROLE] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
