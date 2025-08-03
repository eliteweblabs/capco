// React Email Helper Functions
import { emailService, type ReactEmailTemplate } from "./email-service";

// Dynamic imports for email templates (avoids bundling issues)
const getWelcomeEmailComponent = async () => {
  const { WelcomeEmail } = await import("../emails/WelcomeEmail");
  return WelcomeEmail;
};

const getProjectNotificationComponent = async () => {
  const { ProjectNotificationEmail } = await import(
    "../emails/ProjectNotificationEmail"
  );
  return ProjectNotificationEmail;
};

/**
 * Send a styled welcome email using React Email
 */
export async function sendWelcomeEmail(
  to: string | string[],
  props: {
    name?: string;
    appName?: string;
  },
) {
  const component = await getWelcomeEmailComponent();

  const template: ReactEmailTemplate = {
    subject: `Welcome to ${props.appName || "CAPCo"}!`,
    component,
    props,
  };

  return emailService.sendReactEmail(to, template);
}

/**
 * Send a styled project notification email using React Email
 */
export async function sendProjectNotificationEmail(
  to: string | string[],
  props: {
    recipientName?: string;
    projectTitle?: string;
    projectId?: string;
    statusMessage?: string;
    actionRequired?: boolean;
    actionUrl?: string;
    actionText?: string;
  },
) {
  const component = await getProjectNotificationComponent();

  const template: ReactEmailTemplate = {
    subject: `Project Update: ${props.projectTitle || "Your Project"}`,
    component,
    props,
  };

  return emailService.sendReactEmail(to, template);
}

/**
 * Send a password reset email using React Email (you can create this template)
 */
export async function sendPasswordResetEmail(
  to: string | string[],
  props: {
    name?: string;
    resetLink?: string;
    appName?: string;
  },
) {
  // For now, fall back to HTML template
  return emailService.sendTemplatedEmail(
    to,
    {
      subject: `Reset your ${props.appName || "CAPCo"} password`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1f2937; margin-bottom: 24px;">Password Reset Request</h1>
          <p style="color: #374151; line-height: 1.6; margin-bottom: 16px;">Hi ${props.name},</p>
          <p style="color: #374151; line-height: 1.6; margin-bottom: 24px;">You requested a password reset for your ${props.appName || "CAPCo"} account.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${props.resetLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Best regards,<br>The ${props.appName || "CAPCo"} Team</p>
        </div>
      `,
      text: `Hi ${props.name}, you requested a password reset. Visit: ${props.resetLink}`,
    },
    {
      name: props.name || "User",
      resetLink: props.resetLink || "#",
      appName: props.appName || "CAPCo",
    },
  );
}

/**
 * Quick utility to test email functionality
 */
export async function sendTestEmail(to: string) {
  return sendWelcomeEmail(to, {
    name: "Test User",
    appName: "CAPCo Demo",
  });
}
