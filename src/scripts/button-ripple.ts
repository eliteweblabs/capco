/**
 * Button Ripple Effect
 * Adds Material Design-inspired ripple animations to buttons using ::before pseudo-element
 * - Click ripple: Fast ripple from click position (350ms)
 * - Focus ripple: Slow ripple from center (350ms)
 */

interface RippleOptions {
  type: "click" | "focus";
  x?: number;
  y?: number;
}

/**
 * Finds the actual button element, traversing up from clicked element
 * @param target - The element that was clicked (may be a child node; must be an Element)
 * @returns The button element or null
 */
function findButtonElement(target: EventTarget | null): HTMLElement | null {
  // Guard: target may be a Text node, Document, or non-Element (no getAttribute)
  const start =
    target && typeof (target as Element).getAttribute === "function"
      ? (target as HTMLElement)
      : null;
  if (!start) return null;
  let element: HTMLElement | null = start;
  while (element) {
    if (
      element.tagName === "BUTTON" ||
      (element.tagName === "A" && element.getAttribute("role") === "button") ||
      element.getAttribute("role") === "button"
    ) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
}

/**
 * Creates a ripple effect on a button element using CSS variables and classes
 * @param button - The button element to add ripple to
 * @param options - Ripple configuration (type, position)
 */
function createRipple(button: HTMLElement, options: RippleOptions): void {
  // Remove any existing animation classes
  button.classList.remove("ripple-active", "ripple-focus");

  // Configure based on type
  if (options.type === "click" && options.x !== undefined && options.y !== undefined) {
    // Click ripple - position at click coordinates
    const rect = button.getBoundingClientRect();

    // Calculate size of ripple (large enough to cover button)
    const size = Math.max(rect.width, rect.height) * 2;

    // Calculate position relative to button (as percentage)
    const x = ((options.x - rect.left) / rect.width) * 100;
    const y = ((options.y - rect.top) / rect.height) * 100;

    // Set CSS variables for ripple position and size
    button.style.setProperty("--ripple-x", `${x}%`);
    button.style.setProperty("--ripple-y", `${y}%`);
    button.style.setProperty("--ripple-size", `${size}px`);

    // Trigger animation by adding class
    button.classList.add("ripple-active");

    // Remove class after animation completes
    setTimeout(() => {
      button.classList.remove("ripple-active");
    }, 350);
  } else if (options.type === "focus") {
    // Focus ripple - centered
    button.style.setProperty("--ripple-x", "50%");
    button.style.setProperty("--ripple-y", "50%");
    button.style.setProperty("--ripple-size", "100%");

    // Trigger animation by adding class
    button.classList.add("ripple-focus");

    // Remove class after animation completes
    setTimeout(() => {
      button.classList.remove("ripple-focus");
    }, 350);
  }
}

/**
 * Initializes ripple effects for all buttons
 */
function initButtonRipples(): void {
  console.log("[BUTTON-RIPPLE] Initializing button ripple effects...");

  // Track recently clicked buttons to prevent double ripple (click + focus)
  const recentlyClicked = new WeakMap<HTMLElement, number>();
  const CLICK_FOCUS_DELAY = 500; // ms - time to ignore focus after click

  // Track if the current focus event is from mouse interaction
  let focusFromMouse = false;

  // Detect mouse usage on buttons specifically
  document.addEventListener(
    "mousedown",
    (e) => {
      const target = e.target as HTMLElement;
      const button = findButtonElement(target);
      if (button) {
        focusFromMouse = true;
      }
    },
    true
  );

  // Reset when keyboard is used
  document.addEventListener(
    "keydown",
    (e) => {
      // Only reset on Tab or navigation keys
      if (
        e.key === "Tab" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        focusFromMouse = false;
      }
    },
    true
  );

  // Handle click ripples using event delegation
  document.addEventListener(
    "click",
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Find the actual button element (traverse up if clicked on child element like span/icon)
      const button = findButtonElement(target);

      if (button && !button.hasAttribute("disabled") && !button.hasAttribute("aria-disabled")) {
        // Mark button as recently clicked
        recentlyClicked.set(button, Date.now());

        createRipple(button, {
          type: "click",
          x: e.clientX,
          y: e.clientY,
        });
      }
    },
    true
  );

  // Handle focus ripples using event delegation
  document.addEventListener(
    "focus",
    (e: FocusEvent) => {
      const target = e.target as HTMLElement;

      // Find the actual button element
      const button = findButtonElement(target);

      if (button && !button.hasAttribute("disabled") && !button.hasAttribute("aria-disabled")) {
        // Check if this focus is from a recent click
        const lastClick = recentlyClicked.get(button);
        const timeSinceClick = lastClick ? Date.now() - lastClick : Infinity;

        // Only show focus ripple if:
        // 1. Focus was NOT from a recent click, AND
        // 2. Focus was NOT from mouse interaction
        if (timeSinceClick > CLICK_FOCUS_DELAY && !focusFromMouse) {
          console.log("[BUTTON-RIPPLE] Focus ripple on:", button);
          createRipple(button, { type: "focus" });
        } else {
          console.log("[BUTTON-RIPPLE] Skipping focus ripple (from mouse/click):", button);
        }

        // Reset focusFromMouse after handling focus
        if (focusFromMouse) {
          focusFromMouse = false;
        }
      }
    },
    true
  );

  console.log("[BUTTON-RIPPLE] Button ripple effects initialized");
}

// Initialize immediately (not waiting for DOMContentLoaded)
initButtonRipples();

export { createRipple, initButtonRipples, findButtonElement };
