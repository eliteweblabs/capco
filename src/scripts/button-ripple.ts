/**
 * Button Ripple Effect
 * Adds Material Design-inspired ripple animations to buttons
 * - Click ripple: Fast ripple from click position (600ms)
 * - Focus ripple: Slow ripple from center (1200ms)
 */

interface RippleOptions {
  type: "click" | "focus";
  x?: number;
  y?: number;
}

/**
 * Creates a ripple effect on a button element
 * @param button - The button element to add ripple to
 * @param options - Ripple configuration (type, position)
 */
function createRipple(button: HTMLElement, options: RippleOptions): void {
  // Remove any existing focus ripples to prevent duplicates
  if (options.type === "focus") {
    const existingFocusRipple = button.querySelector(".focus-ripple");
    if (existingFocusRipple) {
      existingFocusRipple.remove();
    }
  }

  // Create ripple element
  const ripple = document.createElement("span");
  ripple.classList.add("button-ripple");

  // Configure based on type
  if (options.type === "click" && options.x !== undefined && options.y !== undefined) {
    // Click ripple - position at click coordinates
    ripple.classList.add("click-ripple");

    const rect = button.getBoundingClientRect();
    
    // Calculate size of ripple (large enough to cover button)
    const size = Math.max(rect.width, rect.height) * 2;
    
    // Calculate position relative to button
    const x = options.x - rect.left;
    const y = options.y - rect.top;

    // Set ripple size and position (centered on click point)
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.transform = 'translate(-50%, -50%) scale(0)';

    // Remove ripple after animation completes
    setTimeout(() => {
      ripple.remove();
    }, 350);
  } else if (options.type === "focus") {
    // Focus ripple - centered, slower animation
    ripple.classList.add("focus-ripple");

    // Remove ripple after animation completes
    setTimeout(() => {
      ripple.remove();
    }, 350);
  }

  // Add ripple to button
  button.appendChild(ripple);
}

/**
 * Initializes ripple effects for all buttons
 */
function initButtonRipples(): void {
  console.log("[BUTTON-RIPPLE] Initializing button ripple effects...");

  // Track recently clicked buttons to prevent double ripple (click + focus)
  const recentlyClicked = new WeakMap<HTMLElement, number>();
  const CLICK_FOCUS_DELAY = 500; // ms - time to ignore focus after click
  
  // Track if user is using mouse or keyboard
  let lastInteractionWasMouse = false;

  // Detect mouse usage
  document.addEventListener("mousedown", () => {
    lastInteractionWasMouse = true;
  }, true);

  // Detect keyboard usage
  document.addEventListener("keydown", () => {
    lastInteractionWasMouse = false;
  }, true);

  // Handle click ripples using event delegation
  document.addEventListener(
    "click",
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest("button, a[role='button'], [role='button']") as HTMLElement;

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

      // Only apply to buttons (not inputs, textareas, etc.)
      if (
        target &&
        (target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.getAttribute("role") === "button")
      ) {
        const button = target as HTMLElement;

        if (!button.hasAttribute("disabled") && !button.hasAttribute("aria-disabled")) {
          // Check if this focus is from a recent click
          const lastClick = recentlyClicked.get(button);
          const timeSinceClick = lastClick ? Date.now() - lastClick : Infinity;

          // Only show focus ripple if:
          // 1. Focus was NOT from a recent click, AND
          // 2. Last interaction was keyboard (not mouse)
          if (timeSinceClick > CLICK_FOCUS_DELAY && !lastInteractionWasMouse) {
            console.log("[BUTTON-RIPPLE] Focus ripple on:", button);
            createRipple(button, { type: "focus" });
          } else {
            console.log("[BUTTON-RIPPLE] Skipping focus ripple (from mouse/click):", button);
          }
        }
      }
    },
    true
  );

  console.log("[BUTTON-RIPPLE] Button ripple effects initialized");
}

// Initialize immediately (not waiting for DOMContentLoaded)
initButtonRipples();

export { createRipple, initButtonRipples };
