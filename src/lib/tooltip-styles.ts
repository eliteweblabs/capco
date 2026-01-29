// Shared tooltip styling logic used by both Tooltip component and client-side code
// This ensures consistent styling across the entire application

export interface TooltipStyleConfig {
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  tooltipClass?: string;
  disabled?: boolean;
  open?: boolean;
  dismissable?: boolean;
}

export function getTooltipClasses(config: TooltipStyleConfig = {}): {
  wrapperClasses: string;
  tooltipClasses: string;
  arrowClasses: string;
} {
  const {
    position = "top",
    className = "",
    tooltipClass = "",
    disabled = false,
    open = false,
    dismissable = false,
  } = config;

  // Base wrapper classes
  const wrapperClasses = `relative inline-block group ${className}`;

  // Position classes for tooltip placement
  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  // Arrow classes for tooltip pointer
  const arrowPositionClasses = {
    top: "absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100",
    bottom:
      "absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-100",
    left: "absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900 dark:border-l-gray-100",
    right:
      "absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900 dark:border-r-gray-100",
  };

  // Build tooltip classes
  const tooltipClasses = [
    "tooltip-content absolute",
    positionClasses[position],
    "px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg",
    dismissable ? "opacity-100" : open ? "opacity-100" : "opacity-0 group-hover:opacity-100",
    dismissable ? "pointer-events-auto" : "transition-opacity duration-200 pointer-events-none",
    "whitespace-nowrap z-500 block",
    tooltipClass,
    disabled ? "hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Get arrow classes for the position
  const arrowClasses = arrowPositionClasses[position];

  return {
    wrapperClasses,
    tooltipClasses,
    arrowClasses,
  };
}

// Helper function to generate complete tooltip HTML
export function generateTooltipHTML(
  text: string,
  slotContent: string,
  config: TooltipStyleConfig = {}
): string {
  const { wrapperClasses, tooltipClasses, arrowClasses } = getTooltipClasses(config);

  return `
    <span class="${wrapperClasses}" style="vertical-align: baseline; white-space: nowrap;">
      ${slotContent}
      <span class="${tooltipClasses}">
        <span class="cursor-pointer">${text}</span>
        <span class="${arrowClasses}" style="display: block;"></span>
      </span>
    </span>
  `;
}
