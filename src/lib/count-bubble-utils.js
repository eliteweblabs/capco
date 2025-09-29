/**
 * Global utility for managing count bubbles on UI elements
 * JavaScript version for Astro compatibility
 */

/**
 * Updates or creates a count bubble on a parent element
 * @param {HTMLElement} parentElement - The element to attach the count bubble to
 * @param {number} count - The count value to display
 * @param {Object} options - Configuration options for the bubble
 * @returns {HTMLElement|null} The count bubble element
 */
export function updateCountBubble(parentElement, count, options = {}) {
  if (!parentElement) {
    console.warn("🔍 [COUNT-BUBBLE] Parent element is null or undefined");
    return null;
  }

  const config = {
    bubbleClasses:
      "absolute inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full -top-2 -end-2 dark:border-gray-900",
    maxCount: 99,
    showZero: false,
    ...options,
  };

  // Find existing bubble or create new one
  let countBubble = parentElement.querySelector(".count-bubble");

  if (count > 0 || config.showZero) {
    // Create bubble if it doesn't exist
    if (!countBubble) {
      countBubble = document.createElement("span");
      countBubble.className = `count-bubble ${config.bubbleClasses}`;
      parentElement.appendChild(countBubble);
      console.log("🔍 [COUNT-BUBBLE] Created new bubble for element:", parentElement);
    }

    // Update bubble content and visibility
    const displayCount = count > config.maxCount ? `${config.maxCount}+` : count.toString();
    countBubble.textContent = displayCount;
    countBubble.style.display = "flex";

    // Update data attribute for accessibility
    parentElement.setAttribute("data-count", count.toString());

    console.log("🔍 [COUNT-BUBBLE] Updated bubble:", {
      count,
      displayCount,
      element: parentElement,
    });
  } else {
    // Hide bubble when count is 0 (unless showZero is true)
    if (countBubble) {
      countBubble.style.display = "none";
      parentElement.removeAttribute("data-count");
      console.log("🔍 [COUNT-BUBBLE] Hidden bubble (count is 0)");
    }
  }

  return countBubble;
}

/**
 * Preset configurations for common use cases
 */
export const COUNT_BUBBLE_PRESETS = {
  /** For notification badges */
  notification: {
    bubbleClasses:
      "absolute inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full -top-2 -end-2 dark:border-gray-900",
    maxCount: 99,
    showZero: false,
  },

  /** For punchlist items */
  punchlist: {
    bubbleClasses:
      "absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white dark:bg-primary-dark",
    maxCount: 99,
    showZero: false,
  },

  /** For small counts (like tabs) */
  small: {
    bubbleClasses:
      "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white",
    maxCount: 9,
    showZero: false,
  },
};
