import type { MultiStepFormConfig } from "../multi-step-form-config";
import { DEFAULT_EMAIL_PLACEHOLDERS, FULL_NAME_PLACEHOLDERS } from "../multi-step-form-config";

// Funny fake company name placeholders (fire protection, architecture, real estate puns)
const COMPANY_NAME_PLACEHOLDERS = [
  "Sprinkler Twinkle Fire Safety",
  "Alarm and Dangerous Systems",
  "For Lease Navidad Properties",
  "Smoke Gets In Your Detectors",
  "Arch Nemesis Architecture",
  "Fire When Ready Protection",
  "Location³ Real Estate",
  "Extinguisher Wishes Inc.",
  "Column A or Column B Design",
  "House of Cards Construction",
  "Wright or Wrong Architects",
  "Hot Property Fire Prevention",
];

import { globalCompanyData } from "../../pages/api/global/global-company-data";
const { globalCompanyName, virtualAssistantName } = await globalCompanyData();
const assistantName = virtualAssistantName || "Leah";

export const contactFormConfig: MultiStepFormConfig = {
  formId: "multi-step-contact-form",
  formAction: "/api/contact/submit",
  formMethod: "post",
  totalSteps: 8,
  progressBar: false,

  // Default button styles
  buttonDefaults: {
    next: {
      type: "next",
      variant: "secondary",
      icon: "arrow-right",
      iconPosition: "right",
      label: "next",
    },
    prev: {
      type: "prev",
      variant: "anchor",
      icon: "arrow-left",
      iconPosition: "left",
      label: "back",
    },
    submit: {
      type: "submit",
      variant: "secondary",
      icon: "send",
      iconPosition: "right",
      label: "send message",
    },
  },

  steps: [
    // Step 1: Name (single full-name input; handler parses to firstName/lastName for placeholders & API)
    {
      stepNumber: 1,
      title: `<span data-typewriter-pause="1360"></span>Hi, I'm ${assistantName},<br><br>${globalCompanyName}'s project assistant. <br><br>Let's start with your name!`,
      fieldLayout: "single",
      fields: [
        {
          id: "contact-full-name",
          name: "fullName",
          type: "text",
          placeholder: FULL_NAME_PLACEHOLDERS[0],
          animatedPlaceholders: FULL_NAME_PLACEHOLDERS,
          required: true,
          autocomplete: "name",
          errorMessage: "Please enter your full name",
          autofocus: true,
          icon: "user",
          iconPosition: "left",
        },
      ],
      buttons: [
        {
          type: "next",
          dataNext: 2,
        },
      ],
    },

    // Step 2: Email
    {
      stepNumber: 2,
      title:
        "What's your email <span data-form-session-meta='firstName' data-default='friend'>friend</span>?",
      fields: [
        {
          id: "contact-email",
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
          label: "back",
          dataPrev: 1,
        },
        {
          type: "next",
          dataNext: 3,
        },
      ],
    },

    // Step 3: Phone
    {
      stepNumber: 3,
      title:
        "What's a good phone number to reach you <span data-form-session-meta='firstName' data-default='friend'>friend</span>?",
      fields: [
        {
          type: "tel",
          id: "step-phone",
          name: "phone",
          placeholder: "1-(555)-123-4567",
          required: false,
          autocomplete: "tel",
          icon: "phone",
          iconPosition: "left",
          classes: "text-center",
        },
      ],
      buttons: [
        {
          type: "prev",
          dataPrev: 2,
        },
        {
          type: "next",
          label: "skip",
          validLabel: "next",
          dataNext: 6,
        },
      ],
      customValidation: "validatePhone",
    },

    // Step 4: SMS Consent
    {
      stepNumber: 4,
      title:
        "<span data-form-session-meta='firstName' data-default='friend'>friend</span>, do you wish to opt in to SMS?<br><br>No marketing messages, communication and project updates only.",
      skipCondition: "noValidPhone", // Skip if phone is invalid or empty
      fields: [
        {
          id: "contact-sms-alerts",
          name: "smsAlerts",
          type: "component",
          component: "SlideToggle",
          componentProps: {
            id: "contact-sms-toggle",
            name: "smsAlerts",
            label: "Enable SMS",
            color: "primary",
            size: "xl",
            checked: false,
          },
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
          classes: "sms-next-btn",
        },
      ],
    },

    // Step 5: Mobile Carrier
    {
      stepNumber: 5,
      title: "your mobile carrier?",
      subtitle:
        "This helps us deliver SMS messages to <span data-form-session-meta='phone' data-default='your phone'></span>.",
      skipCondition: "noValidPhone", // Skip if phone is invalid or empty
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
      title:
        "<span data-form-session-meta='firstName' data-default='friend'>friend</span>, what is the name of the company this project is for?",
      fields: [
        {
          id: "contact-company",
          name: "company",
          type: "text",
          placeholder: COMPANY_NAME_PLACEHOLDERS[0],
          animatedPlaceholders: COMPANY_NAME_PLACEHOLDERS,
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
    // {
    //   stepNumber: 7,
    //   title: "project address?",
    //   fields: [
    //     {
    //       id: "contact-address",
    //       name: "address",
    //       type: "component",
    //       component: "InlineAddressSearch",
    //       componentProps: {
    //         placeholder: "Start typing your address...",
    //         fetchApiEndpoint: "/api/google/places-autocomplete",
    //         apiParams: {
    //           types: "address",
    //           components: "country:us",
    //           locationBias: "circle:100@42.3601,-71.0589",
    //         },
    //         valueField: "description",
    //         labelField: "description",
    //         noResultsText: "Type to search addresses...",
    //         currentLocation: true, // Enable geolocation button
    //       },
    //     },
    //   ],
    //   buttons: [
    //     {
    //       type: "prev",
    //       label: "back",
    //       dataPrev: 6,
    //     },
    //     {
    //       type: "skip",
    //       label: "skip",
    //       validLabel: "next",
    //       dataNext: 8,
    //       classes: "next-step-address",
    //       variant: "secondary",
    //       size: "lg",
    //     },
    //   ],
    // },

    // Step 8: Message
    {
      stepNumber: 7,
      title:
        "What can you tell me about <span data-form-session-meta='company' data-default='your company'>your company</span>'s project or concerns?",
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
          dataPrev: 6,
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
