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
    | "icon"
    | "selected"
    | "anchor"
    | "tab";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  className?: string;
  icon?: boolean;
  focus?: boolean;
}

export function getButtonClasses(config: ButtonStyleConfig = {}): string {
  const {
    variant = "primary",
    size = "md",
    fullWidth = false,
    className = "",
    icon = false,
    focus = false,
  } = config;

  // Base classes for all buttons
  const baseClasses =
    "select-none font-secondary relative inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

  // Icon buttons: square dimensions so they stay perfectly round (rounded-full)
  const isIconButton = icon || variant === "icon";
  const sizeClasses = isIconButton
    ? {
        xs: "h-6 w-6 p-0 text-xs rounded-full",
        sm: "h-8 w-8 p-0 text-sm rounded-full",
        md: "h-10 w-10 p-0 text-md rounded-full",
        lg: "h-12 w-12 p-0 text-lg rounded-full",
        xl: "h-14 w-14 p-0 text-xl rounded-full",
      }
    : {
        xs: "py-1 px-2 text-[10px]",
        sm: "py-2 px-3 text-[12px]",
        md: "py-3 px-4 text-[14px]",
        lg: "py-4 px-5 text-[16px]",
        xl: "py-5 px-6 text-[18px]",
      };

  // Variant classes using global color system
  const variantClasses = {
    primary:
      "[@media(hover:hover)]:hover:scale-101 [@media(hover:hover)]:hover:-translate-y-0.5 transition-all duration-200 rounded-full border-2 border-primary-500 bg-primary-500 text-white [@media(hover:hover)]:hover:bg-primary-600 dark:bg-primary-500 dark:[@media(hover:hover)]:hover:bg-primary-600",
    secondary:
      "ring-2 ring-inset ring-[currentColor] [@media(hover:hover)]:hover:scale-101 [@media(hover:hover)]:hover:-translate-y-0.5 transition-all duration-200 rounded-full border-2 border-secondary-500 bg-secondary-500 text-white [@media(hover:hover)]:hover:bg-secondary-600 dark:bg-secondary-500 dark:[@media(hover:hover)]:hover:bg-secondary-600",
    success:
      "rounded-full bg-success-500 text-white [@media(hover:hover)]:hover:bg-success-600 dark:bg-success-500 dark:[@media(hover:hover)]:hover:bg-success-600 animate-pulse-breathe",
    warning:
      "bg-warning-500 text-white [@media(hover:hover)]:hover:bg-warning-600 dark:bg-warning-500 dark:[@media(hover:hover)]:hover:bg-warning-600",
    danger:
      "rounded-full bg-danger-500 text-white [@media(hover:hover)]:hover:bg-danger-600 dark:bg-danger-500 dark:[@media(hover:hover)]:hover:bg-danger-600",
    outline:
      "[@media(hover:hover)]:hover:scale-101 [@media(hover:hover)]:hover:-translate-y-0.5 rounded-full border-2 border-primary-500 text-primary-500 [@media(hover:hover)]:hover:bg-primary-500 [@media(hover:hover)]:hover:text-white dark:border-primary-400 dark:text-primary-400 dark:[@media(hover:hover)]:hover:bg-primary-600 dark:[@media(hover:hover)]:hover:text-white backdrop-blur-md",
    ghost:
      "rounded-full text-primary-500 [@media(hover:hover)]:hover:bg-primary-50 dark:text-primary-400 dark:[@media(hover:hover)]:hover:bg-primary-900/20",
    link: "link text-primary-500 [@media(hover:hover)]:hover:underline [@media(hover:hover)]:hover:text-primary-600 dark:text-primary-400 dark:[@media(hover:hover)]:hover:text-primary-300",
    loading: "bg-primary-500 text-white cursor-not-allowed opacity-75 dark:bg-primary-500",
    disabled:
      "rounded-full bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 disabled",
    selected:
      "rounded-full bg-primary-500 text-white border-2 border-primary-500 dark:bg-primary-500 dark:border-primary-500",
    anchor:
      "text-gray-800 dark:text-gray-200 [@media(hover:hover)]:hover:text-primary dark:[@media(hover:hover)]:hover:text-primary-dark outline-none focus:outline-none border-none focus:ring-0 focus:ring-offset-0 [@media(hover:hover)]:hover:shadow-none opacity-100 transition-all duration-200",
    tab: "tab-button sliding-tabs-item",
  };

  // Focus classes with dashed outline
  const focusClasses = focus
    ? "!outline !outline-2 !outline-dashed !outline-primary-500 !outline-offset-2 dark:!outline-primary-400"
    : "";

  // Build the complete class string
  const buttonClasses = [
    baseClasses,
    sizeClasses[size] || sizeClasses.md,
    variantClasses[variant] || variantClasses.primary,
    fullWidth ? "w-full" : "",
    focusClasses,
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
