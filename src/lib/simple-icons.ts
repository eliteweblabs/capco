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
    return `<span class="inline-block text-red-500">[icon:${name}]</span>`; // Debug fallback
  }

  // Replace size and add className (add inline-block only if className is provided and doesn't already have it)
  const needsInlineBlock =
    className && !className.includes("inline-block") && !className.includes("block");
  const classes = needsInlineBlock ? `${className} inline-block` : className || "inline-block";

  // Replace width and height attributes only (not viewBox)
  let result = iconSvg
    .replace(/width="16"/g, `width="${size}"`)
    .replace(/height="16"/g, `height="${size}"`);
  
  // Then add class attribute if it doesn't exist, or replace if it does
  if (result.includes('class="')) {
    result = result.replace(/class="[^"]*"/g, `class="${classes}"`);
  } else {
    // Add class attribute after the opening <svg tag
    result = result.replace('<svg', `<svg class="${classes}"`);
  }
  
  return result;
}

// Auto-initialize for client-side (browser) usage
if (typeof window !== "undefined") {
  (window as any).SimpleIcons = {
    getIcon,
    SIMPLE_ICONS,
  } as any;
}
