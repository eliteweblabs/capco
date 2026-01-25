import { isValidPhoneNumber, AsYouType } from "libphonenumber-js";

export function validatePhone(phoneValue: string): boolean {
  if (!phoneValue || phoneValue.trim() === "") {
    return true; // Phone is optional
  }

  try {
    // Remove all non-digit characters
    const digitsOnly = phoneValue.replace(/\D/g, "");

    console.log("[PHONE-VALIDATION] Input:", phoneValue);
    console.log("[PHONE-VALIDATION] Digits only:", digitsOnly);
    console.log("[PHONE-VALIDATION] Length:", digitsOnly.length);

    // Allow partial numbers (3+ digits) or validate complete numbers (10-11 digits)
    if (digitsOnly.length < 3) {
      console.log("[PHONE-VALIDATION] Too short");
      return false; // Too short
    }

    if (digitsOnly.length >= 10) {
      // Validate complete phone number
      const isValid = isValidPhoneNumber(phoneValue, "US");
      console.log("[PHONE-VALIDATION] Complete number validation:", isValid);
      return isValid;
    }

    // Partial number is okay (user is still typing)
    console.log("[PHONE-VALIDATION] Partial number - allowing");
    return true;
  } catch (error) {
    console.error("[PHONE-VALIDATION] Error:", error);
    return false;
  }
}

export function formatPhoneAsYouType(value: string): string {
  // Remove all non-digit characters to get raw input
  const digitsOnly = value.replace(/\D/g, "");

  // Format as user types
  const formatter = new AsYouType("US");
  return formatter.input(digitsOnly);
}
