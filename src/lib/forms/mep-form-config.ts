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
  progressBar: false,
  registerUser: true, // Allow existing users to proceed (backend will handle user lookup)
  // Global button defaults - change here to update ALL buttons of that type

  steps: [
    // Step 1: Name (skip if authenticated)
    {
      stepNumber: 1,
      title: `<span data-typewriter-pause="1360"></span>Hi, I'm Leah...<br><br>${globalCompanyName}'s project assistant. <br><br>Let's get you started with the mechanical, engineering & plumbing intake process.<br><br>Ready to begin?`,
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
      title: `Let's start with your name!`,
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

    // Step 6: Fuel Source (Radio buttons via choice buttons)
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
          required: false,
        },
        {
          type: "button-group",
          id: "fuel-source-group",
          name: "fuelSource",
          required: false,
          buttons: [
            {
              type: "choice",
              label: "Gas",
              dataValue: "gas",
              dataNext: 7,
            },
            {
              type: "choice",
              label: "Electric",
              dataValue: "electric",
              dataNext: 7,
            },
          ],
        },
      ],
      buttons: [
        {
          type: "prev",
          dataPrev: 6,
        },
        {
          type: "next",
          label: "unsure",
          validLabel: "next",
          dataNext: 8,
        },
      ],
    },

    // Step 7: HVAC System Type (conditional based on fuel source)
    {
      stepNumber: 7,
      title:
        "What type of <span data-form-session-meta='fuelSource' data-default=''></span> HVAC system is at <span data-form-session-meta='address' data-default='this project'>this project</span>?",
      subtitle: "",
      fieldLayout: "single",
      fields: [
        {
          type: "hidden",
          id: "step-hvac-system",
          name: "hvacSystem",
          required: true,
        },
        {
          type: "button-group",
          id: "hvac-gas-group",
          name: "hvacSystem",
          required: true,
          conditional: {
            field: "fuelSource",
            value: "gas",
          },
          buttons: [
            {
              type: "choice",
              label: "Natural gas fired air handler and furnace",
              dataValue: "Natural gas fired air handler and furnace",
            },
            {
              type: "choice",
              label: "Propane gas fired air handler and furnace",
              dataValue: "Propane gas fired air handler and furnace",
            },
            {
              type: "choice",
              label: "Conventional ducted system",
              dataValue: "Conventional ducted system",
            },
            {
              type: "choice",
              label: "High velocity deducted system",
              dataValue: "High velocity deducted system",
            },
            {
              type: "choice",
              label: "Forced hot water radiant baseboard",
              dataValue: "Forced hot water radiant baseboard",
            },
            {
              type: "choice",
              label: "Other radiant heat",
              dataValue: "Other radiant heat",
            },
            {
              type: "choice",
              label: "Other",
              dataValue: "Other",
            },
          ],
        },
        {
          type: "button-group",
          id: "hvac-electric-group",
          name: "hvacSystem",
          required: true,
          conditional: {
            field: "fuelSource",
            value: "electric",
          },
          buttons: [
            {
              type: "choice",
              label: "Ceiling cassette mini split",
              dataValue: "Ceiling cassette mini split",
            },
            {
              type: "choice",
              label: "Wall mounted mini split",
              dataValue: "Wall mounted mini split",
            },
            {
              type: "choice",
              label: "Electric mini split",
              dataValue: "Electric mini split air handler and conventional ductwork",
            },
            {
              type: "choice",
              label: "Cove Heating",
              dataValue: "Cove Heating",
            },
            {
              type: "choice",
              label: "Other",
              dataValue: "Other",
            },
          ],
        },
      ],
      buttons: [
        {
          type: "prev",
          dataPrev: 6,
        },
        {
          type: "next",
          label: "unsure",
          validLabel: "next",
          dataNext: 8,
        },
      ],
    },

    // Step 8: Electric Service (Radio buttons via choice buttons)
    {
      stepNumber: 8,
      title:
        "What is the electric service at <span data-form-session-meta='address' data-default='this project'>this project</span>?",
      // subtitle: "What type of fuel does the HVAC system use?",
      fields: [
        {
          type: "hidden",
          id: "step-electric-service",
          name: "electricService",
          required: false,
        },
        {
          type: "button-group",
          id: "electric-service-group",
          name: "electricService",
          required: false,
          buttons: [
            {
              type: "choice",
              label: "New Service",
              dataValue: "New Service",
            },
            {
              type: "choice",
              label: "Existing Service",
              dataValue: "Existing Service",
            },
          ],
        },
      ],
      buttons: [
        {
          type: "prev",
          dataPrev: 6,
        },
        {
          type: "next",
          label: "unsure",
          validLabel: "next",
          dataNext: 9,
        },
      ],
    },

    // Step 9: Electric Service Type (Radio buttons via choice buttons)
    {
      stepNumber: 9,
      title:
        "Is there a transformer at <span data-form-session-meta='address' data-default='this project'>this project</span>?",
      // subtitle: "What type of fuel does the HVAC system use?",
      fields: [
        {
          type: "hidden",
          id: "step-transformer",
          name: "transformer",
          required: false,
        },
        {
          type: "button-group",
          id: "electric-service-group",
          name: "transformer",
          required: false,
          buttons: [
            {
              type: "choice",
              label: "Yes",
              dataValue: "Yes",
            },
            {
              type: "choice",
              label: "No",
              dataValue: "No",
            },
          ],
        },
      ],
      buttons: [
        {
          type: "prev",
          dataPrev: 8,
        },
        {
          type: "next",
          label: "unsure",
          validLabel: "next",
          dataNext: 10,
        },
      ],
    },

    // Step 10: EV Charging Service (Radio buttons via choice buttons)
    {
      stepNumber: 10,
      title:
        "Is there EV charging service at <span data-form-session-meta='address' data-default='this project'>this project</span>?",
      // subtitle: "What type of fuel does the HVAC system use?",
      fields: [
        {
          type: "hidden",
          id: "step-ev-charging-service",
          name: "evChargingService",
          required: false,
        },
        {
          type: "range",
          id: "ev-charging-service-slider",
          name: "evChargingService",
          required: false,
          min: 1,
          max: 20,
          step: 1,
          label: "Number of EV Chargers",
        },
      ],
      buttons: [
        {
          type: "prev",
          dataPrev: 9,
        },
        {
          type: "next",
          label: "no EV",
          validLabel: "next",
          dataNext: 11,
        },
      ],
    },

    // Step 11: Smart Home  (Radio buttons via choice buttons)
    {
      stepNumber: 11,
      title:
        "Is there a smart home system installed at <span data-form-session-meta='address' data-default='this project'>this project</span> or planned for the future?",
      // subtitle: "What type of fuel does the HVAC system use?",
      fields: [
        {
          type: "hidden",
          id: "step-smart-home-system",
          name: "smartHomeSystem",
          required: false,
        },
        {
          type: "button-group",
          id: "smart-home-system-group",
          name: "smartHomeSystem",
          required: false,
          buttons: [
            {
              type: "choice",
              label: "Yes",
              dataValue: "Yes",
            },
            {
              type: "choice",
              label: "No",
              dataValue: "No",
            },
          ],
        },
      ],
      buttons: [
        {
          type: "prev",
          dataPrev: 10,
        },
        {
          type: "next",
          label: "unsure",
          validLabel: "next",
          dataNext: 12,
        },
      ],
    },
  ],
};
