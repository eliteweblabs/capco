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
 * Hides elements when mobile users focus on form inputs
 * Useful for hiding floating elements like speed dials that get in the way
 * @param elementSelector - CSS selector for the element to hide (e.g., '#sticky-container')
 */
export function hideOnMobileInput(elementSelector: string): void {
  if (!isMobile()) return;

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
  const inputs = document.querySelectorAll("input, textarea, select");
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
          const newInputs = element.querySelectorAll("input, textarea, select");
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
