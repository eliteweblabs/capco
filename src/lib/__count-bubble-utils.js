// /**
//  * Global utility for managing count bubbles on UI elements
//  * JavaScript version for Astro compatibility
//  */

// /**
//  * Updates or creates a count bubble on a parent element
//  * @param {HTMLElement} parentElement - The element to attach the count bubble to
//  * @param {number} count - The count value to display
//  * @param {Object} options - Configuration options for the bubble
//  * @returns {HTMLElement|null} The count bubble element
//  */
// export function updateCountBubble(parentElement, count, options = {}) {
//   if (!parentElement) {
//     console.warn("🔍 [COUNT-BUBBLE] Parent element is null or undefined");
//     return null;
//   }

//   const config = {
//     bubbleClasses:
//       "absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white dark:bg-primary-dark animate-pulse",
//     parentClasses: "relative",
//     maxCount: 99,
//     showZero: false,
//     ...options,
//   };

//   // Find existing bubble or create new one
//   let countBubble = parentElement.querySelector(".count-bubble");

//   if (count > 0 || config.showZero) {
//     // Create bubble if it doesn't exist
//     if (!countBubble) {
//       countBubble = document.createElement("span");
//       countBubble.className = `count-bubble ${config.bubbleClasses}`;
//       parentElement.appendChild(countBubble);
//       console.log("🔍 [COUNT-BUBBLE] Created new bubble for element:", parentElement);
//     }

//     // Update bubble content and visibility
//     const displayCount = count > config.maxCount ? `${config.maxCount}+` : count.toString();
//     countBubble.textContent = displayCount;
//     countBubble.style.display = "flex";

//     // Update data attribute for accessibility
//     parentElement.setAttribute("data-count", count.toString());

//   } else {
//     // Hide bubble when count is 0 (unless showZero is true)
//     if (countBubble) {
//       countBubble.style.display = "none";
//       parentElement.removeAttribute("data-count");
//       console.log("🔍 [COUNT-BUBBLE] Hidden bubble (count is 0)");
//     }
//   }

//   return countBubble;
// }

// /**
//  * Preset configurations for common use cases
//  * Note: The default style is the standard for most use cases
//  * Only use these presets if you have a specific need
//  */
// export const COUNT_BUBBLE_PRESETS = {
//   /** Standard default */
//   default: {
//     bubbleClasses:
//       "absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white dark:bg-primary-dark animate-pulse",
//     maxCount: 99,
//     showZero: false,
//   },

//   /** For notification badges with red background */
//   notification: {
//     bubbleClasses:
//       "absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white dark:bg-red-600 animate-pulse",
//     maxCount: 99,
//     showZero: false,
//   },

//   /** For small counts (like tabs) */
//   small: {
//     bubbleClasses:
//       "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white dark:bg-primary-dark animate-pulse",
//     maxCount: 9,
//     showZero: false,
//   },
// };
