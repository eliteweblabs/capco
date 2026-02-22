/**
 * Standalone entry for multi-step form init. Bundled to public/scripts/init-multistep-form.js
 * so it runs even when Astro module chunks don't load (e.g. 404 in prod).
 * Same logic as MultiStepForm.astro runMultiStepInit.
 */
import { initializeMultiStepForm } from "../lib/multi-step-form-handler";

function runMultiStepInit(): void {
  const forms = document.querySelectorAll("form[data-form-config]");
  if (forms.length === 0) return;
  forms.forEach((formEl) => {
    const form = formEl as HTMLFormElement;
    let formId: string;
    let formConfig: any;
    let initialData: Record<string, any> = {};
    try {
      const parsed = JSON.parse(form.getAttribute("data-form-config") ?? "{}");
      formId = parsed.formId;
      formConfig = parsed.formConfig;
      initialData = parsed.initialData ?? {};
    } catch (e) {
      console.error("[MULTISTEP-FORM] Invalid data-form-config on form", form.id || formEl, e);
      return;
    }
    if (!formId || !formConfig) {
      console.error("[MULTISTEP-FORM] Missing formId or formConfig in data-form-config");
      return;
    }
    console.log("[MULTISTEP-FORM] Attaching handler for form (standalone):", formId);

    Object.entries(initialData || {}).forEach(([key, value]) => {
      const input = form.querySelector(`[name="${key}"]`) as HTMLInputElement;
      if (input && value) {
        (input as HTMLInputElement).value = value as string;
        if (input.hasAttribute("data-has-animated-placeholder")) {
          const span = document.querySelector(
            `.animated-placeholder[data-for="${input.id}"]`
          ) as HTMLElement;
          if (span) span.style.display = "none";
        }
      }
    });

    initializeMultiStepForm(form, {
      initialData: initialData || {},
      formConfig,
    });
  });
}

function main(): void {
  if (typeof window !== "undefined" && (window as any).__jsOrderLog) {
    (window as any).__jsOrderLog("MultiStepForm standalone (script)");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runMultiStepInit);
  } else {
    runMultiStepInit();
  }
}

main();
