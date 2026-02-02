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

  // Inject form session data into spans with data-form-session-meta attribute
  function injectSessionMetaData(stepElement: HTMLElement) {
    // Find all spans with data-form-session-meta in title and subtitle
    const metaSpans = stepElement.querySelectorAll('[data-form-session-meta]') as NodeListOf<HTMLElement>;
    
    if (metaSpans.length === 0) return;

    console.log(`[SESSION-META] Found ${metaSpans.length} meta spans to populate`);

    metaSpans.forEach((span) => {
      const fieldName = span.getAttribute('data-form-session-meta');
      if (!fieldName) return;

      // Get the input value from the form
      const input = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
      if (input && input.value) {
        const value = input.value.trim();
        if (value) {
          console.log(`[SESSION-META] Injecting ${fieldName}: ${value}`);
          span.textContent = value;
          span.classList.add('text-primary-600', 'dark:text-primary-400', 'font-semibold');
        } else {
          // Reset to default if no value
          span.textContent = span.getAttribute('data-default') || 'friend';
        }
      } else {
        // Reset to default if input not found or empty
        span.textContent = span.getAttribute('data-default') || 'friend';
      }
    });
  }

  // Show specific step with animation
  async function showStep(stepNumber: number, direction: "forward" | "backward" = "forward") {
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
      
      // Clear stored original data-next when leaving a step
      const nextButton = step.querySelector("button.next-step, button.submit-step") as HTMLButtonElement;
      if (nextButton && nextButton.hasAttribute("data-original-next")) {
        nextButton.removeAttribute("data-original-next");
        console.log(`[MULTISTEP-FORM] Cleared stored data-original-next when leaving step`);
      }
    });

    const targetStep = document.querySelector(
      `#${formId} .step-content[data-step="${stepNumber}"]`
    ) as HTMLElement;

    if (targetStep) {
      targetStep.classList.add("active");
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
    if (phoneInput && phoneInput.required) {
      // Only validate phone if it's marked as required
      const phoneValue = phoneInput.value?.trim() || "";
      
      if (!phoneValue) {
        // Empty phone on required field
        if (window.showNotice) {
          window.showNotice(
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
          if (window.showNotice) {
            window.showNotice(
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
    } else if (phoneInput && !phoneInput.required) {
      // Optional phone field - only validate if user entered something
      const phoneValue = phoneInput.value?.trim() || "";
      
      if (phoneValue) {
        const digitsOnly = phoneValue.replace(/\D/g, "");
        
        // If user started entering a phone but it's incomplete, show gentle error
        if (digitsOnly.length > 0 && digitsOnly.length < 10) {
          if (window.showNotice) {
            window.showNotice(
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

        // Update button text for buttons with validLabel (dynamic skip/next based on validation)
        const currentStepEl = form.querySelector(`#${formId} .step-content.active`);
        if (currentStepEl) {
          const digitsOnly = formatted.replace(/\D/g, "");
          const isValid = digitsOnly.length >= 10 && validatePhone(formatted);
          
          // Find buttons in current step that might have dynamic labels
          const nextButtons = currentStepEl.querySelectorAll('button.next-step');
          nextButtons.forEach((btn) => {
            const buttonText = btn.querySelector('.button-text');
            if (buttonText) {
              // Check if button has data attributes for label switching
              const defaultLabel = btn.getAttribute('data-default-label');
              const validLabel = btn.getAttribute('data-valid-label');
              
              if (defaultLabel && validLabel) {
                if (!formatted || formatted.trim() === "") {
                  buttonText.textContent = defaultLabel;
                } else if (isValid) {
                  buttonText.textContent = validLabel;
                } else {
                  buttonText.textContent = defaultLabel;
                }
              }
            }
          });
        }
      });
    });

    // Address input change listener - update button text with validLabel
    window.addEventListener('inline-address-select', (e: any) => {
      console.log('[ADDRESS-SELECT] Address selected:', e.detail);
      
      // Find the address input
      const addressInput = form.querySelector('input[name="address"]') as HTMLInputElement;
      if (!addressInput) return;
      
      // Find current active step
      const activeStep = form.querySelector('.step-content.active');
      if (!activeStep) return;
      
      // Find buttons with validLabel in the active step
      const buttons = activeStep.querySelectorAll('button');
      buttons.forEach((btn) => {
        const validLabel = btn.getAttribute('data-valid-label');
        const defaultLabel = btn.getAttribute('data-default-label');
        const buttonText = btn.querySelector('.button-text');
        
        if (buttonText && validLabel && defaultLabel) {
          // Address was selected, show validLabel
          if (e.detail.value) {
            buttonText.textContent = validLabel;
          } else {
            buttonText.textContent = defaultLabel;
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
        const activeStep = form.querySelector('.step-content.active');
        if (!activeStep) return;
        
        // Find buttons with validLabel in the active step
        const buttons = activeStep.querySelectorAll('button');
        buttons.forEach((btn) => {
          const validLabel = btn.getAttribute('data-valid-label');
          const defaultLabel = btn.getAttribute('data-default-label');
          const buttonText = btn.querySelector('.button-text');
          
          if (buttonText && validLabel && defaultLabel) {
            if (!input.value || input.value.trim() === "") {
              buttonText.textContent = defaultLabel;
            } else {
              buttonText.textContent = validLabel;
            }
          }
        });
      });

      // Observe attribute changes (for value attribute)
      observer.observe(input, {
        attributes: true,
        attributeFilter: ["value"],
      });

      // Also listen for input events
      input.addEventListener("input", () => {
        const activeStep = form.querySelector('.step-content.active');
        if (!activeStep) return;
        
        const buttons = activeStep.querySelectorAll('button');
        buttons.forEach((btn) => {
          const validLabel = btn.getAttribute('data-valid-label');
          const defaultLabel = btn.getAttribute('data-default-label');
          const buttonText = btn.querySelector('.button-text');
          
          if (buttonText && validLabel && defaultLabel) {
            if (!input.value || input.value.trim() === "") {
              buttonText.textContent = defaultLabel;
            } else {
              buttonText.textContent = validLabel;
            }
          }
        });
      });
    });

    // === Generic Hidden Input Handler for Button Label Updates ===
    // Handle all hidden inputs that might affect button labels (e.g., fuelSource, hvacSystem)
    const allHiddenInputs = form.querySelectorAll('input[type="hidden"][name]');
    allHiddenInputs.forEach((hiddenInput) => {
      const input = hiddenInput as HTMLInputElement;
      
      // Function to update button labels based on hidden input value
      const updateButtonLabels = () => {
        // Find current active step
        const activeStep = form.querySelector('.step-content.active');
        if (!activeStep) return;
        
        // Find buttons with validLabel in the active step
        const buttons = activeStep.querySelectorAll('button[data-valid-label][data-default-label]');
        buttons.forEach((btn) => {
          const validLabel = btn.getAttribute('data-valid-label');
          const defaultLabel = btn.getAttribute('data-default-label');
          const buttonText = btn.querySelector('.button-text');
          
          if (buttonText && validLabel && defaultLabel) {
            // Check if this hidden input has a value
            if (!input.value || input.value.trim() === "") {
              buttonText.textContent = defaultLabel;
            } else {
              buttonText.textContent = validLabel;
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

    // Update conditional fields whenever form values change
    form.addEventListener("input", updateConditionalFields);
    form.addEventListener("change", updateConditionalFields);

    // Handle button clicks
    form.addEventListener("click", async (e) => {
      const target = e.target as HTMLElement;
      const nextBtn = target.closest("button.next-step, a.next-step, button.submit-step");
      const prevBtn = target.closest("button.prev-step, a.prev-step");
      const smsChoiceBtn = target.closest("button.sms-choice, a.sms-choice");
      
      // Generic choice button (any button with data-value inside a button-group)
      const choiceBtn = target.closest("button[data-value], a[data-value]");
      
      const editBtn = target.closest("button.edit-step");
      const skipBtn = target.closest("button.skip-step");

      // Generic choice button handler (for button-groups)
      if (choiceBtn && !smsChoiceBtn) {
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
        const isAlreadySelected = choiceBtn.classList.contains("!ring-2") && 
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
        targetInput.dispatchEvent(new Event('change', { bubbles: true }));

        // Update conditional fields
        updateConditionalFields();

        // Check if button has data-next - update the Next button instead of auto-advancing
        const choiceDataNext = choiceBtn.getAttribute("data-next");
        const nextButton = stepContent.querySelector("button.next-step, button.submit-step") as HTMLButtonElement;
        
        if (choiceDataNext && nextButton) {
          if (isAlreadySelected) {
            // Deselected: restore original data-next (or default to currentStep + 1)
            const originalDataNext = nextButton.getAttribute("data-original-next");
            if (originalDataNext) {
              nextButton.setAttribute("data-next", originalDataNext);
              console.log(`[MULTISTEP-FORM] Restored Next button data-next to: ${originalDataNext}`);
            } else {
              // Fallback: use currentStep + 1
              const currentStepNum = parseInt(stepContent.getAttribute("data-step") || "1");
              nextButton.setAttribute("data-next", (currentStepNum + 1).toString());
              console.log(`[MULTISTEP-FORM] Restored Next button data-next to default: ${currentStepNum + 1}`);
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
          if (await validateStep(currentStep)) {
            await showStep(nextStep);
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

        // NOTE: Back button skip logic is now handled by skipCondition in form config
        // The initializeMultiStepForm function will automatically skip over
        // steps with skipConditions when navigating backward

        await showStep(prevStep, "backward");
      }

      // Edit button (for review step)
      if (editBtn) {
        e.preventDefault();
        const editStep = parseInt(editBtn.getAttribute("data-edit") || "1");
        await showStep(editStep);
      }

      // Skip button
      if (skipBtn) {
        e.preventDefault();
        const nextStep = parseInt(skipBtn.getAttribute("data-next") || "1");
        await showStep(nextStep);
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
        const target = e.target as HTMLElement;
        const currentStepEl = form.querySelector(`.step-content[data-step="${currentStep}"]`);
        
        // Check if target is an input field
        if (target.tagName === "INPUT") {
          // Get all visible inputs in the current step (not hidden)
          const inputs = Array.from(
            currentStepEl?.querySelectorAll('input:not([type="hidden"]), textarea') || []
          ).filter(input => {
            const el = input as HTMLElement;
            return el.offsetParent !== null; // Check if visible
          }) as HTMLInputElement[];
          
          const currentIndex = inputs.indexOf(target as HTMLInputElement);
          
          // If there's a next input, focus it
          if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
            const nextInput = inputs[currentIndex + 1];
            nextInput.focus();
            console.log('[ENTER-KEY] Moving to next input');
            return;
          }
        }
        
        // If we're on the last input or not on an input, click next button
        const nextBtn = currentStepEl?.querySelector(
          ".next-step, .submit-registration, .submit-contact"
        ) as HTMLElement;
        if (nextBtn) {
          console.log('[ENTER-KEY] Clicking next button');
          nextBtn.click();
        }
      }
    });

    // Initialize
    // Show first step and update progress
    showStep(currentStep);

    // Initialize phone button data-next based on current phone value
    // Reuse the phoneInputs already queried above
    phoneInputs.forEach((phoneInput) => {
      const input = phoneInput as HTMLInputElement;
      const phoneValue = input.value?.trim() || "";
      const phoneButton = form.querySelector(`.next-step-phone`);

      if (phoneButton && phoneValue) {
        const digitsOnly = phoneValue.replace(/\D/g, "");
        const isValid = digitsOnly.length >= 10 && validatePhone(phoneValue);

        if (isValid) {
          phoneButton.setAttribute("data-next", "4");
          console.log("[PHONE-INIT] Pre-filled valid phone - data-next set to 4");
        } else {
          phoneButton.setAttribute("data-next", "6");
          console.log("[PHONE-INIT] Pre-filled invalid phone - data-next set to 6");
        }
      }
    });

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

  return handler;
}
