/**
 * Standalone entry for multi-step form init. Bundled to public/scripts/init-multistep-form.js
 * so it runs even when Astro module chunks don't load (e.g. 404 in prod).
 * Handles both MultiStepForm and StandardForm to avoid Vite script 500 / import errors.
 */
import { initializeMultiStepForm, initializeStandardForm } from "../lib/multi-step-form-handler";

function runStandardFormInit(): void {
  const wrapper = document.querySelector("[data-standard-form]");
  if (wrapper?.hasAttribute("data-skip-init")) return;
  const form = wrapper?.querySelector("form[data-form-config]") as HTMLFormElement | null;
  if (!form) return;
  let formId: string;
  let formConfig: any;
  let initialData: Record<string, any> = {};
  try {
    const parsed = JSON.parse(form.getAttribute("data-form-config") ?? "{}");
    formId = parsed.formId;
    formConfig = parsed.formConfig;
    initialData = parsed.initialData ?? {};
  } catch {
    return;
  }
  if (!formId || !formConfig) return;
  initializeStandardForm(form, { initialData, formConfig });
}

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

/** Mark steps with typewriter and listen for typewriter-complete so inputs/buttons cascade after title. */
function runStepCascadeInit(): void {
  document.querySelectorAll(".step-content").forEach((step) => {
    const hasTypewriter = step.querySelector(".typewriter-text");
    if (hasTypewriter) {
      step.classList.add("has-typewriter");
    }
  });

  document.addEventListener("typewriter-complete", (e) => {
    const target = (e as CustomEvent).target as HTMLElement;
    const stepContent = target.closest(".step-content");
    if (stepContent) {
      stepContent.classList.add("typewriter-complete");
    }
  });
}

function main(): void {
  if (typeof window !== "undefined" && (window as any).__jsOrderLog) {
    (window as any).__jsOrderLog("MultiStepForm standalone (script)");
  }
  const runAll = () => {
    runStandardFormInit();
    runMultiStepInit();
    runStepCascadeInit();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runAll);
  } else {
    runAll();
  }
}

main();
