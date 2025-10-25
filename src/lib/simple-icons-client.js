// Simple icon system - Client-side JavaScript version
// Import icons from single source

import iconData from "./icon-data.json";

const SIMPLE_ICONS = iconData;

// Function to get icon with size and class customization
function getIcon(name, config = {}) {
  const { size = 16, className = "" } = config;

  const iconSvg = SIMPLE_ICONS[name];
  if (!iconSvg) {
    return name;
  }

  // Replace size and add className
  return iconSvg
    .replace(/width="16"/g, `width="${size}"`)
    .replace(/height="16"/g, `height="${size}"`)
    .replace(/class=""/g, `class="${className}"`);
}

// Make available globally
window.SimpleIcons = {
  getIcon,
  SIMPLE_ICONS,
};
