// Email monitoring configuration and utilities
export interface EmailMonitoringConfig {
  enabled: boolean;
  monitoredEmail: string;
  webhookSecret?: string;
  provider: "sendgrid" | "mailgun" | "gmail" | "generic";
  autoCreateProjects: boolean;
  requireApproval: boolean;
  notifyAdmins: boolean;
}

// Default configuration
export const defaultEmailConfig: EmailMonitoringConfig = {
  enabled: process.env.EMAIL_MONITORING_ENABLED === "true",
  monitoredEmail: process.env.MONITORED_EMAIL || "projects@capco.com",
  webhookSecret: process.env.EMAIL_WEBHOOK_SECRET,
  provider: (process.env.EMAIL_PROVIDER as any) || "generic",
  autoCreateProjects: process.env.AUTO_CREATE_PROJECTS !== "false",
  requireApproval: process.env.REQUIRE_PROJECT_APPROVAL === "true",
  notifyAdmins: process.env.NOTIFY_ADMINS_ON_EMAIL === "true",
};

// Email patterns for better parsing
export const emailPatterns = {
  address: [
    /(?:address|location|site|property)[:\s]+([^\n\r]+)/i,
    /(?:project|building)\s+(?:at|located)\s+([^\n\r]+)/i,
    /^([^:\n\r]+)$/m, // First line as fallback
  ],

  squareFootage: [
    /(\d+(?:,\d+)*)\s*(?:sq\.?\s*ft|square\s*feet|sf|sqft)/i,
    /(?:square\s*footage|size|area)[:\s]+(\d+(?:,\d+)*)/i,
    /(\d+(?:,\d+)*)\s*(?:sq|square)/i,
  ],

  buildingType: [
    /(?:building\s+type|type)[:\s]+(residential|commercial|mixed\s+use|mercantile|storage|warehouse|institutional)/i,
    /(residential|commercial|mixed\s+use|mercantile|storage|warehouse|institutional)\s+(?:building|project|development)/i,
  ],

  projectType: [
    /(?:services?|systems?|work)[:\s]*([^\n\r]+)/i,
    /(?:sprinkler|alarm|mechanical|electrical|plumbing|civil)/gi,
  ],

  urgency: [
    /(?:urgent|rush|asap|immediate|emergency)/i,
    /(?:deadline|due\s+date)[:\s]+([^\n\r]+)/i,
  ],
};

// Validation rules for extracted data
export const validationRules = {
  address: {
    minLength: 5,
    maxLength: 200,
    required: true,
  },

  squareFootage: {
    min: 100,
    max: 1000000,
    required: false,
  },

  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    required: true,
  },
};

// Enhanced email parsing with machine learning-like scoring
export class EmailParser {
  private config: EmailMonitoringConfig;

  constructor(config: EmailMonitoringConfig = defaultEmailConfig) {
    this.config = config;
  }

  // Score confidence of extracted data
  scoreExtraction(extracted: any): number {
    let score = 0;
    let maxScore = 0;

    // Address scoring (most important)
    maxScore += 40;
    if (extracted.address) {
      if (extracted.address.length > 10) score += 40;
      else if (extracted.address.length > 5) score += 20;
      else score += 10;
    }

    // Contact info scoring
    maxScore += 20;
    if (extracted.owner_email && validationRules.email.pattern.test(extracted.owner_email)) {
      score += 20;
    }

    // Project details scoring
    maxScore += 20;
    if (extracted.sq_ft && extracted.sq_ft > 0) score += 10;
    if (extracted.building) score += 5;
    if (extracted.project && extracted.project.length > 0) score += 5;

    // Content quality scoring
    maxScore += 20;
    if (extracted.description && extracted.description.length > 20) score += 10;
    if (extracted.architect) score += 5;
    if (extracted.requested_docs && extracted.requested_docs.length > 0) score += 5;

    return Math.round((score / maxScore) * 100);
  }

  // Extract with confidence scoring
  extractWithConfidence(emailData: any): {
    data: any;
    confidence: number;
    issues: string[];
  } {
    const data = this.extractBasicData(emailData);
    const confidence = this.scoreExtraction(data);
    const issues = this.validateExtraction(data);

    return { data, confidence, issues };
  }

  private extractBasicData(emailData: any): any {
    // Implementation would use the patterns defined above
    // This is a simplified version
    return {
      address: this.extractUsingPatterns(
        emailData.text + " " + emailData.subject,
        emailPatterns.address
      ),
      sq_ft: this.extractNumberUsingPatterns(emailData.text, emailPatterns.squareFootage),
      building: this.extractUsingPatterns(emailData.text, emailPatterns.buildingType),
      // ... other extractions
    };
  }

  private extractUsingPatterns(text: string, patterns: RegExp[]): string | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  private extractNumberUsingPatterns(text: string, patterns: RegExp[]): number | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1].replace(/,/g, ""));
      }
    }
    return null;
  }

  private validateExtraction(data: any): string[] {
    const issues: string[] = [];

    if (!data.address || data.address.length < validationRules.address.minLength) {
      issues.push("Address is missing or too short");
    }

    if (
      data.sq_ft &&
      (data.sq_ft < validationRules.squareFootage.min ||
        data.sq_ft > validationRules.squareFootage.max)
    ) {
      issues.push("Square footage seems unrealistic");
    }

    return issues;
  }
}

// Email service integrations
export class EmailServiceIntegrator {
  // Setup SendGrid webhook
  static async setupSendGridWebhook(webhookUrl: string, apiKey: string): Promise<boolean> {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/user/webhooks/event/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: true,
          url: webhookUrl,
          group_resubscribe: true,
          delivered: true,
          group_unsubscribe: true,
          spam_report: true,
          bounce: true,
          deferred: true,
          unsubscribe: true,
          processed: true,
          open: true,
          click: true,
          dropped: true,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Error setting up SendGrid webhook:", error);
      return false;
    }
  }

  // Setup Mailgun webhook
  static async setupMailgunWebhook(
    domain: string,
    webhookUrl: string,
    apiKey: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`https://api.mailgun.net/v3/${domain}/webhooks`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          id: "delivered",
          url: webhookUrl,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Error setting up Mailgun webhook:", error);
      return false;
    }
  }
}

// Admin notification system
export async function notifyAdminsOfNewProject(
  projectId: number,
  emailData: any,
  confidence: number
) {
  try {
    console.log(
      `📧 [NOTIFY] New project ${projectId} created from email (confidence: ${confidence}%)`
    );

    // Here you would send notifications to admins
    // Could integrate with Slack, Discord, email, or in-app notifications

    // Example: Store notification in database
    // await supabase.from('notifications').insert({
    //   type: 'email_project_created',
    //   title: `New project created from email`,
    //   message: `Project #${projectId} was automatically created from email with ${confidence}% confidence`,
    //   data: { projectId, confidence, originalEmail: emailData.messageId }
    // });
  } catch (error) {
    console.error("Error notifying admins:", error);
  }
}

// Email monitoring dashboard data
export async function getEmailMonitoringStats() {
  try {
    // Return stats about email processing
    return {
      totalProcessed: 0, // Count from database
      projectsCreated: 0,
      averageConfidence: 0,
      recentActivity: [],
      errors: [],
    };
  } catch (error) {
    console.error("Error getting email monitoring stats:", error);
    return null;
  }
}
