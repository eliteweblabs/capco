/**
 * Form Utilities
 * Handles conversion between camelCase frontend and snake_case database
 */

/**
 * Converts FormData from camelCase to snake_case for database operations
 * @param formData - The FormData object from the form
 * @returns Object with snake_case keys for database operations
 */
export function convertFormDataToSnakeCase(formData: FormData) {
  return {
    firstName: formData.get("firstName")?.toString(),
    lastName: formData.get("lastName")?.toString(),
    companyName: formData.get("companyName")?.toString(),
    email: formData.get("email")?.toString(),
    phone: formData.get("phone")?.toString(),
    password: formData.get("password")?.toString(),
    role: formData.get("role")?.toString(),
    mobileCarrier: formData.get("mobileCarrier")?.toString(),
    smsAlerts: formData.get("smsAlerts") === "on" || formData.get("smsAlerts") === "true",
  };
}

/**
 * Converts snake_case database object to camelCase for frontend
 * @param dbObject - Object with snake_case keys from database
 * @returns Object with camelCase keys for frontend
 */
export function convertDbToCamelCase(dbObject: any) {
  return {
    firstName: dbObject.firstName,
    lastName: dbObject.lastName,
    companyName: dbObject.companyName,
    email: dbObject.email,
    phone: dbObject.phone,
    role: dbObject.role,
    mobileCarrier: dbObject.mobileCarrier,
    smsAlerts: dbObject.smsAlerts,
    createdAt: dbObject.createdAt,
    updatedAt: dbObject.updatedAt,
    // Additional common fields
    id: dbObject.id,
    userId: dbObject.userId,
    authorId: dbObject.authorId,
  };
}

/**
 * Converts camelCase frontend object to snake_case for database
 * @param frontendObject - Object with camelCase keys from frontend
 * @returns Object with snake_case keys for database
 */
export function convertFrontendToSnakeCase(frontendObject: any) {
  return {
    firstName: frontendObject.firstName,
    lastName: frontendObject.lastName,
    companyName: frontendObject.companyName,
    email: frontendObject.email,
    phone: frontendObject.phone,
    role: frontendObject.role,
    mobileCarrier: frontendObject.mobileCarrier,
    smsAlerts: frontendObject.smsAlerts,
    // Timestamps are usually handled automatically by the database
    // but can be explicitly set if needed
    createdAt: frontendObject.createdAt,
    updatedAt: frontendObject.updatedAt || new Date().toISOString(),
  };
}

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
