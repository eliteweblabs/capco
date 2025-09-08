/**
 * SMS Carrier Email-to-SMS Gateway Mappings
 *
 * These are the email domains used by major carriers to send SMS messages
 * via email. Format: phone_number@gateway_domain
 */

export interface CarrierInfo {
  name: string;
  gateway: string;
  format: string; // Example format for documentation
}

export const SMS_CARRIERS: Record<string, CarrierInfo> = {
  att: {
    name: "AT&T",
    gateway: "@txt.att.net",
    format: "1234567890@txt.att.net",
  },
  verizon: {
    name: "Verizon",
    gateway: "@vtext.com",
    format: "1234567890@vtext.com",
  },
  spectrum: {
    name: "Spectrum",
    gateway: "@vtext.com",
    format: "1234567890@vtext.com",
  },
  tmobile: {
    name: "T-Mobile",
    gateway: "@tmomail.net",
    format: "1234567890@tmomail.net",
  },
  sprint: {
    name: "Sprint",
    gateway: "@messaging.sprintpcs.com",
    format: "1234567890@messaging.sprintpcs.com",
  },
  boost: {
    name: "Boost Mobile",
    gateway: "@smsmyboostmobile.com",
    format: "1234567890@smsmyboostmobile.com",
  },
  cricket: {
    name: "Cricket Wireless",
    gateway: "@sms.cricketwireless.net",
    format: "1234567890@sms.cricketwireless.net",
  },
  metropcs: {
    name: "MetroPCS",
    gateway: "@mymetropcs.com",
    format: "1234567890@mymetropcs.com",
  },
  uscellular: {
    name: "U.S. Cellular",
    gateway: "@email.uscc.net",
    format: "1234567890@email.uscc.net",
  },
  virgin: {
    name: "Virgin Mobile",
    gateway: "@vmobl.com",
    format: "1234567890@vmobl.com",
  },
  other: {
    name: "Other",
    gateway: "",
    format: "Unknown gateway",
  },
};

/**
 * Get carrier information by carrier key
 */
export function getCarrierInfo(carrierKey: string): CarrierInfo | null {
  return SMS_CARRIERS[carrierKey] || null;
}

/**
 * Generate SMS email address for a phone number and carrier
 */
export function generateSmsEmail(phoneNumber: string, carrierKey: string): string | null {
  const carrier = getCarrierInfo(carrierKey);

  if (!carrier || !carrier.gateway) {
    return null;
  }

  // Clean phone number (remove all non-digits)
  const cleanPhone = phoneNumber.replace(/\D/g, "");

  // Ensure it's a 10-digit US number
  if (cleanPhone.length !== 10) {
    return null;
  }

  return `${cleanPhone}${carrier.gateway}`;
}

/**
 * Get all available carriers as an array
 */
export function getAllCarriers(): CarrierInfo[] {
  return Object.values(SMS_CARRIERS);
}

/**
 * Validate if a carrier key is supported
 */
export function isValidCarrier(carrierKey: string): boolean {
  return carrierKey in SMS_CARRIERS;
}

/**
 * Get carrier key from gateway domain (reverse lookup)
 */
export function getCarrierKeyFromGateway(gateway: string): string | null {
  for (const [key, carrier] of Object.entries(SMS_CARRIERS)) {
    if (carrier.gateway === gateway) {
      return key;
    }
  }
  return null;
}
