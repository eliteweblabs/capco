/**
 * UX Utility Functions
 * Common user experience utilities used across the application
 */

/**
 * Scrolls to the top of the page on mobile devices
 * Only triggers on screens smaller than 768px (mobile breakpoint)
 */
export function scrollToTopOnMobile(): void {
  // Check if device is mobile (screen width < 768px)
  if (window.innerWidth < 768) {
    console.log("📱 [UX-UTILS] Scrolling to top on mobile device");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

/**
 * Scrolls to the top of the page on any device
 * @param behavior - Scroll behavior ('smooth' | 'instant' | 'auto')
 */
export function scrollToTop(behavior: ScrollBehavior = "smooth"): void {
  console.log("📱 [UX-UTILS] Scrolling to top");
  window.scrollTo({ top: 0, behavior });
}

/**
 * Checks if the current device is mobile
 * @returns true if screen width is less than 768px
 */
export function isMobile(): boolean {
  return window.innerWidth < 768;
}

/**
 * Checks if the current device is tablet
 * @returns true if screen width is between 768px and 1024px
 */
export function isTablet(): boolean {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

/**
 * Checks if the current device is desktop
 * @returns true if screen width is 1024px or larger
 */
export function isDesktop(): boolean {
  return window.innerWidth >= 1024;
}

/**
 * Gets the current viewport size category
 * @returns 'mobile' | 'tablet' | 'desktop'
 */
export function getViewportSize(): "mobile" | "tablet" | "desktop" {
  if (isMobile()) return "mobile";
  if (isTablet()) return "tablet";
  return "desktop";
}

/**
 * Debounce function to limit the rate of function execution
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit the rate of function execution
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Hides elements when users focus on form inputs
 * Useful for hiding floating elements like speed dials that get in the way
 * @param elementSelector - CSS selector for the element to hide (e.g., '#sticky-container')
 * @param mobileOnly - If true, only hides on mobile devices (default: false)
 */
export function hideOnFormFocus(elementSelector: string, mobileOnly: boolean = false): void {
  // Check if we should only hide on mobile
  if (mobileOnly && !isMobile()) return;

  const element = document.querySelector(elementSelector);
  if (!element) return;

  // Hide on input focus
  const hideOnFocus = () => {
    (element as HTMLElement).style.display = "none";
  };

  // Show on input blur
  const showOnBlur = () => {
    (element as HTMLElement).style.display = "block";
  };

  // Add event listeners to all form inputs
  const inputs = document.querySelectorAll("input, textarea, select, [contenteditable]");
  inputs.forEach((input) => {
    input.addEventListener("focus", hideOnFocus);
    input.addEventListener("blur", showOnBlur);
  });

  // Also handle dynamic content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const newInputs = element.querySelectorAll("input, textarea, select, [contenteditable]");
          newInputs.forEach((input) => {
            input.addEventListener("focus", hideOnFocus);
            input.addEventListener("blur", showOnBlur);
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Hides elements when mobile users focus on form inputs
 * Useful for hiding floating elements like speed dials that get in the way
 * @param elementSelector - CSS selector for the element to hide (e.g., '#sticky-container')
 * @deprecated Use hideOnFormFocus with mobileOnly: true instead
 */
export function hideOnMobileInput(elementSelector: string): void {
  hideOnFormFocus(elementSelector, true);
}

/**
 * Detects if the current browser is Safari on iOS
 * @returns true if running on Safari iOS
 */
export function isSafariIOS(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

/**
 * Detects if the current browser is Safari (any platform)
 * @returns true if running on Safari
 */
export function isSafari(): boolean {
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
}

export function isSafari18OrLater(): boolean {
  const ua = navigator.userAgent;
  // Safari 18+ (including final release) still has viewport bugs
  return (
    /Safari/.test(ua) && /Version\/(18|19|20)\./.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua)
  );
}

/**
 * Fixes Safari viewport positioning issues (Safari 18 beta and earlier)
 * Only runs on Safari browsers to avoid unnecessary processing
 */

// not called
// export function fixSafariViewport(): void {
//   if (!isSafari()) {
//     return; // Only run on Safari
//   }

//   const isSafari18 = isSafariBeta();
//   console.log(
//     `🍎 [UX-UTILS] Fixing Safari viewport positioning${isSafari18 ? " (Safari 18 Beta)" : ""}`
//   );

// AGGRESSIVE FIXES - Force all elements to stay in place

// Fix sticky container (SpeedDial) - FORCE POSITIONING
// const container = document.getElementById("sticky-container");
// if (container) {
//   let containerStyles = `
//     position: fixed !important;
//     bottom: 1.5rem !important;
//     left: 1.5rem !important;
//     z-index: 40 !important;
//     transform: translateZ(0) !important;
//     will-change: transform !important;
//     display: inline !important;
//   `;

//   // Safari 18 beta specific fixes
//   if (isSafari18) {
//     containerStyles += `
//       /* Safari 18 beta specific fixes */
//       contain: layout style paint !important;
//       isolation: isolate !important;
//       backface-visibility: hidden !important;
//       -webkit-transform: translateZ(0) !important;
//       -webkit-backface-visibility: hidden !important;
//     `;
//   }

//   container.style.cssText = containerStyles;
//   container.setAttribute("data-fixed", "true");
//   container.setAttribute("data-safari18", isSafari18 ? "true" : "false");
// }

// Fix SMS form panel - FORCE POSITIONING
//   const panel = document.getElementById("sms-form-panel");
//   if (panel) {
//     panel.style.cssText = `
//       position: fixed !important;
//       bottom: 6rem !important;
//       left: 1.5rem !important;
//       z-index: 50 !important;
//       transform: translateZ(0) !important;
//       will-change: transform !important;
//     `;
//     panel.setAttribute("data-fixed", "true");
//   }

//   // Fix header positioning - FORCE STICKY
//   const header = document.querySelector("header");
//   if (header) {
//     let headerStyles = `
//       position: sticky !important;
//       top: 0 !important;
//       z-index: 30 !important;
//       transform: translateZ(0) !important;
//       will-change: transform !important;
//     `;

//     // Safari 18 beta specific fixes
//     if (isSafari18) {
//       headerStyles += `
//         /* Safari 18 beta specific fixes */
//         contain: layout style paint !important;
//         isolation: isolate !important;
//         backface-visibility: hidden !important;
//         -webkit-transform: translateZ(0) !important;
//         -webkit-backface-visibility: hidden !important;
//         /* Force header to stay at top */
//         position: -webkit-sticky !important;
//         position: sticky !important;
//       `;
//     }

//     header.style.cssText = headerStyles;
//     header.setAttribute("data-safari18", isSafari18 ? "true" : "false");
//   }
// }

/**
 * IMMEDIATE Safari viewport fix - runs before DOM is ready
 * This fixes the initial load issue where sticky elements don't work
 */
export function immediateSafariViewportFix(): void {
  // ONLY RUN ON iOS SAFARI - Skip all other browsers
  if (!isSafariIOS()) {
    return;
  }

  console.log("🚀 [UX-UTILS] IMMEDIATE Safari viewport fix - Running before DOM ready");

  // Force viewport height calculation immediately
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
    console.log(`📐 [UX-UTILS] IMMEDIATE viewport height: ${vh}px`);
  };

  // Set viewport height immediately
  setViewportHeight();

  // Force sticky elements to work immediately
  const forceImmediatePositioning = () => {
    console.log("🚀 [UX-UTILS] IMMEDIATE positioning fix");

    // Fix header immediately if it exists
    const header = document.querySelector("header");
    if (header) {
      header.style.cssText = `
        position: sticky !important;
        position: -webkit-sticky !important;
        top: 0 !important;
        z-index: 9998 !important;
        transform: translate3d(0, 0, 0) !important;
        will-change: transform !important;
        contain: layout style paint !important;
        isolation: isolate !important;
        backface-visibility: hidden !important;
        -webkit-transform: translate3d(0, 0, 0) !important;
        -webkit-backface-visibility: hidden !important;
      `;
      console.log("🚀 [UX-UTILS] IMMEDIATE header fix applied");
    }

    // Fix sticky container immediately if it exists
    const container = document.getElementById("sticky-container");
    if (container) {
      container.style.cssText = `
        position: fixed !important;
        bottom: 1.5rem !important;
        left: 1.5rem !important;
        z-index: 9999 !important;
        transform: translate3d(0, 0, 0) !important;
        will-change: transform !important;
        contain: layout style paint !important;
        isolation: isolate !important;
        backface-visibility: hidden !important;
        -webkit-transform: translate3d(0, 0, 0) !important;
        -webkit-backface-visibility: hidden !important;
      `;
      console.log("🚀 [UX-UTILS] IMMEDIATE container fix applied");
    }
  };

  // Apply immediately
  forceImmediatePositioning();

  // Re-apply on orientation change with delay
  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      setViewportHeight();
      forceImmediatePositioning();
    }, 100);
  });

  // Re-apply on resize
  window.addEventListener("resize", () => {
    setViewportHeight();
    forceImmediatePositioning();
  });
}

/**
 * Sets up responsive viewport handling for all elements
 * Handles resize, orientation change, and other viewport events
 */
export function setupViewportHandling(): void {
  // ONLY RUN ON iOS SAFARI - Skip all other browsers
  if (!isSafariIOS()) {
    console.log("🌐 [UX-UTILS] Not iOS Safari - Skipping viewport fixes");
    return;
  }

  console.log("🍎 [UX-UTILS] iOS Safari detected - Applying viewport fixes");

  // SAFARI 18+ DETECTION - Disable problematic features (including final release)
  const isSafari18Plus = isSafari18OrLater();

  if (isSafari18Plus) {
    console.log("🍎 [UX-UTILS] Safari 18+ detected - Using fallback mode");

    // Show user notification about Safari 18+ viewport issues
    if (typeof (window as any).showModal === "function") {
      (window as any).showModal(
        "info",
        "Safari Viewport Issues Detected",
        "Safari 18+ has known viewport positioning bugs that affect sticky headers and fixed elements. This is a WebKit engine issue. For the best experience, please use Chrome, Firefox, or Safari 17.",
        5000
      );
    }

    // Disable sticky positioning on Safari 18+ (including final release)
    const header = document.querySelector("header");
    if (header) {
      header.style.setProperty("position", "relative", "important");
      header.style.setProperty("top", "0", "important");
      console.log("🍎 [UX-UTILS] Header set to relative positioning");
    }

    const container = document.getElementById("sticky-container");
    if (container) {
      container.style.setProperty("position", "absolute", "important");
      container.style.setProperty("bottom", "1.5rem", "important");
      container.style.setProperty("left", "1.5rem", "important");
      console.log("🍎 [UX-UTILS] Sticky container set to absolute positioning");
    }

    return; // Skip all other viewport handling
  }

  // SAFARI 18 BETA VIEWPORT FIX - Official workaround
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
    console.log(`📐 [UX-UTILS] Setting viewport height: ${vh}px`);
  };

  // Set viewport height immediately
  // setViewportHeight();

  // Recalculate on resize
  // window.addEventListener("resize", setViewportHeight);
  // window.addEventListener("orientationchange", () => {
  //   setTimeout(setViewportHeight, 100);
  // });

  // NUCLEAR OPTION - Force elements to stay in place
  const forcePositioning = () => {
    console.log("🚀 [UX-UTILS] NUCLEAR OPTION - Forcing positioning");

    // Force sticky container with multiple techniques
    const container = document.getElementById("sticky-container");
    if (container) {
      // Remove all existing styles first
      container.removeAttribute("style");
      container.removeAttribute("class");

      // Apply nuclear positioning
      container.style.setProperty("position", "fixed", "important");
      container.style.setProperty("bottom", "1.5rem", "important");
      container.style.setProperty("left", "1.5rem", "important");
      container.style.setProperty("z-index", "9999", "important");
      container.style.setProperty("transform", "translate3d(0, 0, 0)", "important");
      container.style.setProperty("will-change", "transform", "important");
      container.style.setProperty("display", "inline-block", "important");
      container.style.setProperty("width", "auto", "important");
      container.style.setProperty("height", "auto", "important");
      container.style.setProperty("max-width", "none", "important");
      container.style.setProperty("max-height", "none", "important");
      container.style.setProperty("contain", "layout style paint", "important");
      container.style.setProperty("isolation", "isolate", "important");
      container.style.setProperty("backface-visibility", "hidden", "important");
      container.style.setProperty("-webkit-transform", "translate3d(0, 0, 0)", "important");
      container.style.setProperty("-webkit-backface-visibility", "hidden", "important");

      // Force it to stay in place with JavaScript
      const rect = container.getBoundingClientRect();
      if (rect.bottom > window.innerHeight || rect.left < 0 || rect.top < 0) {
        container.style.setProperty("bottom", "1.5rem", "important");
        container.style.setProperty("left", "1.5rem", "important");
        container.style.setProperty("top", "auto", "important");
        container.style.setProperty("right", "auto", "important");
      }
    }

    // NUCLEAR HEADER FIX - Override everything
    const header = document.querySelector("header");
    if (header) {
      console.log("🚨 [UX-UTILS] NUCLEAR HEADER FIX - Forcing header position");

      // Remove ALL existing styles and classes
      header.removeAttribute("style");
      header.removeAttribute("class");

      // Apply nuclear positioning with CSS text override
      header.style.cssText = `
        position: sticky !important;
        position: -webkit-sticky !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        z-index: 9998 !important;
        transform: translate3d(0, 0, 0) !important;
        will-change: transform !important;
        contain: layout style paint !important;
        isolation: isolate !important;
        backface-visibility: hidden !important;
        -webkit-transform: translate3d(0, 0, 0) !important;
        -webkit-backface-visibility: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        background: var(--background-light, #ffffff) !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
      `;

      // Force it to stay at top with JavaScript
      const rect = header.getBoundingClientRect();
      if (rect.top > 0) {
        console.log("🚨 [UX-UTILS] Header moved, forcing back to top");
        header.style.setProperty("top", "0", "important");
        header.style.setProperty("transform", "translate3d(0, 0, 0)", "important");
        header.style.setProperty("position", "sticky", "important");
        header.style.setProperty("position", "-webkit-sticky", "important");
      }
    }
  };

  // Apply immediately
  // forcePositioning();

  // Event listeners for viewport fixes
  // window.addEventListener("resize", forcePositioning);
  // window.addEventListener("orientationchange", () => {
  //   setTimeout(forcePositioning, 100);
  // });
  // window.addEventListener("scroll", forcePositioning);
  // window.addEventListener("focus", forcePositioning);
  // window.addEventListener("blur", forcePositioning);
  // window.addEventListener("touchstart", forcePositioning);
  // window.addEventListener("touchend", forcePositioning);
  // window.addEventListener("touchmove", forcePositioning);

  // NUCLEAR periodic check (every 500ms for ALL browsers)
  // setInterval(forcePositioning, 500);

  // Additional nuclear checks
  // setInterval(() => {
  //   const container = document.getElementById("sticky-container");
  //   const header = document.querySelector("header");

  //   if (container) {
  //     const rect = container.getBoundingClientRect();
  //     if (rect.bottom > window.innerHeight || rect.left < 0 || rect.top < 0) {
  //       console.log("🚨 [UX-UTILS] Container out of bounds, forcing position");
  //       forcePositioning();
  //     }
  //   }

  //   if (header) {
  //     const rect = header.getBoundingClientRect();
  //     if (rect.top > 0) {
  //       console.log("🚨 [UX-UTILS] Header out of bounds, forcing position");
  //       // Force header immediately
  //       header.style.setProperty("position", "sticky", "important");
  //       header.style.setProperty("position", "-webkit-sticky", "important");
  //       header.style.setProperty("top", "0", "important");
  //       header.style.setProperty("transform", "translate3d(0, 0, 0)", "important");
  //       forcePositioning();
  //     }
  //   }
  // }, 250);

  // EXTRA AGGRESSIVE header check every 100ms
  // setInterval(() => {
  //   const header = document.querySelector("header");
  //   if (header) {
  //     const rect = header.getBoundingClientRect();
  //     if (rect.top > 0) {
  //       console.log("🚨 [UX-UTILS] EXTRA AGGRESSIVE - Header moved, forcing back");
  //       header.style.cssText = `
  //         position: sticky !important;
  //         position: -webkit-sticky !important;
  //         top: 0 !important;
  //         left: 0 !important;
  //         right: 0 !important;
  //         width: 100% !important;
  //         z-index: 9998 !important;
  //         transform: translate3d(0, 0, 0) !important;
  //         will-change: transform !important;
  //         contain: layout style paint !important;
  //         isolation: isolate !important;
  //         backface-visibility: hidden !important;
  //         -webkit-transform: translate3d(0, 0, 0) !important;
  //         -webkit-backface-visibility: hidden !important;
  //       `;
  //     }
  //   }
  // }, 100);

  // Use MutationObserver to catch DOM changes that might reset positioning
  // const observer = new MutationObserver((mutations) => {
  //   let shouldFix = false;
  //   mutations.forEach((mutation) => {
  //     if (
  //       mutation.type === "attributes" &&
  //       (mutation.attributeName === "style" || mutation.attributeName === "class")
  //     ) {
  //       shouldFix = true;
  //     }
  //   });

  //   if (shouldFix && isSafari()) {
  //     setTimeout(applySafariFix, 50);
  //   }
  // });

  // // Start observing
  // observer.observe(document.body, {
  //   attributes: true,
  //   subtree: true,
  //   attributeFilter: ["style", "class"],
  // });
}

/**
 * Ensures elements stay within viewport bounds
 * @param elementId - ID of element to check
 * @param fallbackPosition - Fallback positioning if element is out of bounds
 */
export function ensureViewportBounds(
  elementId: string,
  fallbackPosition: { top?: string; bottom?: string; left?: string; right?: string } = {}
): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // Check if element is out of viewport
  const isOutOfBounds =
    rect.right > viewport.width || rect.left < 0 || rect.bottom > viewport.height || rect.top < 0;

  if (isOutOfBounds) {
    console.log(
      `📐 [UX-UTILS] Element ${elementId} is out of viewport, applying fallback positioning`
    );

    // Apply fallback positioning
    if (fallbackPosition.top) {
      element.style.setProperty("top", fallbackPosition.top, "important");
    }
    if (fallbackPosition.bottom) {
      element.style.setProperty("bottom", fallbackPosition.bottom, "important");
    }
    if (fallbackPosition.left) {
      element.style.setProperty("left", fallbackPosition.left, "important");
    }
    if (fallbackPosition.right) {
      element.style.setProperty("right", fallbackPosition.right, "important");
    }
  }
}

/**
 * Locks body scroll to prevent background scrolling (especially for Safari iOS)
 * Uses multiple techniques to ensure scroll is locked on all browsers
 */
export function lockBodyScroll(): void {
  const body = document.body;
  const html = document.documentElement;

  // Store original values
  const originalBodyOverflow = body.style.overflow;
  const originalBodyPosition = body.style.position;
  const originalBodyTop = body.style.top;
  const originalBodyWidth = body.style.width;
  const originalHtmlOverflow = html.style.overflow;

  // Get current scroll position
  const scrollY = window.scrollY;

  // Apply multiple scroll lock techniques
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.width = "100%";
  html.style.overflow = "hidden";

  // Safari iOS specific fixes
  if (isSafariIOS()) {
    // Prevent elastic scrolling
    (body as any).style.webkitOverflowScrolling = "auto";
    body.style.overscrollBehavior = "none";

    // Add touch-action prevention
    body.style.touchAction = "none";

    // Prevent zoom on double tap
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      );
    }
  }

  // Store cleanup function on body for later use
  (body as any).__scrollLockCleanup = () => {
    body.style.overflow = originalBodyOverflow;
    body.style.position = originalBodyPosition;
    body.style.top = originalBodyTop;
    body.style.width = originalBodyWidth;
    html.style.overflow = originalHtmlOverflow;

    if (isSafariIOS()) {
      (body as any).style.webkitOverflowScrolling = "";
      body.style.overscrollBehavior = "";
      body.style.touchAction = "";

      // Restore viewport
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute("content", "width=device-width, initial-scale=1.0");
      }
    }

    // Restore scroll position
    window.scrollTo(0, scrollY);
  };
}

/**
 * Unlocks body scroll and restores original state
 */
export function unlockBodyScroll(): void {
  const body = document.body;
  const cleanup = (body as any).__scrollLockCleanup;

  if (cleanup) {
    cleanup();
    delete (body as any).__scrollLockCleanup;
  } else {
    // Fallback cleanup
    body.style.overflow = "";
    body.style.position = "";
    body.style.top = "";
    body.style.width = "";
    document.documentElement.style.overflow = "";

    if (isSafariIOS()) {
      (body as any).style.webkitOverflowScrolling = "";
      body.style.overscrollBehavior = "";
      body.style.touchAction = "";
    }
  }
}

/**
 * Validates email format using a standard regex pattern
 * @param email - Email address to validate
 * @returns null if valid, error message string if invalid
 */
export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? null : "Invalid email format";
}
