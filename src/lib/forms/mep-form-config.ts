import type { MultiStepFormConfig } from "../multi-step-form-config";
import { DEFAULT_EMAIL_PLACEHOLDERS } from "../multi-step-form-config";
import { globalCompanyData } from "../../pages/api/global/global-company-data";

// First name placeholders in different languages
const FIRST_NAME_PLACEHOLDERS = [
  "John", // English
  "Juan", // Spanish
  "Jean", // French
  "João", // Portuguese
  "Giovanni", // Italian
  "Hans", // German
  "Иван", // Russian (Ivan)
  "太郎", // Japanese (Taro)
  "伟", // Chinese (Wei)
];

// Last name placeholders in different languages
const LAST_NAME_PLACEHOLDERS = [
  "Doe", // English
  "García", // Spanish
  "Dupont", // French
  "Silva", // Portuguese
  "Rossi", // Italian
  "Müller", // German
  "Иванов", // Russian (Ivanov)
  "山田", // Japanese (Yamada)
  "李", // Chinese (Li)
];

const { globalCompanyName } = await globalCompanyData();
/**
 * MEP Form Configuration
 * Multi-step form for MEP (Mechanical, Electrical, Plumbing) projects
 */
export const mepFormConfig: MultiStepFormConfig = {
  formId: "multi-step-mep-form",
  formAction: "/api/mep/submit",
  formMethod: "post",
  totalSteps: 6,
  progressBar: true,
  registerUser: true, // Allow existing users to proceed (backend will handle user lookup)
  // Global button defaults - change here to update ALL buttons of that type

  steps: [
    // Step 1: Name (skip if authenticated)
    {
      stepNumber: 1,
      title: `<span data-typewriter-pause="1360"></span>Hi, I'm Leah...<br><br>${globalCompanyName}'s project assistant. <br><br>Let's get you started with the mechanical, engineering & plumbing intake process.<br><br>Ready to get started?`,
      // subtitle:
      //   "It takes about 2 minutes to complete. We typically respond within 1 business day EDT. ready to get started?",
      skipCondition: "isAuthenticated", // Skip for logged-in users
      fieldLayout: "grid", // Enable grid layout for side-by-side fields
      fields: [],
      hideProgressBar: true,
      buttons: [
        {
          type: "prev",
          label: "Back",
          href: "/",
        },
        {
          type: "next",
          label: "begin",
          dataNext: 2,
        },
      ],
    },

    {
      stepNumber: 2,
      title: `What's your name?`,
      subtitle: "",
      skipCondition: "isAuthenticated", // Skip for logged-in users
      fieldLayout: "grid", // Enable grid layout for side-by-side fields
      fields: [
        {
          type: "text",
          id: "step-first-name",
          name: "firstName",
          placeholder: FIRST_NAME_PLACEHOLDERS[0],
          animatedPlaceholders: FIRST_NAME_PLACEHOLDERS,
          required: true,
          autocomplete: "given-name",
          errorMessage: "Please enter your first name",
          icon: "user",
          iconPosition: "left",
          classes: "text-center",
        },
        {
          type: "text",
          id: "step-last-name",
          name: "lastName",
          placeholder: LAST_NAME_PLACEHOLDERS[0],
          animatedPlaceholders: LAST_NAME_PLACEHOLDERS,
          required: true,
          autocomplete: "family-name",
          errorMessage: "Please enter your last name",
          icon: "user",
          iconPosition: "left",
          classes: "text-center",
        },
      ],
      buttons: [
        {
          type: "prev",
          dataPrev: 1,
        },
        {
          type: "next",
          dataNext: 3,
        },
      ],
    },

    // Step 2: Email (skip if authenticated)
    {
      stepNumber: 3,
      title:
        "What's your email <span data-form-session-meta='firstName' data-default='friend'>friend</span>?",
      subtitle: "",
      skipCondition: "isAuthenticated", // Skip for logged-in users
      fields: [
        {
          type: "email",
          id: "step-email",
          name: "email",
          placeholder: DEFAULT_EMAIL_PLACEHOLDERS[0],
          animatedPlaceholders: DEFAULT_EMAIL_PLACEHOLDERS,
          required: true,
          autocomplete: "email",
          errorMessage: "Please enter a valid email address",
          icon: "mail",
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
          dataNext: 4,
        },
      ],
    },

    // Step 3: Phone (skip if authenticated)
    {
      stepNumber: 4,
      title:
        "What's a good phone number to reach you <span data-form-session-meta='firstName' data-default='friend'>friend</span>?",
      subtitle: "",
      skipCondition: "isAuthenticated", // Skip for logged-in users
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
          dataPrev: 3,
        },
        {
          type: "next",
          label: "skip",
          validLabel: "next",
          dataNext: 5,
        },
      ],
    },

    // Step 4: Address
    {
      stepNumber: 5,
      title: "Where is this MEP project located?",
      subtitle: "",
      fields: [
        {
          type: "component",
          id: "step-address",
          name: "address",
          component: "InlineAddressSearch",
          required: false,
          componentProps: {
            placeholder: "Start typing an address...",
            required: false,
            currentLocation: true,
          },
        },
      ],
      buttons: [
        {
          type: "prev",
          dataPrev: 4,
        },
        {
          type: "next",
          label: "skip",
          validLabel: "next",
          dataNext: 6,
        },
      ],
    },

    // Step 5: Fuel Source (Radio buttons via choice buttons)
    {
      stepNumber: 6,
      title:
        "What is the fuel source for <span data-form-session-meta='address' data-default='this project'>this project</span>?",
      // subtitle: "What type of fuel does the HVAC system use?",
      fields: [
        {
          type: "hidden",
          id: "step-fuel-source",
          name: "fuelSource",
          required: true,
        },
      ],
      buttons: [
        {
          type: "prev",
          dataPrev: 4,
        },
        {
          type: "choice",
          label: "Gas",
          variant: "outline",
          size: "md",
          dataValue: "gas",
          classes: "fuel-choice",
        },
        {
          type: "choice",
          label: "Electric",
          variant: "outline",
          size: "md",
          dataValue: "electric",
          classes: "fuel-choice",
        },
        {
          type: "next",
          label: "next",
          variant: "secondary",
          size: "md",
          dataNext: 7,
          icon: "arrow-right",
          iconPosition: "right",
          classes: "disabled:opacity-50 disabled:cursor-not-allowed",
          disabled: true, // Initially disabled until choice is made
        },
      ],
    },

    // Step 6: HVAC System Type (conditional based on fuel source)
    {
      stepNumber: 7,
      title: "HVAC System Type?",
      subtitle: "Select your system:",
      fieldLayout: "single",
      fields: [
        {
          type: "hidden",
          id: "step-hvac-system",
          name: "hvacSystem",
          required: true,
        },
      ],
      buttons: [
        {
          type: "prev",
          label: '<span class="hidden md:block">back</span>',
          variant: "ghost",
          dataPrev: 5,
          icon: "arrow-left",
          iconPosition: "left",
          classes: "!mb-4",
        },
        // Gas options
        {
          type: "choice",
          label: "Natural gas fired air handler and furnace",
          variant: "outline",
          size: "md",
          dataValue: "natural-gas-fired",
          classes: "hvac-choice hvac-gas w-full !justify-start !text-left mb-2",
        },
        {
          type: "choice",
          label: "Propane gas fired air handler and furnace",
          variant: "outline",
          size: "md",
          dataValue: "propane-gas-fired",
          classes: "hvac-choice hvac-gas w-full !justify-start !text-left mb-2",
        },
        {
          type: "choice",
          label: "Conventional ducted system",
          variant: "outline",
          size: "md",
          dataValue: "conventional-ducted",
          classes: "hvac-choice hvac-gas w-full !justify-start !text-left mb-2",
        },
        {
          type: "choice",
          label: "High velocity deducted system",
          variant: "outline",
          size: "md",
          dataValue: "high-velocity-deducted",
          classes: "hvac-choice hvac-gas w-full !justify-start !text-left mb-2",
        },
        {
          type: "choice",
          label: "Gas fired boiler with hot water baseboard",
          variant: "outline",
          size: "md",
          dataValue: "gas-fired-boiler-baseboard",
          classes: "hvac-choice hvac-gas w-full !justify-start !text-left mb-2",
        },
        {
          type: "choice",
          label: "Gas fired boiler with hydronic radiant floor",
          variant: "outline",
          size: "md",
          dataValue: "gas-fired-boiler-radiant",
          classes: "hvac-choice hvac-gas w-full !justify-start !text-left mb-2",
        },
        // Electric options
        {
          type: "choice",
          label: "Ceiling cassette mini split",
          variant: "outline",
          size: "md",
          dataValue: "ceiling-cassette",
          classes: "hvac-choice hvac-electric w-full !justify-start !text-left mb-2",
        },
        {
          type: "choice",
          label: "Wall mounted mini split",
          variant: "outline",
          size: "md",
          dataValue: "wall-mounted",
          classes: "hvac-choice hvac-electric w-full !justify-start !text-left mb-2",
        },
        {
          type: "choice",
          label: "Electric mini split air handler and conventional ductwork",
          variant: "outline",
          size: "md",
          dataValue: "electric-mini-split-ducted",
          classes: "hvac-choice hvac-electric w-full !justify-start !text-left mb-2",
        },
        {
          type: "choice",
          label: "Cove Heating",
          variant: "outline",
          size: "md",
          dataValue: "cove-heating",
          classes: "hvac-choice hvac-electric w-full !justify-start !text-left mb-2",
        },
        {
          type: "choice",
          label: "Other",
          variant: "outline",
          size: "md",
          dataValue: "other",
          classes: "hvac-choice hvac-electric hvac-gas w-full !justify-start !text-left mb-2",
        },
        {
          type: "submit",
          label: "submit",
          variant: "primary",
          size: "md",
          icon: "check",
          iconPosition: "right",
          classes: "disabled:opacity-50 disabled:cursor-not-allowed mt-4",
          disabled: true, // Initially disabled until choice is made
        },
      ],
    },
  ],
};
