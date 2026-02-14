/**
 * Form config loaders - read from site-config JSON (company-specific).
 * Replaces standalone TS config files (register-form-config, login-form-config, etc.)
 */

import type { MultiStepFormConfig } from "../multi-step-form-config";
import { getSiteConfig } from "../content";

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
  if (json) return json as MultiStepFormConfig;
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
  if (json) return json as MultiStepFormConfig;
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
  return replacePlaceholders(JSON.parse(JSON.stringify(base)), vars) as MultiStepFormConfig;
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
  return replacePlaceholders(JSON.parse(JSON.stringify(base)), vars) as MultiStepFormConfig;
}
