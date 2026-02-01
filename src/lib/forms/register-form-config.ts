import type { MultiStepFormConfig } from "../multi-step-form-config";

export const registerFormConfig: MultiStepFormConfig = {
  formId: "multi-step-register-form",
  formAction: "/api/auth/register",
  formMethod: "post",
  totalSteps: 8,
  progressBar: true,
  registerUser: true, // Require unique email and redirect to login if exists

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
      label: "create account",
    },
  },

  // Hidden fields
  hiddenFields: [{ name: "role", value: "Client" }],

  steps: [
    // Step 1: Email
    {
      stepNumber: 1,
      title: "",
      fields: [
        {
          id: "step-email",
          name: "email",
          type: "email",
          placeholder: "your.email@example.com",
          required: true,
          autocomplete: "email",
          errorMessage: "Please enter a valid email address",
          icon: "mail",
          iconPosition: "left",
        },
      ],
      buttons: [
        {
          type: "prev",
          label: "back to login",
          variant: "anchor",
          href: "/auth/login",
          icon: "",
          iconPosition: "left",
        },
        {
          type: "next",
          label: "next",
          dataNext: 2,
        },
      ],
      additionalContent: "google-oauth",
    },

    // Step 2: Name
    {
      stepNumber: 2,
      title: "Your name?",
      fieldLayout: "grid",
      fields: [
        {
          id: "step-first-name",
          name: "firstName",
          type: "text",
          placeholder: "John",
          required: true,
          autocomplete: "given-name",
          errorMessage: "Please enter your first name",
          columns: 2,
          icon: "user",
          iconPosition: "left",
        },
        {
          id: "step-last-name",
          name: "lastName",
          type: "text",
          placeholder: "Doe",
          required: true,
          autocomplete: "family-name",
          errorMessage: "Please enter your last name",
          columns: 2,
          icon: "user",
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
          type: "next",
          label: "next",
          dataNext: 3,
        },
      ],
    },

    // Step 3: Company
    {
      stepNumber: 3,
      title: "Your company?",
      fields: [
        {
          id: "step-company-name",
          name: "companyName",
          type: "text",
          placeholder: "Acme Corporation",
          required: true,
          autocomplete: "organization",
          errorMessage: "Please enter your company name",
          icon: "building",
          iconPosition: "left",
        },
      ],
      buttons: [
        {
          type: "prev",
          label: "back",
          dataPrev: 2,
        },
        {
          type: "next",
          label: "next",
          dataNext: 4,
        },
      ],
    },

    // Step 4: Password
    {
      stepNumber: 4,
      title: "Create a password",
      subtitle: "minimum 6 characters",
      fields: [
        {
          id: "step-password",
          name: "password",
          type: "password",
          placeholder: "Enter your password",
          required: true,
          minlength: 6,
          autocomplete: "new-password",
          errorMessage: "Password must be at least 6 characters",
          icon: "lock",
          iconPosition: "left",
        },
      ],
      buttons: [
        {
          type: "prev",
          label: "back",
          dataPrev: 3,
        },
        {
          type: "next",
          label: "next",
          dataNext: 5,
        },
      ],
    },

    // Step 5: Phone
    {
      stepNumber: 5,
      title: "Your phone?",
      fields: [
        {
          id: "step-phone",
          name: "phone",
          type: "tel",
          placeholder: "1-(555)-123-4567 (optional)",
          autocomplete: "tel",
          required: false,
          icon: "phone",
          iconPosition: "left",
        },
      ],
      buttons: [
        {
          type: "prev",
          label: "back",
          dataPrev: 4,
        },
        {
          type: "next",
          label: "Skip",
          dataNext: 6,
          classes: "next-step-phone",
        },
      ],
      customValidation: "validatePhone",
    },

    // Step 6: SMS Consent
    {
      stepNumber: 6,
      title: "Opt-in to SMS alerts?",
      subtitle: "Not for marketing. Communication and project updates only.",
      fields: [
        {
          id: "step-sms-alerts",
          name: "smsAlerts",
          type: "hidden",
          required: false,
        },
      ],
      buttons: [
        {
          type: "prev",
          label: "back",
          dataPrev: 5,
        },
        {
          type: "choice",
          label: "no",
          variant: "primary",
          dataNext: 8,
          dataValue: "false",
        },
        {
          type: "choice",
          label: "yes",
          variant: "secondary",
          dataNext: 7,
          dataValue: "true",
        },
      ],
    },

    // Step 7: Mobile Carrier
    {
      stepNumber: 7,
      title: "your mobile carrier?",
      subtitle: "This helps us deliver SMS messages to your phone.",
      fields: [
        {
          id: "step-carrier",
          name: "mobileCarrier",
          type: "component",
          component: "SlotMachineModalStaff",
          componentProps: {
            title: "Select your carrier",
            buttonVariant: "outline",
            placeholder: "Select your carrier...",
            icon: "wifi",
            buttonClass: "w-full",
          },
        },
      ],
      buttons: [
        {
          type: "prev",
          label: "back",
          dataPrev: 6,
        },
        {
          type: "next",
          label: "next",
          dataNext: 8,
        },
      ],
      customValidation: "validateCarrier",
    },

    // Step 8: Review & Submit
    {
      stepNumber: 8,
      title: "Almost there!",
      subtitle: "Review your information and create your account",
      isReview: true,
      reviewFields: [
        "email",
        "firstName",
        "lastName",
        "companyName",
        "password",
        "phone",
        "smsAlerts",
        "mobileCarrier",
      ],
      fields: [],
      buttons: [
        {
          type: "prev",
          label: "back",
          dataPrev: 7,
          classes: "prev-step-review",
        },
        {
          type: "submit",
          label: "create account",
          classes: "submit-registration",
        },
      ],
    },
  ],
};
