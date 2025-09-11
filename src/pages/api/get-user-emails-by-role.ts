import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request }) => {
  console.log("📧 [GET-USER-EMAILS-BY-ROLE] API called");

  try {
    const body = await request.json();
    const { roles, userIds } = body;

    console.log("📧 [GET-USER-EMAILS-BY-ROLE] Request data:", {
      roles: roles || [],
      userIds: userIds || [],
    });

    const emails = [];

    // Get emails by roles
    if (roles && roles.length > 0) {
      console.log("📧 [GET-USER-EMAILS-BY-ROLE] Fetching emails for roles:", roles);

      if (!supabaseAdmin || !supabase) {
        return new Response(JSON.stringify({ error: "Database connection not available" }), {
          status: 500,
        });
      }
      const { data: roleUsers, error: roleError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, company_name, role, email")
        .in("role", roles);

      if (roleError) {
        console.error("📧 [GET-USER-EMAILS-BY-ROLE] Error fetching users by roles:", roleError);
      } else if (roleUsers) {
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
      console.log("📧 [GET-USER-EMAILS-BY-ROLE] Fetching emails for user IDs:", userIds);

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
            console.log(
              `📧 [GET-USER-EMAILS-BY-ROLE] Found email for user ID ${user.id}: ${user.email}`
            );
          } else {
            console.log(`📧 [GET-USER-EMAILS-BY-ROLE] No email found for user ID ${user.id}`);
          }
        }
      }
    }

    // Remove duplicates
    const uniqueEmails = [...new Set(emails)];

    console.log("📧 [GET-USER-EMAILS-BY-ROLE] Final unique emails:", uniqueEmails);

    return new Response(
      JSON.stringify({
        success: true,
        emails: uniqueEmails,
        count: uniqueEmails.length,
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
