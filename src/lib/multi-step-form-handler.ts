// Generic multi-step form handler
// This module provides reusable logic for any multi-step form

import { validatePhone, formatPhoneAsYouType } from "./phone-validation";
import { getSupabaseClient } from "./supabase-client";

export interface MultiStepFormHandler {
  init: () => void;
  showStep: (stepNumber: number) => void;
  getCurrentStep: () => number;
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

  // Update progress bar
  function updateProgress() {
    const stepper = document.getElementById(`${formId}-stepper`);
    if (!stepper) return;

    // Update each step indicator
    const stepIndicators = stepper.querySelectorAll("[data-step-indicator]");
    stepIndicators.forEach((indicator) => {
      const stepNum = parseInt(indicator.getAttribute("data-step-indicator") || "0");
      const circle = indicator.querySelector("span:first-child");
      const checkmark = indicator.querySelector(".checkmark-icon");
      const number = indicator.querySelector(".step-number");
      const progressLine = indicator.querySelector(".step-progress-line");

      if (!circle) return;

      // Remove all state classes
      circle.classList.remove(
        "bg-primary-500",
        "dark:bg-primary-600",
        "text-white",
        "ring-4",
        "ring-primary-100",
        "dark:ring-primary-900/30",
        "bg-green-500",
        "dark:bg-green-600",
        "bg-gray-100",
        "dark:bg-gray-800",
        "text-gray-500",
        "dark:text-gray-400"
      );

      if (stepNum < currentStep) {
        // Completed step - show checkmark
        circle.classList.add("bg-green-500", "dark:bg-green-600", "text-white");
        if (checkmark) checkmark.classList.remove("hidden");
        if (number) number.classList.add("hidden");

        // Fill progress line 100%
        if (progressLine) {
          (progressLine as HTMLElement).style.width = "100%";
        }
      } else if (stepNum === currentStep) {
        // Current step - highlight with ring
        circle.classList.add(
          "bg-primary-500",
          "dark:bg-primary-600",
          "text-white",
          "ring-4",
          "ring-primary-100",
          "dark:ring-primary-900/30"
        );
        if (checkmark) checkmark.classList.add("hidden");
        if (number) number.classList.remove("hidden");

        // Empty progress line
        if (progressLine) {
          (progressLine as HTMLElement).style.width = "0%";
        }
      } else {
        // Future step - gray
        circle.classList.add(
          "bg-gray-100",
          "dark:bg-gray-800",
          "text-gray-500",
          "dark:text-gray-400"
        );
        if (checkmark) checkmark.classList.add("hidden");
        if (number) number.classList.remove("hidden");

        // Empty progress line
        if (progressLine) {
          (progressLine as HTMLElement).style.width = "0%";
        }
      }
    });
  }

  // Show specific step
  function showStep(stepNumber: number) {
    const steps = document.querySelectorAll(`#${formId} .step-content`);

    steps.forEach((step) => {
      step.classList.remove("active");
      // Remove focus classes from buttons
      const buttons = step.querySelectorAll("button");
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
    });

    const targetStep = document.querySelector(
      `#${formId} .step-content[data-step="${stepNumber}"]`
    ) as HTMLElement;

    if (targetStep) {
      targetStep.classList.add("active");
      currentStep = stepNumber;
      updateProgress();

      // Trigger typewriter effect for title
      const titleElement = targetStep.querySelector(".typewriter-text") as HTMLElement;
      if (titleElement) {
        // Reset animation by removing and re-adding class
        titleElement.classList.remove("typed");
        void titleElement.offsetWidth; // Force reflow

        // After animation completes, add 'typed' class to stop cursor
        setTimeout(() => {
          titleElement.classList.add("typed");
        }, 800); // Match typewriter animation duration
      }

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

      // Auto-focus handling
      setTimeout(() => {
        // Check if this step has SMS choice buttons
        const smsChoiceButtons = targetStep.querySelectorAll("button.sms-choice");
        if (smsChoiceButtons.length > 0) {
          // Focus the "yes" button
          const yesButton = targetStep.querySelector(
            'button[data-sms-value="true"]'
          ) as HTMLElement;
          if (yesButton) {
            yesButton.focus();
          }
        } else {
          // Auto-focus first input
          const firstInput = targetStep.querySelector(
            "input:not([type=hidden]):not([readonly]), textarea"
          ) as HTMLElement;
          if (firstInput) {
            firstInput.focus();
            firstInput.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }, 150);
    }
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

        if (window.showNotice) {
          const errorMsg =
            inputEl.getAttribute("data-error") || "Please fill in this field correctly";
          window.showNotice("error", "Validation Error", errorMsg, 3000);
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
    if (phoneInput) {
      const phoneValue = phoneInput.value?.trim() || "";
      if (phoneValue && !validatePhone(phoneValue)) {
        if (window.showNotice) {
          window.showNotice(
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

          if (window.showNotice) {
            window.showNotice(
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

    return isValid;
  }

  // Validate email uniqueness
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

  // Update review section
  function updateReviewSection() {
    const reviewElements = form.querySelectorAll("[id^='review-']");
    reviewElements.forEach((reviewEl) => {
      const fieldName = reviewEl.id.replace("review-", "");
      const input = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;

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
        } else if (fieldName.includes("Name")) {
          const firstName =
            (form.querySelector('[name="firstName"]') as HTMLInputElement)?.value || "";
          const lastName =
            (form.querySelector('[name="lastName"]') as HTMLInputElement)?.value || "";
          if (fieldName === "firstName" || fieldName === "lastName") {
            displayValue = `${firstName} ${lastName}`.trim() || "Not provided";
          }
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
    phoneInputs.forEach((phoneInput) => {
      const input = phoneInput as HTMLInputElement;
      let lastValue = "";

      input.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        const cursorPosition = target.selectionStart || 0;
        const formatted = formatPhoneAsYouType(target.value);
        const wasDeleting = target.value.length < lastValue.length;

        target.value = formatted;
        lastValue = formatted;

        if (wasDeleting) {
          target.setSelectionRange(cursorPosition, cursorPosition);
        } else {
          target.setSelectionRange(formatted.length, formatted.length);
        }

        // Update button text for phone steps
        const phoneButtonText = document.getElementById(`${formId}-next-step-phone-text`);
        if (phoneButtonText) {
          if (!formatted || formatted.trim() === "") {
            phoneButtonText.textContent = "skip";
          } else {
            const digitsOnly = formatted.replace(/\D/g, "");
            if (digitsOnly.length >= 10 && validatePhone(formatted)) {
              phoneButtonText.textContent = "next";
            } else {
              phoneButtonText.textContent = "skip";
            }
          }
        }
      });
    });

    // Handle button clicks
    form.addEventListener("click", async (e) => {
      const target = e.target as HTMLElement;
      const nextBtn = target.closest("button.next-step, a.next-step, button.submit-step");
      const prevBtn = target.closest("button.prev-step, a.prev-step");
      const smsChoiceBtn = target.closest("button.sms-choice, a.sms-choice");
      const fuelChoiceBtn = target.closest("button.fuel-choice, a.fuel-choice");
      const hvacChoiceBtn = target.closest("button.hvac-choice, a.hvac-choice");
      const editBtn = target.closest("button.edit-step");
      const skipBtn = target.closest("button.skip-step");

      // Fuel choice buttons (Gas/Electric) - Select only, don't advance
      if (fuelChoiceBtn) {
        e.preventDefault();
        const fuelValue = fuelChoiceBtn.getAttribute("data-value");

        // Update hidden input
        const fuelInput = form.querySelector('input[name="fuelSource"]') as HTMLInputElement;
        if (fuelInput) {
          fuelInput.value = fuelValue || "";
          console.log(`[MULTISTEP-FORM] Set fuelSource to: ${fuelValue}`);
        }

        // Visual feedback: highlight selected button
        const allFuelButtons = form.querySelectorAll("button.fuel-choice");
        allFuelButtons.forEach((btn) => {
          btn.classList.remove("!ring-2", "!ring-primary-600", "!bg-primary-50");
          btn.classList.add("hover:bg-gray-50");
        });
        fuelChoiceBtn.classList.add("!ring-2", "!ring-primary-600", "!bg-primary-50");
        fuelChoiceBtn.classList.remove("hover:bg-gray-50");

        // Enable the next button
        const nextButton = form.querySelector(
          `.sms-step[data-step="${currentStep}"] button.next-step`
        ) as HTMLButtonElement;
        if (nextButton) {
          nextButton.disabled = false;
        }

        return;
      }

      // HVAC choice buttons - Select only, don't advance
      if (hvacChoiceBtn) {
        e.preventDefault();
        const hvacValue = hvacChoiceBtn.getAttribute("data-value");

        // Update hidden input
        const hvacInput = form.querySelector('input[name="hvacSystem"]') as HTMLInputElement;
        if (hvacInput) {
          hvacInput.value = hvacValue || "";
          console.log(`[MULTISTEP-FORM] Set hvacSystem to: ${hvacValue}`);
        }

        // Visual feedback: highlight selected button
        const allHvacButtons = form.querySelectorAll(
          "button.hvac-choice:not([style*='display: none'])"
        );
        allHvacButtons.forEach((btn) => {
          btn.classList.remove("!ring-2", "!ring-primary-600", "!bg-primary-50");
          btn.classList.add("hover:bg-gray-50");
        });
        hvacChoiceBtn.classList.add("!ring-2", "!ring-primary-600", "!bg-primary-50");
        hvacChoiceBtn.classList.remove("hover:bg-gray-50");

        // Enable the submit button
        const submitButton = form.querySelector(
          `.sms-step[data-step="${currentStep}"] button.submit-step`
        ) as HTMLButtonElement;
        if (submitButton) {
          submitButton.disabled = false;
        }

        return;
      }

      // SMS choice buttons
      if (smsChoiceBtn) {
        e.preventDefault();
        const smsValue = smsChoiceBtn.getAttribute("data-sms-value");
        const nextStep = parseInt(smsChoiceBtn.getAttribute("data-next") || "1");

        const smsInput = form.querySelector('input[name="smsAlerts"]') as HTMLInputElement;
        if (smsInput) {
          smsInput.value = smsValue || "false";
        }

        showStep(nextStep);
        return;
      }

      // Next button
      if (nextBtn) {
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

        // Special handling for phone step
        if (nextBtn.classList.contains("next-step-phone")) {
          const phoneInput = form.querySelector('input[type="tel"]') as HTMLInputElement;
          const phoneValue = phoneInput?.value?.trim() || "";

          if (!phoneValue) {
            // Skip SMS steps if no phone
            const smsInput = form.querySelector('input[name="smsAlerts"]') as HTMLInputElement;
            if (smsInput) smsInput.value = "false";

            // Find the step after SMS steps
            nextStep = nextStep + 2; // Skip SMS consent and carrier selection
            showStep(nextStep);
            return;
          }

          if (!(await validateStep(currentStep))) {
            return;
          }
        }

        (nextBtn as HTMLButtonElement).disabled = true;

        try {
          if (await validateStep(currentStep)) {
            showStep(nextStep);
          }
        } finally {
          (nextBtn as HTMLButtonElement).disabled = false;
        }
      }

      // Previous button
      if (prevBtn) {
        const isLink = prevBtn.tagName === "A" || prevBtn.hasAttribute("href");
        if (isLink) return;

        e.preventDefault();
        let prevStep = parseInt(prevBtn.getAttribute("data-prev") || "1");

        // Special handling for going back from company step
        if (prevBtn.classList.contains("prev-step-company")) {
          const phoneInput = form.querySelector('input[type="tel"]') as HTMLInputElement;
          const phoneValue = phoneInput?.value?.trim() || "";

          if (!phoneValue) {
            prevStep = prevStep - 2; // Skip back over SMS steps
          }
        }

        // Special handling for going back from review step
        if (prevBtn.classList.contains("prev-step-review")) {
          const phoneInput = form.querySelector('input[type="tel"]') as HTMLInputElement;
          const phoneValue = phoneInput?.value?.trim() || "";

          if (!phoneValue) {
            prevStep = prevStep - 2; // Skip back over SMS steps
          }
        }

        showStep(prevStep);
      }

      // Edit button (for review step)
      if (editBtn) {
        e.preventDefault();
        const editStep = parseInt(editBtn.getAttribute("data-edit") || "1");
        showStep(editStep);
      }

      // Skip button
      if (skipBtn) {
        e.preventDefault();
        const nextStep = parseInt(skipBtn.getAttribute("data-next") || "1");
        showStep(nextStep);
      }
    });

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

      const formData = new FormData(form);
      console.log("[MULTISTEP-FORM] Form data keys:", Array.from(formData.keys()));

      if (window.showNotice) {
        window.showNotice(
          "info",
          "Submitting...",
          "Please wait while we process your request.",
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
          });

          console.log("[MULTISTEP-FORM] Response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("[MULTISTEP-FORM] Response error body:", errorText);
            throw new Error(`Submission failed: ${response.status}`);
          }

          const result = await response.json();
          console.log("[MULTISTEP-FORM] Response result:", result);

          if (result.success === false || result.error) {
            throw new Error(result.error || "Submission failed");
          }

          if (window.showNotice) {
            window.showNotice(
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
        if (window.showNotice) {
          window.showNotice(
            "error",
            "Submission Failed",
            error instanceof Error ? error.message : "An unexpected error occurred",
            8000
          );
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
        e.preventDefault();
        const currentStepEl = form.querySelector(`.step-content[data-step="${currentStep}"]`);
        const nextBtn = currentStepEl?.querySelector(
          ".next-step, .submit-registration, .submit-contact"
        ) as HTMLElement;
        if (nextBtn) nextBtn.click();
      }
    });

    // Initialize
    updateProgress();

    // Focus first input
    setTimeout(() => {
      const firstStep = form.querySelector('.step-content[data-step="1"]') as HTMLElement;
      if (firstStep) {
        const firstInput = firstStep.querySelector(
          "input:not([type=hidden]):not([readonly])"
        ) as HTMLElement;
        if (firstInput) firstInput.focus();
      }
    }, 150);
  }

  return {
    init,
    showStep,
    getCurrentStep: () => currentStep,
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

  console.log("[MULTISTEP-FORM] Initializing form with skip logic");

  // Helper function to check if a step should be skipped
  function shouldSkipStep(stepNumber: number): boolean {
    if (!formConfig?.steps) return false;

    const step = formConfig.steps.find((s: any) => s.stepNumber === stepNumber);
    if (!step?.skipCondition) return false;

    // Evaluate skip condition
    const condition = step.skipCondition;

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

  return handler;
}
