/**
 * Form config loaders - read from site-config JSON (company-specific).
 * Replaces standalone TS config files (register-form-config, login-form-config, etc.)
 *
 * layout and formAction are NOT in config.json — ConfigForm derives layout from steps
 * (1 step = standard, multiple = multi-step), and formAction is injected from this map.
 */

import type {
  MultiStepFormConfig,
  FormFieldConfig,
  FormStepConfig,
} from "../multi-step-form-config";
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

function injectFormAction<T extends { formId?: string; formAction?: string }>(
  config: T
): T & { formAction: string } {
  const formId = config?.formId;
  const action = formId ? FORM_ACTION_MAP[formId] : undefined;
  return { ...config, formAction: action ?? config.formAction ?? "" };
}

/** Forms that support age consent when plugins.ageConsent is true */
const AGE_CONSENT_FORMS = new Set(["contact-form", "register-form"]);

/** Read plugins from config. plugins is an array of objects, merged into one. */
function getPlugins(siteConfig: any): Record<string, unknown> {
  const arr = siteConfig?.plugins;
  if (!Array.isArray(arr) || arr.length === 0) return {};
  return Object.assign({}, ...arr.filter((p) => p && typeof p === "object"));
}

function isAgeConsentEnabled(siteConfig: any): boolean {
  return getPlugins(siteConfig).ageConsent === true;
}

/** Age consent step inserted when plugins.ageConsent is true */
const AGE_CONSENT_STEP: FormStepConfig = {
  title: "Age verification",
  subtitle: "You must be 18 or older to use our services.",
  fields: [
    {
      id: "age-consent",
      name: "ageConsent",
      type: "component",
      component: "AgeConsent",
      required: true,
      componentProps: { minAge: 18 },
    },
  ],
  buttons: [{ type: "next", label: "next", dataNext: 2 }],
};

/** Increment all dataNext and dataPrev in steps/buttons by 1 */
function incrementStepRefs(steps: any[]): void {
  for (const step of steps) {
    for (const btn of step.buttons || []) {
      if (typeof btn.dataNext === "number") btn.dataNext += 1;
      if (typeof btn.dataPrev === "number") btn.dataPrev += 1;
    }
  }
}

/** Inject age consent as step 1 when enabled for this form. */
function injectAgeConsentIfEnabled(
  siteConfig: any,
  formConfig: MultiStepFormConfig,
  formId: string
): MultiStepFormConfig {
  if (!isAgeConsentEnabled(siteConfig) || !AGE_CONSENT_FORMS.has(formId)) {
    return formConfig;
  }
  const steps = [...formConfig.steps];
  incrementStepRefs(steps);
  return {
    ...formConfig,
    totalSteps: formConfig.totalSteps + 1,
    steps: [AGE_CONSENT_STEP, ...steps],
  };
}

/** Forms that support age consent when plugins.ageConsent is true */
const AGE_CONSENT_FORMS = new Set(["contact-form", "register-form"]);

/** Read plugins from config. plugins is an array of objects, merged into one. */
function getPlugins(siteConfig: any): Record<string, unknown> {
  const arr = siteConfig?.plugins;
  if (!Array.isArray(arr) || arr.length === 0) return {};
  return Object.assign({}, ...arr);
}

function isAgeConsentEnabled(siteConfig: any): boolean {
  return getPlugins(siteConfig).ageConsent === true;
}

/** Age consent step inserted when plugins.ageConsent is true */
const AGE_CONSENT_STEP: FormStepConfig = {
  title: "Age verification",
  subtitle: "You must be 18 or older to use our services.",
  fields: [
    {
      id: "age-consent",
      name: "ageConsent",
      type: "component",
      component: "AgeConsent",
      required: true,
      componentProps: { minAge: 18 },
    },
  ],
  buttons: [{ type: "next", label: "next", dataNext: 2 }],
};

/** Insert age consent as step 1 and increment all dataNext/dataPrev in existing steps */
function injectAgeConsentStep(formConfig: MultiStepFormConfig): MultiStepFormConfig {
  const steps = formConfig.steps ?? [];
  if (steps.length === 0) return formConfig;

  const bumpedSteps = steps.map((step) => {
    const buttons = (step.buttons ?? []).map((btn: any) => ({
      ...btn,
      ...(btn.dataNext != null && { dataNext: btn.dataNext + 1 }),
      ...(btn.dataPrev != null && { dataPrev: btn.dataPrev + 1 }),
      ...(btn.dataSkip != null && { dataSkip: btn.dataSkip + 1 }),
    }));
    return { ...step, buttons };
  });

  const ageStep = {
    ...AGE_CONSENT_STEP,
    buttons: [{ type: "next", label: "next", dataNext: 2 }],
  };

  return {
    ...formConfig,
    totalSteps: formConfig.totalSteps + 1,
    steps: [ageStep, ...bumpedSteps],
  };
}

/** If plugins.ageConsent is true and formId is in AGE_CONSENT_FORMS, inject the age consent step */
function maybeInjectAgeConsent(
  siteConfig: any,
  formConfig: MultiStepFormConfig,
  formId: string
): MultiStepFormConfig {
  if (!isAgeConsentEnabled(siteConfig) || !AGE_CONSENT_FORMS.has(formId)) {
    return formConfig;
  }
  return injectAgeConsentStep(formConfig);
}

/** Forms that support age consent when plugins.ageConsent is true */
const AGE_CONSENT_FORMS = new Set(["contact-form", "register-form"]);

/** Read plugins from config. plugins is an array of objects, merged into one. */
function getPlugins(siteConfig: any): Record<string, unknown> {
  const arr = siteConfig?.plugins;
  if (!Array.isArray(arr) || arr.length === 0) return {};
  return Object.assign({}, ...arr) as Record<string, unknown>;
}

function isAgeConsentEnabled(siteConfig: any): boolean {
  return getPlugins(siteConfig).ageConsent === true;
}

/** Age consent step inserted when plugins.ageConsent is true */
const AGE_CONSENT_STEP: FormStepConfig = {
  title: "Age verification",
  subtitle: "You must be 18 or older to use our services.",
  fields: [
    {
      id: "age-consent",
      name: "ageConsent",
      type: "component",
      component: "AgeConsent",
      required: true,
      componentProps: { minAge: 18 },
    },
  ],
  buttons: [{ type: "next", label: "next", dataNext: 2 }],
};

/** Increment dataNext/dataPrev in steps and buttons by 1 */
function incrementStepRefs(steps: any[]): void {
  for (const step of steps) {
    for (const btn of step.buttons ?? []) {
      if (typeof btn.dataNext === "number") btn.dataNext += 1;
      if (typeof btn.dataPrev === "number") btn.dataPrev += 1;
    }
  }
}

/** Inject age consent as step 1 when enabled for this form. */
function injectAgeConsentIfEnabled(
  siteConfig: any,
  formConfig: MultiStepFormConfig,
  formId: string
): MultiStepFormConfig {
  if (!isAgeConsentEnabled(siteConfig) || !AGE_CONSENT_FORMS.has(formId)) {
    return formConfig;
  }
  const steps = formConfig.steps ?? [];
  if (steps.length === 0) return formConfig;
  incrementStepRefs(steps);
  const ageStep = { ...AGE_CONSENT_STEP };
  const newSteps = [ageStep, ...steps];
  return {
    ...formConfig,
    totalSteps: newSteps.length,
    steps: newSteps,
  };
}

// Import FormStepConfig for AGE_CONSENT_STEP

/** Forms that support age consent when plugins.ageConsent is true */
const AGE_CONSENT_FORMS = new Set(["contact-form", "register-form"]);

/** Read plugins from config. plugins is an array of objects, e.g. [{ ageConsent: false }]. */
function isAgeConsentEnabled(siteConfig: any): boolean {
  const plugins = siteConfig?.plugins;
  if (!Array.isArray(plugins) || plugins.length === 0) return false;
  const merged = Object.assign({}, ...plugins) as { ageConsent?: boolean };
  return merged.ageConsent === true;
}

/** Age consent step inserted when plugins.ageConsent is true */
const AGE_CONSENT_STEP: FormStepConfig = {
  title: "Age verification",
  subtitle: "You must be 18 or older to use our services.",
  fields: [
    {
      id: "age-consent",
      name: "ageConsent",
      type: "component",
      component: "AgeConsent",
      required: true,
      componentProps: { minAge: 18 },
    },
  ],
  buttons: [{ type: "next", label: "next", dataNext: 2 }],
};

/** Increment all dataNext and dataPrev in steps/buttons by 1 */
function incrementStepRefs(steps: any[]): void {
  for (const step of steps) {
    for (const btn of step.buttons ?? []) {
      if (typeof btn.dataNext === "number") btn.dataNext += 1;
      if (typeof btn.dataPrev === "number") btn.dataPrev += 1;
    }
  }
}

/** Inject age consent as step 1 when enabled. Call after normalizeFormConfig. */
function injectAgeConsentIfEnabled(
  siteConfig: any,
  formConfig: MultiStepFormConfig,
  formId: string
): MultiStepFormConfig {
  if (!isAgeConsentEnabled(siteConfig) || !AGE_CONSENT_FORMS.has(formId)) {
    return formConfig;
  }
  const steps = [...(formConfig.steps ?? [])];
  incrementStepRefs(steps);
  const ageStep = { ...AGE_CONSENT_STEP };
  ageStep.buttons = ageStep.buttons!.map((b) => (b.dataNext === 2 ? b : { ...b, dataNext: 2 }));
  const newSteps = [ageStep, ...steps];
  return {
    ...formConfig,
    totalSteps: newSteps.length,
    steps: newSteps,
  };
}

type FormStepConfig = import("../multi-step-form-config").FormStepConfig;

/** Forms that support age consent when plugins.ageConsent is true */
const AGE_CONSENT_FORMS = new Set(["contact-form", "register-form"]);

/** Read plugins from config. plugins is an array of objects, merged into one. */
function isAgeConsentEnabled(siteConfig: any): boolean {
  const arr = siteConfig?.plugins;
  if (!Array.isArray(arr) || arr.length === 0) return false;
  const merged = Object.assign({}, ...arr);
  return merged.ageConsent === true;
}

/** Age consent step inserted when plugins.ageConsent is true */
const AGE_CONSENT_STEP: FormStepConfig = {
  title: "Age verification",
  subtitle: "You must be 18 or older to use our services.",
  fields: [
    {
      id: "age-consent",
      name: "ageConsent",
      type: "component",
      component: "AgeConsent",
      required: true,
      componentProps: { minAge: 18 },
    },
  ],
  buttons: [{ type: "next", label: "next", dataNext: 2 }],
};

/** Increment dataNext/dataPrev in steps and buttons by delta */
function incrementStepRefs(steps: any[], delta: number): void {
  for (const step of steps) {
    for (const btn of step.buttons ?? []) {
      if (typeof btn.dataNext === "number") btn.dataNext += delta;
      if (typeof btn.dataPrev === "number") btn.dataPrev += delta;
    }
  }
}

/** Inject age consent as step 1 when plugins.ageConsent is true for supported forms */
function injectAgeConsentIfEnabled(
  siteConfig: any,
  formConfig: MultiStepFormConfig,
  formId: string
): MultiStepFormConfig {
  if (!isAgeConsentEnabled(siteConfig) || !AGE_CONSENT_FORMS.has(formId)) return formConfig;
  const steps = formConfig.steps ?? [];
  if (steps.length === 0) return formConfig;
  incrementStepRefs(steps, 1);
  const ageStep = { ...AGE_CONSENT_STEP };
  ageStep.buttons = ageStep.buttons!.map((b) => ({ ...b, dataNext: 2 }));
  return {
    ...formConfig,
    totalSteps: formConfig.totalSteps + 1,
    steps: [ageStep, ...steps],
  };
}

/** Forms that support age consent when plugins.ageConsent is true */
const AGE_CONSENT_FORMS = new Set(["contact-form", "register-form"]);

/** Read plugins from config. plugins is an array of objects, merged into one. */
function getPlugins(siteConfig: any): Record<string, unknown> {
  const arr = siteConfig?.plugins;
  if (!Array.isArray(arr) || arr.length === 0) return {};
  return Object.assign({}, ...arr) as Record<string, unknown>;
}

function isAgeConsentEnabled(siteConfig: any): boolean {
  return getPlugins(siteConfig).ageConsent === true;
}

/** Age consent step inserted at the beginning when plugins.ageConsent is true */
const AGE_CONSENT_STEP: FormStepConfig = {
  title: "Age verification",
  subtitle: "You must be 18 or older to use our services.",
  fields: [
    {
      id: "age-consent",
      name: "ageConsent",
      type: "component",
      component: "AgeConsent",
      required: true,
      componentProps: { minAge: 18 },
    },
  ],
  buttons: [{ type: "next", label: "next", dataNext: 2 }],
};

function injectAgeConsentStepIfEnabled(
  siteConfig: any,
  formConfig: MultiStepFormConfig,
  formId: string
): MultiStepFormConfig {
  if (!isAgeConsentEnabled(siteConfig) || !AGE_CONSENT_FORMS.has(formId)) {
    return formConfig;
  }
  const steps = formConfig.steps ?? [];
  if (steps.length === 0) return formConfig;

  const bump = (n: number | undefined) => (n != null ? n + 1 : undefined);
  const existingSteps = steps.map((step) => ({
    ...step,
    buttons: (step.buttons ?? []).map((b: any) => ({
      ...b,
      dataNext: bump(b.dataNext),
      dataPrev: bump(b.dataPrev),
    })),
  }));

  return {
    ...formConfig,
    totalSteps: formConfig.totalSteps + 1,
    steps: [AGE_CONSENT_STEP, ...existingSteps],
  };
}

/** Forms that support age consent when plugins.ageConsent is enabled */
const AGE_CONSENT_FORMS = ["contact-form", "register-form"];

/** Read plugins.ageConsent from config. plugins is array of objects, merged. */
function isAgeConsentEnabled(siteConfig: any): boolean {
  const arr = siteConfig?.plugins;
  if (!Array.isArray(arr) || arr.length === 0) return false;
  const merged = Object.assign({}, ...arr);
  return merged.ageConsent === true;
}

/** Inject age consent step at beginning when enabled. Increments dataNext/dataPrev in existing steps. */
function injectAgeConsentStepIfEnabled(
  siteConfig: any,
  formConfig: MultiStepFormConfig,
  formId: string
): MultiStepFormConfig {
  if (!isAgeConsentEnabled(siteConfig) || !AGE_CONSENT_FORMS.includes(formId)) {
    return formConfig;
  }
  const ageConsentStep = {
    title: "Age verification",
    subtitle: "You must be 18 or older to use our services.",
    fields: [
      {
        id: "age-consent",
        name: "ageConsent",
        type: "component" as const,
        component: "AgeConsent",
        required: true,
        componentProps: { minAge: 18 },
      },
    ],
    buttons: [{ type: "next" as const, label: "next", dataNext: 2 }],
  };
  const existingSteps = formConfig.steps || [];
  const shiftedSteps = existingSteps.map((step, i) => {
    const newStep = { ...step };
    (newStep.buttons || []).forEach((btn: any) => {
      if (btn.dataNext != null) btn.dataNext = btn.dataNext + 1;
      if (btn.dataPrev != null) btn.dataPrev = btn.dataPrev + 1;
    });
    return newStep;
  });
  const steps = [ageConsentStep, ...shiftedSteps];
  return normalizeFormConfig({
    ...formConfig,
    totalSteps: steps.length,
    steps,
  }) as MultiStepFormConfig;
}

/** Forms that support age consent when plugins.ageConsent is true */
const AGE_CONSENT_FORM_IDS = new Set(["contact-form", "register-form"]);

/** Read plugins from config. plugins is an array of objects, e.g. [{ ageConsent: false }]. */
function isAgeConsentEnabled(siteConfig: any): boolean {
  const plugins = siteConfig?.plugins;
  if (!Array.isArray(plugins) || plugins.length === 0) return false;
  const merged = Object.assign({}, ...plugins) as Record<string, unknown>;
  return merged.ageConsent === true;
}

/** Age consent step inserted when plugins.ageConsent is true */
const AGE_CONSENT_STEP: FormStepConfig = {
  title: "Age verification",
  subtitle: "You must be 18 or older to use our services.",
  fields: [
    {
      id: "age-consent",
      name: "ageConsent",
      type: "component",
      component: "AgeConsent",
      required: true,
      componentProps: { minAge: 18 },
    },
  ],
  buttons: [{ type: "next", label: "next", dataNext: 2 }],
};

/** Increment dataNext and dataPrev by delta for all buttons in steps */
function incrementStepRefs(steps: any[], delta: number): void {
  for (const step of steps) {
    for (const btn of step.buttons ?? []) {
      if (typeof btn.dataNext === "number") btn.dataNext += delta;
      if (typeof btn.dataPrev === "number") btn.dataPrev += delta;
    }
  }
}

/** Inject age consent as step 1 when plugins.ageConsent is true and formId is in AGE_CONSENT_FORM_IDS */
function injectAgeConsentIfEnabled(
  siteConfig: any,
  formConfig: MultiStepFormConfig,
  formId: string
): MultiStepFormConfig {
  if (!isAgeConsentEnabled(siteConfig) || !AGE_CONSENT_FORM_IDS.has(formId)) {
    return formConfig;
  }
  const steps = [...(formConfig.steps ?? [])];
  if (steps.length === 0) return formConfig;
  incrementStepRefs(steps, 1);
  const newSteps = [AGE_CONSENT_STEP, ...steps];
  return {
    ...formConfig,
    totalSteps: newSteps.length,
    steps: newSteps,
  };
}

// Re-import FormStepConfig for AGE_CONSENT_STEP type
import type { FormStepConfig } from "../multi-step-form-config";

/** Forms that support age consent when plugins.ageConsent is true */
const AGE_CONSENT_FORMS = new Set(["contact-form", "register-form"]);

/** Read plugins from config. plugins is an array of objects, merged into one. */
function getPlugins(siteConfig: any): Record<string, unknown> {
  const arr = siteConfig?.plugins;
  if (!Array.isArray(arr) || arr.length === 0) return {};
  return Object.assign({}, ...arr) as Record<string, unknown>;
}

function isAgeConsentEnabled(siteConfig: any): boolean {
  return getPlugins(siteConfig).ageConsent === true;
}

/** Inject age consent step at the beginning when plugins.ageConsent is true. */
function injectAgeConsentStepIfEnabled(
  siteConfig: any,
  formConfig: MultiStepFormConfig,
  formId: string
): MultiStepFormConfig {
  if (!isAgeConsentEnabled(siteConfig) || !AGE_CONSENT_FORMS.has(formId)) {
    return formConfig;
  }
  const ageConsentStep = {
    title: "Age verification",
    subtitle: "You must be 18 or older to use our services.",
    fields: [
      {
        id: "age-consent",
        name: "ageConsent",
        type: "component" as const,
        component: "AgeConsent",
        required: true,
        componentProps: { minAge: 18 },
      },
    ],
    buttons: [{ type: "next" as const, label: "next", dataNext: 2 }],
  };
  const existingSteps = formConfig.steps || [];
  const shiftedSteps = existingSteps.map((step: any) => {
    const newStep = { ...step };
    const buttons = (newStep.buttons || []).map((btn: any) => {
      const b = { ...btn };
      if (b.dataPrev != null) b.dataPrev = b.dataPrev + 1;
      if (b.dataNext != null) b.dataNext = b.dataNext + 1;
      return b;
    });
    newStep.buttons = buttons;
    return newStep;
  });
  return {
    ...formConfig,
    totalSteps: formConfig.totalSteps + 1,
    steps: [ageConsentStep, ...shiftedSteps],
  };
}

/** Forms that support age consent when plugins.ageConsent is true */
const AGE_CONSENT_FORMS = new Set(["contact-form", "register-form"]);

/** Read plugins.ageConsent from config. plugins is array of objects, merged. */
function isAgeConsentEnabled(siteConfig: any): boolean {
  const arr = siteConfig?.plugins;
  if (!Array.isArray(arr) || arr.length === 0) return false;
  const merged = Object.assign({}, ...arr);
  return merged.ageConsent === true;
}

/** Age consent step inserted when plugins.ageConsent is true */
const AGE_CONSENT_STEP: FormStepConfig = {
  title: "Age verification",
  subtitle: "You must be 18 or older to use our services.",
  fields: [
    {
      id: "age-consent",
      name: "ageConsent",
      type: "component",
      component: "AgeConsent",
      required: true,
      componentProps: { minAge: 18 },
    },
  ],
  buttons: [{ type: "next", label: "next", dataNext: 2 }],
};

type FormStepConfig = import("../multi-step-form-config").FormStepConfig;

/** Insert age consent as step 1 and increment all dataNext/dataPrev in existing steps. */
function injectAgeConsentStep(formConfig: MultiStepFormConfig): MultiStepFormConfig {
  const steps = formConfig.steps ?? [];
  if (steps.length === 0) return formConfig;

  const bumpedSteps = steps.map((step) => {
    const buttons = (step.buttons ?? []).map((b: any) => {
      const out = { ...b };
      if (b.dataNext != null) out.dataNext = b.dataNext + 1;
      if (b.dataPrev != null) out.dataPrev = b.dataPrev + 1;
      if (b.dataSkip != null) out.dataSkip = b.dataSkip + 1;
      return out;
    });
    return { ...step, buttons };
  });

  const ageStep = { ...AGE_CONSENT_STEP };
  ageStep.buttons = [{ type: "next" as const, label: "next", dataNext: 2 }];

  return {
    ...formConfig,
    totalSteps: formConfig.totalSteps + 1,
    steps: [ageStep, ...bumpedSteps],
  };
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
  if (!Array.isArray(json.steps) || json.steps.length === 0) return null;
  const merged = mergeFormButtonDefaults(config, json);
  const normalized = normalizeFormConfig({
    ...json,
    buttonDefaults: merged,
  }) as MultiStepFormConfig;
  const withAction = injectFormAction(normalized) as MultiStepFormConfig;
  return injectAgeConsentIfEnabled(config, withAction, formId);
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
  const normalized = normalizeFormConfig({
    ...json,
    buttonDefaults: merged,
  }) as MultiStepFormConfig;
  const withAction = injectFormAction(normalized) as MultiStepFormConfig;
  return injectAgeConsentIfEnabled(config, withAction, "register-form");
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
  const normalized = normalizeFormConfig({
    ...json,
    buttonDefaults: merged,
  }) as MultiStepFormConfig;
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
  const withAction = injectFormAction(normalized) as MultiStepFormConfig;
  return injectAgeConsentIfEnabled(config, withAction, "contact-form");
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

export async function getReviewFormConfig(globalCompanyName: string): Promise<MultiStepFormConfig> {
  const fromForms = await getFormConfig("review-form");
  if (fromForms) {
    const vars = { globalCompanyName: globalCompanyName || "Our Company" };
    const result = replacePlaceholders(
      JSON.parse(JSON.stringify(fromForms)),
      vars
    ) as MultiStepFormConfig;
    return injectFormAction(
      normalizeFormConfig(result) as MultiStepFormConfig
    ) as MultiStepFormConfig;
  }
  const config = await getSiteConfig();
  const json = (config as any).reviewForm;
  const base = json || {};
  const vars = { globalCompanyName: globalCompanyName || "Our Company" };
  const result = replacePlaceholders(JSON.parse(JSON.stringify(base)), vars) as MultiStepFormConfig;
  result.buttonDefaults = mergeFormButtonDefaults(config, result);
  return injectFormAction(
    normalizeFormConfig(result) as MultiStepFormConfig
  ) as MultiStepFormConfig;
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
    const result = replacePlaceholders(
      JSON.parse(JSON.stringify(fromForms)),
      vars
    ) as MultiStepFormConfig;
    return injectFormAction(
      normalizeFormConfig(result) as MultiStepFormConfig
    ) as MultiStepFormConfig;
  }
  const config = await getSiteConfig();
  const json = (config as any).mepForm;
  const base =
    json && Array.isArray(json.steps) && json.steps.length > 0
      ? json
      : {
          formId: "multi-step-mep-form",
          layout: "multi-step" as const,
          steps: [
            {
              title: "Contact Information",
              fields: [
                {
                  id: "email",
                  name: "email",
                  type: "email" as const,
                  label: "Email",
                  required: true,
                },
                {
                  id: "firstName",
                  name: "firstName",
                  type: "text" as const,
                  label: "First Name",
                  required: true,
                },
                {
                  id: "lastName",
                  name: "lastName",
                  type: "text" as const,
                  label: "Last Name",
                  required: true,
                },
                { id: "phone", name: "phone", type: "text" as const, label: "Phone" },
              ],
              buttons: [{ type: "next" as const, label: "Next" }],
            },
            {
              title: "Project Details",
              fields: [
                {
                  id: "projectDescription",
                  name: "projectDescription",
                  type: "textarea" as const,
                  label: "Project Description",
                  required: true,
                },
              ],
              buttons: [
                { type: "prev" as const, label: "Back" },
                { type: "submit" as const, label: "Submit" },
              ],
            },
          ],
        };
  const vars = {
    globalCompanyName: globalCompanyName || "Our Company",
    virtualAssistantName: virtualAssistantName || "Leah",
    assistantName: virtualAssistantName || "Leah",
  };
  const result = replacePlaceholders(JSON.parse(JSON.stringify(base)), vars) as MultiStepFormConfig;
  result.buttonDefaults = mergeFormButtonDefaults(config, result);
  return injectFormAction(
    normalizeFormConfig(result) as MultiStepFormConfig
  ) as MultiStepFormConfig;
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
