import type { APIRoute } from "astro";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";
import { supabaseAdmin } from "../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("📝 [CREATE-PROJECT] API route called!");

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

    console.log("📝 [CREATE-PROJECT] Auth check:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });

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
    console.log("📝 [CREATE-PROJECT] User authenticated:", {
      userId,
      userEmail: session.session.user.email,
    });

    // Get user profile to determine role
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.log("📝 [CREATE-PROJECT] Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ error: "Failed to get user profile" }), {
        status: 500,
      });
    }

    console.log("📝 [CREATE-PROJECT] User profile:", userProfile);

    let projectAuthorId: string;

    // Determine project author based on user role
    if (userProfile.role === "Client") {
      // If current user is a client, they are the project author
      projectAuthorId = userId;
      console.log("📝 [CREATE-PROJECT] Client user - using their ID as author:", projectAuthorId);
    } else {
      // If current user is admin/staff, handle new client creation or existing client
      if (body.new_client === "on") {
        // Create new client profile
        const newClientData = {
          name: `${body.first_name} ${body.last_name}`.trim(),
          company_name: body.company_name,
          email: body.email,
          role: "Client",
        };

        console.log("📝 [CREATE-PROJECT] Creating new client profile:", newClientData);

        const { data: newClient, error: clientError } = await supabase
          .from("profiles")
          .insert([newClientData])
          .select()
          .single();

        if (clientError) {
          console.error("📝 [CREATE-PROJECT] Error creating client profile:", clientError);
          return new Response(JSON.stringify({ error: "Failed to create client profile" }), {
            status: 500,
          });
        }

        projectAuthorId = newClient.id;
        console.log("📝 [CREATE-PROJECT] New client created, using ID as author:", projectAuthorId);
      } else {
        // Use existing client from form
        if (!body.author_id) {
          return new Response(
            JSON.stringify({ error: "Author ID is required for admin/staff users" }),
            {
              status: 400,
            }
          );
        }
        projectAuthorId = body.author_id;
        console.log(
          "📝 [CREATE-PROJECT] Admin/Staff user - using existing client ID:",
          projectAuthorId
        );
      }
    }

    // Debug all button group fields
    const buttonGroupFields = ["building", "project", "service", "requested_docs"];

    buttonGroupFields.forEach((fieldName) => {
      console.log(`📝 [CREATE-PROJECT] Debug ${fieldName} field:`, {
        value: body[fieldName],
        type: typeof body[fieldName],
        isArray: Array.isArray(body[fieldName]),
        stringified: Array.isArray(body[fieldName])
          ? JSON.stringify(body[fieldName])
          : body[fieldName],
      });
    });

    // Prepare project data - match the update-project API structure
    const projectData = {
      author_id: projectAuthorId,
      title: body.address || "New Project",
      address: body.address,
      description: body.description,
      architect: body.architect,
      sq_ft: body.sq_ft ? parseInt(body.sq_ft) : null,
      new_construction: body.new_construction === "on" || body.new_construction === true,
      units: body.units,
      // Button group fields - pass through as-is (Supabase handles JSONB conversion)
      building: body.building,
      project: body.project,
      service: body.service,
      requested_docs: body.requested_docs,
      status: 10, // Default status for new projects (Specs Received)
      created_at: new Date().toISOString(), // Set creation timestamp
      updated_at: new Date().toISOString(), // Set initial update timestamp
    };

    console.log(
      "📝 [CREATE-PROJECT] Inserting project data:",
      JSON.stringify(projectData, null, 2)
    );

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
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({ error: "Failed to create project" }), {
        status: 500,
      });
    }

    const project = projects[0];

    // Log the project creation
    try {
      await SimpleProjectLogger.logProjectCreation(
        project.id,
        session.session.user.email || "unknown",
        projectData
      );
    } catch (logError) {
      console.error("Error logging project creation:", logError);
      // Don't fail the request if logging fails
    }

    // Send email notifications for new project creation
    try {
      await sendNewProjectNotifications(project, session.session.user.email || "unknown");
    } catch (emailError) {
      console.error("Error sending project creation notifications:", emailError);
      // Don't fail the request if email notifications fail
    }

    console.log("📝 [CREATE-PROJECT] Project created successfully:", project.id);

    return new Response(JSON.stringify(project), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("📝 [CREATE-PROJECT] Catch block error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};

// Function to send new project creation notifications
async function sendNewProjectNotifications(project: any, userEmail: string) {
  try {
    if (!supabase) {
      console.error("Supabase client not available for notifications");
      return;
    }

    // Get project author's profile for client notification
    const { data: authorProfile } = await supabase
      .from("profiles")
      .select("email, first_name, last_name, company_name")
      .eq("id", project.author_id)
      .single();

    // Get environment variables for email
    const emailProvider = import.meta.env.EMAIL_PROVIDER;
    const emailApiKey = import.meta.env.EMAIL_API_KEY;
    const fromEmail = import.meta.env.FROM_EMAIL;
    const fromName = import.meta.env.FROM_NAME;

    if (!emailProvider || !emailApiKey || !fromEmail) {
      console.log("Email configuration not available, skipping notifications");
      return;
    }

    // Get email content from project_statuses table for status 10 (new project)
    const emailContentResponse = await fetch(
      `${import.meta.env.SITE_URL || "http://localhost:4321"}/api/get-status-email-content?status=10`
    );

    if (!emailContentResponse.ok) {
      console.error("Failed to fetch email content for status 10");
      return;
    }

    const emailContentData = await emailContentResponse.json();
    const { email_content, button_text, users_to_notify } = emailContentData;

    // Read email template
    const emailTemplatePath = new URL("../../../emails/template.html", import.meta.url);
    const emailTemplate = await fetch(emailTemplatePath).then((res) => res.text());

    // Send notification to project author (client)
    if (authorProfile?.email) {
      try {
        // Generate magic link for client
        if (!supabaseAdmin) {
          console.error("SupabaseAdmin not available for magic link generation");
          return;
        }

        const { data: magicLinkData, error: magicLinkError } =
          await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: authorProfile.email,
            options: {
              redirectTo: `${import.meta.env.SITE_URL || "http://localhost:4321"}/project/${project.id}`,
            },
          });

        if (!magicLinkError && magicLinkData) {
          // Personalize email content for client
          const personalizedContent = email_content
            .replace("{{PROJECT_TITLE}}", project.title || project.address)
            .replace("{{PROJECT_ADDRESS}}", project.address || "N/A")
            .replace(
              "{{CLIENT_NAME}}",
              authorProfile.first_name || authorProfile.company_name || "Client"
            );

          let clientEmailHtml = emailTemplate.replace("{{CONTENT}}", personalizedContent);
          clientEmailHtml = clientEmailHtml.replace(
            "{{BUTTON_TEXT}}",
            button_text || "View Your Project"
          );
          clientEmailHtml = clientEmailHtml.replace(
            "{{BUTTON_LINK}}",
            magicLinkData.properties.action_link
          );

          // Send email to client
          const clientResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${emailApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${fromName} <${fromEmail}>`,
              to: [authorProfile.email],
              subject: `Project Created: ${project.title || project.address}`,
              html: clientEmailHtml,
              text: personalizedContent.replace(/<[^>]*>/g, ""),
            }),
          });

          if (clientResponse.ok) {
            console.log(`Project creation notification sent to client: ${authorProfile.email}`);
          } else {
            console.error(`Failed to send client notification:`, await clientResponse.text());
          }
        }
      } catch (clientError) {
        console.error("Error sending client notification:", clientError);
      }
    }

    // Send notification to all users specified in the status configuration
    if (users_to_notify && users_to_notify.length > 0) {
      for (const user of users_to_notify) {
        try {
          // Personalize email content for each user
          const personalizedContent = email_content
            .replace("{{PROJECT_TITLE}}", project.title || project.address)
            .replace("{{PROJECT_ADDRESS}}", project.address || "N/A")
            .replace(
              "{{CLIENT_NAME}}",
              authorProfile?.first_name ||
                authorProfile?.company_name ||
                authorProfile?.email ||
                "Unknown"
            )
            .replace("{{USER_NAME}}", user.first_name || user.company_name || user.email);

          let userEmailHtml = emailTemplate.replace("{{CONTENT}}", personalizedContent);
          userEmailHtml = userEmailHtml.replace("{{BUTTON_TEXT}}", button_text || "View Project");
          userEmailHtml = userEmailHtml.replace(
            "{{BUTTON_LINK}}",
            `${import.meta.env.SITE_URL || "http://localhost:4321"}/project/${project.id}`
          );

          // Send email to user
          const userResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${emailApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${fromName} <${fromEmail}>`,
              to: [user.email],
              subject: `New Project: ${project.title || project.address}`,
              html: userEmailHtml,
              text: personalizedContent.replace(/<[^>]*>/g, ""),
            }),
          });

          if (userResponse.ok) {
            console.log(`Project creation notification sent to ${user.role}: ${user.email}`);
          } else {
            console.error(
              `Failed to send notification to ${user.email}:`,
              await userResponse.text()
            );
          }
        } catch (userError) {
          console.error(`Error sending notification to ${user.email}:`, userError);
        }
      }
    }
  } catch (error) {
    console.error("Error in sendNewProjectNotifications:", error);
    throw error;
  }
}
