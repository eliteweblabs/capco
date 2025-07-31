export interface EmailConfig {
  provider: "smtp" | "sendgrid" | "resend";
  apiKey?: string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
  fromEmail: string;
  fromName: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export class EmailService {
  private config: EmailConfig;

  constructor(config?: Partial<EmailConfig>) {
    this.config = {
      provider: (process.env.EMAIL_PROVIDER as any) || "smtp",
      apiKey: process.env.EMAIL_API_KEY,
      smtp: {
        host: process.env.SMTP_HOST || "localhost",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
      fromEmail: process.env.FROM_EMAIL || "noreply@example.com",
      fromName: process.env.FROM_NAME || "CAPCo",
      ...config,
    };
  }

  /**
   * Send an email using the configured provider
   */
  async sendEmail(
    options: SendEmailOptions,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const emailData = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.join(", ")
            : options.cc
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.join(", ")
            : options.bcc
          : undefined,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };

      switch (this.config.provider) {
        case "smtp":
          return await this.sendViaSMTP(emailData);
        case "sendgrid":
          return await this.sendViaSendGrid(emailData);
        case "resend":
          return await this.sendViaResend(emailData);
        default:
          throw new Error(
            `Unsupported email provider: ${this.config.provider}`,
          );
      }
    } catch (error) {
      console.error("Email sending failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send email using SMTP (requires nodemailer)
   */
  private async sendViaSMTP(emailData: any) {
    return {
      success: false,
      error:
        "SMTP provider is not available in this build. Please use Resend or SendGrid instead.",
    };
  }

  /**
   * Send email using SendGrid API
   */
  private async sendViaSendGrid(emailData: any) {
    if (!this.config.apiKey) {
      throw new Error("SendGrid API key is required");
    }

    const sendGridData = {
      personalizations: [
        {
          to: [{ email: emailData.to }],
          ...(emailData.cc && { cc: [{ email: emailData.cc }] }),
          ...(emailData.bcc && { bcc: [{ email: emailData.bcc }] }),
          subject: emailData.subject,
        },
      ],
      from: { email: this.config.fromEmail, name: this.config.fromName },
      content: [
        { type: "text/html", value: emailData.html },
        ...(emailData.text
          ? [{ type: "text/plain", value: emailData.text }]
          : []),
      ],
      ...(emailData.attachments && {
        attachments: emailData.attachments.map((att: any) => ({
          content: att.content.toString("base64"),
          filename: att.filename,
          type: att.contentType || "application/octet-stream",
        })),
      }),
    };

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sendGridData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid error: ${error}`);
    }

    return {
      success: true,
      messageId: response.headers.get("x-message-id") || undefined,
    };
  }

  /**
   * Send email using Resend API
   */
  private async sendViaResend(emailData: any) {
    if (!this.config.apiKey) {
      throw new Error("Resend API key is required");
    }

    const resendData = {
      from: `${this.config.fromName} <${this.config.fromEmail}>`,
      to: emailData.to,
      ...(emailData.cc && { cc: emailData.cc }),
      ...(emailData.bcc && { bcc: emailData.bcc }),
      subject: emailData.subject,
      html: emailData.html,
      ...(emailData.text && { text: emailData.text }),
      ...(emailData.attachments && { attachments: emailData.attachments }),
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend error: ${error}`);
    }

    const result = await response.json();
    return { success: true, messageId: result.id };
  }

  /**
   * Send a templated email
   */
  async sendTemplatedEmail(
    to: string | string[],
    template: EmailTemplate,
    variables: Record<string, string> = {},
  ) {
    // Replace variables in template
    let subject = template.subject;
    let html = template.html;
    let text = template.text;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, "g"), value);
      html = html.replace(new RegExp(placeholder, "g"), value);
      if (text) {
        text = text.replace(new RegExp(placeholder, "g"), value);
      }
    });

    return this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.config.provider === "smtp") {
        return {
          success: false,
          error:
            "SMTP verification not available in this build. Please use Resend or SendGrid.",
        };
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Connection verification failed",
      };
    }
  }
}

// Default instance for global use
export const emailService = new EmailService();

// Email templates
export const EMAIL_TEMPLATES = {
  welcome: {
    subject: "Welcome to {{appName}}!",
    html: `
      <h1>Welcome {{name}}!</h1>
      <p>Thank you for joining {{appName}}. We're excited to have you on board.</p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The {{appName}} Team</p>
    `,
    text: `Welcome {{name}}! Thank you for joining {{appName}}. We're excited to have you on board.`,
  },

  passwordReset: {
    subject: "Reset your {{appName}} password",
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi {{name}},</p>
      <p>You requested a password reset for your {{appName}} account.</p>
      <p><a href="{{resetLink}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>Best regards,<br>The {{appName}} Team</p>
    `,
    text: `Hi {{name}}, you requested a password reset. Visit: {{resetLink}}`,
  },

  notification: {
    subject: "{{title}}",
    html: `
      <h2>{{title}}</h2>
      <p>{{message}}</p>
      <p>Best regards,<br>The {{appName}} Team</p>
    `,
    text: `{{title}}: {{message}}`,
  },
} as const;
