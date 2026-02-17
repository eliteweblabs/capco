// Generic multi-step form handler
// This module provides reusable logic for any multi-step form

import { validatePhone, formatPhoneAsYouType } from "./phone-validation";
import { getSupabaseClient } from "./supabase-client";
import { parseFullNameToFirstAndLast } from "./multi-step-form-config";

export interface MultiStepFormHandler {
  init: () => void;
  showStep: (stepNumber: number) => void;
  getCurrentStep: () => number;
  setActiveStepByFocus: (stepNumber: number) => void;
}

// Helper function to update button validation state with icon swap
function updateButtonIcon(button: HTMLElement, isValid: boolean) {
  if (isValid) {
    button.classList.add("is-valid");
  } else {
    button.classList.remove("is-valid");
  }
}

export function createMultiStepFormHandler(
  formId: string,
  totalSteps: number,
  options: {
    onSubmit?: (formData: FormData) => Promise<void>;
    customValidators?: Record<string, (stepNumber: number) => Promise<boolean>>;
    onStepChange?: (stepNumber: number) => void;
    formConfig?: any; // Add formConfig to access registerUser flag
  } = {}
): MultiStepFormHandler {
  let currentStep = 1;
  let isSubmitting = false;

  const form = document.getElementById(formId) as HTMLFormElement;

  /** Show form response inline above form (Alert-style) when responseType is "inline" */
  function showInlineFormResponse(type: "success" | "error", title: string, description: string) {
    const container = document.getElementById(`${formId}-response-alert`);
    if (!container) return;
    const cfg =
      type === "success"
        ? {
            bgClass: "bg-green-50 dark:bg-green-900/20",
            borderClass: "border border-green-200 dark:border-green-800",
            textClass: "text-green-800 dark:text-green-400",
            icon: "check-circle",
          }
        : {
            bgClass: "bg-red-50 dark:bg-red-900/20",
            borderClass: "border border-red-200 dark:border-red-800",
            textClass: "text-red-800 dark:text-red-400",
            icon: "x-circle",
          };
    const escaped = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    container.className = `w-100 p-2 mb-4 ${cfg.bgClass} ${cfg.borderClass}`;
    container.innerHTML = `
      <div class="flex items-start">
        <svg class="mr-2 mt-0.5 h-5 w-5 shrink-0 ${cfg.textClass}" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          ${
            cfg.icon === "check-circle"
              ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />'
              : '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />'
          }
        </svg>
        <div class="mr-8 flex-1">
          <div class="text-base ${cfg.textClass}">${escaped(title)}</div>
          ${description ? `<div class="mt-1 text-sm ${cfg.textClass}">${escaped(description)}</div>` : ""}
        </div>
      </div>`;
    container.classList.remove("hidden");
  }

  // Update progress bar
  function updateProgress() {
    const stepper = document.getElementById(`${formId}-stepper`);
    if (!stepper) return;

    // Update each step indicator
    const stepIndicators = stepper.querySelectorAll("[data-step-indicator]");
    stepIndicators.forEach((indicator) => {
      const stepNum = parseInt(indicator.getAttribute("data-step-indicator") || "0");
      const circle = indicator.querySelector(".step-indicator");
      const progressLine = indicator.querySelector(".step-progress-line");

      if (!circle) return;

      // Remove all state classes
      circle.classList.remove("active", "completed");

      if (stepNum < currentStep) {
        // Completed step
        circle.classList.add("completed");
        // Fill progress line 100% for completed steps
        if (progressLine) {
          (progressLine as HTMLElement).style.width = "100%";
        }
      } else if (stepNum === currentStep) {
        // Current active step
        circle.classList.add("active");
        if (progressLine) {
          (progressLine as HTMLElement).style.width = "0%";
        }
      } else {
        // Future step - gray (default)
        if (progressLine) {
          (progressLine as HTMLElement).style.width = "0%";
        }
      }
    });
  }

  // Get firstName/lastName from form: either direct inputs or parsed from fullName
  function getFirstNameLastName(): { firstName: string; lastName: string } {
    const firstInput = form.querySelector('[name="firstName"]') as HTMLInputElement;
    const lastInput = form.querySelector('[name="lastName"]') as HTMLInputElement;
    const fullInput = form.querySelector('[name="fullName"]') as HTMLInputElement;
    if (firstInput?.value?.trim() && lastInput?.value?.trim()) {
      return { firstName: firstInput.value.trim(), lastName: lastInput.value.trim() };
    }
    if (fullInput?.value?.trim()) {
      return parseFullNameToFirstAndLast(fullInput.value);
    }
    if (firstInput?.value?.trim()) return { firstName: firstInput.value.trim(), lastName: "" };
    if (lastInput?.value?.trim()) return { firstName: "", lastName: lastInput.value.trim() };
    return { firstName: "", lastName: "" };
  }

  // Inject form session data into spans with data-form-session-meta attribute
  function injectSessionMetaData(stepElement: HTMLElement) {
    // Find all spans with data-form-session-meta in title and subtitle
    const metaSpans = stepElement.querySelectorAll(
      "[data-form-session-meta]"
    ) as NodeListOf<HTMLElement>;

    if (metaSpans.length === 0) return;

    const { firstName, lastName } = getFirstNameLastName();

    metaSpans.forEach((span) => {
      const fieldName = span.getAttribute("data-form-session-meta");
      if (!fieldName) return;

      let value: string;
      if (fieldName === "firstName" || fieldName === "lastName") {
        value = fieldName === "firstName" ? firstName : lastName;
      } else {
        const input = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
        value = input?.value?.trim() || "";
      }
      if (value) {
        span.textContent = value;
        span.classList.add("text-primary-600", "dark:text-primary-400", "font-semibold");
      } else {
        span.textContent = span.getAttribute("data-default") || "friend";
      }
    });
  }

  // Set active step when user focuses an input (e.g. after scrolling up to edit). No scroll or animation.
  function setActiveStepByFocus(stepNumber: number) {
    console.log("[MULTISTEP-CLICK-DEBUG] setActiveStepByFocus() called", {
      stepNumber,
      formId,
      currentStep,
      stack: new Error().stack,
    });
    const formEl = document.getElementById(formId) as HTMLFormElement;
    if (!formEl) return;

    const targetStep = formEl.querySelector(
      `.step-content[data-step="${stepNumber}"]`
    ) as HTMLElement;
    if (!targetStep) return;

    const currentActiveStep = formEl.querySelector(".step-content.active") as HTMLElement;
    if (currentActiveStep === targetStep) return;

    // Never advance the step via focus alone (errant click in a later step must not show that panel)
    if (stepNumber > currentStep) {
      console.log("[MULTISTEP-CLICK-DEBUG] setActiveStepByFocus ignored (would advance)", {
        stepNumber,
        currentStep,
      });
      return;
    }

    formEl.querySelectorAll(".step-content").forEach((el) => {
      el.classList.remove("active");
    });
    targetStep.classList.add("active");

    currentStep = stepNumber;
    updateProgress();

    const progressBar = document.getElementById(`${formId}-progress-bar`);
    const shouldHideProgressBar = targetStep.getAttribute("data-hide-progress-bar") === "true";
    if (progressBar) {
      progressBar.style.opacity = shouldHideProgressBar ? "0" : "1";
      progressBar.style.pointerEvents = shouldHideProgressBar ? "none" : "auto";
    }

    if (options.onStepChange) {
      options.onStepChange(stepNumber);
    }
    form.dispatchEvent(
      new CustomEvent("multistep-step-change", { detail: { stepNumber }, bubbles: true })
    );
  }

  // Show specific step with animation (continuous scroll: previous steps stay visible, scroll to active)
  async function showStep(stepNumber: number, direction: "forward" | "backward" = "forward") {
    console.log("[MULTISTEP-CLICK-DEBUG] showStep() called", {
      stepNumber,
      direction,
      formId,
      stack: new Error().stack,
    });
    const currentActiveStep = document.querySelector(
      `#${formId} .step-content.active`
    ) as HTMLElement;
    const targetStep = document.querySelector(
      `#${formId} .step-content[data-step="${stepNumber}"]`
    ) as HTMLElement;

    if (!targetStep) return;

    // Remove active from current step; when going forward mark as completed (stays visible), when going back remove completed (hide again)
    if (currentActiveStep && currentActiveStep !== targetStep) {
      if (direction === "backward") {
        currentActiveStep.classList.remove(
          "active",
          "completed",
          "sliding-out-up",
          "sliding-out-down"
        );
      } else {
        currentActiveStep.classList.add("completed");
        currentActiveStep.classList.remove("active", "sliding-out-up", "sliding-out-down");
        // Clear cascade transition delays from typewriter-complete so completed input-wrappers collapse together (not staggered by index)
        currentActiveStep
          .querySelectorAll(".input-wrapper, .inline-address-search-wrapper, textarea, button, a")
          .forEach((el) => {
            (el as HTMLElement).style.transitionDelay = "";
          });
      }

      const buttons = currentActiveStep.querySelectorAll("button");
      buttons.forEach((btn) => {
        btn.classList.remove(
          "!outline",
          "!outline-2",
          "!outline-dashed",
          "!outline-primary-500",
          "!outline-offset-2",
          "dark:!outline-primary-400"
        );
      });

      const nextButton = currentActiveStep.querySelector(
        "button.next-step, button.submit-step"
      ) as HTMLButtonElement;
      if (nextButton && nextButton.hasAttribute("data-original-next")) {
        nextButton.removeAttribute("data-original-next");
        console.log(`[MULTISTEP-FORM] Cleared stored data-original-next when leaving step`);
      }
    }

    // Activate target step: only first panel slides up on load; when switching steps we skip slide-in to avoid jump
    const isFirstLoad = !currentActiveStep;
    targetStep.classList.add("active");
    // if (isFirstLoad) {
    //   targetStep.classList.remove("initial-load");
    // } else {
    //   targetStep.classList.add("initial-load");
    // }
    // No slide animation on backward — wrapper scroll alone positions the step; slide + scroll caused bounce

    // Steps wrapper is fixed with overflow-y: auto — scroll it so target step's bottom is at wrapper bottom (same spot active was)
    const stepsWrapper = document.getElementById(`${formId}-steps`);
    if (stepsWrapper && currentActiveStep !== targetStep) {
      const runScroll = () => {
        if (direction === "backward") {
          const targetBottom = targetStep.offsetTop + targetStep.offsetHeight;
          const scrollTop = targetBottom - stepsWrapper.clientHeight;
          const clamped = Math.max(
            0,
            Math.min(scrollTop, stepsWrapper.scrollHeight - stepsWrapper.clientHeight)
          );
          stepsWrapper.scrollTo({ top: clamped, behavior: "smooth" });
          console.log("[MULTISTEP-SCROLL] Wrapper scrollTo (back):", {
            stepNumber,
            targetBottom,
            scrollTop: clamped,
            reason: "previous step bottom at wrapper bottom",
          });
        } else {
          stepsWrapper.scrollTo({
            top: stepsWrapper.scrollHeight - stepsWrapper.clientHeight,
            behavior: "smooth",
          });
          console.log("[MULTISTEP-SCROLL] Wrapper scrollTo (forward):", {
            stepNumber,
            reason: "new active step at wrapper bottom",
          });
        }
      };
      requestAnimationFrame(() => requestAnimationFrame(runScroll));
    }

    currentStep = stepNumber;
    updateProgress();

    // Handle progress bar visibility based on step's hideProgressBar property
    const progressBar = document.getElementById(`${formId}-progress-bar`);
    const shouldHideProgressBar = targetStep.getAttribute("data-hide-progress-bar") === "true";

    if (progressBar) {
      if (shouldHideProgressBar) {
        progressBar.style.opacity = "0";
        progressBar.style.pointerEvents = "none";
      } else {
        progressBar.style.opacity = "1";
        progressBar.style.pointerEvents = "auto";
      }
    }

    // Inject form session data into spans with data-form-session-meta attribute
    injectSessionMetaData(targetStep);

    // Note: Typewriter animation is now handled by typewriter-text.ts script

    // Hide title block when moving past step 1
    const titleBlock = document.querySelector(".step-1-only");
    if (titleBlock) {
      if (stepNumber === 1) {
        (titleBlock as HTMLElement).style.display = "block";
      } else {
        (titleBlock as HTMLElement).style.display = "none";
      }
    }

    // Update review section if on final step
    if (targetStep.querySelector(".edit-step")) {
      updateReviewSection();
    }

    // Call custom step change handler
    if (options.onStepChange) {
      options.onStepChange(stepNumber);
    }
    const formEl = document.getElementById(formId);
    if (formEl) {
      formEl.dispatchEvent(
        new CustomEvent("multistep-step-change", { detail: { stepNumber }, bubbles: true })
      );
    }

    // Handle conditional HVAC options based on fuel source (Step 6)
    if (stepNumber === 6) {
      const fuelInput = form.querySelector('input[name="fuelSource"]') as HTMLInputElement;
      const fuelSource = fuelInput?.value || "";

      console.log(`[MULTISTEP-FORM] Entering step 6 with fuelSource: ${fuelSource}`);

      // Hide all HVAC options first
      const allHvacButtons = targetStep.querySelectorAll("button.hvac-choice");
      allHvacButtons.forEach((btn) => {
        (btn as HTMLElement).style.display = "none";
      });

      // Show only the relevant options based on fuel source
      if (fuelSource === "gas") {
        const gasButtons = targetStep.querySelectorAll("button.hvac-gas");
        gasButtons.forEach((btn) => {
          (btn as HTMLElement).style.display = "inline-flex";
        });
        console.log(`[MULTISTEP-FORM] Showing ${gasButtons.length} gas HVAC options`);
      } else if (fuelSource === "electric") {
        const electricButtons = targetStep.querySelectorAll("button.hvac-electric");
        electricButtons.forEach((btn) => {
          (btn as HTMLElement).style.display = "inline-flex";
        });
        console.log(`[MULTISTEP-FORM] Showing ${electricButtons.length} electric HVAC options`);
      }

      // Update subtitle based on fuel source
      const subtitle = targetStep.querySelector("p.text-base");
      if (subtitle && fuelSource) {
        subtitle.textContent = `Select your ${fuelSource === "gas" ? "Gas" : "Electric"} HVAC system:`;
      }
    }

    // Auto-focus when panel is done. iOS keypad requires focus() in same user gesture - NO setTimeout for touch.
    const hasTypewriter = targetStep.classList.contains("has-typewriter");
    if (!hasTypewriter) {
      const isTouch = typeof window !== "undefined" && "ontouchstart" in window;
      const formEl = document.getElementById(formId) as HTMLFormElement;
      const cursorFraction = 0.4;

      const scrollFormToCursor = (element: HTMLElement) => {
        if (!formEl) return;
        const formRect = formEl.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const delta = elementRect.top - (formRect.top + formEl.clientHeight * cursorFraction);
        formEl.scrollBy({ top: delta, behavior: "smooth" });
      };

      const doFocus = () => {
        const smsChoiceButtons = targetStep.querySelectorAll("button.sms-choice");
        if (smsChoiceButtons.length > 0) {
          const yesButton = targetStep.querySelector(
            'button[data-sms-value="true"]'
          ) as HTMLElement;
          if (yesButton) {
            yesButton.focus();
            scrollFormToCursor(yesButton);
          }
        } else {
          const firstInput = targetStep.querySelector(
            "input:not([type=hidden]):not([readonly]), textarea, select"
          ) as HTMLInputElement | HTMLTextAreaElement | null;
          if (firstInput?.focus) {
            firstInput.focus();
            scrollFormToCursor(firstInput);
          }
        }
      };

      if (isTouch) {
        // Sync: must run in same click handler as "Next" tap for iOS keypad
        doFocus();
      } else {
        setTimeout(doFocus, 400);
      }
    }
    // Steps with typewriter: focus + keypad run from MultiStepForm typewriter-complete → cascade transitionend
  }

  // Validate current step
  async function validateStep(stepNumber: number): Promise<boolean> {
    const stepEl = document.querySelector(`#${formId} .step-content[data-step="${stepNumber}"]`);
    if (!stepEl) return false;

    const inputs = stepEl.querySelectorAll("input[required], textarea[required]");
    let isValid = true;

    // Basic validation
    for (const input of inputs) {
      const inputEl = input as HTMLInputElement | HTMLTextAreaElement;
      if (!inputEl.checkValidity()) {
        isValid = false;
        inputEl.classList.add("touched");

        if ((window as any).showNotice) {
          const errorMsg =
            inputEl.getAttribute("data-error") || "Please fill in this field correctly";
          (window as any).showNotice("error", "Validation Error", errorMsg, 3000);
        }
        return false;
      }
    }

    // Custom validation for specific forms
    if (options.customValidators) {
      for (const [validatorName, validatorFn] of Object.entries(options.customValidators)) {
        const stepData = stepEl.getAttribute("data-custom-validation");
        if (stepData === validatorName) {
          const customValid = await validatorFn(stepNumber);
          if (!customValid) return false;
        }
      }
    }

    // Phone validation (if step has phone input)
    const phoneInput = stepEl.querySelector('input[type="tel"]') as HTMLInputElement;
    if (phoneInput && phoneInput.required) {
      // Only validate phone if it's marked as required
      const phoneValue = phoneInput.value?.trim() || "";

      if (!phoneValue) {
        // Empty phone on required field
        if ((window as any).showNotice) {
          (window as any).showNotice(
            "error",
            "Phone Number Required",
            "Please enter a phone number",
            3000
          );
        }
        phoneInput.classList.add("touched");
        return false;
      }

      if (!validatePhone(phoneValue)) {
        const digitsOnly = phoneValue.replace(/\D/g, "");

        // If it's a partial number (less than 10 digits), show error
        if (digitsOnly.length < 10) {
          if ((window as any).showNotice) {
            (window as any).showNotice(
              "error",
              "Invalid Phone Number",
              "Please enter a complete 10-digit phone number",
              3000
            );
          }
          phoneInput.classList.add("touched");
          return false;
        }

        // If it's 10+ digits but invalid, show error
        if ((window as any).showNotice) {
          (window as any).showNotice(
            "error",
            "Invalid Phone Number",
            "Please enter a valid US phone number",
            3000
          );
        }
        phoneInput.classList.add("touched");
        return false;
      }
    } else if (phoneInput && !phoneInput.required) {
      // Optional phone field - only validate if user entered something
      const phoneValue = phoneInput.value?.trim() || "";

      if (phoneValue) {
        const digitsOnly = phoneValue.replace(/\D/g, "");

        // If user started entering a phone but it's incomplete, show gentle error
        if (digitsOnly.length > 0 && digitsOnly.length < 10) {
          if ((window as any).showNotice) {
            (window as any).showNotice(
              "warning",
              "Incomplete Phone Number",
              "Phone number should be 10 digits, or leave blank to skip",
              3000
            );
          }
          phoneInput.classList.add("touched");
          return false;
        }

        // If 10+ digits, validate it
        if (digitsOnly.length >= 10 && !validatePhone(phoneValue)) {
          if ((window as any).showNotice) {
            (window as any).showNotice(
              "error",
              "Invalid Phone Number",
              "Please enter a valid US phone number",
              3000
            );
          }
          phoneInput.classList.add("touched");
          return false;
        }
      }
      // Empty phone on optional field is OK - allow progression
    }

    // Email uniqueness validation (configurable via registerUser flag)
    const shouldCheckEmailUniqueness = options.formConfig?.registerUser === true;

    if (shouldCheckEmailUniqueness) {
      const emailInput = stepEl.querySelector('input[type="email"]') as HTMLInputElement;
      if (emailInput && emailInput.value) {
        const emailValid = await validateEmailUniqueness(emailInput.value);
        if (!emailValid) {
          emailInput.classList.add("touched");

          // Redirect to login with callback URL to return to this form
          const currentUrl = window.location.pathname;
          const loginUrl = `/auth/login?redirect=${encodeURIComponent(currentUrl)}`;

          if ((window as any).showNotice) {
            (window as any).showNotice(
              "warning",
              "Email Already Registered",
              `This email is already registered. <br><br><a href="${loginUrl}" class="text-primary-600 hover:text-primary-500 underline">Click here to log in and continue</a>`,
              10000
            );
          }

          // Optional: Auto-redirect after a delay
          setTimeout(() => {
            window.location.href = loginUrl;
          }, 10000);

          return false;
        }
      }
    }

    // Field-level validate rule (e.g. "exists:profiles,email" – value must exist in DB)
    const validateInputs = stepEl.querySelectorAll("input[data-validate], textarea[data-validate]");
    for (const input of validateInputs) {
      const inputEl = input as HTMLInputElement | HTMLTextAreaElement;
      const rule = inputEl.getAttribute("data-validate")?.trim();
      const validateMessage = inputEl.getAttribute("data-validate-message")?.trim();
      if (!rule || !inputEl.value?.trim()) continue;

      if (rule.startsWith("exists:")) {
        const exists = await validateFieldExists(inputEl.value.trim(), rule, inputEl.type);
        if (!exists) {
          inputEl.classList.add("touched");
          if ((window as any).showNotice && validateMessage) {
            (window as any).showNotice("warning", "Not found", validateMessage, 10000);
          }
          return false;
        }
      }
    }

    return isValid;
  }

  // Validate email uniqueness (for register: email must be available)
  async function validateEmailUniqueness(email: string): Promise<boolean> {
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        console.error("Email validation request failed");
        return true; // Allow progression if validation fails
      }

      const result = await response.json();
      return result.available !== false;
    } catch (error) {
      console.error("Email validation error:", error);
      return true;
    }
  }

  // Validate that a field value exists in DB (e.g. login: email must exist). Rule format: "exists:table,column".
  async function validateFieldExists(
    value: string,
    rule: string,
    inputType: string
  ): Promise<boolean> {
    const match = rule.match(/^exists:([^,]+),([^,]+)$/);
    if (!match) return true;
    const [, _table, column] = match;
    if (column?.toLowerCase() !== "email" || inputType !== "email") {
      return true; // Only support exists:*,email for email inputs for now
    }
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (!response.ok) return true; // On API error, allow progression
      const result = await response.json();
      // available === false means email exists in DB; we need "exists" so return !available
      return result.available === false;
    } catch (error) {
      console.error("Exists validation error:", error);
      return true;
    }
  }

  // Update review section
  function updateReviewSection() {
    const reviewElements = form.querySelectorAll("[id^='review-']");
    const { firstName, lastName } = getFirstNameLastName();

    reviewElements.forEach((reviewEl) => {
      const fieldName = reviewEl.id.replace("review-", "");
      const input = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;

      // firstName/lastName can come from fullName when form has single name input
      if (fieldName === "firstName" || fieldName === "lastName") {
        reviewEl.textContent =
          fieldName === "firstName" ? firstName || "Not provided" : lastName || "Not provided";
        return;
      }

      if (input) {
        let displayValue = input.value || "Not provided";

        // Special handling for specific fields
        if (fieldName === "password") {
          displayValue = input.value ? "••••••" : "Not provided";
        } else if (fieldName === "smsAlerts") {
          displayValue = input.value === "true" ? "Yes" : "No";
        } else if (fieldName === "mobileCarrier") {
          // Get carrier display text from button
          const carrierButton = form.querySelector(
            `#${input.id.replace("-value", "")}`
          ) as HTMLElement;
          displayValue = carrierButton?.textContent?.trim() || "Not provided";
        }

        reviewEl.textContent = displayValue;
      }
    });
  }

  // Initialize form
  function init() {
    if (!form) {
      console.error(`Form with id "${formId}" not found`);
      return;
    }

    // Phone input formatting
    const phoneInputs = form.querySelectorAll('input[type="tel"]');
    let phoneButtonLabelRaf: number | null = null;

    phoneInputs.forEach((phoneInput) => {
      const input = phoneInput as HTMLInputElement;
      let lastValue = "";

      input.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        const cursorPosition = target.selectionStart || 0;
        const oldValue = lastValue;
        const newRawValue = target.value;

        // Count digits before cursor position to maintain relative position
        const textBeforeCursor = newRawValue.substring(0, cursorPosition);
        const digitsBeforeCursor = textBeforeCursor.replace(/\D/g, "").length;

        const formatted = formatPhoneAsYouType(newRawValue);
        const wasDeleting = newRawValue.length < oldValue.length;

        target.value = formatted;
        lastValue = formatted;

        // Calculate new cursor position based on digit count
        if (wasDeleting) {
          // When deleting, keep cursor where it was
          target.setSelectionRange(cursorPosition, cursorPosition);
        } else {
          // Find the position after the same number of digits in formatted string
          let newCursorPos = 0;
          let digitCount = 0;

          for (let i = 0; i < formatted.length && digitCount < digitsBeforeCursor; i++) {
            if (/\d/.test(formatted[i])) {
              digitCount++;
            }
            newCursorPos = i + 1;
          }

          // If we're at the end or past it, move to end
          if (digitsBeforeCursor >= formatted.replace(/\D/g, "").length) {
            newCursorPos = formatted.length;
          }

          target.setSelectionRange(newCursorPos, newCursorPos);
        }

        // Debounce button label updates to avoid DOM thrashing while typing
        if (phoneButtonLabelRaf != null) cancelAnimationFrame(phoneButtonLabelRaf);
        phoneButtonLabelRaf = requestAnimationFrame(() => {
          phoneButtonLabelRaf = null;
          const currentStepEl = form.querySelector(`#${formId} .step-content.active`);
          if (!currentStepEl) return;
          const digitsOnly = (target.value || "").replace(/\D/g, "");
          const isValid = digitsOnly.length >= 10 && validatePhone(target.value || "");

          const nextButtons = currentStepEl.querySelectorAll("button.next-step");
          nextButtons.forEach((btn) => {
            const btnEl = btn as HTMLElement;
            const buttonText = btn.querySelector(".button-text");
            if (buttonText) {
              const defaultLabel = btn.getAttribute("data-default-label");
              const validLabel = btn.getAttribute("data-valid-label");
              if (defaultLabel && validLabel) {
                if (!target.value?.trim()) {
                  buttonText.textContent = defaultLabel;
                  updateButtonIcon(btnEl, false);
                } else if (isValid) {
                  buttonText.textContent = validLabel;
                  updateButtonIcon(btnEl, true);
                  // Valid: data-next = valid dest (dataSkip is for invalid; never overwrite data-next with skip dest)
                  const validDest = options.formConfig?.steps
                    ?.find(
                      (s: any) =>
                        s.stepNumber === parseInt(currentStepEl.getAttribute("data-step") || "0")
                    )
                    ?.buttons?.find((b: any) => b.type === "next")?.dataNext;
                  if (validDest != null) {
                    btnEl.setAttribute("data-next", String(validDest));
                  }
                } else {
                  buttonText.textContent = defaultLabel;
                  updateButtonIcon(btnEl, false);
                }
              }
            }
          });
        });
      });
    });

    // Address input change listener - update button text and icon with validLabel
    window.addEventListener("inline-address-select", (e: any) => {
      // Find the address input
      const addressInput = form.querySelector('input[name="address"]') as HTMLInputElement;
      if (!addressInput) return;

      // Find current active step
      const activeStep = form.querySelector(".step-content.active");
      if (!activeStep) return;

      // Find buttons with validLabel in the active step
      const buttons = activeStep.querySelectorAll("button");
      buttons.forEach((btn) => {
        const validLabel = btn.getAttribute("data-valid-label");
        const defaultLabel = btn.getAttribute("data-default-label");
        const buttonText = btn.querySelector(".button-text");

        if (buttonText && validLabel && defaultLabel) {
          // Address was selected, show validLabel and update icon
          if (e.detail.value) {
            buttonText.textContent = validLabel;
            updateButtonIcon(btn as HTMLElement, true);
          } else {
            buttonText.textContent = defaultLabel;
            updateButtonIcon(btn as HTMLElement, false);
          }
        }
      });
    });

    // Also handle when address input is cleared
    const addressInputs = form.querySelectorAll('input[name="address"]');
    addressInputs.forEach((addressInput) => {
      const input = addressInput as HTMLInputElement;

      // Create a MutationObserver to watch for value changes
      const observer = new MutationObserver(() => {
        // Find current active step
        const activeStep = form.querySelector(".step-content.active");
        if (!activeStep) return;

        // Find buttons with validLabel in the active step
        const buttons = activeStep.querySelectorAll("button");
        buttons.forEach((btn) => {
          const validLabel = btn.getAttribute("data-valid-label");
          const defaultLabel = btn.getAttribute("data-default-label");
          const buttonText = btn.querySelector(".button-text");

          if (buttonText && validLabel && defaultLabel) {
            if (!input.value || input.value.trim() === "") {
              buttonText.textContent = defaultLabel;
              updateButtonIcon(btn as HTMLElement, false);
            } else {
              buttonText.textContent = validLabel;
              updateButtonIcon(btn as HTMLElement, true);
            }
          }
        });
      });

      // Observe attribute changes (for value attribute)
      observer.observe(input, {
        attributes: true,
        attributeFilter: ["value"],
      });

      // Debounce button label updates when address input value changes (e.g. paste/clear)
      let addressLabelRaf: number | null = null;
      input.addEventListener("input", () => {
        if (addressLabelRaf != null) cancelAnimationFrame(addressLabelRaf);
        addressLabelRaf = requestAnimationFrame(() => {
          addressLabelRaf = null;
          const activeStep = form.querySelector(".step-content.active");
          if (!activeStep) return;

          const buttons = activeStep.querySelectorAll("button");
          buttons.forEach((btn) => {
            const validLabel = btn.getAttribute("data-valid-label");
            const defaultLabel = btn.getAttribute("data-default-label");
            const buttonText = btn.querySelector(".button-text");

            if (buttonText && validLabel && defaultLabel) {
              if (!input.value || input.value.trim() === "") {
                buttonText.textContent = defaultLabel;
                updateButtonIcon(btn as HTMLElement, false);
              } else {
                buttonText.textContent = validLabel;
                updateButtonIcon(btn as HTMLElement, true);
              }
            }
          });
        });
      });
    });

    // === Generic Hidden Input Handler for Button Label Updates ===
    // Handle all hidden inputs that might affect button labels (e.g., fuelSource, hvacSystem)
    const allHiddenInputs = form.querySelectorAll('input[type="hidden"][name]');
    allHiddenInputs.forEach((hiddenInput) => {
      const input = hiddenInput as HTMLInputElement;

      // Function to update button labels and icons based on hidden input value
      const updateButtonLabels = () => {
        // Find current active step
        const activeStep = form.querySelector(".step-content.active");
        if (!activeStep) return;

        // Find buttons with validLabel in the active step
        const buttons = activeStep.querySelectorAll("button[data-valid-label][data-default-label]");
        buttons.forEach((btn) => {
          const validLabel = btn.getAttribute("data-valid-label");
          const defaultLabel = btn.getAttribute("data-default-label");
          const buttonText = btn.querySelector(".button-text");

          if (buttonText && validLabel && defaultLabel) {
            // Check if this hidden input has a value
            if (!input.value || input.value.trim() === "") {
              buttonText.textContent = defaultLabel;
              updateButtonIcon(btn as HTMLElement, false);
            } else {
              buttonText.textContent = validLabel;
              updateButtonIcon(btn as HTMLElement, true);
            }
          }
        });
      };

      // Create a MutationObserver to watch for value changes
      const observer = new MutationObserver(updateButtonLabels);

      // Observe attribute changes (for value attribute)
      observer.observe(input, {
        attributes: true,
        attributeFilter: ["value"],
      });

      // Also listen for input/change events
      input.addEventListener("input", updateButtonLabels);
      input.addEventListener("change", updateButtonLabels);
    });

    // === Conditional Field Visibility ===
    let conditionalFieldsDebounce: ReturnType<typeof setTimeout> | null = null;
    const CONDITIONAL_FIELDS_DEBOUNCE_MS = 120;

    function updateConditionalFields() {
      const conditionalWrappers = form.querySelectorAll("[data-conditional-field]");

      conditionalWrappers.forEach((wrapper) => {
        const fieldName = wrapper.getAttribute("data-conditional-field");
        const requiredValue = wrapper.getAttribute("data-conditional-value");

        if (!fieldName || !requiredValue) return;

        // Get the current value of the conditional field
        const conditionalInput = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
        const currentValue = conditionalInput?.value || "";

        // Check if current value matches required value(s)
        const requiredValues = requiredValue.split(",");
        const shouldShow = requiredValues.includes(currentValue);

        // Show/hide the wrapper
        if (shouldShow) {
          (wrapper as HTMLElement).style.display = "";
        } else {
          (wrapper as HTMLElement).style.display = "none";
        }
      });
    }

    function debouncedUpdateConditionalFields() {
      if (conditionalFieldsDebounce) clearTimeout(conditionalFieldsDebounce);
      conditionalFieldsDebounce = setTimeout(() => {
        conditionalFieldsDebounce = null;
        updateConditionalFields();
      }, CONDITIONAL_FIELDS_DEBOUNCE_MS);
    }

    // Update conditional fields on change (immediate for selects/radios) and debounced on input (typing)
    form.addEventListener("input", debouncedUpdateConditionalFields);
    form.addEventListener("change", updateConditionalFields);

    // Handle button clicks
    const multistepDebug =
      typeof (window as any).__MULTISTEP_DEBUG !== "undefined" && (window as any).__MULTISTEP_DEBUG;

    form.addEventListener("click", async (e) => {
      const target = e.target as HTMLElement;

      // Never treat clicks on form controls or inside input wrappers as navigation
      // (fixes login: clicking input or icon advanced step)
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.closest(".input-wrapper, .inline-address-search-wrapper")
      ) {
        e.stopPropagation();
        return;
      }

      // Ignore clicks on non-interactive areas (step container, dividers, labels, empty space)
      // so that clicking anywhere in the form doesn't advance the step
      if (
        target.closest(".step-content, [id$='-steps']") &&
        !target.closest("button, a[href], input, textarea, select")
      ) {
        return;
      }

      if (multistepDebug) {
        console.log("[MULTISTEP-CLICK-DEBUG] form click", {
          formId: form.id,
          targetTag: target?.tagName,
          targetId: target?.id,
        });
      }

      const nextBtn = target.closest("button.next-step, a.next-step, button.submit-step");
      const prevBtn = target.closest("button.prev-step, a.prev-step");
      const smsChoiceBtn = target.closest("button.sms-choice, a.sms-choice");

      // Generic choice button (any button with data-value inside a button-group)
      const choiceBtn = target.closest("button[data-value], a[data-value]");

      const editBtn = target.closest("button.edit-step");
      const skipBtn = target.closest("button.skip-step");

      // Generic choice button handler (for button-groups)
      if (choiceBtn && !smsChoiceBtn) {
        if (multistepDebug) {
          console.log("[MULTISTEP-CLICK-DEBUG] form click → choice button", {
            choiceValue: choiceBtn.getAttribute("data-value"),
          });
        }
        e.preventDefault();
        const choiceValue = choiceBtn.getAttribute("data-value");

        // Find the button-group wrapper to get the field name
        const buttonGroup = choiceBtn.closest(".flex.flex-wrap.gap-3");
        if (!buttonGroup) {
          console.warn("[MULTISTEP-FORM] Choice button not inside button-group wrapper");
          return;
        }

        // Find the hidden input by looking for inputs in the same step
        const stepContent = choiceBtn.closest(".step-content");
        if (!stepContent) return;

        // Find all hidden inputs in this step
        const hiddenInputs = stepContent.querySelectorAll('input[type="hidden"][name]');

        // Find which hidden input this button-group controls
        // We'll match based on the button's data-value being set as the input's value
        let targetInput: HTMLInputElement | null = null;

        // Try to find by checking if any hidden input's name makes sense
        // For now, we'll use the first hidden input that's not for session data
        hiddenInputs.forEach((input) => {
          const inp = input as HTMLInputElement;
          if (!inp.id.includes("session") && !targetInput) {
            targetInput = inp;
          }
        });

        if (!targetInput) {
          console.warn("[MULTISTEP-FORM] Could not find hidden input for choice button");
          return;
        }

        // Check if this button is already selected (toggle behavior)
        const isAlreadySelected =
          choiceBtn.classList.contains("!ring-2") &&
          choiceBtn.classList.contains("!bg-primary-600");

        if (isAlreadySelected) {
          // Deselect: clear the value
          targetInput.value = "";
          console.log(`[MULTISTEP-FORM] Cleared ${targetInput.name}`);

          // Remove visual feedback
          choiceBtn.classList.remove(
            "!ring-2",
            "!ring-primary-600",
            "!bg-primary-600",
            "dark:!bg-primary-600",
            "!text-white",
            "dark:!text-white"
          );
        } else {
          // Select: update hidden input
          targetInput.value = choiceValue || "";
          console.log(`[MULTISTEP-FORM] Set ${targetInput.name} to: ${choiceValue}`);

          // Visual feedback: remove selection from all buttons
          const allChoiceButtons = stepContent.querySelectorAll("button[data-value]");
          allChoiceButtons.forEach((btn) => {
            btn.classList.remove(
              "!ring-2",
              "!ring-primary-600",
              "!bg-primary-600",
              "dark:!bg-primary-600",
              "!text-white",
              "dark:!text-white"
            );
          });

          // Add selection to clicked button
          choiceBtn.classList.add(
            "!ring-2",
            "!ring-primary-600",
            "!bg-primary-600",
            "dark:!bg-primary-600",
            "!text-white",
            "dark:!text-white"
          );
        }

        // Manually trigger change event to update button labels
        targetInput.dispatchEvent(new Event("change", { bubbles: true }));

        // Update conditional fields
        updateConditionalFields();

        // Check if button has data-next - update the Next button instead of auto-advancing
        const choiceDataNext = choiceBtn.getAttribute("data-next");
        const nextButton = stepContent.querySelector(
          "button.next-step, button.submit-step"
        ) as HTMLButtonElement;

        if (choiceDataNext && nextButton) {
          if (isAlreadySelected) {
            // Deselected: restore original data-next (or default to currentStep + 1)
            const originalDataNext = nextButton.getAttribute("data-original-next");
            if (originalDataNext) {
              nextButton.setAttribute("data-next", originalDataNext);
              console.log(
                `[MULTISTEP-FORM] Restored Next button data-next to: ${originalDataNext}`
              );
            } else {
              // Fallback: use currentStep + 1
              const currentStepNum = parseInt(stepContent.getAttribute("data-step") || "1");
              nextButton.setAttribute("data-next", (currentStepNum + 1).toString());
              console.log(
                `[MULTISTEP-FORM] Restored Next button data-next to default: ${currentStepNum + 1}`
              );
            }
          } else {
            // Selected: store original data-next if not already stored, then update it
            if (!nextButton.hasAttribute("data-original-next")) {
              const originalNext = nextButton.getAttribute("data-next") || "";
              nextButton.setAttribute("data-original-next", originalNext);
              console.log(`[MULTISTEP-FORM] Stored original data-next: ${originalNext}`);
            }
            nextButton.setAttribute("data-next", choiceDataNext);
            console.log(`[MULTISTEP-FORM] Updated Next button data-next to: ${choiceDataNext}`);
          }
        }

        // Enable the next/submit button
        if (nextButton) {
          nextButton.disabled = false;
        }

        return;
      }

      // SMS choice buttons
      if (smsChoiceBtn) {
        if (multistepDebug)
          console.log("[MULTISTEP-CLICK-DEBUG] form click → SMS choice, will showStep");
        e.preventDefault();
        const smsValue = smsChoiceBtn.getAttribute("data-sms-value");
        const nextStep = parseInt(smsChoiceBtn.getAttribute("data-next") || "1");

        const smsInput = form.querySelector('input[name="smsAlerts"]') as HTMLInputElement;
        if (smsInput) {
          smsInput.value = smsValue || "false";
        }

        await showStep(nextStep);
        return;
      }

      // Next button
      if (nextBtn) {
        if (multistepDebug) {
          console.log("[MULTISTEP-CLICK-DEBUG] form click → next/submit button", {
            nextBtnTag: nextBtn.tagName,
            dataNext: nextBtn.getAttribute("data-next"),
            isSubmit:
              nextBtn.classList.contains("submit-step") ||
              nextBtn.classList.contains("submit-registration") ||
              nextBtn.classList.contains("submit-contact"),
          });
        }
        e.preventDefault();
        let nextStep = parseInt(nextBtn.getAttribute("data-next") || "1");

        // Check if this is submit button
        if (
          nextBtn.classList.contains("submit-registration") ||
          nextBtn.classList.contains("submit-contact") ||
          nextBtn.classList.contains("submit-step")
        ) {
          console.log("[MULTISTEP-FORM] Submit button clicked, dispatching form submit event");
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
          return;
        }

        // Special handling for SMS consent step
        if (nextBtn.classList.contains("sms-next-btn")) {
          const smsToggle = form.querySelector('input[name="smsAlerts"]') as HTMLInputElement;
          if (smsToggle && smsToggle.checked) {
            // SMS is enabled, go to carrier selection (step 5)
            nextStep = 5;
          } else {
            // SMS is disabled, skip to step 6
            nextStep = 6;
          }
        }

        // NOTE: Phone step skip logic is now handled by skipCondition in form config
        // The initializeMultiStepForm function will automatically skip SMS steps
        // if phone is invalid or empty based on the "noValidPhone" condition

        (nextBtn as HTMLButtonElement).disabled = true;

        try {
          const valid = await validateStep(currentStep);
          if (valid) {
            await showStep(nextStep);
          } else {
            // Validation failed – if button has data-skip (skip mode: label="skip" validLabel="next"), advance to skip step
            const skipStep = nextBtn.getAttribute("data-skip");
            if (skipStep) {
              const skipStepNum = parseInt(skipStep, 10);
              if (!isNaN(skipStepNum)) {
                await showStep(skipStepNum);
              }
            }
          }
        } finally {
          (nextBtn as HTMLButtonElement).disabled = false;
        }
      }

      // Previous button
      if (prevBtn) {
        const isLink = prevBtn.tagName === "A" || prevBtn.hasAttribute("href");
        if (isLink) {
          if (multistepDebug)
            console.log(
              "[MULTISTEP-CLICK-DEBUG] form click → prev link (navigate away), no action"
            );
          return;
        }
        if (multistepDebug)
          console.log("[MULTISTEP-CLICK-DEBUG] form click → prev button, will showStep");
        e.preventDefault();
        let prevStep = parseInt(prevBtn.getAttribute("data-prev") || "1");

        // NOTE: Back button skip logic is now handled by skipCondition in form config
        // The initializeMultiStepForm function will automatically skip over
        // steps with skipConditions when navigating backward

        await showStep(prevStep, "backward");
      }

      // Edit button (for review step)
      if (editBtn) {
        if (multistepDebug)
          console.log("[MULTISTEP-CLICK-DEBUG] form click → edit button, will showStep");
        e.preventDefault();
        const editStep = parseInt(editBtn.getAttribute("data-edit") || "1");
        await showStep(editStep);
      }

      // Skip button
      if (skipBtn) {
        if (multistepDebug)
          console.log("[MULTISTEP-CLICK-DEBUG] form click → skip button, will showStep");
        e.preventDefault();
        const nextStep = parseInt(skipBtn.getAttribute("data-next") || "1");
        await showStep(nextStep);
      }

      if (multistepDebug)
        console.log("[MULTISTEP-CLICK-DEBUG] form click → no button matched, no action");
    });

    // Debug: log clicks outside form only when __MULTISTEP_DEBUG is set
    if (multistepDebug) {
      document.addEventListener(
        "click",
        (e) => {
          const t = e.target as HTMLElement;
          if (!form.contains(t)) {
            console.log("[MULTISTEP-CLICK-DEBUG] document click OUTSIDE form", {
              formId: form.id,
              targetTag: t?.tagName,
              targetId: t?.id,
            });
          }
        },
        true
      );
    }

    // Add touched class to inputs
    const inputs = form.querySelectorAll("input[required], textarea[required]");
    inputs.forEach((input) => {
      input.addEventListener("blur", () => {
        input.classList.add("touched");
      });
      input.addEventListener("input", () => {
        input.classList.add("touched");
      });
    });

    // Handle form submission
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      console.log("[MULTISTEP-FORM] Form submit event triggered");

      if (isSubmitting) {
        console.log("[MULTISTEP-FORM] Already submitting, ignoring duplicate");
        return;
      }

      console.log("[MULTISTEP-FORM] Validating final step:", currentStep);
      if (!(await validateStep(currentStep))) {
        console.log("[MULTISTEP-FORM] Final step validation failed");
        return;
      }

      console.log("[MULTISTEP-FORM] Validation passed, starting submission");
      isSubmitting = true;
      const submitButton = form.querySelector(
        'button[type="submit"], button.submit-registration, button.submit-contact, button.submit-step'
      ) as HTMLButtonElement;

      if (submitButton) {
        console.log("[MULTISTEP-FORM] Disabling submit button");
        submitButton.disabled = true;
      }

      let formData = new FormData(form);
      // If form has fullName, parse to firstName/lastName so APIs and placeholders have both
      const fullNameRaw = formData.get("fullName")?.toString()?.trim();
      if (fullNameRaw) {
        const { firstName, lastName } = parseFullNameToFirstAndLast(fullNameRaw);
        formData.set("firstName", firstName);
        formData.set("lastName", lastName);
      }
      console.log("[MULTISTEP-FORM] Form data keys:", Array.from(formData.keys()));

      const responseType = options.formConfig?.responseType || "toast";
      if (responseType === "toast" && (window as any).showNotice) {
        (window as any).showNotice(
          "info",
          "Submitting...",
          "Sending your information to the team.",
          10000
        );
      }

      try {
        console.log("[MULTISTEP-FORM] Fetching:", form.action, "method:", form.method);
        if (options.onSubmit) {
          console.log("[MULTISTEP-FORM] Using custom onSubmit handler");
          await options.onSubmit(formData);
        } else {
          // Default submission
          console.log("[MULTISTEP-FORM] Using default submission");
          const response = await fetch(form.action, {
            method: form.method,
            body: formData,
            headers: {
              Accept: "application/json",
            },
          });

          console.log("[MULTISTEP-FORM] Response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("[MULTISTEP-FORM] Response error body:", errorText);
            let errorMessage = `Submission failed: ${response.status}`;
            try {
              const errorJson = JSON.parse(errorText);
              if (typeof errorJson?.error === "string" && errorJson.error.trim()) {
                errorMessage = errorJson.error;
              }
            } catch {
              // Not JSON or parse failed - use status-based message
            }
            throw new Error(errorMessage);
          }

          const result = await response.json();
          console.log("[MULTISTEP-FORM] Response result:", result);

          if (result.success === false || result.error) {
            throw new Error(result.error || "Submission failed");
          }

          if (responseType === "inline") {
            showInlineFormResponse(
              "success",
              "Success!",
              result.message || "Form submitted successfully"
            );
          } else if ((window as any).showNotice) {
            (window as any).showNotice(
              "success",
              "Success!",
              result.message || "Form submitted successfully",
              3000
            );
          }

          // Redirect if specified
          if (result.redirect) {
            console.log("[MULTISTEP-FORM] Redirecting to:", result.redirect);
            setTimeout(() => {
              window.location.href = result.redirect;
            }, 2000);
          }
        }
      } catch (error) {
        console.error("[MULTISTEP-FORM] Submission error:", error);
        const errMsg = error instanceof Error ? error.message : "An unexpected error occurred";
        if (responseType === "inline") {
          showInlineFormResponse("error", "Submission Failed", errMsg);
        } else if ((window as any).showNotice) {
          (window as any).showNotice("error", "Submission Failed", errMsg, 8000);
        }
      } finally {
        console.log("[MULTISTEP-FORM] Submission complete, resetting state");
        isSubmitting = false;
        if (submitButton) submitButton.disabled = false;
      }
    });

    // Handle Enter key
    form.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
        // If typewriter is running, skip it instead of advancing (avoids "please enter full name" validation)
        const skipTypewriter = (window as any).skipActiveTypewriterToEnd as
          | (() => boolean)
          | undefined;
        if (typeof skipTypewriter === "function" && skipTypewriter()) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        const target = e.target as HTMLElement;
        if (multistepDebug) {
          console.log("[MULTISTEP-CLICK-DEBUG] form keypress Enter", {
            formId: form.id,
            targetTag: target?.tagName,
            targetId: target?.id,
          });
        }
        e.preventDefault();
        const currentStepEl = form.querySelector(`.step-content[data-step="${currentStep}"]`);

        // Check if target is an input field
        if (target.tagName === "INPUT") {
          // Get all visible inputs in the current step (not hidden)
          const inputs = Array.from(
            currentStepEl?.querySelectorAll('input:not([type="hidden"]), textarea') || []
          ).filter((input) => {
            const el = input as HTMLElement;
            return el.offsetParent !== null; // Check if visible
          }) as HTMLInputElement[];

          const currentIndex = inputs.indexOf(target as HTMLInputElement);

          // If there's a next input in this step, focus it (don't advance to next step)
          if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
            const nextInput = inputs[currentIndex + 1];
            nextInput.focus();
            if (multistepDebug)
              console.log(
                "[MULTISTEP-CLICK-DEBUG] Enter → moving to next input (not advancing step)"
              );
            return;
          }
          // Single or last input: fall through to click next/submit button
        }

        // Multiple inputs and on last, or target not an input: click next button
        const nextBtn = currentStepEl?.querySelector(
          ".next-step, .submit-registration, .submit-contact, .submit-step"
        ) as HTMLElement;
        if (nextBtn) {
          if (multistepDebug) {
            console.log(
              "[MULTISTEP-CLICK-DEBUG] Enter → programmatically clicking next button (will advance)",
              {
                keypressTargetTag: target.tagName,
                keypressTargetClass: target.className?.slice?.(0, 60),
              }
            );
          }
          nextBtn.click();
        } else if (multistepDebug) {
          console.log("[MULTISTEP-CLICK-DEBUG] Enter → no next button in current step");
        }
      }
    });

    // Initialize
    // Show first step and update progress
    showStep(currentStep);

    // Phone step: only apply validation-based routing when next button has dataSkip (conditional next)
    const phoneStep =
      phoneInputs.length > 0
        ? ((phoneInputs[0] as HTMLInputElement).closest(".step-content") as HTMLElement)
        : null;
    const phoneBtnConfig = phoneStep
      ? options.formConfig?.steps
          ?.find(
            (s: any) => s.stepNumber === parseInt(phoneStep.getAttribute("data-step") || "0", 10)
          )
          ?.buttons?.find((b: any) => b.type === "next" && b.dataSkip != null)
      : null;

    if (phoneBtnConfig && phoneStep) {
      const validDest = phoneBtnConfig.dataNext;
      const conditionalNextButton = phoneStep.querySelector("[data-skip]") as HTMLElement;

      if (conditionalNextButton && validDest != null) {
        const phoneValue = (phoneInputs[0] as HTMLInputElement)?.value?.trim() || "";
        if (phoneValue) {
          const isValid = phoneValue.replace(/\D/g, "").length >= 10 && validatePhone(phoneValue);
          if (isValid) {
            conditionalNextButton.setAttribute("data-next", String(validDest));
          }
          // When invalid: never overwrite data-next; click handler uses data-skip when validation fails
        } else {
          conditionalNextButton.setAttribute("data-next", String(validDest));
        }
      }
    }

    // Focus first input when first step has no typewriter (otherwise typewriter-complete will focus)
    // Use .typewriter-text in DOM so we don't depend on has-typewriter class being set before init
    const firstStep = form.querySelector(".step-content.active") as HTMLElement;
    const firstStepHasTypewriter = firstStep?.querySelector(".typewriter-text") != null;
    if (!firstStepHasTypewriter) {
      // No typewriter: short delay so DOM is ready; no cascade to wait for
      setTimeout(() => {
        if (firstStep) {
          const firstInput = firstStep.querySelector(
            "input:not([type=hidden]):not([readonly]), textarea, select"
          ) as HTMLElement;
          if (firstInput?.focus) {
            firstInput.focus();
            const elementRect = firstInput.getBoundingClientRect();
            const absoluteElementTop = elementRect.top + window.pageYOffset;
            const cursorLine = absoluteElementTop - window.innerHeight * 0.4;
            window.scrollTo({ top: cursorLine, behavior: "smooth" });
          }
        }
      }, 120);
    }
    // Step 1 with typewriter: focus + keypad run from MultiStepForm typewriter-complete → cascade transitionend
  }

  return {
    init,
    showStep,
    getCurrentStep: () => currentStep,
    setActiveStepByFocus,
  };
}

// New simplified initialization function for forms with skip logic
export function initializeMultiStepForm(
  form: HTMLFormElement,
  options: {
    initialData?: Record<string, any>;
    formConfig?: any;
  } = {}
) {
  const { initialData = {}, formConfig } = options;

  console.log("[MULTISTEP-FORM] Initializing form with skip logic", { formId: form.id });

  // Helper function to check if a step should be skipped
  function shouldSkipStep(stepNumber: number): boolean {
    if (!formConfig?.steps) return false;

    const step = formConfig.steps.find((s: any) => s.stepNumber === stepNumber);
    if (!step?.skipCondition) return false;

    // Evaluate skip condition
    const condition = step.skipCondition;

    // Handle special dynamic conditions
    if (condition === "noValidPhone") {
      // Check if phone is valid
      const phoneInput = form.querySelector('input[type="tel"]') as HTMLInputElement;
      const phoneValue = phoneInput?.value?.trim() || "";
      const isPhoneValid = phoneValue && validatePhone(phoneValue);

      if (!isPhoneValid) {
        console.log(
          `[MULTISTEP-FORM] Skipping step ${stepNumber} (no valid phone: "${phoneValue}")`
        );
        return true;
      }
      return false;
    }

    // Simple evaluation - check if condition exists in initialData
    if (typeof condition === "string") {
      // For simple boolean checks like "isAuthenticated"
      if (initialData[condition] === true || initialData[condition] === "true") {
        console.log(
          `[MULTISTEP-FORM] Skipping step ${stepNumber} (condition: ${condition} = true)`
        );
        return true;
      }
    }

    return false;
  }

  // Find the first non-skipped step
  function getFirstValidStep(): number {
    if (!formConfig?.steps) return 1;

    for (let i = 1; i <= formConfig.totalSteps; i++) {
      if (!shouldSkipStep(i)) {
        console.log(`[MULTISTEP-FORM] First valid step: ${i}`);
        return i;
      }
    }

    return 1;
  }

  // Find the next non-skipped step
  function getNextValidStep(currentStep: number): number {
    for (let i = currentStep + 1; i <= formConfig.totalSteps; i++) {
      if (!shouldSkipStep(i)) {
        return i;
      }
    }
    return currentStep; // No valid next step
  }

  // Find the previous non-skipped step
  function getPrevValidStep(currentStep: number): number {
    for (let i = currentStep - 1; i >= 1; i--) {
      if (!shouldSkipStep(i)) {
        return i;
      }
    }
    return currentStep; // No valid previous step
  }

  // Initialize with the handler, but override the initial step
  const firstStep = getFirstValidStep();

  // Use the existing handler
  const handler = createMultiStepFormHandler(form.id, formConfig?.totalSteps || 8, {
    onStepChange: (stepNumber) => {
      console.log(`[MULTISTEP-FORM] Step changed to: ${stepNumber}`);
    },
    formConfig: formConfig, // Pass formConfig to enable registerUser flag
  });

  // Override showStep to respect skip logic
  const originalShowStep = handler.showStep;
  handler.showStep = (stepNumber: number) => {
    if (shouldSkipStep(stepNumber)) {
      console.log(`[MULTISTEP-FORM] Step ${stepNumber} should be skipped, finding next valid step`);
      // If trying to go forward and this step should be skipped, go to next valid
      const nextValid = getNextValidStep(stepNumber - 1);
      if (nextValid !== stepNumber) {
        originalShowStep(nextValid);
        return;
      }
      // If trying to go backward, go to previous valid
      const prevValid = getPrevValidStep(stepNumber + 1);
      originalShowStep(prevValid);
      return;
    }
    originalShowStep(stepNumber);
  };

  // Initialize and show first valid step
  handler.init();
  if (firstStep !== 1) {
    handler.showStep(firstStep);
  }

  // Expose handler on form so focus listener can call setActiveStepByFocus when user scrolls up to edit
  (form as HTMLFormElement & { multiStepHandler?: MultiStepFormHandler }).multiStepHandler =
    handler;

  return handler;
}

/** Validate a flat form container (used by StandardForm). Same validation logic as validateStep. */
async function validateFormContainer(container: HTMLElement, formConfig?: any): Promise<boolean> {
  const inputs = container.querySelectorAll("input[required], textarea[required]");
  for (const input of inputs) {
    const inputEl = input as HTMLInputElement | HTMLTextAreaElement;
    if (!inputEl.checkValidity()) {
      inputEl.classList.add("touched");
      if ((window as any).showNotice) {
        const errorMsg =
          inputEl.getAttribute("data-error") || "Please fill in this field correctly";
        (window as any).showNotice("error", "Validation Error", errorMsg, 3000);
      }
      return false;
    }
  }

  // Phone validation
  const phoneInput = container.querySelector('input[type="tel"]') as HTMLInputElement;
  if (phoneInput) {
    const phoneValue = phoneInput.value?.trim() || "";
    if (phoneInput.required && !phoneValue) {
      if ((window as any).showNotice) {
        (window as any).showNotice(
          "error",
          "Phone Number Required",
          "Please enter a phone number",
          3000
        );
      }
      phoneInput.classList.add("touched");
      return false;
    }
    if (phoneValue && !validatePhone(phoneValue)) {
      const digitsOnly = phoneValue.replace(/\D/g, "");
      if (digitsOnly.length < 10) {
        if ((window as any).showNotice) {
          (window as any).showNotice(
            "error",
            "Invalid Phone Number",
            "Please enter a complete 10-digit phone number",
            3000
          );
        }
      } else if ((window as any).showNotice) {
        (window as any).showNotice(
          "error",
          "Invalid Phone Number",
          "Please enter a valid US phone number",
          3000
        );
      }
      phoneInput.classList.add("touched");
      return false;
    }
  }

  // Email uniqueness (register forms)
  const shouldCheckEmailUniqueness = formConfig?.registerUser === true;
  if (shouldCheckEmailUniqueness) {
    const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
    if (emailInput?.value) {
      try {
        const response = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailInput.value }),
        });
        if (response.ok) {
          const result = await response.json();
          if (result.available === false) {
            emailInput.classList.add("touched");
            const loginUrl = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
            if ((window as any).showNotice) {
              (window as any).showNotice(
                "warning",
                "Email Already Registered",
                `This email is already registered. <a href="${loginUrl}" class="text-primary-600 underline">Log in</a>`,
                10000
              );
            }
            return false;
          }
        }
      } catch {
        /* allow on error */
      }
    }
  }

  // data-validate exists rule
  const validateInputs = container.querySelectorAll(
    "input[data-validate], textarea[data-validate]"
  );
  for (const input of validateInputs) {
    const inputEl = input as HTMLInputElement | HTMLTextAreaElement;
    const rule = inputEl.getAttribute("data-validate")?.trim();
    const validateMessage = inputEl.getAttribute("data-validate-message")?.trim();
    if (!rule || !inputEl.value?.trim()) continue;
    if (rule.startsWith("exists:")) {
      const match = rule.match(/^exists:([^,]+),([^,]+)$/);
      if (!match) continue;
      const [, , column] = match;
      if (column?.toLowerCase() === "email" && inputEl.type === "email") {
        try {
          const response = await fetch("/api/auth/check-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: inputEl.value.trim() }),
          });
          if (response.ok) {
            const result = await response.json();
            if (result.available !== false) {
              inputEl.classList.add("touched");
              if ((window as any).showNotice && validateMessage) {
                (window as any).showNotice("warning", "Not found", validateMessage, 10000);
              }
              return false;
            }
          }
        } catch {
          /* allow on error */
        }
      }
    }
  }
  return true;
}

/**
 * Initialize StandardForm (single-page flat form) with validation and submit handling.
 * Uses the same validation logic as MultiStepForm.
 */
export function initializeStandardForm(
  form: HTMLFormElement,
  options: { initialData?: Record<string, any>; formConfig?: any } = {}
) {
  const { initialData = {}, formConfig } = options;
  const formId = form.id;

  // Pre-fill initial data
  Object.entries(initialData || {}).forEach(([key, value]) => {
    const input = form.querySelector(`[name="${key}"]`) as HTMLInputElement;
    if (input && value != null) input.value = String(value);
  });

  // Touched class on blur/input
  form.querySelectorAll("input[required], textarea[required]").forEach((input) => {
    input.addEventListener("blur", () => (input as HTMLElement).classList.add("touched"));
    input.addEventListener("input", () => (input as HTMLElement).classList.add("touched"));
  });

  let isSubmitting = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (isSubmitting) return;
    if (!(await validateFormContainer(form, formConfig))) return;

    isSubmitting = true;
    const submitBtn = form.querySelector(
      'button[type="submit"], button.submit-step'
    ) as HTMLButtonElement | null;
    if (submitBtn) submitBtn.disabled = true;

    const responseType = formConfig?.responseType || "toast";
    if (responseType === "toast" && (window as any).showNotice) {
      (window as any).showNotice("info", "Submitting...", "Sending your information.", 10000);
    }

    try {
      const formData = new FormData(form);
      const fullNameRaw = formData.get("fullName")?.toString()?.trim();
      if (fullNameRaw) {
        const { firstName, lastName } = parseFullNameToFirstAndLast(fullNameRaw);
        formData.set("firstName", firstName);
        formData.set("lastName", lastName);
      }

      const response = await fetch(form.action, {
        method: form.method,
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Submission failed: ${response.status}`;
        try {
          const err = JSON.parse(errorText);
          if (typeof err?.error === "string" && err.error.trim()) errorMessage = err.error;
        } catch {
          /* ignore */
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success === false || result.error)
        throw new Error(result.error || "Submission failed");

      if (responseType === "inline") {
        const container = document.getElementById(`${formId}-response-alert`);
        if (container) {
          const escaped = (s: string) =>
            s
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;");
          container.className =
            "w-100 p-2 mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800";
          container.innerHTML = `
            <div class="flex items-start">
              <svg class="mr-2 mt-0.5 h-5 w-5 shrink-0 text-green-800 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              <div class="mr-8 flex-1 text-base text-green-800 dark:text-green-400">${escaped(result.message || "Form submitted successfully")}</div>
            </div>`;
          container.classList.remove("hidden");
        }
      } else if ((window as any).showNotice) {
        (window as any).showNotice(
          "success",
          "Success!",
          result.message || "Form submitted successfully",
          3000
        );
      }

      if (result.redirect) {
        setTimeout(() => (window.location.href = result.redirect), 2000);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "An unexpected error occurred";
      if (formConfig?.responseType === "inline") {
        const container = document.getElementById(`${formId}-response-alert`);
        if (container) {
          const escaped = (s: string) =>
            s
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;");
          container.className =
            "w-100 p-2 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800";
          container.innerHTML = `
            <div class="flex items-start">
              <svg class="mr-2 mt-0.5 h-5 w-5 shrink-0 text-red-800 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
              <div class="mr-8 flex-1 text-base text-red-800 dark:text-red-400">${escaped(errMsg)}</div>
            </div>`;
          container.classList.remove("hidden");
        }
      } else if ((window as any).showNotice) {
        (window as any).showNotice("error", "Submission Failed", errMsg, 8000);
      }
    } finally {
      isSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
