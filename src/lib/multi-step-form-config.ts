// Multi-step form configuration system
// This allows you to define forms using JSON configuration instead of writing repetitive HTML

export interface FormFieldConfig {
  id: string;
  name: string;
  type: "text" | "email" | "tel" | "password" | "textarea" | "hidden" | "component";
  label?: string;
  placeholder?: string;
  required?: boolean;
  autocomplete?: string;
  errorMessage?: string;
  minlength?: number;
  rows?: number;
  autofocus?: boolean;
  component?: string; // Component name (e.g., "InlineAddressSearch", "SlotMachineModalStaff")
  componentProps?: Record<string, any>; // Props to pass to component
  // Grid layout for multi-column layouts
  columns?: 1 | 2; // 1 = full width, 2 = half width in grid
  gridColumn?: string; // Grid column classes (e.g., "md:grid-cols-2")
  classes?: string; // Additional CSS classes for the input field
}

export interface FormButtonConfig {
  type: "next" | "prev" | "skip" | "submit" | "choice";
  label: string;
  variant?: "primary" | "secondary" | "anchor" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "base";
  icon?: string;
  iconPosition?: "left" | "right";
  dataNext?: number; // Step number to go to on click
  dataPrev?: number; // Step number to go back to on click
  dataValue?: string; // For choice buttons (e.g., SMS consent)
  classes?: string; // Additional CSS classes
  href?: string; // For link buttons
  action?: string; // Custom action identifier
  disabled?: boolean; // Whether button is disabled initially
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
  additionalContent?: "google-oauth" | "custom"; // Special content like OAuth buttons
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
  inputClasses?: string; // Default input classes
  // Submission handling
  onSubmitSuccess?: string; // Function name or redirect URL
  onSubmitError?: string; // Function name
  // Hidden fields (e.g., role)
  hiddenFields?: Array<{ name: string; value: string }>;
}

// Helper function to get button config with defaults
export function getButtonConfig(
  button: FormButtonConfig,
  defaults?: Partial<FormButtonConfig>
): FormButtonConfig {
  return {
    ...defaults,
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
