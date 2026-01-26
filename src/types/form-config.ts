/**
 * JSON-driven multi-step form configuration types
 * 
 * This file defines the TypeScript interfaces for creating multi-step forms
 * from JSON configuration. Used by the JSONMultiStepForm component.
 */

export type InputType = 
  | 'text' 
  | 'email' 
  | 'tel' 
  | 'password' 
  | 'number' 
  | 'url' 
  | 'date'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'hidden'
  | 'phone-sms' // Special: PhoneAndSMS component
  | 'address-search' // Special: InlineAddressSearch component
  | 'slot-machine' // Special: SlotMachineModalStaff component
  | 'button-choice'; // Special: Multiple button choices (like yes/no)

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'anchor';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
export type IconPosition = 'left' | 'right';

export interface ButtonConfig {
  text?: string;
  type?: 'button' | 'submit';
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string; // BoxIcon name
  iconPosition?: IconPosition;
  iconClasses?: string;
  class?: string;
  dataAttributes?: Record<string, string | number>;
  href?: string; // For link buttons
  onclick?: string; // For custom handlers
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ConditionalLogic {
  /**
   * Field name to watch for conditional logic
   */
  dependsOn?: string;
  /**
   * Required value(s) to show this field/step
   */
  showWhen?: string | string[] | { [key: string]: any };
  /**
   * Hide when this condition is met
   */
  hideWhen?: string | string[] | { [key: string]: any };
}

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: string | number;
  message?: string;
  /**
   * For custom validation, provide an API endpoint
   */
  apiEndpoint?: string;
}

export interface FormField {
  /**
   * HTML input name attribute
   */
  name: string;
  
  /**
   * Input type or special component type
   */
  type: InputType;
  
  /**
   * Unique ID for the field
   */
  id?: string;
  
  /**
   * Label text (optional - can use placeholder instead)
   */
  label?: string;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Is this field required?
   */
  required?: boolean;
  
  /**
   * Validation rules
   */
  validation?: ValidationRule[];
  
  /**
   * Error message to display
   */
  errorMessage?: string;
  
  /**
   * Autocomplete attribute
   */
  autocomplete?: string;
  
  /**
   * Default value
   */
  defaultValue?: string;
  
  /**
   * Additional CSS classes
   */
  class?: string;
  
  /**
   * Grid column span (for multi-column layouts)
   * 1 = full width, 2 = half width (in 2-col grid)
   */
  colSpan?: number;
  
  /**
   * Options for select, radio, button-choice, or slot-machine
   */
  options?: SelectOption[];
  
  /**
   * For textarea: number of rows
   */
  rows?: number;
  
  /**
   * For text inputs: min/max length
   */
  minLength?: number;
  maxLength?: number;
  
  /**
   * For number inputs: min/max value
   */
  min?: number;
  max?: number;
  
  /**
   * Pattern for regex validation
   */
  pattern?: string;
  
  /**
   * Should this field auto-focus?
   */
  autofocus?: boolean;
  
  /**
   * Conditional logic for showing/hiding
   */
  conditional?: ConditionalLogic;
  
  /**
   * Custom data attributes
   */
  dataAttributes?: Record<string, string | number>;
  
  /**
   * Special component props (for address-search, slot-machine, etc.)
   */
  componentProps?: Record<string, any>;
}

export interface FormStep {
  /**
   * Step number (1-based)
   */
  step: number;
  
  /**
   * Step title/heading
   */
  title: string;
  
  /**
   * Optional subtitle/description
   */
  subtitle?: string;
  
  /**
   * Icon for the step (BoxIcon name)
   */
  icon?: string;
  
  /**
   * Fields in this step
   */
  fields: FormField[];
  
  /**
   * Button configuration for this step
   */
  buttons?: {
    next?: ButtonConfig;
    prev?: ButtonConfig;
    skip?: ButtonConfig;
    submit?: ButtonConfig;
    custom?: ButtonConfig[];
  };
  
  /**
   * Conditional logic for showing/hiding entire step
   */
  conditional?: ConditionalLogic;
  
  /**
   * Custom validation function name (must be available in global scope)
   */
  customValidation?: string;
  
  /**
   * Additional CSS classes for the step container
   */
  class?: string;
  
  /**
   * Layout: single column or multi-column grid
   */
  layout?: 'single' | 'grid-2' | 'grid-3';
}

export interface ProgressBarConfig {
  show?: boolean;
  showStepNumbers?: boolean;
  class?: string;
}

export interface FormConfig {
  /**
   * Unique form ID
   */
  id: string;
  
  /**
   * Form submission action URL
   */
  action: string;
  
  /**
   * HTTP method
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  
  /**
   * Form title (optional - shown above progress bar)
   */
  title?: string;
  
  /**
   * Form description (optional)
   */
  description?: string;
  
  /**
   * Progress bar configuration
   */
  progressBar?: ProgressBarConfig;
  
  /**
   * All form steps
   */
  steps: FormStep[];
  
  /**
   * Global button defaults
   */
  defaultButtons?: {
    next?: Partial<ButtonConfig>;
    prev?: Partial<ButtonConfig>;
    skip?: Partial<ButtonConfig>;
    submit?: Partial<ButtonConfig>;
  };
  
  /**
   * Success redirect URL
   */
  successRedirect?: string;
  
  /**
   * Success message
   */
  successMessage?: {
    title: string;
    message: string;
    duration?: number;
  };
  
  /**
   * Additional CSS classes for the form
   */
  class?: string;
  
  /**
   * Container classes (for max-width, etc.)
   */
  containerClass?: string;
  
  /**
   * Enable Enter key to advance steps?
   */
  enableEnterKey?: boolean;
  
  /**
   * Custom submit handler function name (must be available in global scope)
   */
  customSubmitHandler?: string;
  
  /**
   * Should we hide the sidebar toggle on this form?
   */
  hideSidebarToggle?: boolean;
}
