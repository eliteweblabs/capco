/**
 * Form config loaders - read from site-config JSON (company-specific).
 * Replaces standalone TS config files (register-form-config, login-form-config, etc.)
 *
 * layout and formAction are NOT in config.json — ConfigForm derives layout from steps
 * (1 step = standard, multiple = multi-step), and formAction is injected from this map.
 */

import type { MultiStepFormConfig, FormFieldConfig } from "../multi-step-form-config";
import { GLOBAL_BUTTON_DEFAULTS, normalizeFormConfig } from "../multi-step-form-config";
import type { FormElementConfig } from "../project-form-config";
import { getFilteredUserFormElements } from "../__user-form-config";
import { getSiteConfig } from "../content";

const FORM_ACTION_MAP: Record<string, string> = {
  "login-form": "/api/auth/signin",
  "register-form": "/api/auth/register",
  "contact-form": "/api/contact-form-submit",
  "review-form": "/api/reviews/submit",
  "mep-form": "/api/mep/submit",
  "project-form": "/api/projects/upsert",
  "nfpa25-wet-pipe-itm-form": "/api/nfpa25/wet-pipe-itm",
};

function injectFormAction<T extends { formId?: string; formAction?: string }>(config: T): T & { formAction: string } {
  const formId = config?.formId;
  const action = formId ? FORM_ACTION_MAP[formId] : undefined;
  return { ...config, formAction: action ?? config.formAction ?? "" };
}

/**
 * Get any form config by id from config.json "forms" (or legacy top-level keys).
 * Use this for all forms so they are managed in config.json under "forms".
 */
export async function getFormConfig(formId: string): Promise<MultiStepFormConfig | null> {
  const config = await getSiteConfig();
  const forms = (config as any).forms;
  let json = forms?.[formId] ?? null;
  if (!json) {
    const legacy: Record<string, string> = {
      "register-form": "registerForm",
      "login-form": "loginForm",
      "contact-form": "contactForm",
      "review-form": "reviewForm",
      "mep-form": "mepForm",
    };
    const key = legacy[formId];
    if (key) json = (config as any)[key] ?? null;
  }
  if (!json) return null;
  const merged = mergeFormButtonDefaults(config, json);
  const normalized = normalizeFormConfig({ ...json, buttonDefaults: merged }) as MultiStepFormConfig;
  return injectFormAction(normalized) as MultiStepFormConfig;
}

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
  const fromForms = await getFormConfig("register-form");
  if (fromForms) return fromForms;
  const config = await getSiteConfig();
  const json = (config as any).registerForm;
  if (!json) {
    throw new Error(
      "registerForm is missing from site config. Add it to config.json (or SITE_CONFIG) under forms or registerForm"
    );
  }
  const merged = mergeFormButtonDefaults(config, json);
  const normalized = normalizeFormConfig({ ...json, buttonDefaults: merged }) as MultiStepFormConfig;
  return injectFormAction(normalized) as MultiStepFormConfig;
}

export async function getLoginFormConfig(): Promise<MultiStepFormConfig> {
  const fromForms = await getFormConfig("login-form");
  if (fromForms) return fromForms;
  const config = await getSiteConfig();
  const json = (config as any).loginForm;
  if (!json) {
    throw new Error(
      "loginForm is missing from site config. Add it to config.json (or SITE_CONFIG) under forms or loginForm"
    );
  }
  const merged = mergeFormButtonDefaults(config, json);
  const normalized = normalizeFormConfig({ ...json, buttonDefaults: merged }) as MultiStepFormConfig;
  return injectFormAction(normalized) as MultiStepFormConfig;
}

export async function getContactFormConfig(
  globalCompanyName: string,
  virtualAssistantName?: string | null
): Promise<MultiStepFormConfig> {
  const config = await getSiteConfig();
  const forms = (config as any).forms;
  let base = forms?.["contact-form"] ?? (config as any).contactForm ?? {};
  const vars = {
    globalCompanyName: globalCompanyName || "Our Company",
    virtualAssistantName: virtualAssistantName || "Leah",
    assistantName: virtualAssistantName || "Leah",
  };
  const result = replacePlaceholders(JSON.parse(JSON.stringify(base)), vars) as MultiStepFormConfig;
  result.buttonDefaults = mergeFormButtonDefaults(config, result);
  const normalized = normalizeFormConfig(result) as MultiStepFormConfig;
  return injectFormAction(normalized) as MultiStepFormConfig;
}

export async function getProjectFormConfig(
  userRole?: string | null,
  isNewProject?: boolean,
  projectStatus?: number | null
): Promise<MultiStepFormConfig | null> {
  const config = await getSiteConfig();
  const pf = (config as any).projectForm;
  if (!pf || !pf.steps?.length) return null;

  const merged = mergeFormButtonDefaults(config, pf);
  const step = pf.steps[0];
  const fields = (step?.fields ?? []).filter((f: any) => {
    if (!f || typeof f !== "object") return false;
    if (f.allow?.length && userRole) {
      const r = userRole.toLowerCase();
      if (!f.allow.some((a: string) => a.toLowerCase() === r)) return false;
    }
    const status = isNewProject ? 0 : projectStatus;
    if (f.hideAtStatus?.length && status != null && f.hideAtStatus.includes(status)) return false;
    return true;
  });
  const buttons = (step?.buttons ?? []).filter((b: any) => {
    if (!b || typeof b !== "object") return false;
    if (b.allow?.length && userRole) {
      const r = userRole.toLowerCase();
      if (!b.allow.some((a: string) => a.toLowerCase() === r)) return false;
    }
    const status = isNewProject ? 0 : projectStatus;
    if (b.hideAtStatus?.length && status != null && b.hideAtStatus.includes(status)) return false;
    return true;
  });

  const out = {
    ...pf,
    buttonDefaults: merged,
    steps: [{ ...step, fields, buttons }],
  } as MultiStepFormConfig;
  return injectFormAction(out) as MultiStepFormConfig;
}

export async function getReviewFormConfig(
  globalCompanyName: string
): Promise<MultiStepFormConfig> {
  const fromForms = await getFormConfig("review-form");
  if (fromForms) {
    const vars = { globalCompanyName: globalCompanyName || "Our Company" };
    const result = replacePlaceholders(JSON.parse(JSON.stringify(fromForms)), vars) as MultiStepFormConfig;
    return injectFormAction(normalizeFormConfig(result) as MultiStepFormConfig) as MultiStepFormConfig;
  }
  const config = await getSiteConfig();
  const json = (config as any).reviewForm;
  const base = json || {};
  const vars = { globalCompanyName: globalCompanyName || "Our Company" };
  const result = replacePlaceholders(JSON.parse(JSON.stringify(base)), vars) as MultiStepFormConfig;
  result.buttonDefaults = mergeFormButtonDefaults(config, result);
  return injectFormAction(normalizeFormConfig(result) as MultiStepFormConfig) as MultiStepFormConfig;
}

export async function getMepFormConfig(
  globalCompanyName: string,
  virtualAssistantName?: string | null
): Promise<MultiStepFormConfig> {
  const fromForms = await getFormConfig("mep-form");
  if (fromForms) {
    const vars = {
      globalCompanyName: globalCompanyName || "Our Company",
      virtualAssistantName: virtualAssistantName || "Leah",
      assistantName: virtualAssistantName || "Leah",
    };
    const result = replacePlaceholders(JSON.parse(JSON.stringify(fromForms)), vars) as MultiStepFormConfig;
    return injectFormAction(normalizeFormConfig(result) as MultiStepFormConfig) as MultiStepFormConfig;
  }
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
  return injectFormAction(normalizeFormConfig(result) as MultiStepFormConfig) as MultiStepFormConfig;
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
    ...(el.icon && {
      icon: el.icon,
      iconPosition: (el.iconPosition as "left" | "right") || "left",
    }),
    ...((el as any).dataScrap != null && { dataScrap: (el as any).dataScrap }),
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
  const elements = await getFilteredUserFormElements(userRole, isAdminEdit, false, includeAllModes);
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
