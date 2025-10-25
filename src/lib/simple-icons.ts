// Simple icon system - just complete SVG HTML strings
// Usage: <Icon name="user" />

import iconData from "./icon-data.json";

export interface IconConfig {
  size?: number;
  className?: string;
}

// Import icons from single source
export const SIMPLE_ICONS: Record<string, string> = iconData;

// Function to get icon with size and class customization
export function getIcon(name: string, config: IconConfig = {}): string {
  const { size = 16, className = "" } = config;

  const iconSvg = SIMPLE_ICONS[name];
  if (!iconSvg) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`;
  }

  // Replace size and add className
  return iconSvg
    .replace(/width="16"/g, `width="${size}"`)
    .replace(/height="16"/g, `height="${size}"`)
    .replace(/class=""/g, `class="${className}"`);
}
