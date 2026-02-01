import { isValidPhoneNumber, AsYouType } from "libphonenumber-js";

export function validatePhone(phoneValue: string): boolean {
  if (!phoneValue || phoneValue.trim() === "") {
    return false; // Empty phone is invalid (will trigger skip logic)
  }

  try {
    // Remove all non-digit characters
    const digitsOnly = phoneValue.replace(/\D/g, "");

    console.log("[PHONE-VALIDATION] Input:", phoneValue);
    console.log("[PHONE-VALIDATION] Digits only:", digitsOnly);
    console.log("[PHONE-VALIDATION] Length:", digitsOnly.length);

    // Only validate complete numbers (10-11 digits)
    if (digitsOnly.length < 10) {
      console.log("[PHONE-VALIDATION] Partial number - treating as invalid");
      return false; // Partial numbers are invalid (will trigger skip logic)
    }

    // Validate complete phone number
    const isValid = isValidPhoneNumber(phoneValue, "US");
    console.log("[PHONE-VALIDATION] Complete number validation:", isValid);
    return isValid;
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
