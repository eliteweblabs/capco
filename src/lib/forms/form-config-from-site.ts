/**
 * Form config loaders - read from site-config JSON (company-specific).
 * Replaces standalone TS config files (register-form-config, login-form-config, etc.)
 */

import type {
  MultiStepFormConfig,
  FormFieldConfig,
} from "../multi-step-form-config";
import { GLOBAL_BUTTON_DEFAULTS } from "../multi-step-form-config";
import type { FormElementConfig } from "../project-form-config";
import { getFilteredUserFormElements } from "../user-form-config";
import { getSiteConfig } from "../content";

/**
 * Merge button defaults: global (from site config.formButtonDefaults) + form (form-specific).
 * Form defaults override global. GLOBAL_BUTTON_DEFAULTS is the TS fallback when config has no key.
 */
function mergeFormButtonDefaults(
  siteConfig: any,
  formConfig: any
): MultiStepFormConfig["buttonDefaults"] {
  const global = siteConfig?.formButtonDefaults || {};
  const form = formConfig?.buttonDefaults || {};
  const allTypes = new Set([
    ...Object.keys(GLOBAL_BUTTON_DEFAULTS),
    ...Object.keys(global),
    ...Object.keys(form),
  ]) as Set<keyof typeof GLOBAL_BUTTON_DEFAULTS>;
  const result: NonNullable<MultiStepFormConfig["buttonDefaults"]> = {};
  for (const t of allTypes) {
    const base = (GLOBAL_BUTTON_DEFAULTS as Record<string, any>)[t] || {};
    const g = (global as Record<string, any>)[t] || {};
    const f = (form as Record<string, any>)[t] || {};
    result[t as keyof typeof result] = { ...base, ...g, ...f };
  }
  return result;
}

function replacePlaceholders(obj: any, vars: Record<string, string>): any {
  if (typeof obj === "string") {
    let s = obj;
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`{{${k}}}`, "g"), v || "");
    }
    return s;
  }
  if (Array.isArray(obj)) return obj.map((x) => replacePlaceholders(x, vars));
  if (obj && typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = replacePlaceholders(v, vars);
    }
    return out;
  }
  return obj;
}

export async function getRegisterFormConfig(): Promise<MultiStepFormConfig> {
  const config = await getSiteConfig();
  const json = (config as any).registerForm;
  if (json) {
    const merged = mergeFormButtonDefaults(config, json);
    return { ...json, buttonDefaults: merged } as MultiStepFormConfig;
  }
  // Fallback: minimal default (matches original structure)
  return {
    formId: "multi-step-register-form",
    formAction: "/api/auth/register",
    formMethod: "post",
    totalSteps: 8,
    progressBar: false,
    registerUser: true,
    authRedirect: [{ name: "Dashboard", url: "/project/dashboard" }],
    buttonDefaults: {
      next: {
        type: "next",
        variant: "secondary",
        size: "md",
        icon: "arrow-right",
        iconPosition: "right",
        label: "next",
      },
      prev: {
        type: "prev",
        variant: "anchor",
        size: "md",
        icon: "arrow-left",
        iconPosition: "left",
        label: "back",
      },
      submit: {
        type: "submit",
        variant: "secondary",
        size: "md",
        icon: "arrow-right",
        iconPosition: "right",
        label: "create account",
      },
    },
    hiddenFields: [{ name: "role", value: "Client" }],
    steps: [],
  } as MultiStepFormConfig;
}

export async function getLoginFormConfig(): Promise<MultiStepFormConfig> {
  const config = await getSiteConfig();
  const json = (config as any).loginForm;
  if (json) {
    const merged = mergeFormButtonDefaults(config, json);
    return { ...json, buttonDefaults: merged } as MultiStepFormConfig;
  }
  return {
    formId: "multi-step-login-form",
    formAction: "/api/auth/signin",
    formMethod: "post",
    totalSteps: 2,
    progressBar: false,
    registerUser: false,
    authRedirect: [{ name: "Dashboard", url: "/project/dashboard" }],
    hiddenFields: [{ name: "redirect", value: "/project/dashboard" }],
    buttonDefaults: {
      next: {
        type: "next",
        variant: "secondary",
        size: "md",
        icon: "arrow-right",
        iconPosition: "right",
        label: "next",
      },
      prev: {
        type: "prev",
        variant: "anchor",
        size: "md",
        icon: "arrow-left",
        iconPosition: "left",
        label: "back",
      },
      submit: {
        type: "submit",
        variant: "secondary",
        size: "md",
        icon: "arrow-right",
        iconPosition: "right",
        label: "sign in",
      },
    },
    steps: [],
  } as MultiStepFormConfig;
}

export async function getContactFormConfig(
  globalCompanyName: string,
  virtualAssistantName?: string | null
): Promise<MultiStepFormConfig> {
  const config = await getSiteConfig();
  const json = (config as any).contactForm;
  const base = json || {};
  const vars = {
    globalCompanyName: globalCompanyName || "Our Company",
    virtualAssistantName: virtualAssistantName || "Leah",
    assistantName: virtualAssistantName || "Leah",
  };
  const result = replacePlaceholders(JSON.parse(JSON.stringify(base)), vars) as MultiStepFormConfig;
  result.buttonDefaults = mergeFormButtonDefaults(config, result);
  return result;
}

export async function getMepFormConfig(
  globalCompanyName: string,
  virtualAssistantName?: string | null
): Promise<MultiStepFormConfig> {
  const config = await getSiteConfig();
  const json = (config as any).mepForm;
  const base = json || {};
  const vars = {
    globalCompanyName: globalCompanyName || "Our Company",
    virtualAssistantName: virtualAssistantName || "Leah",
    assistantName: virtualAssistantName || "Leah",
  };
  const result = replacePlaceholders(JSON.parse(JSON.stringify(base)), vars) as MultiStepFormConfig;
  result.buttonDefaults = mergeFormButtonDefaults(config, result);
  return result;
}

/** Map FormElementConfig to FormFieldConfig for StandardForm */
function mapUserElementToField(el: FormElementConfig): FormFieldConfig | null {
  if (el.type === "action") return null;
  const base: FormFieldConfig = {
    id: el.id,
    name: el.name,
    type: "text",
    label: el.label,
    placeholder: el.placeholder,
    required: el.required,
    columns: (el.columns as 1 | 2) || 1,
    componentProps: { ...(el.componentProps || {}), readOnly: (el as any).readOnly },
  };
  switch (el.elementType) {
    case "avatar":
      return { ...base, type: "component", component: "ProfileAvatar" };
    case "select":
      return {
        ...base,
        type: "component",
        component: "Select",
        options: (el.options || []).map((o: any) => ({ value: o.value, label: o.label })),
      };
    case "text":
      return { ...base, type: "text" };
    case "email":
      return { ...base, type: "email" };
    case "password":
      return { ...base, type: "password" };
    case "phone-sms":
      return {
        ...base,
        type: "component",
        component: "PhoneAndSMS",
        componentProps: { ...(el.componentProps || {}), showSMS: true },
      };
    case "textarea":
      return { ...base, type: "textarea" };
    default:
      return { ...base, type: "text" };
  }
}

/**
 * Build MultiStepFormConfig for profile form (General tab).
 * Used by ProfileTabForm with ConfigForm layout="standard".
 */
export async function getProfileFormConfig(
  userRole?: string | null,
  isAdminEdit?: boolean,
  includeAllModes?: boolean
): Promise<MultiStepFormConfig> {
  const elements = await getFilteredUserFormElements(
    userRole,
    isAdminEdit,
    false,
    includeAllModes
  );
  const fields: FormFieldConfig[] = [];
  for (const el of elements) {
    const field = mapUserElementToField(el);
    if (field) fields.push(field);
  }
  const backBtn = elements.find((e: any) => e.type === "action" && e.action === "back");
  const saveBtn = elements.find((e: any) => e.type === "action" && e.elementType === "submit");
  return {
    formId: "profile-form",
    formAction: "/api/users/update",
    formMethod: "post",
    layout: "standard",
    totalSteps: 1,
    progressBar: false,
    responseType: "toast",
    steps: [
      {
        title: "Profile",
        fields,
        buttons: [
          ...(backBtn
            ? [
                {
                  type: "prev" as const,
                  label: backBtn.label,
                  icon: backBtn.icon,
                  iconPosition: (backBtn.iconPosition as "left" | "right") || "left",
                  variant: "outline" as const,
                  classes: backBtn.cssClass,
                },
              ]
            : []),
          ...(saveBtn
            ? [
                {
                  type: "submit" as const,
                  label: saveBtn.label || "Save Changes",
                  icon: saveBtn.icon || "save",
                  iconPosition: (saveBtn.iconPosition as "left" | "right") || "left",
                  variant: "secondary" as const,
                  classes: saveBtn.cssClass,
                },
              ]
            : []),
        ],
      },
    ],
  };
}
