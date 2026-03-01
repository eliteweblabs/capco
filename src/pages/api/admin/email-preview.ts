/**
 * API: Preview rendered email template (src/templates/email/template.html)
 * Admin-only. Returns HTML for different use cases.
 * GET /api/admin/email-preview?useCase=<slug>
 */
import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import { checkAuth } from "../../../lib/auth";
import { replacePlaceholders } from "../../../lib/placeholder-utils";

const USE_CASES: Record<
  string,
  { content: string; buttonText: string; buttonLink: string; project?: object }
> = {
  projectUpdate: {
    content: `Hello {{CLIENT_FIRST_NAME}},

Your project <strong>{{PROJECT_TITLE}}</strong> at {{PROJECT_ADDRESS}} has been updated.

<strong>Status:</strong> {{STATUS_NAME}}
<strong>Estimated completion:</strong> {{PROJECT_EST_TIME}}

Please review the updates and let us know if you have any questions.`,
    buttonText: "View Project",
    buttonLink: "{{BASE_URL}}/project/{{PROJECT_ID}}",
    project: {
      id: 123,
      title: "Fire Sprinkler System - Main Street",
      address: "456 Main St, Anytown, ST 12345",
      statusName: "In Review",
      estTime: "2 weeks",
      sqFt: "5000",
      authorProfile: {
        firstName: "Jane",
        lastName: "Smith",
        companyName: "Acme Construction",
        email: "jane@acme.com",
      },
    },
  },
  magicLink: {
    content: `Hello,

Click the button below to securely access your dashboard. This link will expire soon.

If you did not request this, you can safely ignore this email.`,
    buttonText: "Access Your Dashboard",
    buttonLink: "{{BASE_URL}}/dashboard",
    project: { id: 0 },
  },
  contactFormAdmin: {
    content: `New contact form submission received.

<strong>From:</strong> {{CLIENT_EMAIL}}
<strong>Company:</strong> {{PROJECT_COMPANY_NAME}}

Please review the submission in the contact form leads section.`,
    buttonText: "View Lead",
    buttonLink: "{{BASE_URL}}/admin/contact-form-leads",
    project: {
      id: 0,
      authorProfile: {
        companyName: "Prospect Corp",
        email: "lead@prospect.com",
      },
    },
  },
  confirmSignup: {
    content: `Welcome!

Please confirm your email address by clicking the button below. Once confirmed, you'll have full access to your account.`,
    buttonText: "Confirm Email",
    buttonLink: "{{BASE_URL}}/auth/confirm",
    project: { id: 0 },
  },
  projectCreated: {
    content: `Hello {{CLIENT_FIRST_NAME}},

Your project <strong>{{PROJECT_TITLE}}</strong> has been created successfully.

You can now upload files and track your project status through the dashboard.`,
    buttonText: "View Project",
    buttonLink: "{{BASE_URL}}/project/{{PROJECT_ID}}",
    project: {
      id: 456,
      title: "New Fire Protection System",
      address: "789 Oak Ave, City, ST 67890",
      authorProfile: {
        firstName: "John",
        lastName: "Doe",
        companyName: "BuildCo",
        email: "john@buildco.com",
      },
    },
  },
  minimal: {
    content: `This is a simple notification with minimal content.

No special formatting or project-specific placeholders.`,
    buttonText: "Go to Dashboard",
    buttonLink: "{{BASE_URL}}/dashboard",
    project: { id: 0 },
  },
};

export const GET: APIRoute = async ({ request, cookies }): Promise<Response> => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    const role = currentUser?.profile?.role;
    if (!isAuth || !currentUser || role !== "Admin") {
      return new Response("Admin access required", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const url = new URL(request.url);
    const useCaseSlug = url.searchParams.get("useCase") || "projectUpdate";
    const preset = USE_CASES[useCaseSlug] || USE_CASES.projectUpdate;

    const templatePath = join(process.cwd(), "src", "templates", "email", "template.html");
    let template = readFileSync(templatePath, "utf-8");

    template = template.replace("{{CONTENT}}", preset.content);
    template = template.replace("{{BUTTON_TEXT}}", preset.buttonText);
    template = template.replace("{{BUTTON_LINK}}", preset.buttonLink);

    const html = await replacePlaceholders(template, { project: preset.project || {} }, false, request);

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("[email-preview] Error:", error);
    return new Response(
      `<html><body><p>Error rendering preview: ${error instanceof Error ? error.message : "Unknown"}</p></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
};
