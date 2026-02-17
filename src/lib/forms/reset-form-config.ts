import type { MultiStepFormConfig } from "../multi-step-form-config";

export const resetFormConfig: MultiStepFormConfig = {
  formId: "multi-step-reset-form",
  formAction: "/api/auth/update-password",
  formMethod: "post",
  totalSteps: 2,
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
      icon: "check",
      iconPosition: "right",
      label: "set new password",
    },
  },

  steps: [
    // Step 1: New password
    {
      stepNumber: 1,
      title: "",
      showIcon: false,
      response: false,
      fields: [
        {
          id: "reset-password",
          name: "password",
          type: "password",
          placeholder: "Enter new password",
          required: true,
          minlength: 6,
          autocomplete: "new-password",
          errorMessage: "Password must be at least 6 characters",
          icon: "lock",
          iconPosition: "left",
          autofocus: true,
        },
      ],
      buttons: [
        {
          type: "prev",
          label: "back to login",
          variant: "anchor",
          size: "xs",
          href: "/auth/login",
          icon: "arrow-left",
          iconPosition: "left",
        },
        {
          type: "next",
          validLabel: "next",
          validIcon: "enter",
          dataNext: 2,
        },
      ],
    },

    // Step 2: Confirm password
    {
      stepNumber: 2,
      title: "",
      showIcon: false,
      fields: [
        {
          id: "reset-password-confirm",
          name: "passwordConfirm",
          type: "password",
          placeholder: "Confirm new password",
          required: true,
          minlength: 6,
          autocomplete: "new-password",
          errorMessage: "Passwords must match",
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
          label: "set new password",
        },
      ],
    },
  ],
};
