/**
 * Unified form configuration loader
 * Returns form elements based on form type (project | user)
 */

import { getFilteredUnifiedFormElements as getProjectFormElements } from "./project-form-config";
import { getFilteredUserFormElements } from "./__user-form-config";
import type { FormElementConfig } from "./project-form-config";

export type { FormElementConfig } from "./project-form-config";

export type FormType = "project" | "user";

/**
 * Get filtered form elements for the given form type
 */
export async function getFormElements(
  formType: FormType,
  options: {
    userRole?: string | null;
    isNewProject?: boolean;
    projectStatus?: number | null;
    isAdminEdit?: boolean;
    isCreateMode?: boolean;
    /** When true (admin users page), include both createOnly and updateOnly fields for unified form */
    includeAllModes?: boolean;
  }
): Promise<FormElementConfig[]> {
  const { userRole, isNewProject, projectStatus, isAdminEdit, isCreateMode, includeAllModes } =
    options;

  if (formType === "project") {
    return getProjectFormElements(userRole, isNewProject ?? true, projectStatus);
  }

  if (formType === "user") {
    return getFilteredUserFormElements(
      userRole,
      isAdminEdit ?? false,
      includeAllModes ? undefined : isCreateMode,
      includeAllModes ?? false
    );
  }

  return [];
}
