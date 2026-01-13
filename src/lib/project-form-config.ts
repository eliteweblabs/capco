// Dynamic project form configuration loader
// Loads client-specific config files based on company name slug
// Falls back to default config if client-specific file doesn't exist

import { globalCompanyData } from "../pages/api/global/global-company-data";

// Re-export all interfaces and helper functions from default config
export type {
  FormFieldConfig,
  FormElementConfig,
  FormActionConfig,
} from "./project-form-config-capco-design-group";

export {
  isAllowed,
  isStatusAllowed,
  isFieldStatusAllowed,
  isFieldReadOnly,
  isFormElementReadOnly,
  isUnifiedElementAllowed,
  isUnifiedElementStatusAllowed,
} from "./project-form-config-capco-design-group";

// Import default config for fallback
import * as defaultConfig from "./project-form-config-capco-design-group";

// Export default UNIFIED_FORM_ELEMENTS for backwards compatibility
export const UNIFIED_FORM_ELEMENTS = defaultConfig.UNIFIED_FORM_ELEMENTS;

// Import client-specific configs here as they are created
// This allows static analysis and proper bundling
// Example: import * as acmeConfig from "./project-form-config-acme-corp";

// Helper function to slugify company name
function slugifyCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
}

// Cache for loaded configs
let configCache: {
  UNIFIED_FORM_ELEMENTS: any[];
  getFilteredUnifiedFormElements: (
    userRole?: string | null,
    isNewProject?: boolean,
    projectStatus?: number | null
  ) => any[];
} | null = null;
let configCompanySlug: string | null = null;

/**
 * Get the project form configuration for the current company
 * Loads client-specific config if available, otherwise falls back to default
 */
async function getProjectFormConfig() {
  // Get company name
  const companyData = await globalCompanyData();
  const companyName = companyData.globalCompanyName || process.env.RAILWAY_PROJECT_NAME || "";
  const companySlug = slugifyCompanyName(companyName);

  // Return cached config if it's for the same company
  if (configCache && configCompanySlug === companySlug) {
    return configCache;
  }

  // Try to load client-specific config
  // Use explicit imports for each client to avoid dynamic import issues
  let configModule = defaultConfig;

  // Map company slugs to their config modules
  // Add new client configs here as they are created
  // Import them at the top of the file, then reference here
  if (companySlug === "capco-design-group") {
    // Already using defaultConfig, no need to import again
    configModule = defaultConfig;
    console.log(`✅ [PROJECT-FORM-CONFIG] Using config for: ${companyName} (${companySlug})`);
  } else {
    // For other clients, try to dynamically import
    // This will be expanded as new client configs are added
    try {
      // Try dynamic import - this will fail if file doesn't exist, which is fine
      const dynamicImport = await import(`./project-form-config-${companySlug}`);
      configModule = dynamicImport;
      console.log(
        `✅ [PROJECT-FORM-CONFIG] Loaded client-specific config for: ${companyName} (${companySlug})`
      );
    } catch (error) {
      // Fall back to default
      console.log(
        `⚠️ [PROJECT-FORM-CONFIG] No client-specific config for "${companySlug}", using default (capco-design-group)`
      );
      configModule = defaultConfig;
    }
  }

  // Cache the config
  configCache = {
    UNIFIED_FORM_ELEMENTS: configModule.UNIFIED_FORM_ELEMENTS,
    getFilteredUnifiedFormElements: configModule.getFilteredUnifiedFormElements,
  };
  configCompanySlug = companySlug;

  return configCache;
}

/**
 * Get filtered unified form elements based on user role and project status
 * This is the main function used by components
 *
 * NOTE: This function is async. For synchronous usage, use getFilteredUnifiedFormElementsSync
 * which uses the default config.
 */
export async function getFilteredUnifiedFormElements(
  userRole?: string | null,
  isNewProject: boolean = false,
  projectStatus?: number | null
): Promise<any[]> {
  const config = await getProjectFormConfig();
  return config.getFilteredUnifiedFormElements(userRole, isNewProject, projectStatus);
}

/**
 * Synchronous version that uses default config
 * Use this when you can't use async/await (for backwards compatibility)
 */
export function getFilteredUnifiedFormElementsSync(
  userRole?: string | null,
  isNewProject: boolean = false,
  projectStatus?: number | null
): any[] {
  return defaultConfig.getFilteredUnifiedFormElements(userRole, isNewProject, projectStatus);
}

/**
 * Get unified form elements (unfiltered)
 * Useful for admin/debugging purposes
 */
export async function getUnifiedFormElements(): Promise<any[]> {
  const config = await getProjectFormConfig();
  return config.UNIFIED_FORM_ELEMENTS;
}
