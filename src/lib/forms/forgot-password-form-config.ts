import type { MultiStepFormConfig } from "../multi-step-form-config";
import { DEFAULT_EMAIL_PLACEHOLDERS } from "../multi-step-form-config";

export const forgotPasswordFormConfig: MultiStepFormConfig = {
  formId: "multi-step-forgot-password-form",
  formAction: "/api/auth/reset-password",
  formMethod: "post",
  totalSteps: 1,
  progressBar: false,
  registerUser: false,

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
      icon: "mail",
      iconPosition: "right",
      label: "get link",
    },
  },

  steps: [
    {
      title: "",
      showIcon: false,
      response: false,
      fields: [
        {
          id: "forgot-email",
          name: "email",
          type: "email",
          placeholder: "Enter your email address",
          animatedPlaceholders: DEFAULT_EMAIL_PLACEHOLDERS,
          animatedPlaceholderAlignment: "left",
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
          label: "",
          variant: "anchor",
          size: "xs",
          href: "/auth/login",
          icon: "arrow-left",
          iconPosition: "left",
        },
        {
          type: "submit",
          label: "get link",
        },
      ],
    },
  ],
};
