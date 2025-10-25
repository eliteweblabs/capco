// Simple icon system - Works both server-side (Astro) and client-side (browser)
// Usage: <Icon name="user" /> or window.SimpleIcons.getIcon("user")

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
    return `<span class="inline-block">[icon:${name}]</span>`; // Debug fallback
  }

  // Replace size and add className with inline-block default
  const classes = className ? `${className} inline-block` : "inline-block";

  return iconSvg
    .replace(/width="16"/g, `width="${size}"`)
    .replace(/height="16"/g, `height="${size}"`)
    .replace(/class=""/g, `class="${classes}"`);
}

// Auto-initialize for client-side (browser) usage
if (typeof window !== "undefined") {
  window.SimpleIcons = {
    getIcon,
    SIMPLE_ICONS,
  };
}
