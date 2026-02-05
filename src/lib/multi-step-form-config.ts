// Multi-step form configuration system
// This allows you to define forms using JSON configuration instead of writing repetitive HTML
import { globalClasses } from "../pages/api/global/global-classes";
const { globalInputClasses } = globalClasses();
const appendedGlobalInputClasses = `${globalInputClasses} text-center`;

// GLOBAL EMAIL PLACEHOLDER DEFAULTS - funny/generic rotating placeholders for email fields
export const DEFAULT_EMAIL_PLACEHOLDERS = [
  "hello@example.com",
  "definitely.not.spam@email.com",
  "inbox.zero@impossible.com",
  "reply.all@regrets.com",
  "unsubscribe@never.works",
  "404@notfound.com",
  "no.reply@void.com",
  "you@company.com",
  "professional.email@work.biz",
  "sent.from.my.iphone@mobile.com",
];

// GLOBAL BUTTON DEFAULTS - applies to ALL forms using MultiStepForm
// Change these to update button styles across ALL forms at once
export const GLOBAL_BUTTON_DEFAULTS = {
  next: {
    variant: "secondary" as const,
    size: "md" as const,
    icon: "arrow-right",
    iconPosition: "right" as const,
    label: "next",
  },
  prev: {
    variant: "anchor" as const,
    size: "md" as const,
    icon: "arrow-left",
    iconPosition: "left" as const,
    label: "back",
  },
  skip: {
    variant: "outline" as const,
    size: "md" as const,
  },
  submit: {
    variant: "primary" as const,
    size: "lg" as const,
    icon: "check",
    iconPosition: "right" as const,
  },
  choice: {
    variant: "outline" as const,
    size: "md" as const,
  },
  slider: {
    variant: "outline" as const,
    size: "md" as const,
  },
};

export interface FormFieldConfig {
  id: string;
  name: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "password"
    | "textarea"
    | "hidden"
    | "component"
    | "button-group"
    | "range";
  label?: string;
  placeholder?: string;
  animatedPlaceholders?: string[]; // Array of rotating placeholder values
  required?: boolean;
  autocomplete?: string;
  errorMessage?: string;
  minlength?: number;
  rows?: number;
  autofocus?: boolean;
  component?: string; // Component name (e.g., "InlineAddressSearch", "SlotMachineModalStaff", "UnitSlider", "ToggleButton", "FileUpload")
  componentProps?: Record<string, any>; // Props to pass to component
  // Icon configuration
  icon?: string; // Icon name (e.g., "mail", "lock-alt")
  iconPosition?: "left" | "right"; // Position of icon relative to input
  // Grid layout for multi-column layouts
  columns?: 1 | 2; // 1 = full width, 2 = half width in grid
  gridColumn?: string; // Grid column classes (e.g., "md:grid-cols-2")
  classes?: string; // Additional CSS classes for the input field
  // Button group configuration (for type="button-group")
  buttons?: FormButtonConfig[]; // Array of choice buttons for button-group type
  // Range/Slider configuration (for type="range" or component="UnitSlider")
  min?: number;
  max?: number;
  step?: number;
  value?: number | string; // Default value
  // Toggle button configuration (for component="ToggleButton")
  options?: Array<{ value: string; label: string }>; // Options for toggle buttons
  toggleType?: "radio" | "multi-select"; // Toggle button behavior
  // File upload configuration (for component="FileUpload")
  accept?: string; // Accepted file types
  multiple?: boolean; // Allow multiple file uploads
  maxFiles?: number; // Maximum number of files
  maxSize?: number; // Maximum file size in bytes
  // Conditional rendering
  conditional?: {
    field: string; // Field name to check (e.g., "fuelSource")
    value: string | string[]; // Value(s) that must match to show this field
  };
}

export interface FormButtonConfig {
  type: "next" | "prev" | "skip" | "submit" | "choice" | "slider";
  label?: string; // Optional button label
  validLabel?: string; // Label to show when field is valid (for dynamic labels based on validation)
  id?: string; // Optional unique identifier for the button
  variant?: "primary" | "secondary" | "anchor" | "outline" | "ghost";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  icon?: string;
  iconPosition?: "left" | "right";
  dataNext?: number; // Step number to go to on click
  dataPrev?: number; // Step number to go back to on click
  dataValue?: string; // For choice buttons (e.g., SMS consent)
  classes?: string; // Additional CSS classes
  href?: string; // For link buttons
  action?: string; // Custom action identifier
  disabled?: boolean; // Whether button is disabled initially
  // Slider (for button-group items that render as a range/slider)
  min?: number;
  max?: number;
  step?: number;
}

export interface FormStepConfig {
  stepNumber: number;
  title: string;
  subtitle?: string;
  icon?: string; // Icon name for the step header
  showIcon?: boolean; // Whether to show icon in header
  fields: FormFieldConfig[];
  buttons: FormButtonConfig[];
  // Conditional rendering
  skipCondition?: string; // JS expression to evaluate (e.g., "!phone")
  // Validation
  customValidation?: string; // Custom validation function name
  // Layout
  fieldLayout?: "single" | "grid"; // single = one field per row, grid = use field columns
  // Special step types
  isReview?: boolean; // Is this a review/summary step
  reviewFields?: string[]; // Field IDs to show in review
  // Custom content
  customContent?: string; // Custom HTML/components to inject
  // Additional content
  additionalContent?: "google-oauth" | "auth-providers" | "custom"; // Special content like OAuth buttons
  // Progress bar visibility
  hideProgressBar?: boolean; // Hide progress bar for this specific step (useful for intro/welcome steps)
  // Animation effects
  effect?: "reveal-text" | "typewriter" | "none"; // Text animation effect for title (defaults to "typewriter")
  // Panel positioning: when false, keep the step panel vertically centered (no expand-down/expand-up)
  expandDown?: boolean; // default true; set false to keep panel centered (e.g. login form)
}

export interface MultiStepFormConfig {
  formId: string;
  formAction: string; // API endpoint
  formMethod?: "post" | "get";
  totalSteps: number;
  progressBar?: boolean; // Show progress bar
  registerUser?: boolean; // If true, require unique email and redirect to login if exists
  // Button templates - defaults for all buttons
  buttonDefaults?: {
    next?: Partial<FormButtonConfig>;
    prev?: Partial<FormButtonConfig>;
    skip?: Partial<FormButtonConfig>;
    submit?: Partial<FormButtonConfig>;
  };
  // Steps
  steps: FormStepConfig[];
  // Global settings
  inputClasses?: { globalInputClasses: string; appendedGlobalInputClasses: string }; // Default input classes
  // Submission handling
  onSubmitSuccess?: string; // Function name or redirect URL
  onSubmitError?: string; // Function name
  // Hidden fields (e.g., role)
  hiddenFields?: Array<{ name: string; value: string }>;
}

// Helper function to get button config with defaults
// Priority: individual button config > form-specific buttonDefaults > GLOBAL_BUTTON_DEFAULTS
export function getButtonConfig(
  button: FormButtonConfig,
  formDefaults?: Partial<FormButtonConfig>
): FormButtonConfig {
  // Get global defaults for this button type
  const globalDefaults =
    GLOBAL_BUTTON_DEFAULTS[button.type as keyof typeof GLOBAL_BUTTON_DEFAULTS] || {};

  return {
    ...globalDefaults,
    ...formDefaults,
    ...button,
  };
}

// Helper function to check if a step should be skipped based on form data
export function shouldSkipStep(step: FormStepConfig, formData: Record<string, any>): boolean {
  if (!step.skipCondition) return false;

  try {
    // Create a function that evaluates the condition with form data in scope
    const conditionFn = new Function(...Object.keys(formData), `return ${step.skipCondition}`);
    return conditionFn(...Object.values(formData));
  } catch (error) {
    console.error(`Error evaluating skip condition for step ${step.stepNumber}:`, error);
    return false;
  }
}

// Helper function to get next step, accounting for skip conditions
export function getNextStepNumber(
  currentStep: number,
  targetStep: number,
  steps: FormStepConfig[],
  formData: Record<string, any>
): number {
  let nextStep = targetStep;

  // Check if target step should be skipped
  const step = steps.find((s) => s.stepNumber === nextStep);
  if (step && shouldSkipStep(step, formData)) {
    // Recursively find the next non-skipped step
    return getNextStepNumber(currentStep, nextStep + 1, steps, formData);
  }

  return nextStep;
}
