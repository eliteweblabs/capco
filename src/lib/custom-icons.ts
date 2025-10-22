// Custom icon system - Direct SVG HTML mapping
// No external dependencies, complete control over styling and behavior

export interface IconConfig {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export interface IconSVG {
  viewBox: string;
  paths: string[];
}

// Base SVG template
const createSVG = (icon: IconSVG, config: IconConfig = {}): string => {
  const { size = 16, color = "currentColor", className = "", strokeWidth = 2 } = config;

  const paths = icon.paths.map((path) => `<path d="${path}"/>`).join("");

  return `<svg 
    width="${size}" 
    height="${size}" 
    viewBox="${icon.viewBox}" 
    fill="none" 
    stroke="${color}" 
    stroke-width="${strokeWidth}" 
    stroke-linecap="round" 
    stroke-linejoin="round"
    class="${className}"
  >${paths}</svg>`;
};

// Icon definitions - all the icons you need
export const CUSTOM_ICONS: Record<string, IconSVG> = {
  // User & Auth
  user: {
    viewBox: "0 0 24 24",
    paths: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"],
  },
  "user-plus": {
    viewBox: "0 0 24 24",
    paths: [
      "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
      "M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
      "M20 8v6",
      "M23 11h-6",
    ],
  },
  "log-in": {
    viewBox: "0 0 24 24",
    paths: ["M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", "M10 17l5-5-5-5", "M21 12H9"],
  },
  "log-out": {
    viewBox: "0 0 24 24",
    paths: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  },

  // Files & Documents
  file: {
    viewBox: "0 0 24 24",
    paths: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6"],
  },
  "file-text": {
    viewBox: "0 0 24 24",
    paths: [
      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
      "M14 2v6h6",
      "M16 13H8",
      "M16 17H8",
      "M10 9H9",
    ],
  },
  "file-plus": {
    viewBox: "0 0 24 24",
    paths: [
      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
      "M14 2v6h6",
      "M12 18v-6",
      "M9 15h6",
    ],
  },

  // Upload & Download
  upload: {
    viewBox: "0 0 24 24",
    paths: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5-5 5 5", "M12 15V3"],
  },
  download: {
    viewBox: "0 0 24 24",
    paths: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  },

  // Navigation & UI
  "chevron-left": {
    viewBox: "0 0 24 24",
    paths: ["M15 18l-6-6 6-6"],
  },
  "chevron-right": {
    viewBox: "0 0 24 24",
    paths: ["M9 18l6-6-6-6"],
  },
  "chevron-up": {
    viewBox: "0 0 24 24",
    paths: ["M18 15l-6-6-6 6"],
  },
  "chevron-down": {
    viewBox: "0 0 24 24",
    paths: ["M6 9l6 6 6-6"],
  },
  menu: {
    viewBox: "0 0 24 24",
    paths: ["M3 12h18", "M3 6h18", "M3 18h18"],
  },
  x: {
    viewBox: "0 0 24 24",
    paths: ["M18 6L6 18", "M6 6l12 12"],
  },
  plus: {
    viewBox: "0 0 24 24",
    paths: ["M12 5v14", "M5 12h14"],
  },
  minus: {
    viewBox: "0 0 24 24",
    paths: ["M5 12h14"],
  },

  // Status & Actions
  check: {
    viewBox: "0 0 24 24",
    paths: ["M20 6L9 17l-5-5"],
  },
  "check-circle": {
    viewBox: "0 0 24 24",
    paths: ["M22 11.08V12a10 10 0 1 1-5.93-9.14", "M22 4L12 14.01l-3-3"],
  },
  "x-circle": {
    viewBox: "0 0 24 24",
    paths: [
      "M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z",
      "M15 9l-6 6",
      "M9 9l6 6",
    ],
  },
  alert: {
    viewBox: "0 0 24 24",
    paths: ["M12 9v4", "M12 17h.01", "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"],
  },

  // Communication
  bell: {
    viewBox: "0 0 24 24",
    paths: ["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 0 1-3.46 0"],
  },
  "message-circle": {
    viewBox: "0 0 24 24",
    paths: [
      "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
    ],
  },
  send: {
    viewBox: "0 0 24 24",
    paths: ["M22 2L11 13", "M22 2l-7 20-4-9-9-4 20-7z"],
  },

  // Settings & Tools
  settings: {
    viewBox: "0 0 24 24",
    paths: [
      "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
      "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z",
    ],
  },
  edit: {
    viewBox: "0 0 24 24",
    paths: [
      "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
      "M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    ],
  },
  trash: {
    viewBox: "0 0 24 24",
    paths: [
      "M3 6h18",
      "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",
      "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",
      "M10 11v6",
      "M14 11v6",
    ],
  },

  // Basic shapes
  circle: {
    viewBox: "0 0 24 24",
    paths: ["M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0"],
  },
  square: {
    viewBox: "0 0 24 24",
    paths: ["M3 3h18v18H3z"],
  },
  triangle: {
    viewBox: "0 0 24 24",
    paths: [
      "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
    ],
  },

  // Arrows & Directions
  arrow: {
    viewBox: "0 0 24 24",
    paths: ["M12 5l7 7-7 7", "M5 12h14"],
  },
  "arrow-up": {
    viewBox: "0 0 24 24",
    paths: ["M12 19V5", "M5 12l7-7 7 7"],
  },
  "arrow-down": {
    viewBox: "0 0 24 24",
    paths: ["M12 5v14", "M19 12l-7 7-7-7"],
  },
  "arrow-left": {
    viewBox: "0 0 24 24",
    paths: ["M19 12H5", "M12 19l-7-7 7-7"],
  },
  "arrow-right": {
    viewBox: "0 0 24 24",
    paths: ["M5 12h14", "M12 5l7 7-7 7"],
  },

  // Additional icons needed for Aside.astro
  "bar-chart-3": {
    viewBox: "0 0 24 24",
    paths: ["M3 3v18h18", "M18 17V9", "M13 17V5", "M8 17v-3"],
  },
  users: {
    viewBox: "0 0 24 24",
    paths: [
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
      "M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
      "M22 21v-2a4 4 0 0 0-3-3.87",
      "M16 3.13a4 4 0 0 1 0 7.75",
    ],
  },
  "file-check": {
    viewBox: "0 0 24 24",
    paths: [
      "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",
      "M14 2v6h6",
      "M9 15l2 2 4-4",
    ],
  },
  folder: {
    viewBox: "0 0 24 24",
    paths: ["M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"],
  },
  "list-checks": {
    viewBox: "0 0 24 24",
    paths: [
      "M9 12l2 2 4-4",
      "M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h18z",
      "M3 19h18",
      "M3 15h18",
    ],
  },
  "check-circle": {
    viewBox: "0 0 24 24",
    paths: ["M22 11.08V12a10 10 0 1 1-5.93-9.14", "M22 4L12 14.01l-3-3"],
  },
  "edit-3": {
    viewBox: "0 0 24 24",
    paths: ["M12 20h9", "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"],
  },
  clock: {
    viewBox: "0 0 24 24",
    paths: ["M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0", "M12 6v6l4 2"],
  },
};

// Main function to get icon HTML
export function getIcon(name: string, config: IconConfig = {}): string {
  const icon = CUSTOM_ICONS[name];
  if (!icon) {
    console.warn(`Icon "${name}" not found, using circle as fallback`);
    return getIcon("circle", config);
  }

  return createSVG(icon, config);
}

// Helper function for common use cases
export function getIconHTML(name: string, size: number = 16, className: string = ""): string {
  return getIcon(name, { size, className });
}

// Preset configurations
export const ICON_PRESETS = {
  small: { size: 12, strokeWidth: 1.5 },
  medium: { size: 16, strokeWidth: 2 },
  large: { size: 20, strokeWidth: 2 },
  xl: { size: 24, strokeWidth: 2.5 },

  primary: { color: "currentColor", className: "text-primary-500 dark:text-primary-400" },
  secondary: { color: "currentColor", className: "text-neutral-500 dark:text-neutral-400" },
  success: { color: "currentColor", className: "text-success-500 dark:text-success-400" },
  warning: { color: "currentColor", className: "text-warning-500 dark:text-warning-400" },
  danger: { color: "currentColor", className: "text-danger-500 dark:text-danger-400" },
} as const;
