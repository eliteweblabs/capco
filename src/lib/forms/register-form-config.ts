import type { MultiStepFormConfig } from "../multi-step-form-config";
import { DEFAULT_EMAIL_PLACEHOLDERS, FULL_NAME_PLACEHOLDERS } from "../multi-step-form-config";

export const registerFormConfig: MultiStepFormConfig = {
  formId: "multi-step-register-form",
  formAction: "/api/auth/register",
  formMethod: "post",
  totalSteps: 8,
  progressBar: false,
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
      hideProgressBar: true,
      response: true,
      fields: [
        {
          id: "step-email",
          name: "email",
          type: "email",
          placeholder: DEFAULT_EMAIL_PLACEHOLDERS[0],
          animatedPlaceholders: DEFAULT_EMAIL_PLACEHOLDERS,
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
          label: "have an account?",
          icon: "",
          variant: "anchor",
          href: "/auth/login",
        },
        {
          type: "next",
          label: "next",
          dataNext: 2,
        },
      ],
      additionalContent: "google-oauth",
    },

    // Step 2: Name (single full-name input; handler parses to firstName/lastName for placeholders & API)
    {
      stepNumber: 2,
      title: "What's your name?",
      fieldLayout: "single",
      response: true,
      fields: [
        {
          id: "step-full-name",
          name: "fullName",
          type: "text",
          placeholder: FULL_NAME_PLACEHOLDERS[0],
          animatedPlaceholders: FULL_NAME_PLACEHOLDERS,
          required: true,
          autocomplete: "name",
          errorMessage: "Please enter your full name",
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
      title:
        "<span data-form-session-meta='firstName' data-default='friend'>friend</span>, what is the name of the company?",
      response: true,
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
          dataPrev: 2,
        },
        {
          type: "next",
          dataNext: 4,
        },
      ],
    },

    // Step 4: Password
    {
      stepNumber: 4,
      title: "Create a password",
      subtitle: "minimum 6 characters",
      response: true,
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
          dataPrev: 3,
        },
        {
          type: "next",
          dataNext: 5,
        },
      ],
    },

    // Step 5: Phone
    {
      stepNumber: 5,
      title: "Your phone?",
      response: true,
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
          dataPrev: 4,
        },
        {
          type: "next",
          label: "Skip",
          validLabel: "Next",
          dataNext: 6,
          classes: "next-step-phone",
        },
      ],
      customValidation: "validatePhone",
    },

    // Step 6: SMS Consent
    {
      stepNumber: 6,
      title:
        "<span data-form-session-meta='firstName' data-default='friend'>friend</span>, do you wish to opt in to SMS?<br><br>No marketing messages, communication and project updates only.",
      response: true,
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
      subtitle:
        "This helps us deliver SMS messages to <span data-form-session-meta='phone' data-default='your phone'></span>.",
      response: true,
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
      response: true,
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
          classes: "submit-registration",
        },
      ],
    },
  ],
};
