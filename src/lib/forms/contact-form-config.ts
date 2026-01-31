import type { MultiStepFormConfig } from "../multi-step-form-config";

export const contactFormConfig: MultiStepFormConfig = {
  formId: "multi-step-contact-form",
  formAction: "/api/contact/submit",
  formMethod: "post",
  totalSteps: 8,
  progressBar: true,

  // Default button styles
  buttonDefaults: {
    next: {
      type: "next",
      variant: "secondary",
      size: "lg",
      icon: "arrow-right",
      iconPosition: "right",
      label: "next",
    },
    prev: {
      type: "prev",
      variant: "anchor",
      size: "lg",
      icon: "arrow-left",
      iconPosition: "left",
      label: "back",
    },
    submit: {
      type: "submit",
      variant: "primary",
      size: "lg",
      icon: "send",
      iconPosition: "right",
      label: "send message",
    },
  },

  steps: [
    // Step 1: Name
    {
      stepNumber: 1,
      title: "what's your name?",
      fieldLayout: "grid",
      fields: [
        {
          id: "contact-first-name",
          name: "firstName",
          type: "text",
          placeholder: "John",
          required: true,
          autocomplete: "given-name",
          errorMessage: "Please enter your first name",
          autofocus: true,
          columns: 2,
        },
        {
          id: "contact-last-name",
          name: "lastName",
          type: "text",
          placeholder: "Doe",
          required: true,
          autocomplete: "family-name",
          errorMessage: "Please enter your last name",
          columns: 2,
        },
      ],
      buttons: [
        {
          type: "next",
          label: "next",
          dataNext: 2,
        },
      ],
    },

    // Step 2: Email
    {
      stepNumber: 2,
      title: "your email?",
      fields: [
        {
          id: "contact-email",
          name: "email",
          type: "email",
          placeholder: "your.email@example.com",
          required: true,
          autocomplete: "email",
          errorMessage: "Please enter a valid email address",
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

    // Step 3: Phone
    {
      stepNumber: 3,
      title: "your phone?",
      fields: [
        {
          id: "contact-phone",
          name: "phone",
          type: "tel",
          placeholder: "(555) 123-4567",
          autocomplete: "tel",
          required: false,
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
          label: "skip",
          dataNext: 4,
          classes: "next-step-phone",
        },
      ],
      customValidation: "validatePhone",
    },

    // Step 4: SMS Consent
    {
      stepNumber: 4,
      title: "contact via SMS?",
      subtitle: "Not for marketing. Communication and project updates only.",
      fields: [
        {
          id: "contact-sms-alerts",
          name: "smsAlerts",
          type: "hidden",
          required: false,
        },
      ],
      buttons: [
        {
          type: "prev",
          label: "back",
          dataPrev: 3,
        },
        {
          type: "choice",
          label: "no",
          variant: "primary",
          dataNext: 6,
          dataValue: "false",
        },
        {
          type: "choice",
          label: "yes",
          variant: "secondary",
          dataNext: 5,
          dataValue: "true",
        },
      ],
    },

    // Step 5: Mobile Carrier
    {
      stepNumber: 5,
      title: "your mobile carrier?",
      subtitle: "This helps us deliver SMS messages to your phone.",
      fields: [
        {
          id: "contact-carrier",
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
          dataPrev: 4,
        },
        {
          type: "next",
          label: "next",
          dataNext: 6,
        },
      ],
      customValidation: "validateCarrier",
    },

    // Step 6: Company
    {
      stepNumber: 6,
      title: "your company?",
      fields: [
        {
          id: "contact-company",
          name: "company",
          type: "text",
          placeholder: "Acme Corporation",
          required: true,
          autocomplete: "organization",
          errorMessage: "Please enter your company name",
        },
      ],
      buttons: [
        {
          type: "prev",
          label: "back",
          dataPrev: 5,
          classes: "prev-step-company",
        },
        {
          type: "next",
          label: "next",
          dataNext: 7,
        },
      ],
    },

    // Step 7: Address
    {
      stepNumber: 7,
      title: "project address?",
      fields: [
        {
          id: "contact-address",
          name: "address",
          type: "component",
          component: "InlineAddressSearch",
          componentProps: {
            placeholder: "Start typing your address...",
            fetchApiEndpoint: "/api/google/places-autocomplete",
            apiParams: {
              types: "address",
              components: "country:us",
              locationBias: "circle:100@42.3601,-71.0589",
            },
            valueField: "description",
            labelField: "description",
            noResultsText: "Type to search addresses...",
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
          type: "skip",
          label: "next / skip",
          dataNext: 8,
        },
      ],
    },

    // Step 8: Message
    {
      stepNumber: 8,
      title: "your message?",
      fields: [
        {
          id: "contact-message",
          name: "message",
          type: "textarea",
          placeholder: "Tell us how we can help you...",
          required: true,
          rows: 6,
          errorMessage: "Please enter your message",
        },
      ],
      buttons: [
        {
          type: "prev",
          label: "back",
          dataPrev: 7,
        },
        {
          type: "submit",
          label: "send message",
          classes: "submit-contact",
        },
      ],
    },
  ],
};
