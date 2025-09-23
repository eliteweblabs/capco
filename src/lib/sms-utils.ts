import { generateSmsEmail, getCarrierInfo, getCarrierKeyFromGateway } from "./sms-carriers";

/**
 * SMS Message Interface
 */
export interface SmsMessage {
  to: string; // Phone number
  carrier: string; // Carrier key or gateway domain
  message: string;
  subject?: string;
}

/**
 * Send SMS via email-to-SMS gateway
 */
export async function sendSmsViaEmail(
  smsMessage: SmsMessage
): Promise<{ success: boolean; error?: string; emailAddress?: string }> {
  try {
    // Check if carrier is a gateway domain or carrier key
    let carrierKey = smsMessage.carrier;
    let gatewayDomain = smsMessage.carrier;

    // If it's a gateway domain (starts with @), convert to carrier key
    if (smsMessage.carrier.startsWith("@")) {
      carrierKey = getCarrierKeyFromGateway(smsMessage.carrier) || smsMessage.carrier;
    } else {
      // If it's a carrier key, get the gateway domain
      const carrierInfo = getCarrierInfo(smsMessage.carrier);
      gatewayDomain = carrierInfo?.gateway || smsMessage.carrier;
    }

    // Generate the email address for SMS
    const emailAddress = generateSmsEmail(smsMessage.to, carrierKey);

    if (!emailAddress) {
      return {
        success: false,
        error: `Invalid phone number or unsupported carrier: ${smsMessage.carrier}`,
      };
    }

    // Get carrier info for logging
    const carrierInfo = getCarrierInfo(carrierKey);

    // // // console.log(`📱 [SMS] Sending SMS to ${smsMessage.to} via ${carrierInfo?.name}:`, {
      emailAddress,
      messageLength: smsMessage.message.length,
      subject: smsMessage.subject || "SMS Message",
    });

    // Here you would integrate with your email service (Resend, SendGrid, etc.)
    // For now, we'll return the email address that would be used
    // You can implement the actual email sending in your email service

    return {
      success: true,
      emailAddress,
    };
  } catch (error) {
    console.error("📱 [SMS] Error sending SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send project status update SMS to a user
 */
export async function sendProjectStatusSms(
  phoneNumber: string,
  carrier: string, // Can be carrier key or gateway domain
  projectTitle: string,
  newStatus: string,
  projectAddress?: string
): Promise<{ success: boolean; error?: string; emailAddress?: string }> {
  const statusMessages: Record<string, string> = {
    "1": "Project Created",
    "2": "Under Review",
    "3": "Approved",
    "4": "In Progress",
    "5": "Completed",
    "6": "On Hold",
    "7": "Cancelled",
  };

  const statusText = statusMessages[newStatus] || `Status ${newStatus}`;

  // Keep SMS messages short and concise for better delivery
  let message = `CAPCo Fire: "${projectTitle}" → ${statusText}`;

  if (projectAddress && message.length < 120) {
    message += `\nAddr: ${projectAddress}`;
  }

  // Only add opt-out if there's space (SMS gateways prefer shorter messages)
  if (message.length < 140) {
    message += "\nReply STOP to opt out";
  }

  // Ensure message is under 160 characters
  if (message.length > 160) {
    message = message.substring(0, 157) + "...";
  }

  return await sendSmsViaEmail({
    to: phoneNumber,
    carrier,
    message,
    subject: "Project Status Update",
  });
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phoneNumber: string): {
  valid: boolean;
  cleaned?: string;
  error?: string;
} {
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Check if it's a valid US phone number (10 digits)
  if (cleaned.length === 10) {
    return { valid: true, cleaned };
  }

  // Check if it's 11 digits starting with 1 (US country code)
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return { valid: true, cleaned: cleaned.substring(1) };
  }

  return {
    valid: false,
    error: "Phone number must be 10 digits (US format)",
  };
}
