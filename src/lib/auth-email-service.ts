// Custom authentication email service using Resend
import { readFileSync } from "fs";
import { join } from "path";

interface AuthEmailOptions {
  to: string;
  type: "welcome" | "email-confirmation" | "password-reset" | "magic-link";
  variables: {
    USER_NAME?: string;
    USER_EMAIL?: string;
    COMPANY_NAME?: string;
    REGISTRATION_DATE?: string;
    CONFIRMATION_LINK?: string;
    RESET_LINK?: string;
    MAGIC_LINK?: string;
    DASHBOARD_LINK?: string;
    CONFIRM_EMAIL_REQUIRED?: boolean;
  };
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class AuthEmailService {
  private static templates: Record<string, EmailTemplate> = {};
  private static templateLoaded = false;

  private static loadTemplates() {
    if (this.templateLoaded) return;

    try {
      // Load the HTML template file
      const templatePath = join(process.cwd(), "src", "templates-email", "auth-templates.html");
      const templateContent = readFileSync(templatePath, "utf-8");

      // Extract individual templates (this is a simple implementation)
      // In production, you might want to use a proper template engine
      this.templates = {
        welcome: {
          subject: "Welcome to CAPCo Fire Protection - <strong>{{USER_NAME}}</strong>",
          html: templateContent,
          text: "Welcome to CAPCo Fire Protection! Your account has been created successfully.",
        },
        "email-confirmation": {
          subject: "Confirm Your Email Address - CAPCo Fire Protection",
          html: templateContent,
          text: "Please confirm your email address to complete your account setup.",
        },
        "password-reset": {
          subject: "Reset Your Password - CAPCo Fire Protection",
          html: templateContent,
          text: "We received a request to reset your password. Use the provided link to reset it.",
        },
        "magic-link": {
          subject: "Sign In to CAPCo Fire Protection",
          html: templateContent,
          text: "Click the provided link to sign in to your account.",
        },
      };

      this.templateLoaded = true;
      console.log("🔧 [AUTH-EMAIL] Templates loaded successfully");
    } catch (error) {
      console.error("🔧 [AUTH-EMAIL] Error loading templates:", error);
      this.templateLoaded = false;
    }
  }

  private static replaceVariables(content: string, variables: Record<string, any>): string {
    let result = content;

    // Replace all {{VARIABLE}} placeholders
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, "g"), String(value || ""));
    });

    // Handle conditional blocks like {{#if CONFIRM_EMAIL_REQUIRED}}
    // This is a simple implementation - for complex logic, use a proper template engine
    result = result.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, condition, content) => {
        return variables[condition] ? content : "";
      }
    );

    // Remove any remaining template syntax
    result = result.replace(/\{\{[^}]+\}\}/g, "");

    return result;
  }

  public static async sendAuthEmail(options: AuthEmailOptions): Promise<boolean> {
    console.log(`🔧 [AUTH-EMAIL] Sending ${options.type} email to ${options.to}`);

    this.loadTemplates();

    if (!this.templateLoaded) {
      console.error("🔧 [AUTH-EMAIL] Templates not loaded");
      return false;
    }

    const template = this.templates[options.type];
    if (!template) {
      console.error(`🔧 [AUTH-EMAIL] Template not found for type: ${options.type}`);
      return false;
    }

    // Set default variables
    const variables = {
      TITLE: template.subject,
      DASHBOARD_LINK: `${process.env.BASE_URL || "http://localhost:4321"}/dashboard`,
      REGISTRATION_DATE: new Date().toLocaleDateString(),
      ...options.variables,
    };

    try {
      // Get email configuration
      const emailProvider = import.meta.env.EMAIL_PROVIDER;
      const emailApiKey = import.meta.env.EMAIL_API_KEY;
      const fromEmail = import.meta.env.FROM_EMAIL;
      const fromName = import.meta.env.FROM_NAME;

      if (!emailProvider || !emailApiKey || !fromEmail) {
        console.error("🔧 [AUTH-EMAIL] Email configuration missing");
        return false;
      }

      // Prepare email content
      const subject = this.replaceVariables(template.subject, variables);
      const htmlContent = this.replaceVariables(template.html, variables);
      const textContent = this.replaceVariables(template.text, variables);

      // Send via Resend
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${emailApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [options.to],
          subject: subject,
          html: htmlContent,
          text: textContent,
          tags: [
            { name: "type", value: "auth" },
            { name: "template", value: options.type },
          ],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`🔧 [AUTH-EMAIL] ${options.type} email sent successfully:`, result.id);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`🔧 [AUTH-EMAIL] Failed to send ${options.type} email:`, errorText);
        return false;
      }
    } catch (error) {
      console.error(`🔧 [AUTH-EMAIL] Error sending ${options.type} email:`, error);
      return false;
    }
  }

  // Convenience methods for different email types
  public static async sendWelcomeEmail(
    to: string,
    userName: string,
    companyName: string,
    confirmEmailRequired = false
  ): Promise<boolean> {
    return this.sendAuthEmail({
      to,
      type: "welcome",
      variables: {
        USER_NAME: userName,
        USER_EMAIL: to,
        COMPANY_NAME: companyName,
        CONFIRM_EMAIL_REQUIRED: confirmEmailRequired,
        CONFIRMATION_LINK: confirmEmailRequired
          ? `${process.env.BASE_URL}/auth/confirm?email=${encodeURIComponent(to)}`
          : undefined,
      },
    });
  }

  public static async sendEmailConfirmation(
    to: string,
    userName: string,
    confirmationLink: string
  ): Promise<boolean> {
    return this.sendAuthEmail({
      to,
      type: "email-confirmation",
      variables: {
        USER_NAME: userName,
        USER_EMAIL: to,
        CONFIRMATION_LINK: confirmationLink,
      },
    });
  }

  public static async sendPasswordReset(
    to: string,
    userName: string,
    resetLink: string
  ): Promise<boolean> {
    return this.sendAuthEmail({
      to,
      type: "password-reset",
      variables: {
        USER_NAME: userName,
        USER_EMAIL: to,
        RESET_LINK: resetLink,
      },
    });
  }

  public static async sendMagicLink(
    to: string,
    userName: string,
    magicLink: string
  ): Promise<boolean> {
    return this.sendAuthEmail({
      to,
      type: "magic-link",
      variables: {
        USER_NAME: userName,
        USER_EMAIL: to,
        MAGIC_LINK: magicLink,
      },
    });
  }
}
