// Shared button styling logic used by both Button component and client-side code
// This ensures consistent styling across the entire application

export interface ButtonStyleConfig {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "outline"
    | "ghost"
    | "link"
    | "loading"
    | "disabled"
    | "selected"
    | "anchor"
    | "tab";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  className?: string;
  icon?: boolean;
}

export function getButtonClasses(config: ButtonStyleConfig = {}): string {
  const {
    variant = "primary",
    size = "md",
    fullWidth = false,
    className = "",
    icon = false,
  } = config;

  // Base classes for all buttons
  const baseClasses =
    "font-secondary relative inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

  // Size classes check if theres an icon and if so, make padding match so the icon is centered and the button is round perfectly
  const sizeClasses = icon
    ? {
        xs: "px-2 py-2 text-xs",
        sm: "px-3 py-3 text-sm",
        md: "px-4 py-4 text-sm",
        lg: "px-5 py-5 text-base",
        xl: "px-6 py-6 text-lg",
      }
    : {
        xs: "px-2 py-2 text-xs",
        sm: "px-4 py-2 text-sm",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
        xl: "px-7 py-3.5 text-lg",
      };

  // Variant classes using global color system
  const variantClasses = {
    primary:
      "hover:scale-102 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 rounded-full border-2 border-primary-500 bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600 shadow-lg hover:shadow-xl",
    secondary:
      "hover:scale-102 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 rounded-full border-2 border-secondary-500 bg-secondary-500 text-white hover:bg-secondary-600 dark:bg-secondary-500 dark:hover:bg-secondary-600 shadow-lg hover:shadow-xl",
    success:
      "rounded-full bg-success-500 text-white hover:bg-success-600 dark:bg-success-500 dark:hover:bg-success-600 shadow-lg hover:shadow-xl",
    warning:
      "bg-warning-500 text-white hover:bg-warning-600 dark:bg-warning-500 dark:hover:bg-warning-600 shadow-lg hover:shadow-xl",
    danger:
      "rounded-full bg-danger-500 text-white hover:bg-danger-600 dark:bg-danger-500 dark:hover:bg-danger-600 shadow-lg hover:shadow-xl",
    outline:
      "hover:scale-102 hover:-translate-y-1 hover:shadow-xl rounded-full border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-600 dark:hover:text-white backdrop-blur-sm",
    ghost:
      "rounded-full text-primary-500 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20",
    link: "link text-primary-500 hover:underline hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300",
    loading: "bg-primary-500 text-white cursor-not-allowed opacity-75 dark:bg-primary-500",
    disabled:
      "rounded-full bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-60 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700 disabled",
    selected:
      "rounded-full bg-primary-500 text-white border-2 border-primary-500 dark:bg-primary-500 dark:border-primary-500",
    anchor:
      "text-gray-800 dark:text-gray-200 hover:text-primary dark:hover:text-primary-dark outline-none focus:outline-none border-none focus:ring-0 focus:ring-offset-0 hover:shadow-none opacity-100 transition-all duration-200",
    tab: "translate-y-1 tab-button pill-nav-item border color-border bg-gray-50 dark:bg-gray-800",
  };

  // Build the complete class string
  const buttonClasses = [
    baseClasses,
    sizeClasses[size] || sizeClasses.md,
    variantClasses[variant] || variantClasses.primary,
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return buttonClasses;
}

// Helper function to generate complete button HTML with data attributes
export function generateButtonHTML(
  text: string,
  config: ButtonStyleConfig = {},
  dataAttributes: Record<string, string> = {}
): string {
  const buttonClasses = getButtonClasses(config);

  // Build data attributes
  const dataAttrs = Object.entries(dataAttributes)
    .map(([key, value]) => `data-${key}="${value}"`)
    .join(" ");

  return `<button class="${buttonClasses}" ${dataAttrs}>${text}</button>`;
}
