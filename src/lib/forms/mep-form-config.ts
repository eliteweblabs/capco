import type { MultiStepFormConfig } from "../multi-step-form-config";

/**
 * MEP Form Configuration
 * Multi-step form for MEP (Mechanical, Electrical, Plumbing) projects
 */
export const mepFormConfig: MultiStepFormConfig = {
  formId: "multi-step-mep-form",
  formAction: "/api/mep/submit",
  formMethod: "post",
  totalSteps: 6,
  registerUser: true, // Allow existing users to proceed (backend will handle user lookup)
  steps: [
    // Step 1: Name (skip if authenticated)
    {
      stepNumber: 1,
      title:
        "Hello, welcome to<br>the Rothco Mechanical,<br>Engineering and Plumbing intake.<br>Takes about 2 minutes.<br>We typically respond within<br>1 business day EDT.",
      subtitle: "",
      skipCondition: "isAuthenticated", // Skip for logged-in users
      fieldLayout: "grid", // Enable grid layout for side-by-side fields
      fields: [
        {
          type: "text",
          id: "step-first-name",
          name: "firstName",
          placeholder: "John",
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
          placeholder: "Doe",
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
          label: '<span class="hidden md:block">Back to Home</span>',
          variant: "ghost",
          href: "/",
          icon: "arrow-left",
          iconPosition: "left",
        },
        {
          type: "next",
          label: "next",
          variant: "secondary",
          size: "md",
          dataNext: 2,
          icon: "arrow-right",
          iconPosition: "right",
        },
      ],
    },

    // Step 2: Email (skip if authenticated)
    {
      stepNumber: 2,
      title: "Your email?",
      subtitle: "",
      skipCondition: "isAuthenticated", // Skip for logged-in users
      fields: [
        {
          type: "email",
          id: "step-email",
          name: "email",
          placeholder: "your.email@example.com",
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
          label: '<span class="hidden md:block">back</span>',
          variant: "ghost",
          dataPrev: 1,
          icon: "arrow-left",
          iconPosition: "left",
        },
        {
          type: "next",
          label: "next",
          variant: "secondary",
          size: "md",
          dataNext: 3,
          icon: "arrow-right",
          iconPosition: "right",
        },
      ],
    },

    // Step 3: Phone (skip if authenticated)
    {
      stepNumber: 3,
      title: "Your phone?",
      subtitle: "",
      skipCondition: "isAuthenticated", // Skip for logged-in users
      fields: [
        {
          type: "tel",
          id: "step-phone",
          name: "phone",
          placeholder: "1-(555)-123-4567",
          required: true,
          autocomplete: "tel",
          icon: "phone",
          iconPosition: "left",
          classes: "text-center",
        },
      ],
      buttons: [
        {
          type: "prev",
          label: '<span class="hidden md:block">back</span>',
          variant: "ghost",
          dataPrev: 2,
          icon: "arrow-left",
          iconPosition: "left",
        },
        {
          type: "next",
          label: "next",
          variant: "secondary",
          size: "md",
          dataNext: 4,
          icon: "arrow-right",
          iconPosition: "right",
        },
      ],
    },

    // Step 4: Address
    {
      stepNumber: 4,
      title: "Project address?",
      subtitle: "Where is the MEP project located?",
      fields: [
        {
          type: "component",
          id: "step-address",
          name: "address",
          component: "InlineAddressSearch",
          required: true,
          componentProps: {
            placeholder: "Start typing an address...",
            required: true,
            currentLocation: true,
          },
        },
      ],
      buttons: [
        {
          type: "prev",
          label: '<span class="hidden md:block">back</span>',
          variant: "ghost",
          dataPrev: 3,
          icon: "arrow-left",
          iconPosition: "left",
        },
        {
          type: "next",
          label: "next",
          variant: "secondary",
          size: "md",
          dataNext: 5,
          icon: "arrow-right",
          iconPosition: "right",
        },
      ],
    },

    // Step 5: Fuel Source (Radio buttons via choice buttons)
    {
      stepNumber: 5,
      title: "Fuel Source?",
      subtitle: "What type of fuel does the HVAC system use?",
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
          label: '<span class="hidden md:block">back</span>',
          variant: "ghost",
          dataPrev: 4,
          icon: "arrow-left",
          iconPosition: "left",
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
          dataNext: 6,
          icon: "arrow-right",
          iconPosition: "right",
          classes: "disabled:opacity-50 disabled:cursor-not-allowed",
          disabled: true, // Initially disabled until choice is made
        },
      ],
    },

    // Step 6: HVAC System Type (conditional based on fuel source)
    {
      stepNumber: 6,
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
