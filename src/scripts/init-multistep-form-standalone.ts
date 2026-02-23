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

/** Animated placeholder rotation (company name, email, etc.) when MultiStepForm.astro module is not loaded. */
function runAnimatedPlaceholderInit(): void {
  const animatedInputs = document.querySelectorAll(
    'input[data-has-animated-placeholder="true"]'
  ) as NodeListOf<HTMLInputElement>;
  if (animatedInputs.length === 0) return;

  const placeholderData = new Map<string, { index: number; values: string[] }>();
  animatedInputs.forEach((input) => {
    const raw = input.getAttribute("data-animated-placeholders");
    if (!raw) return;
    try {
      const values = JSON.parse(raw) as string[];
      if (Array.isArray(values) && values.length > 0) {
        placeholderData.set(input.id, { index: 0, values });
      }
    } catch {
      /* ignore */
    }
  });

  let placeholderInterval: ReturnType<typeof setInterval> | null = null;

  function rotatePlaceholders(): void {
    animatedInputs.forEach((input, _index) => {
      const span = document.querySelector(
        `.animated-placeholder[data-for="${input.id}"]`
      ) as HTMLElement | null;
      const data = placeholderData.get(input.id);
      if (!span || !data) return;
      const hasValue = !!(input.value && input.value.length > 0);
      let isAutofilled = false;
      try {
        isAutofilled = input.matches(":-webkit-autofill") || input.matches(":autofill");
      } catch {
        /* ignore */
      }
      if (hasValue || isAutofilled || span.style.display === "none") return;

      const form = input.closest("form");
      const activeStep = form?.querySelector(".step-content.active");
      if (!activeStep?.contains(input)) return;

      const stepInputs = Array.from(
        activeStep.querySelectorAll('input[data-has-animated-placeholder="true"]')
      );
      const stepIndex = stepInputs.indexOf(input);
      const staggerDelay = stepIndex * 200;

      setTimeout(() => {
        span.style.animation = "slideOutDown 400ms ease-out forwards";
        setTimeout(() => {
          data.index = (data.index + 1) % data.values.length;
          span.textContent = data.values[data.index];
          span.style.animation = "slideInDownPlaceholder 400ms ease-out forwards";
        }, 400);
      }, staggerDelay);
    });
  }

  function resetAndStart(): void {
    if (placeholderInterval) clearInterval(placeholderInterval);
    animatedInputs.forEach((input) => {
      const span = document.querySelector(
        `.animated-placeholder[data-for="${input.id}"]`
      ) as HTMLElement | null;
      const data = placeholderData.get(input.id);
      if (!span || !data) return;
      const hasValue = !!(input.value && input.value.length > 0);
      try {
        if (input.matches(":-webkit-autofill") || input.matches(":autofill")) {
          span.style.display = "none";
          return;
        }
      } catch {
        /* ignore */
      }
      if (hasValue) {
        span.style.display = "none";
        return;
      }
      const form = input.closest("form");
      const activeStep = form?.querySelector(".step-content.active");
      const inActive = activeStep?.contains(input);
      if (inActive) {
        const stepInputs = Array.from(
          activeStep!.querySelectorAll('input[data-has-animated-placeholder="true"]')
        );
        const stepIndex = stepInputs.indexOf(input);
        setTimeout(() => {
          data.index = 0;
          span.textContent = data.values[0];
          span.style.display = "flex";
          span.style.animation = "slideInDownPlaceholder 400ms ease-out forwards";
        }, stepIndex * 200);
      } else {
        data.index = 0;
        span.textContent = data.values[0];
        span.style.display = "flex";
      }
    });
    placeholderInterval = setInterval(rotatePlaceholders, 2000);
  }

  setTimeout(() => resetAndStart(), 100);

  const stepObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "attributes" && m.attributeName === "class") {
        const target = m.target as HTMLElement;
        if (
          target.classList.contains("step-content") &&
          target.classList.contains("active") &&
          target.querySelector('[data-has-animated-placeholder="true"]')
        ) {
          resetAndStart();
          break;
        }
      }
    }
  });
  document.querySelectorAll(".step-content").forEach((step) => {
    stepObserver.observe(step, { attributes: true, attributeFilter: ["class"] });
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
    setTimeout(() => runAnimatedPlaceholderInit(), 50);
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runAll);
  } else {
    runAll();
  }
}

main();
