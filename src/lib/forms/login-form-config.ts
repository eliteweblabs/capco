import type { MultiStepFormConfig } from "../multi-step-form-config";
import { DEFAULT_EMAIL_PLACEHOLDERS } from "../multi-step-form-config";

export const loginFormConfig: MultiStepFormConfig = {
  formId: "multi-step-login-form",
  formAction: "/api/auth/signin",
  formMethod: "post",
  totalSteps: 2,
  progressBar: false, // Simple 2-step, no need for progress bar

  // Default button styles
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

  steps: [
    // Step 1: Email
    {
      stepNumber: 1,
      title: "",
      showIcon: false,
      expandDown: false,
      fields: [
        {
          id: "login-email",
          name: "email",
          type: "email",
          placeholder: DEFAULT_EMAIL_PLACEHOLDERS[0],
          animatedPlaceholders: DEFAULT_EMAIL_PLACEHOLDERS,
          required: true,
          autocomplete: "email",
          errorMessage: "Please enter a valid email address",
          autofocus: true,
          icon: "mail",
          iconPosition: "left",
        },
      ],
      buttons: [
        {
          type: "prev",
          label: "create account?",
          variant: "anchor",
          size: "xs",
          href: "/auth/register",
          icon: "user-plus",
          iconPosition: "left",
        },
        {
          type: "prev",
          id: "forgot-password-btn",
          label: "forgot?",
          variant: "anchor",
          size: "xs",
          href: "/auth/forgot-password",
          icon: "",
          iconPosition: "left",
          tooltipText: "Forgot your password?",
          tooltipPosition: "top",
        },
        {
          type: "next",
          label: "next",
          dataNext: 2,
        },
      ],
      additionalContent: "auth-providers",
    },

    // Step 2: Password
    {
      stepNumber: 2,
      title: "Enter your password",
      showIcon: false,
      fields: [
        {
          id: "login-password",
          name: "password",
          type: "password",
          placeholder: "Enter your password",
          required: true,
          minlength: 6,
          autocomplete: "current-password",
          errorMessage: "Password must be at least 6 characters",
          icon: "lock",
          iconPosition: "left",
        },
      ],
      buttons: [
        {
          type: "prev",
          label: "back",
          dataPrev: 1,
        },
        {
          type: "submit",
          label: "sign in",
        },
      ],
    },
  ],
};
