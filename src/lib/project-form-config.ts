/**
 * Project form configuration - reads from site-config JSON (projectForm).
 * Replaces project-form-config-{company}.ts files.
 */

import { getSiteConfig } from "./content";

export interface FormFieldConfig {
  id: string;
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  [key: string]: any;
}

export interface FormElementConfig {
  id: string;
  name: string;
  type: "field" | "button-group" | "action";
  elementType: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  allow?: string[];
  hideAtStatus?: number[];
  readOnlyAtStatus?: number[];
  columns?: number;
  [key: string]: any;
}

export interface FormActionConfig {
  id: string;
  type: string;
  label: string;
  icon?: string;
  cssClass?: string;
  action?: string;
  allow?: string[];
  hideAtStatus?: number[];
  [key: string]: any;
}

export function isAllowed(item: { allow?: string[] }, userRole?: string | null): boolean {
  if (!item.allow?.length) return true;
  if (!userRole) return false;
  const r = userRole.toLowerCase();
  return item.allow.some((a) => a.toLowerCase() === r);
}

export function isStatusAllowed(
  action: { hideAtStatus?: number[] },
  projectStatus?: number | null
): boolean {
  if (!action.hideAtStatus?.length) return true;
  if (projectStatus == null) return true;
  return !action.hideAtStatus.includes(projectStatus);
}

export function isFieldStatusAllowed(
  field: { hideAtStatus?: number[] },
  projectStatus?: number | null
): boolean {
  if (!field.hideAtStatus?.length) return true;
  if (projectStatus == null) return true;
  return !field.hideAtStatus.includes(projectStatus);
}

export function isFieldReadOnly(
  field: { readOnlyAtStatus?: number[] },
  projectStatus?: number | null
): boolean {
  if (!field.readOnlyAtStatus?.length) return false;
  if (projectStatus == null) return false;
  return field.readOnlyAtStatus.includes(projectStatus);
}

export function isFormElementReadOnly(
  element: { readOnlyAtStatus?: number[] },
  projectStatus?: number | null
): boolean {
  if (!element.readOnlyAtStatus?.length) return false;
  if (projectStatus == null) return false;
  return element.readOnlyAtStatus.includes(projectStatus);
}

export function isUnifiedElementAllowed(
  element: FormElementConfig,
  userRole?: string | null
): boolean {
  if (!element.allow?.length) return true;
  if (!userRole) return false;
  const r = userRole.toLowerCase();
  return element.allow.some((a) => a.toLowerCase() === r);
}

export function isUnifiedElementStatusAllowed(
  element: FormElementConfig,
  projectStatus?: number | null
): boolean {
  if (!element.hideAtStatus?.length) return true;
  if (projectStatus == null) return true;
  return !element.hideAtStatus.includes(projectStatus);
}

function filterAndTransformElements(
  elements: FormElementConfig[],
  userRole?: string | null,
  isNewProject = false,
  projectStatus?: number | null
): FormElementConfig[] {
  const effectiveStatus = isNewProject ? 0 : projectStatus;
  let out = elements.filter(
    (el) =>
      isUnifiedElementAllowed(el, userRole) && isUnifiedElementStatusAllowed(el, effectiveStatus)
  );
  if (isNewProject) {
    out = out
      .filter((el) => el.id !== "delete-project")
      .map((el) => {
        if (el.id === "save-project") {
          return {
            ...el,
            label:
              "<span class='hidden md:block'>Create Project</span><span class='block md:hidden'>Create</span>",
            icon: "plus",
          };
        }
        return el;
      });
  }
  return out;
}

async function getElementsFromConfig(): Promise<FormElementConfig[]> {
  const config = await getSiteConfig();
  const pf = (config as any).projectForm;
  const arr = Array.isArray(pf) ? pf : pf?.unifiedFormElements;
  return Array.isArray(arr) && arr.length > 0 ? arr : [];
}

export async function getFilteredUnifiedFormElements(
  userRole?: string | null,
  isNewProject = false,
  projectStatus?: number | null
): Promise<FormElementConfig[]> {
  const elements = await getElementsFromConfig();
  return filterAndTransformElements(elements, userRole, isNewProject, projectStatus);
}

export function getFilteredUnifiedFormElementsSync(
  userRole?: string | null,
  isNewProject = false,
  projectStatus?: number | null,
  elements?: FormElementConfig[]
): FormElementConfig[] {
  const els = elements ?? [];
  return filterAndTransformElements(els, userRole, isNewProject, projectStatus);
}

export async function getUnifiedFormElements(): Promise<FormElementConfig[]> {
  return getElementsFromConfig();
}

export const UNIFIED_FORM_ELEMENTS: FormElementConfig[] = [];
