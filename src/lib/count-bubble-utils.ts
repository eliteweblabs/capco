// /**
//  * Global utility for managing count bubbles on UI elements
//  * Used for notifications, punchlist items, and other count displays
//  */

// export interface CountBubbleOptions {
//   /** CSS classes for the bubble element */
//   bubbleClasses?: string;
//   /** CSS classes for the parent element when it has a count */
//   parentClasses?: string;
//   /** Maximum count to display (e.g., 99+ for counts over 99) */
//   maxCount?: number;
//   /** Whether to show the bubble when count is 0 */
//   showZero?: boolean;
// }

// const DEFAULT_OPTIONS: CountBubbleOptions = {
//   bubbleClasses:
//     "absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white dark:bg-primary-dark animate-pulse",
//   parentClasses: "relative",
//   maxCount: 99,
//   showZero: false,
// };

// /**
//  * Updates or creates a count bubble on a parent element
//  * @param parentElement - The element to attach the count bubble to
//  * @param count - The count value to display
//  * @param options - Configuration options for the bubble
//  * @returns The count bubble element
//  */
// export function updateCountBubble(
//   parentElement: HTMLElement,
//   count: number,
//   options: CountBubbleOptions = {}
// ): HTMLSpanElement | null {
//   if (!parentElement) {
//     console.warn("🔍 [COUNT-BUBBLE] Parent element is null or undefined");
//     return null;
//   }

//   const config = { ...DEFAULT_OPTIONS, ...options };

//   // Find existing bubble or create new one
//   let countBubble = parentElement.querySelector(".count-bubble") as HTMLSpanElement;

//   if (count > 0 || config.showZero) {
//     // Create bubble if it doesn't exist
//     if (!countBubble) {
//       countBubble = document.createElement("span");
//       countBubble.className = `count-bubble ${config.bubbleClasses}`;

//       // Add parent classes if specified
//       if (config.parentClasses) {
//         parentElement.classList.add(...config.parentClasses.split(" "));
//       }

//       parentElement.appendChild(countBubble);
//       console.log("🔍 [COUNT-BUBBLE] Created new bubble for element:", parentElement);
//     }

//     // Update bubble content and visibility
//     const displayCount =
//       count > (config.maxCount || 99) ? `${config.maxCount || 99}+` : count.toString();
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
//  * Removes a count bubble from a parent element
//  * @param parentElement - The element to remove the bubble from
//  */
// export function removeCountBubble(parentElement: HTMLElement): void {
//   if (!parentElement) return;

//   const countBubble = parentElement.querySelector(".count-bubble");
//   if (countBubble) {
//     countBubble.remove();
//     parentElement.removeAttribute("data-count");
//     console.log("🔍 [COUNT-BUBBLE] Removed bubble from element:", parentElement);
//   }
// }

// /**
//  * Gets the current count from a parent element's data attribute
//  * @param parentElement - The element to get the count from
//  * @returns The current count or 0 if not found
//  */
// export function getCountBubbleValue(parentElement: HTMLElement): number {
//   if (!parentElement) return 0;

//   const countAttr = parentElement.getAttribute("data-count");
//   return countAttr ? parseInt(countAttr, 10) || 0 : 0;
// }

// /**
//  * Preset configurations for common use cases
//  * Note: The default style is the standard for most use cases
//  * Only use these presets if you have a specific need
//  */
// export const COUNT_BUBBLE_PRESETS = {
//   /** Standard default - same as DEFAULT_OPTIONS */
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
// } as const;
