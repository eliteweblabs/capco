/**
 * Form Utilities
 * Standard form field names and helper functions
 */

/**
 * Standard form field names for consistent usage across the app
 */
export const FORM_FIELDS = {
  // User fields
  firstName: "firstName",
  lastName: "lastName",
  companyName: "companyName",
  email: "email",
  phone: "phone",
  password: "password",
  role: "role",
  mobileCarrier: "mobileCarrier",
  smsAlerts: "smsAlerts",

  // Timestamp fields
  createdAt: "createdAt",
  updatedAt: "updatedAt",

  // Project fields
  title: "title",
  address: "address",
  squareFootage: "squareFootage",
  newConstruction: "newConstruction",

  // File fields
  fileName: "fileName",
  fileType: "fileType",
  fileSize: "fileSize",
} as const;

/**
 * Helper to get form field value with proper type conversion
 * @param formData - The FormData object
 * @param fieldName - The field name from FORM_FIELDS
 * @param defaultValue - Default value if field is empty
 * @returns The field value with proper type
 */
export function getFormField(formData: FormData, fieldName: string, defaultValue: any = null) {
  const value = formData.get(fieldName)?.toString();
  if (!value) return defaultValue;

  // Handle boolean fields
  if (fieldName === FORM_FIELDS.smsAlerts || fieldName === FORM_FIELDS.newConstruction) {
    return value === "on" || value === "true";
  }

  // Handle number fields
  if (fieldName === FORM_FIELDS.squareFootage || fieldName === FORM_FIELDS.fileSize) {
    return parseInt(value) || 0;
  }

  return value;
}
