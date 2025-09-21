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

/**
 * Fixes Safari viewport positioning issues (Safari 18 beta and earlier)
 * Only runs on Safari browsers to avoid unnecessary processing
 */
export function fixSafariViewport(): void {
  if (!isSafari()) {
    return; // Only run on Safari
  }

  console.log("🍎 [UX-UTILS] Fixing Safari viewport positioning");

  // Fix sticky container (SpeedDial) - LEFT ONLY
  const container = document.getElementById("sticky-container");
  if (container) {
    container.style.setProperty("position", "fixed", "important");
    container.style.setProperty("bottom", "1.5rem", "important");
    container.style.setProperty("left", "1.5rem", "important");
    container.style.removeProperty("right"); // Remove any right positioning
    container.style.setProperty("z-index", "40", "important");
    container.style.setProperty("transform", "translateZ(0)", "important");
  }

  // Fix SMS form panel - LEFT ONLY
  const panel = document.getElementById("sms-form-panel");
  if (panel) {
    panel.style.setProperty("position", "fixed", "important");
    panel.style.setProperty("bottom", "6rem", "important");
    panel.style.setProperty("left", "1.5rem", "important");
    panel.style.removeProperty("right"); // Remove any right positioning
    panel.style.setProperty("z-index", "50", "important");
    panel.style.setProperty("transform", "translateZ(0)", "important");
  }

  // Fix header positioning
  const header = document.querySelector("header");
  if (header) {
    header.style.setProperty("position", "sticky", "important");
    header.style.setProperty("top", "0", "important");
    header.style.setProperty("z-index", "30", "important");
    header.style.setProperty("transform", "translateZ(0)", "important");
  }
}

/**
 * Sets up responsive viewport handling for all elements
 * Handles resize, orientation change, and other viewport events
 */
export function setupViewportHandling(): void {
  // Safari viewport fix
  const applySafariFix = () => {
    if (isSafari()) {
      fixSafariViewport();
    }
  };

  // Apply on load
  applySafariFix();

  // Event listeners for Safari viewport fixes
  window.addEventListener("resize", applySafariFix);
  window.addEventListener("orientationchange", () => {
    setTimeout(applySafariFix, 100);
  });
  window.addEventListener("scroll", applySafariFix);
  window.addEventListener("focus", applySafariFix);
  window.addEventListener("blur", applySafariFix);

  // Periodic check for Safari (every 2 seconds)
  if (isSafari()) {
    setInterval(applySafariFix, 2000);
  }

  // Responsive behavior for all elements
  window.addEventListener("resize", () => {
    // Handle responsive visibility
    const container = document.getElementById("sticky-container");
    if (container && window.innerWidth >= 768) {
      container.style.opacity = "1";
    }
  });

  // Use MutationObserver to catch DOM changes that might reset positioning
  const observer = new MutationObserver((mutations) => {
    let shouldFix = false;
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        (mutation.attributeName === "style" || mutation.attributeName === "class")
      ) {
        shouldFix = true;
      }
    });

    if (shouldFix && isSafari()) {
      setTimeout(applySafariFix, 50);
    }
  });

  // Start observing
  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ["style", "class"],
  });
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
 * Handles URL parameter notifications (errors and success messages)
 * @param type - Notification type ('error' | 'success')
 * @param param - URL parameter value
 */
export function handleUrlNotification(type: "error" | "success", param: string): void {
  const notifications = {
    // Error notifications
    error: {
      oauth_failed: {
        title: "Authentication Failed",
        message: "OAuth authentication failed. Please try again.",
      },
      verification_failed: {
        title: "Verification Failed",
        message: "Email verification failed. Please try again.",
      },
      verification_expired: {
        title: "Link Expired",
        message: "Verification link has expired. Please request a new one.",
      },
      verification_invalid: {
        title: "Invalid Link",
        message: "Invalid verification link.",
      },
      verification_error: {
        title: "Verification Error",
        message: "An error occurred during verification.",
      },
      no_token: {
        title: "Invalid Token",
        message: "Invalid or missing verification token.",
      },
      no_user: { title: "User Not Found", message: "User not found." },
      invalid_credentials: {
        title: "Invalid Credentials",
        message: "Invalid email or password.",
      },
      email_exists: {
        title: "Account Exists",
        message: "An account with this email already exists.",
      },
      weak_password: {
        title: "Weak Password",
        message: "Password must be at least 6 characters long.",
      },
      invalid_email: {
        title: "Invalid Email",
        message: "Please enter a valid email address.",
      },
      sms_missing_fields: {
        title: "SMS Error",
        message: "Please fill in all required fields for SMS.",
      },
      sms_invalid_phone: {
        title: "Invalid Phone",
        message: "Please enter a valid 10-digit phone number.",
      },
      sms_invalid_carrier: {
        title: "Invalid Carrier",
        message: "Please select a valid carrier.",
      },
      sms_send_failed: {
        title: "SMS Failed",
        message: "Failed to send SMS. Please try again.",
      },
      sms_email_error: {
        title: "Service Error",
        message: "Email service error. Please try again later.",
      },
      sms_unexpected_error: {
        title: "SMS Error",
        message: "An unexpected error occurred while sending SMS.",
      },
      default: { title: "Error", message: "An error occurred. Please try again." },
    },
    // Success notifications
    success: {
      registration_success: {
        title: "Account Created",
        message: "Registration successful! Please check your email to verify your account.",
      },
      verification_success: {
        title: "Email Verified",
        message: "Email verified successfully! You can now sign in.",
      },
      welcome: {
        title: "Welcome!",
        message: "Welcome! Your account has been verified and you're now signed in.",
      },
      logout_success: {
        title: "Signed Out",
        message: "You have been successfully signed out.",
        redirect: { url: "/", delay: 2500, showCountdown: true },
      },
      sms_sent_success: {
        title: "Message Sent",
        message: "Your message has been sent to CAPCo successfully.",
      },
      default: { title: "Success!", message: param },
    },
  };

  const notification = (notifications[type] as any)[param] || notifications[type].default;

  if ((window as any).showModal) {
    // Use global UX utility function for mobile scroll
    scrollToTopOnMobile();

    if (type === "error") {
      (window as any).showModal("error", notification.title, notification.message);
    } else {
      (window as any).showModal(
        notification.title,
        notification.message,
        "success",
        2500,
        notification.redirect
      );
    }
  } else {
    console.error(`🔔 [${notification.title}] ${notification.message}`);
  }

  // Clean up URL parameters
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete(type === "error" ? "error" : "message");
  window.history.replaceState({}, document.title, currentUrl.toString());
}
