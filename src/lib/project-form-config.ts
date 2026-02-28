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
  autocomplete?: string;
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

/** Convert unified MultiStepFormConfig (steps[].fields + buttons) to FormElementConfig[] for ProjectForm.astro */
function unifiedToFormElements(pf: any): FormElementConfig[] {
  const steps = pf?.steps;
  if (!Array.isArray(steps) || steps.length === 0) return [];

  const elements: FormElementConfig[] = [];
  const step = steps[0];
  const fields = step?.fields ?? [];
  const buttons = step?.buttons ?? [];

  for (const f of fields) {
    const field = f as Record<string, any>;
    const el: FormElementConfig = {
      id: field.id,
      name: field.name,
      type: "field",
      elementType: field.type === "number" ? "number" : "text",
      label: field.label,
      placeholder: field.placeholder,
      required: field.required,
      allow: field.allow,
      hideAtStatus: field.hideAtStatus,
      readOnlyAtStatus: field.readOnlyAtStatus,
      columns: field.columns ?? 1,
      dataField: field.dataField,
      dataScrap: field.dataScrap,
      autocomplete: field.autocomplete,
    };

    if (field.type === "button-group") {
      el.type = "button-group";
      el.elementType = "button-group";
      el.options = field.options;
      el.groupType = field.toggleType ?? "radio";
      el.cssClass = field.classes;
    } else if (field.type === "component") {
      el.type = "field";
      el.component = field.component;
      el.componentProps = field.componentProps;
      if (field.component === "UnitSlider") {
        el.elementType = "component";
        el.min = field.min;
        el.max = field.max;
        el.step = field.step;
        el.value = field.value;
      } else if (field.component === "GoogleAddressAutocomplete" || field.id === "address-input") {
        el.elementType = "component";
        el.id = "address-input";
        el.component = field.component === "GoogleAddressAutocomplete" ? "GoogleAddressAutocomplete" : "GoogleAddressAutocomplete";
      } else if (field.component === "SlideToggle") {
        el.elementType = "checkbox";
      } else {
        el.elementType = "component";
      }
    } else if (field.type === "textarea") {
      el.type = "field";
      el.elementType = "textarea";
    } else {
      el.type = "field";
      el.elementType = field.type === "number" ? "number" : "text";
      el.min = field.min;
      el.max = field.max;
      el.step = field.step;
    }
    elements.push(el);
  }

  for (const b of buttons) {
    const btn = b as Record<string, any>;
    elements.push({
      id: btn.id,
      name: btn.name ?? btn.id,
      type: "action",
      elementType: btn.type === "submit" ? "submit" : "button",
      label: btn.label,
      icon: btn.icon,
      iconPosition: btn.iconPosition,
      variant: btn.variant,
      cssClass: btn.classes,
      action: btn.action,
      allow: btn.allow,
      hideAtStatus: btn.hideAtStatus,
    } as FormElementConfig);
  }
  return elements;
}

async function getElementsFromConfig(): Promise<FormElementConfig[]> {
  const config = await getSiteConfig();
  const pf = (config as any).projectForm;

  if (Array.isArray(pf)) {
    return pf.length > 0 ? pf : [];
  }
  if (pf?.steps) {
    return unifiedToFormElements(pf);
  }
  const arr = pf?.unifiedFormElements;
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
