/**
 * Project form element type definitions.
 *
 * Used to be the home of the legacy in-code "unified form elements" rendering
 * path for ProjectForm. That path was removed in favor of a single source of
 * truth: each site's `projectForm` schema in public/data/config-*.json.
 *
 * Only the shared `FormElementConfig` interface remains so that downstream
 * consumers (user-form-config.ts, forms/form-config-from-site.ts) keep a
 * stable type to import.
 */

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
