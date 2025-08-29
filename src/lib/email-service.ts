// Simple email service for CAPCo
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export const EMAIL_TEMPLATES = {
  welcome: {
    subject: "Welcome to CAPCo",
    html: `
      <h1>Welcome to CAPCo</h1>
      <p>Hello {{name}},</p>
      <p>Welcome to {{appName}}! We're excited to have you on board.</p>
      <p>Best regards,<br>The {{appName}} Team</p>
    `,
    text: "Welcome to CAPCo! We're excited to have you on board.",
  },

  passwordReset: {
    subject: "Password Reset Request",
    html: `
      <h1>Password Reset</h1>
      <p>Hello {{name}},</p>
      <p>You requested a password reset for your {{appName}} account.</p>
      <p><a href="{{resetLink}}">Click here to reset your password</a></p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The {{appName}} Team</p>
    `,
    text: "Click the following link to reset your password: {{resetLink}}",
  },

  notification: {
    subject: "{{title}}",
    html: `
      <h1>{{title}}</h1>
      <p>{{message}}</p>
      <p>Best regards,<br>The {{appName}} Team</p>
    `,
    text: "{{message}}",
  },
};

class EmailService {
  async sendEmail(emailData: EmailData): Promise<EmailResult> {
    try {
      // For now, just log the email (in production, this would send via SendGrid, Mailgun, etc.)
      console.log("📧 Email would be sent:", {
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html.substring(0, 100) + "...",
      });

      return {
        success: true,
        messageId: `mock-${Date.now()}`,
      };
    } catch (error) {
      console.error("Email service error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendTemplatedEmail(
    to: string | string[],
    template: EmailTemplate,
    variables: Record<string, any> = {}
  ): Promise<EmailResult> {
    try {
      // Replace variables in template
      let html = template.html;
      let text = template.text || "";
      let subject = template.subject;

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        html = html.replace(regex, value);
        text = text.replace(regex, value);
        subject = subject.replace(regex, value);
      });

      return this.sendEmail({
        to,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error("Templated email error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async verifyConnection(): Promise<EmailResult> {
    try {
      // Mock verification - in production, this would test the actual email service
      console.log("📧 Email service connection verified");
      return {
        success: true,
        messageId: "connection-verified",
      };
    } catch (error) {
      console.error("Email service verification error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const emailService = new EmailService();
