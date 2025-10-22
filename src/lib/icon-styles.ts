// Global icon styling utility for consistent icon usage across the application
// Similar to button-styles.ts but for icons

export interface IconStyleConfig {
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
    | "anchor";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  backgroundColor?:
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
    | "anchor";
  shape?: "circle" | "rounded" | "square";
  className?: string;
  color?: string;
}

export function getIconClasses(config: IconStyleConfig = {}): string {
  const { variant, size = "sm", backgroundColor, shape, className = "" } = config;

  // Base classes for all icons
  const baseClasses = "inline-block";

  // Size classes
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  // Style variant classes
  const styleClasses = {
    primary: "text-primary-500 dark:text-primary-400",
    secondary: "text-neutral-500 dark:text-neutral-400",
    success: "text-success-500 dark:text-success-400",
    warning: "text-warning-500 dark:text-warning-400",
    danger: "text-danger-500 dark:text-danger-400",
    outline:
      "text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-full p-1",
    ghost:
      "text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400",
    link: "text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300",
    loading: "text-primary-500 dark:text-primary-400 animate-spin",
    disabled: "text-neutral-400 dark:text-neutral-500 opacity-50",
    selected: "text-primary-600 dark:text-primary-300 font-semibold",
    anchor:
      "text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300",
  };

  // Background color classes
  const backgroundColorClasses = {
    primary: "bg-primary-500 dark:bg-primary-400 text-white",
    secondary: "bg-neutral-500 dark:bg-neutral-400 text-white",
    success: "bg-success-500 dark:bg-success-400 text-white",
    warning: "bg-warning-500 dark:bg-warning-400 text-white",
    danger: "bg-danger-500 dark:bg-danger-400 text-white",
    outline:
      "bg-transparent border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300",
    ghost:
      "bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400",
    link: "bg-transparent hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-500 dark:text-primary-400",
    loading: "bg-primary-500 dark:bg-primary-400 text-white animate-pulse",
    disabled:
      "bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 opacity-50",
    selected: "bg-primary-600 dark:bg-primary-300 text-white font-semibold",
    anchor:
      "bg-transparent hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-500 dark:text-primary-400",
  };

  // Shape classes
  const shapeClasses = {
    circle: "rounded-full p-3",
    rounded: "rounded-lg p-2",
    square: "rounded-none",
  };

  // Build the complete class string
  const iconClasses = [
    baseClasses,
    sizeClasses[size] || sizeClasses.sm,
    variant && styleClasses[variant],
    backgroundColor && backgroundColorClasses[backgroundColor],
    shape && shapeClasses[shape],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return iconClasses;
}

// Convert kebab-case to PascalCase for Lucide icons
export function convertToPascalCase(str: string): string {
  // Handle undefined, null, or empty strings
  if (!str || typeof str !== "string") {
    return "Circle"; // Default fallback
  }

  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

// Map common icon names to correct Lucide names
export const ICON_NAME_MAPPING: Record<string, string> = {
  FileBlank: "File",
  CommentDots: "MessageCircle",
  MessageDots: "MessageCircle",
  MessageRoundedDots: "MessageCircle",
  MessageSquareDots: "MessageSquare",
  UserPlus: "UserPlus",
  CheckSquare: "CheckSquare",
  BarChart3: "BarChart3",
  MessageSquare: "MessageSquare",
  User: "User",
  Check: "Check",
  Shield: "Shield",
  Send: "Send",
  Zap: "Zap",
  MapPin: "MapPin",
  Pin: "MapPin",
  Bell: "Bell",
  ChevronLeft: "ChevronLeft",
  ChevronRight: "ChevronRight",
  ChevronDown: "ChevronDown",
  ChevronUp: "ChevronUp",
  Menu: "Menu",
  X: "X",
  Plus: "Plus",
  Minus: "Minus",
  Edit: "Edit",
  Trash: "Trash",
  Save: "Save",
  Download: "Download",
  Upload: "Upload",
  Search: "Search",
  Filter: "Filter",
  Settings: "Settings",
  Home: "Home",
  Dashboard: "Dashboard",
  FileText: "FileText",
  LogIn: "LogIn",
  LogOut: "LogOut",
};

// Get the correct Lucide icon name
export function getIconName(name: string): string {
  // Handle undefined or null names
  if (!name || typeof name !== "string") {
    return "Circle"; // Default fallback
  }

  const pascalCaseName = convertToPascalCase(name);
  return ICON_NAME_MAPPING[pascalCaseName] || pascalCaseName;
}

// Helper function to generate complete icon HTML
export function generateIconHTML(
  name: string,
  config: IconStyleConfig = {},
  dataAttributes: Record<string, string> = {}
): string {
  const iconClasses = getIconClasses(config);
  const iconName = getIconName(name);

  // Build data attributes
  const dataAttrs = Object.entries(dataAttributes)
    .map(([key, value]) => `data-${key}="${value}"`)
    .join(" ");

  return `<i data-lucide="${iconName}" class="${iconClasses}" ${dataAttrs}></i>`;
}

// Preset configurations for common icon use cases
export const ICON_PRESETS = {
  /** Standard default icon */
  default: {
    size: "sm" as const,
    variant: "primary" as const,
  },

  /** Small icon for inline text */
  inline: {
    size: "xs" as const,
    variant: "secondary" as const,
  },

  /** Large icon for headers/hero sections */
  hero: {
    size: "xl" as const,
    variant: "primary" as const,
  },

  /** Icon for buttons */
  button: {
    size: "sm" as const,
    variant: "primary" as const,
  },

  /** Icon for navigation items */
  nav: {
    size: "sm" as const,
    variant: "secondary" as const,
  },

  /** Icon for status indicators */
  status: {
    size: "sm" as const,
    variant: "success" as const,
  },

  /** Icon for warnings */
  warning: {
    size: "sm" as const,
    variant: "warning" as const,
  },

  /** Icon for errors */
  error: {
    size: "sm" as const,
    variant: "danger" as const,
  },

  /** Icon with background circle */
  badge: {
    size: "sm" as const,
    backgroundColor: "primary" as const,
    shape: "circle" as const,
  },

  /** Icon for loading states */
  loading: {
    size: "sm" as const,
    variant: "loading" as const,
  },

  /** Icon for disabled states */
  disabled: {
    size: "sm" as const,
    variant: "disabled" as const,
  },
} as const;
