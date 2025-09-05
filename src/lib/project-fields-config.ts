/**
 * Project Fields Configuration
 *
 * This file defines all the fields that can be updated in a project.
 * Fields are categorized by their update behavior and validation requirements.
 */

export interface ProjectField {
  name: string;
  type: "string" | "number" | "boolean" | "date";
  required?: boolean;
  allowEmpty?: boolean; // Whether empty strings are allowed
  category: "core" | "optional" | "new"; // Core = always exists, Optional = may not exist, New = experimental
  description?: string;
  step?: number;
}

export const PROJECT_UPDATE_FIELDS: ProjectField[] = [
  // Core fields - these should always exist in the projects table
  {
    name: "status",
    type: "number",
    category: "core",
    description: "Project status code",
  },
  {
    name: "title",
    type: "string",
    category: "core",
    description: "Project title",
  },
  {
    name: "description",
    type: "string",
    category: "core",
    description: "Project description",
  },
  {
    name: "address",
    type: "string",
    category: "core",
    description: "Project address",
  },
  {
    name: "sq_ft",
    type: "number",
    category: "core",
    description: "Square footage",
    step: 100,
  },
  {
    name: "new_construction",
    type: "boolean",
    category: "core",
    description: "Whether this is new construction",
  },

  // Optional fields - may not exist in all database schemas
  {
    name: "building",
    type: "string",
    category: "optional",
    allowEmpty: false,
    description: "Building information",
  },
  {
    name: "project",
    type: "string",
    category: "optional",
    allowEmpty: false,
    description: "Project type",
  },
  {
    name: "service",
    type: "string",
    category: "optional",
    allowEmpty: false,
    description: "Service type",
  },
  {
    name: "requested_docs",
    type: "string",
    category: "optional",
    allowEmpty: false,
    description: "Requested documents",
  },

  // New fields - experimental or recently added
  {
    name: "owner",
    type: "string",
    category: "new",
    allowEmpty: false,
    description: "Project owner",
  },
  {
    name: "architect",
    type: "string",
    category: "new",
    allowEmpty: false,
    description: "Project architect",
  },
  {
    name: "units",
    type: "number",
    category: "new",
    description: "Number of units",
  },
];

/**
 * Get fields by category
 */
export function getFieldsByCategory(category: "core" | "optional" | "new"): ProjectField[] {
  return PROJECT_UPDATE_FIELDS.filter((field) => field.category === category);
}

/**
 * Get all field names
 */
export function getAllFieldNames(): string[] {
  return PROJECT_UPDATE_FIELDS.map((field) => field.name);
}

/**
 * Get core field names
 */
export function getCoreFieldNames(): string[] {
  return getFieldsByCategory("core").map((field) => field.name);
}

/**
 * Get optional field names
 */
export function getOptionalFieldNames(): string[] {
  return getFieldsByCategory("optional").map((field) => field.name);
}

/**
 * Get new field names
 */
export function getNewFieldNames(): string[] {
  return getFieldsByCategory("new").map((field) => field.name);
}

/**
 * Validate if a field should be included in update data
 */
export function shouldIncludeField(fieldName: string, value: any): boolean {
  const field = PROJECT_UPDATE_FIELDS.find((f) => f.name === fieldName);
  if (!field) return false;

  // If value is undefined, don't include
  if (value === undefined) return false;

  // assigned_to_id is handled by StaffSelect component directly

  // If field doesn't allow empty and value is empty string, don't include
  if (field.allowEmpty === false && value === "") return false;

  return true;
}

/**
 * Build update data object from request body
 */
export function buildUpdateData(body: any): { core: any; optional: any; newFields: any } {
  const core: any = {};
  const optional: any = {};
  const newFields: any = {};

  PROJECT_UPDATE_FIELDS.forEach((field) => {
    const value = body[field.name];
    if (shouldIncludeField(field.name, value)) {
      if (field.category === "core") {
        core[field.name] = value;
      } else if (field.category === "optional") {
        optional[field.name] = value;
      } else if (field.category === "new") {
        newFields[field.name] = value;
      }
    }
  });

  return { core, optional, newFields };
}
