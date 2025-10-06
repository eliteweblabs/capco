/**
 * Database Field Mapper
 * Handles conversion between camelCase application fields and snake_case database columns
 */

/**
 * Maps camelCase application fields to snake_case database columns
 */
export const FIELD_MAPPING = {
  // User/Profile fields
  firstName: "firstName",
  lastName: "lastName",
  companyName: "companyName",
  email: "email",
  phone: "phone",
  password: "password",
  role: "role",
  mobileCarrier: "mobileCarrier",
  smsAlerts: "smsAlerts",
  createdAt: "createdAt",
  updatedAt: "updatedAt",

  // Project fields
  title: "title",
  address: "address",
  squareFootage: "sqFt",
  newConstruction: "newConstruction",
  authorId: "authorId",
  projectId: "id",

  // File fields
  fileName: "fileName",
  fileType: "fileType",
  fileSize: "fileSize",
  filePath: "filePath",
  uploadedAt: "uploadedAt",

  // Additional project fields
  featuredImageData: "featuredImageData",
  dueDate: "dueDate",
  punchlistCount: "punchlistCount",
  nfpaVersion: "nfpaVersion",
  exteriorBeacon: "exteriorBeacon",
  siteAccess: "siteAccess",
  fireSprinklerInstallation: "fireSprinklerInstallation",
  hazardousMaterial: "hazardousMaterial",
  commencementOfConstruction: "commencementOfConstruction",
  suppressionDetectionSystems: "suppressionDetectionSystems",

  // Common fields
  id: "id",
  userId: "userId",
} as const;

/**
 * Converts camelCase object to snake_case for database operations
 * @param obj - Object with camelCase keys
 * @returns Object with snake_case keys for database
 */
export function toDatabaseFields(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const dbField = FIELD_MAPPING[key as keyof typeof FIELD_MAPPING];
    if (dbField) {
      result[dbField] = value;
    } else {
      // If no mapping found, assume it's already in the correct format
      result[key] = value;
    }
  }

  return result;
}

/**
 * Converts snake_case database object to camelCase for application
 * @param obj - Object with snake_case keys from database
 * @returns Object with camelCase keys for application
 */
export function fromDatabaseFields(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  // Create reverse mapping
  const reverseMapping: Record<string, string> = {};
  for (const [camelKey, snakeKey] of Object.entries(FIELD_MAPPING)) {
    reverseMapping[snakeKey] = camelKey;
  }

  for (const [key, value] of Object.entries(obj)) {
    const appField = reverseMapping[key];
    if (appField) {
      result[appField] = value;
    } else {
      // If no mapping found, keep as is
      result[key] = value;
    }
  }

  return result;
}

/**
 * Validates that all required database fields are present
 * @param obj - Object to validate
 * @param requiredFields - Array of camelCase field names that are required
 * @returns Object with validation results
 */
export function validateDatabaseFields(
  obj: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[]; errors: string[] } {
  const missingFields: string[] = [];
  const errors: string[] = [];

  for (const field of requiredFields) {
    const dbField = FIELD_MAPPING[field as keyof typeof FIELD_MAPPING];
    if (!dbField) {
      errors.push(`No database mapping found for field: ${field}`);
      continue;
    }

    if (obj[dbField] === undefined || obj[dbField] === null || obj[dbField] === "") {
      missingFields.push(field);
    }
  }

  return {
    isValid: missingFields.length === 0 && errors.length === 0,
    missingFields,
    errors,
  };
}

/**
 * Helper to create database insert/update objects
 * @param appData - Application data with camelCase keys
 * @param excludeFields - Fields to exclude from the database operation
 * @returns Database-ready object with snake_case keys
 */
export function createDatabaseObject(
  appData: Record<string, any>,
  excludeFields: string[] = []
): Record<string, any> {
  const dbData = toDatabaseFields(appData);

  // Remove excluded fields
  for (const field of excludeFields) {
    const dbField = FIELD_MAPPING[field as keyof typeof FIELD_MAPPING];
    if (dbField) {
      delete dbData[dbField];
    }
  }

  return dbData;
}

/**
 * Helper to create Supabase query objects
 * @param appData - Application data with camelCase keys
 * @returns Object with snake_case keys for Supabase queries
 */
export function createSupabaseQuery(appData: Record<string, any>): Record<string, any> {
  return toDatabaseFields(appData);
}

/**
 * Debug utility to check for field mapping issues
 * @param obj - Object to check
 * @param context - Context for debugging (e.g., "user creation", "profile update")
 * @returns Debug information about field mappings
 */
export function debugFieldMapping(
  obj: Record<string, any>,
  context: string
): {
  context: string;
  originalFields: string[];
  mappedFields: Record<string, string>;
  unmappedFields: string[];
} {
  const originalFields = Object.keys(obj);
  const mappedFields: Record<string, string> = {};
  const unmappedFields: string[] = [];

  for (const field of originalFields) {
    const dbField = FIELD_MAPPING[field as keyof typeof FIELD_MAPPING];
    if (dbField) {
      mappedFields[field] = dbField;
    } else {
      unmappedFields.push(field);
    }
  }

  return {
    context,
    originalFields,
    mappedFields,
    unmappedFields,
  };
}
