import { getIcon } from "../lib/simple-icons";
import { setupConsoleInterceptor } from "../lib/console-interceptor";

declare global {
  interface Window {
    // Global functions and utilities (alphabetized)
    acceptProposal?: () => void;
    initInputWithIcon?: (root?: Document | Element) => void;
    addNewLineItem?: () => void;
    camelToProper?: (str: string) => string;
    clipboardData?: any;
    createLineItemRow?: (data: any) => HTMLElement;
    createButtonPartial?: (config: any) => Promise<HTMLElement | null>;
    deleteProject?: (projectId: any) => void;
    getProject?: (projectId: string | number) => Promise<any>;
    handleNewStatusModalAndEmail?: any;
    handleUrlNotification?: (type: string, message: string) => void;
    hideOnFormFocus?: (elementSelector: string, mobileOnly?: boolean) => void;
    hideNotification?: any;
    /** Returns scroll position as %; 0–100 = normal, >100 = overscroll past bottom, <0 = overscroll past top */
    getOverscrollPercent?: () => number;
    /** Call when overscroll starts (at boundary + scroll/wheel in overscroll direction). On emulator/desktop only wheel-at-bottom fires. */
    setupOverscrollStart?: (callback: (percent: number, source: "scroll" | "wheel") => void) => () => void;
    // UX Utility Functions
    isDarkMode?: () => boolean;
    currentTheme?: "light" | "dark";
    updateThemeSync?: () => "light" | "dark";
    scrollToTopOnMobile?: () => void;
    scrollToTop?: (behavior?: ScrollBehavior) => void;
    isMobile?: () => boolean;
    isTablet?: () => boolean;
    isDesktop?: () => boolean;
    getViewportSize?: () => "mobile" | "tablet" | "desktop";
    debounce?: <T extends (...args: any[]) => any>(func: T, wait: number) => T;
    throttle?: <T extends (...args: any[]) => any>(func: T, limit: number) => T;
    truncateString?: (str: string, maxLength?: number, suffix?: string) => string;
    hideOnMobileInput?: (elementSelector: string) => void;
    isSafariIOS?: () => boolean;
    isSafari?: () => boolean;
    isSafariBeta?: () => boolean;
    isSafari18OrLater?: () => boolean;
    fixSafariViewport?: () => void;
    immediateSafariViewportFix?: () => void;
    setupViewportHandling?: () => void;
    ensureViewportBounds?: (minHeight?: number, maxHeight?: number) => void;
    lockBodyScroll?: () => void;
    unlockBodyScroll?: () => void;
    // Modal system
    showModal?: (options: {
      id?: string;
      title: string;
      body: string | HTMLElement;
      primaryButtonText?: string;
      secondaryButtonText?: string;
      onConfirm?: () => void | Promise<void>;
      onCancel?: () => void;
      showFooter?: boolean;
      size?: "small" | "medium" | "large" | "xlarge";
      closeOnBackdrop?: boolean;
      closeOnEscape?: boolean;
      zIndex?: number;
    }) => void;
    hideModal?: (modalId: string, resetZIndex?: boolean) => void;
    removeModal?: (modalId: string) => void;
    setModalOverlayZIndex?: (zIndex: number) => void;
    resetModalOverlayZIndex?: () => void;
    initializeSubjectEditing?: () => void;
    proposalHelper?: any;
    proposalManager?: any;
    refreshManager?: any;
    requestPushNotificationPermission?: () => void;
    resetForm?: any;
    resetNotifications?: () => void;
    sendEmail?: (emailData: any, currentUser: any) => Promise<any>;
    setPageLoadStatusActionsFromUrl?: any;
    showNotice?: any;
    switchTab?: any;
    toggleCommentForm?: () => void;
    trimText?: (text: string, maxLength?: number, suffix?: string) => string;
    trimWords?: (text: string, wordLimit?: number, suffix?: string) => string;
    // Typewriter (simple + TypeIt)
    runSimpleTypewriter?: (
      el: HTMLElement,
      options?: { speed?: number; doneClass?: string; dispatchEvent?: boolean }
    ) => void;
    runSimpleTypewriterOnSelector?: (selector: string) => void;
    initTypewriterTexts?: () => void;
    triggerActiveStepTypewriter?: () => void;
    // Sticky Actions Portal System
    initializeStickyActionsPortal?: () => void;
    showStickyActions?: (instanceIdOrElement: string | HTMLElement) => void;
    hideStickyActions?: (instanceIdOrElement?: string | HTMLElement) => void;
    updateCountBubble?: (
      parentElement: HTMLElement,
      count: number,
      options?: any
    ) => HTMLElement | null;
    updateProposalTotal?: () => void;
    updateStatus?: (project: any, newStatus: number, statuses?: any) => Promise<any>;
    validateEmail?: (email: string) => string | null;
    COUNT_BUBBLE_PRESETS?: {
      notification: {
        bubbleClasses: string;
        maxCount: number;
        showZero: boolean;
      };
      punchlist: {
        bubbleClasses: string;
        maxCount: number;
        showZero: boolean;
      };
      small: {
        bubbleClasses: string;
        maxCount: number;
        showZero: boolean;
      };
    };
  }
}

// Setup console interceptor for client-side (filters out image fetch logs)
setupConsoleInterceptor();

// Set Stripe publishable key globally for PaymentForm
(window as any).STRIPE_PUBLISHABLE_KEY = import.meta.env.STRIPE_PUBLISHABLE_KEY;
console.log("🔧 [STRIPE] Publishable key loaded:", !!(window as any).STRIPE_PUBLISHABLE_KEY);

// Helper function to create buttons using Button partial
(window as any).createButtonPartial = async function (config: any) {
  try {
    const headers = new Headers();
    Object.entries(config).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        headers.set(`x-button-${key}`, value.toString());
      }
    });

    const response = await fetch("/partials/button", {
      headers: headers,
    });

    if (response.ok) {
      const buttonHTML = await response.text();
      return buttonHTML; // Return HTML string instead of DOM element
    } else {
      console.error("Failed to fetch button partial:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error creating button partial:", error);
    return null;
  }
};

(window as any).createSimpleIconPartial = async function (config: any) {
  try {
    const headers = new Headers();
    Object.entries(config).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        headers.set(`x-icon-${key}`, value.toString());
      }
    });

    const response = await fetch("/partials/simple-icon", {
      headers: headers,
    });

    if (response.ok) {
      const iconHTML = await response.text();
      return iconHTML; // Return HTML string instead of DOM element
    } else {
      console.error("Failed to fetch simple-icon partial:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error creating simple-icon partial:", error);
    return null;
  }
};

// Helper function to create user avatars using UserAvatar partial
(window as any).createUserAvatarPartial = async function (config: any) {
  try {
    const headers = new Headers();

    // Handle nested user object
    if (config.user) {
      Object.entries(config.user).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          headers.set(
            `x-user-avatar-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`,
            value.toString()
          );
        }
      });
    }

    // Handle other config options
    Object.entries(config).forEach(([key, value]) => {
      if (key !== "user" && value !== undefined && value !== null) {
        headers.set(
          `x-user-avatar-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`,
          value.toString()
        );
      }
    });

    const response = await fetch("/partials/user-avatar", {
      headers: headers,
    });

    if (response.ok) {
      const avatarHTML = await response.text();
      return avatarHTML; // Return HTML string instead of DOM element
    } else {
      console.error("Failed to fetch user-avatar partial:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error creating user-avatar partial:", error);
    return null;
  }
};

if (!String.prototype.startsWith) {
  console.log("🔧 [POLYFILL] Adding startsWith polyfill...");
  String.prototype.startsWith = function (search: string, pos?: number) {
    return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
  };
  console.log("🔧 [POLYFILL] startsWith polyfill added successfully");
}

// Global utility function to convert camelCase to Proper Case
(window as any).camelToProper = (str: string): string => {
  if (!str) return "";

  // Handle special cases first
  const specialCases: { [key: string]: string } = {
    id: "ID",
    url: "URL",
    api: "API",
    sms: "SMS",
    email: "Email",
    phone: "Phone",
    status: "Status",
    project: "Project",
    user: "User",
    admin: "Admin",
    client: "Client",
    staff: "Staff",
    role: "Role",
    name: "Name",
    title: "Title",
    address: "Address",
    created: "Created",
    updated: "Updated",
    completed: "Completed",
    incomplete: "Incomplete",
    failed: "Failed",
    sent: "Sent",
    received: "Received",
    uploaded: "Uploaded",
    downloaded: "Downloaded",
    added: "Added",
    changed: "Changed",
    login: "Login",
    logout: "Logout",
    registration: "Registration",
    action: "Action",
    event: "Event",
    error: "Error",
    info: "Info",
    system: "System",
    notification: "Notification",
    discussion: "Discussion",
    punchlist: "Punchlist",
    proposal: "Proposal",
    assignment: "Assignment",
    comment: "Comment",
    file: "File",
  };

  // Split camelCase into words
  const words = str
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(" ");

  // Convert each word to proper case
  const properWords = words.map((word) => {
    const lowerWord = word.toLowerCase();

    // Check special cases first
    if (specialCases[lowerWord]) {
      return specialCases[lowerWord];
    }

    // Default: capitalize first letter
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return properWords.join(" ");
};

(window as any).hideNotification = function () {
  console.log("[FALLBACK-NOTIFICATION] Hiding notification");
};

// switchTab function is now defined in individual pages that need it
// This prevents conflicts with page-specific tab switching logic

(window as any).handleNewStatusModalAndEmail = function (response: any, context: string) {
  if (!response) {
    console.error(`ERROR [${context || "NOTIFICATION"}] API call failed:`, response.error);
    return;
  }

  if (!response.statusData || !(window as any).showNotice) {
    console.warn(
      `WARNING [${context || "NOTIFICATION"}] No notification data or showNotice function available`
    );
    return;
  }

  // Get the current status configuration
  const clientNotification = response.statusData?.client;
  const adminNotification = response.statusData?.admin;
  const currentNotification = response.statusData?.current;
  const currentUser = response.currentUser;

  clientNotification.email.currentUser = currentUser;
  adminNotification.email.currentUser = currentUser;
  // Send email if email configuration exists
  if (clientNotification?.email) {
    (window as any).sendEmail(clientNotification.email);
  }

  if (adminNotification?.email) {
    (window as any).sendEmail(adminNotification.email);
  }

  console.log("currentUser from notice", currentUser);
  if (currentNotification?.modal) {
    const modalData = {
      ...currentNotification.modal,
      redirect: currentNotification.modal.redirect
        ? {
            url: currentNotification.modal.redirect.url,
            showCountdown: currentNotification.modal.redirect.showCountdown || true,
          }
        : undefined,
    };
    console.log("🔔 [STATUS-MODAL] Showing modal with data:", modalData);
    (window as any).showNotice(modalData);
  } else {
    console.warn(`WARNING [${context || "NOTIFICATION"}] No notification found in response`);
  }
};

/** Focus first focusable input in a container. Call at end of panel animations so mobile keypad opens. */
(window as any).focusFirstInputIn = function (container: HTMLElement): boolean {
  console.log("[AUTOFOCUS] focusFirstInputIn called", {
    hasContainer: !!container,
    containerTag: container?.tagName,
    containerStep: container?.getAttribute?.("data-step"),
  });
  if (!container || typeof container.querySelector !== "function") {
    console.log("[AUTOFOCUS] early return: no container or no querySelector");
    return false;
  }
  const first = container.querySelector(
    "input:not([type=hidden]):not([readonly]), textarea, select"
  ) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  console.log("[AUTOFOCUS] first focusable", {
    found: !!first,
    tag: first?.tagName,
    id: first?.id,
    name: (first as HTMLInputElement)?.name,
    type: (first as HTMLInputElement)?.type,
  });
  if (!first || typeof first.focus !== "function") {
    console.log("[AUTOFOCUS] early return: no first element or no focus method");
    return false;
  }
  const isTouch = "ontouchstart" in window;
  console.log("[AUTOFOCUS] focusing", { isTouch, preventScroll: false });
  if (isTouch) {
    first.scrollIntoView({ block: "center", behavior: "auto" });
    console.log("[AUTOFOCUS] touch: scrolled input into view before focus");
  }
  first.focus({ preventScroll: false });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const active = document.activeElement === first;
      console.log("[AUTOFOCUS] after rAF x2", { activeElementIsFirst: active });
      if (!active) first.focus({ preventScroll: false });
    });
  });
  if (isTouch) {
    console.log("[AUTOFOCUS] touch device: scheduling focus at 50ms, 300ms, 500ms (mobile keypad)");
    setTimeout(() => {
      first.focus({ preventScroll: false });
      console.log("[AUTOFOCUS] touch focus 50ms", {
        activeElementIsFirst: document.activeElement === first,
      });
    }, 50);
    setTimeout(() => {
      first.focus({ preventScroll: false });
      console.log("[AUTOFOCUS] touch focus 300ms", {
        activeElementIsFirst: document.activeElement === first,
      });
    }, 300);
    setTimeout(() => {
      first.focus({ preventScroll: false });
      console.log("[AUTOFOCUS] touch focus 500ms (iOS fallback)", {
        activeElementIsFirst: document.activeElement === first,
      });
    }, 500);
  }
  console.log("[AUTOFOCUS] done", {
    activeElement: document.activeElement?.tagName,
    activeId: (document.activeElement as HTMLElement)?.id,
  });
  return true;
};

/**
 * Injects SimpleIcons into elements with class .input-with-icon and data-icon="name".
 * Call with no args to run on the whole document, or pass a container to scope (e.g. after dynamic content).
 */
(window as any).initInputWithIcon = function (root?: Document | Element) {
  const scope = root || document;
  const inputWrappers = scope.querySelectorAll(".input-with-icon[data-icon]");
  inputWrappers.forEach((wrapper) => {
    const iconName = wrapper.getAttribute("data-icon");
    if (!iconName) return;
    const iconSVG = getIcon(iconName, {
      size: 28,
      className: "text-black dark:text-white",
    });
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = iconSVG;
    const svgElement = tempDiv.firstElementChild as SVGElement;
    if (!svgElement) return;
    svgElement.style.position = "absolute";
    svgElement.style.left = "calc(1rem - 5px)";
    svgElement.style.right = "";
    svgElement.style.top = "50%";
    svgElement.style.transform = "translateY(-50%)";
    svgElement.style.pointerEvents = "none";
    svgElement.style.zIndex = "1";
    svgElement.style.opacity = "0.5";
    svgElement.style.transition = "opacity 0.3s ease";
    const input = wrapper.querySelector("input");
    if (input) {
      input.addEventListener("focus", () => {
        svgElement.style.opacity = "0.7";
      });
      input.addEventListener("blur", () => {
        svgElement.style.opacity = "0.5";
      });
    }
    wrapper.appendChild(svgElement);
  });
};

(window as any).hideOnFormFocus = function () {
  // Check if we should only hide on mobile
  // if (!(window as any).isMobile()) return;

  const element = document.querySelectorAll(".hide-on-form-focus");
  if (!element.length) return;

  // Set up CSS transitions for fade effect
  const transitionDuration = 300; // milliseconds
  const blurDelay = 100; // Delay before showing (prevents flash when tabbing between inputs)
  let blurTimeout: ReturnType<typeof setTimeout> | null = null;

  element.forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.transition = `opacity ${transitionDuration}ms ease-in-out`;
    htmlEl.style.opacity = "1";
  });

  // Hide on input focus (fade out)
  const hideOnFocus = () => {
    // Cancel any pending show operation
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }

    element.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.opacity = "0";
      // Set visibility hidden after transition completes
      setTimeout(() => {
        htmlEl.style.visibility = "hidden";
      }, transitionDuration);
    });
  };

  // Show on input blur (fade in) - debounced to prevent flash
  const showOnBlur = () => {
    // Delay showing to see if focus moves to another input
    blurTimeout = setTimeout(() => {
      element.forEach((el) => {
        const htmlEl = el as HTMLElement;
        // Set visibility visible first, then fade in
        htmlEl.style.visibility = "visible";
        // Use requestAnimationFrame to ensure visibility is set before opacity change
        requestAnimationFrame(() => {
          htmlEl.style.opacity = "1";
          // Refresh AOS to allow animation when element becomes visible
          setTimeout(() => {
            // @ts-ignore - AOS loaded from CDN
            if (typeof AOS !== "undefined" && htmlEl.hasAttribute("data-aos")) {
              // @ts-ignore
              AOS.refresh();
            }
          }, 50);
        });
      });
    }, blurDelay);
  };

  const selector =
    "input, textarea, select, form, .slot-machine-modal, #agent-chat, #agent-messages";
  // Add event listeners to all form inputs
  const inputs = document.querySelectorAll(selector);
  inputs.forEach((input) => {
    input.addEventListener("focus", hideOnFocus);
    input.addEventListener("focus-within", hideOnFocus);
    input.addEventListener("blur", showOnBlur);
  });

  // Also handle dynamically added inputs
  const inputObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const newInputs = element.querySelectorAll ? element.querySelectorAll(selector) : [];
          newInputs.forEach((input) => {
            input.addEventListener("focus", hideOnFocus);
            input.addEventListener("blur", showOnBlur);
          });
        }
      });
    });
  });

  inputObserver.observe(document.body, { childList: true, subtree: true });

  // Watch for modal visibility changes
  const modalObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "attributes" && mutation.attributeName === "class") {
        const target = mutation.target as HTMLElement;
        // Check if element has modal-related attributes or classes
        if (
          target.hasAttribute("data-modal") ||
          target.id.includes("Modal") ||
          target.id.includes("modal") ||
          target.classList.contains("modal")
        ) {
          const isVisible =
            target.classList.contains("flex") && !target.classList.contains("hidden");
          if (isVisible) {
            hideOnFocus();
          } else {
            showOnBlur();
          }
        }
      }
    });
  });

  // Observe all existing modals and drawers for class changes
  const modals = document.querySelectorAll(
    '[data-modal], [id*="modal" i], [id*="Modal" i], [id*="drawer" i], .modal'
  );
  modals.forEach((modal) => {
    modalObserver.observe(modal, { attributes: true, attributeFilter: ["class"] });
  });

  // Also watch for new modals being added to the DOM
  const newModalObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          // Check if the added node itself is a modal
          if (
            element.hasAttribute("data-modal") ||
            element.id.includes("Modal") ||
            element.id.includes("modal") ||
            element.classList.contains("modal")
          ) {
            modalObserver.observe(element, { attributes: true, attributeFilter: ["class"] });
          }
          // Also check for modals within the added node
          const innerModals = element.querySelectorAll
            ? element.querySelectorAll('[data-modal], [id*="modal" i], [id*="Modal" i], .modal')
            : [];
          innerModals.forEach((modal) => {
            modalObserver.observe(modal, { attributes: true, attributeFilter: ["class"] });
          });
        }
      });
    });
  });

  newModalObserver.observe(document.body, { childList: true, subtree: true });
};

(window as any).sendEmail = async function (emailData: any, currentUser: any) {
  try {
    console.log("📧 [SEND-EMAIL] Received email data:", emailData);
    console.log("📧 [SEND-EMAIL] usersToNotify:", emailData.usersToNotify);
    console.log("📧 [SEND-EMAIL] method:", emailData.method);

    // Transform the email data to match the update-delivery API structure
    const transformedData = {
      usersToNotify: emailData.usersToNotify || [],
      method: emailData.method || "email",
      emailSubject: emailData.emailSubject || "Project Update",
      emailContent: emailData.emailContent || "Project status has been updated",
      buttonLink: emailData.buttonLink,
      buttonText: emailData.buttonText,
      project: emailData.project || {},
      currentUser: currentUser,
    };

    console.log("📧 [SEND-EMAIL] Sending email with transformed data:", transformedData);

    const response = await fetch("/api/delivery/update-delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transformedData),
    });

    const result = await response.json();
    console.log("📧 [SEND-EMAIL] Email response:", result);
    return result;
  } catch (error: any) {
    console.error("Global sendEmail error:", error);
    return { success: false, error: error.message };
  }
};

(window as any).getProject = async function (projectId: string | number) {
  const projectResponse = await fetch(`/api/get-project?id=${projectId}`);
  if (projectResponse.ok) {
    return await projectResponse.json();
  } else {
    throw new Error("Failed to fetch project");
  }
};

let isDeleting = false; // Flag to prevent multiple delete operations
(window as any).deleteProject = async function (projectId: any) {
  // Prevent multiple delete operations
  if (isDeleting) {
    console.log("Delete operation already in progress, ignoring request");
    return;
  }

  // Validate project ID - ensure it's a string
  console.log("🔧 [DELETE] projectId type:", typeof projectId, "value:", projectId);
  const projectIdStr = String(projectId);
  console.log("🔧 [DELETE] projectIdStr:", projectIdStr);
  if (!projectId || projectIdStr.startsWith("new-project-")) {
    if ((window as any).showNotice) {
      (window as any).showNotice(
        "error",
        "Delete Failed",
        "Cannot delete a new project that hasn't been saved yet.",
        5000
      );
    }
    return;
  }

  // Fetch project details for confirmation message
  let projectName = "this project";
  try {
    const project = await (window as any).getProject(projectId);
    if (project) {
      projectName = project.title || project.address || "this project";
    }
  } catch (error) {
    console.error("Failed to fetch project for delete confirmation:", error);
  }

  // Show confirmation modal with action buttons
  if ((window as any).showNotice) {
    (window as any).showNotice(
      "error",
      `Delete ${projectName}?`,
      `Are you sure you want to delete ${projectName}? This action cannot be undone.`,
      6000000, // 6000 seconds timeout
      [
        {
          label: "Cancel",
          variant: "link",
          fullWidth: true,
          action: () => {},
        },
        {
          label: "Yes",
          variant: "secondary",
          fullWidth: true,
          action: () => {
            // Set deleting flag to prevent multiple operations
            isDeleting = true;

            // Show loading state
            const deleteBtn = document.getElementById("delete-project") as HTMLButtonElement;
            deleteBtn?.setAttribute("data-loading", "true");
            if (deleteBtn) {
              deleteBtn.disabled = true;
              deleteBtn.innerHTML =
                '<SimpleIcon name="loader-2" class="animate-spin mr-1" />Deleting...';
            }

            // Make API call to delete project
            console.log("Sending delete request for project:", projectId);
            fetch(`/api/projects/delete`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ projectId }),
            })
              .then(async (response) => {
                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.error || "Failed to delete project");
                }

                // Show success modal
                if ((window as any).showNotice) {
                  (window as any).showNotice(
                    "success",
                    "Project Deleted!",
                    data.message || "Project has been deleted successfully.",
                    1500
                  );
                }

                // Reset deleting flag
                isDeleting = false;

                document
                  .querySelectorAll("[data-project-id='" + projectId + "']")
                  ?.forEach((element) => {
                    element.remove();
                  });
              })
              .catch((error) => {
                console.error("Error deleting project:", error);

                // Show error modal with specific error message
                if ((window as any).showNotice) {
                  (window as any).showNotice(
                    "error",
                    "Delete Failed",
                    error.message || "Failed to delete project. Please try again.",
                    6000000
                  );
                }

                // Reset deleting flag and button state
                isDeleting = false;
                if (deleteBtn) {
                  deleteBtn.disabled = false;
                  deleteBtn.innerHTML = '<SimpleIcon name="trash-2" class="mr-1" />Delete Project';
                }
              });
          },
        },
      ]
    );
  }
};

(window as any).updateStatus = async function (
  project: any,
  status: number,
  currentStatusData?: any
) {
  try {
    // If project exists, use it; otherwise fetch it
    let currentProject = project;
    if (!currentProject) {
      try {
        currentProject = await (window as any).getProject(project);
      } catch (error) {
        console.error("📊 [UPDATE-STATUS] Could not fetch project, using minimal object:", error);
        currentProject = {
          id: project.id,
          status: 0,
        };
      }
    }

    const response = await fetch("/api/status/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentProject,
        newStatus: status,
        currentStatusData: currentStatusData || null, // Pass the current status data
      }),
    });
    return await response.json();
  } catch (error: any) {
    console.error("Global updateStatus error:", error);
    return { success: false, error: error.message };
  }
};

(window as any).updateCountBubble = function (
  parentElement: HTMLElement,
  count: number,
  options: any = {}
) {
  if (!parentElement) {
    console.warn("🔍 [COUNT-BUBBLE] Parent element is null or undefined");
    return null;
  }

  const config = {
    bubbleClasses:
      "absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white dark:bg-primary-dark animate-pulse",
    parentClasses: "relative",
    maxCount: 99,
    showZero: false,
    ...options,
  };

  // Find existing bubble or create new one
  let countBubble = parentElement.querySelector(".count-bubble") as HTMLSpanElement;

  if (count > 0 || config.showZero) {
    // Create bubble if it doesn't exist
    if (!countBubble) {
      countBubble = document.createElement("span");
      countBubble.className = `count-bubble ${config.bubbleClasses}`;

      // Add parent classes if specified
      if (config.parentClasses) {
        parentElement.classList.add(...config.parentClasses.split(" "));
      }

      parentElement.appendChild(countBubble);
      console.log("🔍 [COUNT-BUBBLE] Created new bubble for element:", parentElement);
    }

    // Update bubble content and visibility
    const displayCount = count > config.maxCount ? `${config.maxCount}+` : count.toString();
    countBubble.textContent = displayCount;
    countBubble.style.display = "flex";

    // Update data attribute for accessibility
    parentElement.setAttribute("data-count", count.toString());
  } else {
    // Hide bubble when count is 0 (unless showZero is true)
    if (countBubble) {
      countBubble.style.display = "none";
      parentElement.removeAttribute("data-count");
      console.log("🔍 [COUNT-BUBBLE] Hidden bubble (count is 0)");
    }
  }

  return countBubble;
};

// Count bubble presets - single source of truth
(window as any).COUNT_BUBBLE_PRESETS = {
  default: {
    bubbleClasses:
      "absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white dark:bg-primary-dark animate-pulse",
    maxCount: 99,
    showZero: false,
  },
  notification: {
    bubbleClasses:
      "absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white dark:bg-primary-600 animate-pulse",
    maxCount: 99,
    showZero: false,
  },
  small: {
    bubbleClasses:
      "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white dark:bg-primary-dark animate-pulse",
    maxCount: 9,
    showZero: false,
  },
};

// String utility functions
(window as any).unslugify = function (slug: string): string {
  return (
    slug
      .split("/")
      .filter(Boolean)
      .pop() // Get last segment
      ?.split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "Home"
  );
};

// ===== UX UTILITY FUNCTIONS =====

/**
 * Returns current scroll position as a percentage.
 * - 0–100: normal scroll (0 = top, 100 = bottom)
 * - >100: overscroll past bottom (e.g. 100.1, 105, 120, 130)
 * - <0: overscroll past top (e.g. -5, -10)
 */
(window as any).getOverscrollPercent = function (): number {
  const doc = document.documentElement;
  const scrollHeight = doc.scrollHeight;
  const clientHeight = window.innerHeight;
  const maxScroll = Math.max(0, scrollHeight - clientHeight);
  const scrollY = window.scrollY ?? doc.scrollTop;

  if (maxScroll <= 0) return 100;

  if (scrollY > maxScroll) {
    // Overscroll past bottom: 100 + extra as % of viewport
    const over = scrollY - maxScroll;
    return 100 + (over / clientHeight) * 100;
  }
  if (scrollY < 0) {
    // Overscroll past top
    return (scrollY / clientHeight) * 100;
  }
  return (scrollY / maxScroll) * 100;
};

/**
 * Calls your callback only when overscroll *starts* — i.e. user is at the top or bottom
 * of the scroll range and pulls further (rubber-band). Not for normal scrolling in the middle.
 * - Real device: when scroll position actually goes >100% or <0% (scroll event).
 * - Emulator/desktop: first wheel at bottom (scroll down) or at top (scroll up); synthetic % capped 100–120 or -20–0.
 * Uses #reveal-test-scroll as scroll container when present (your layout), otherwise window/document.
 * Returns an unsubscribe function.
 */
(window as any).setupOverscrollStart = function (
  callback: (percent: number, source: "scroll" | "wheel") => void
): () => void {
  const getPercent = (window as any).getOverscrollPercent;
  if (!getPercent) return () => {};

  const scrollEl = document.getElementById("reveal-test-scroll");
  const useEl = scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight;

  let lastPercent = getPercent();
  let lastContainerPercent: number | null = null;
  let wheelAccum = 0;
  let overscrollGestureActive: "bottom" | "top" | null = null;
  const THRESH = 8; // px tolerance for "at bottom/ top"
  const MIN_SCROLLABLE = 20; // px — minimum scroll range to treat as scrollable
  const WHEEL_CAP = 20;

  function atBoundary(): { atBottom: boolean; atTop: boolean; maxScroll: number } {
    if (useEl && scrollEl) {
      const maxScroll = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
      if (maxScroll < MIN_SCROLLABLE) return { atBottom: false, atTop: false, maxScroll: 0 };
      const top = scrollEl.scrollTop;
      return {
        atBottom: top >= maxScroll - THRESH,
        atTop: top <= THRESH,
        maxScroll,
      };
    }
    const doc = document.documentElement;
    const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
    if (maxScroll < MIN_SCROLLABLE) return { atBottom: false, atTop: false, maxScroll: 0 };
    const scrollY = window.scrollY ?? doc.scrollTop;
    return {
      atBottom: scrollY >= maxScroll - THRESH,
      atTop: scrollY <= THRESH,
      maxScroll,
    };
  }

  function getContainerPercent(): number | null {
    if (!useEl || !scrollEl) return null;
    const maxScroll = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
    if (maxScroll <= 0) return 100;
    const top = scrollEl.scrollTop;
    if (top > maxScroll) return 100 + ((top - maxScroll) / scrollEl.clientHeight) * 100;
    if (top < 0) return (top / scrollEl.clientHeight) * 100;
    return (top / maxScroll) * 100;
  }

  function onScroll() {
    const { atBottom, atTop } = atBoundary();
    if (!atBottom && !atTop) {
      wheelAccum = 0;
      overscrollGestureActive = null;
    }
    if (useEl && scrollEl) {
      const p = getContainerPercent();
      if (p !== null) {
        const wasInRange = lastContainerPercent !== null && lastContainerPercent >= 0 && lastContainerPercent <= 100;
        const nowOverscroll = p > 100 || p < 0;
        if (wasInRange && nowOverscroll) callback(p, "scroll");
        lastContainerPercent = p;
      }
    } else {
      const p = getPercent();
      const wasInRange = lastPercent >= 0 && lastPercent <= 100;
      const nowOverscroll = p > 100 || p < 0;
      if (wasInRange && nowOverscroll) callback(p, "scroll");
      lastPercent = p;
    }
  }

  function onWheel(ev: WheelEvent) {
    const { atBottom, atTop } = atBoundary();
    const scrollingDown = ev.deltaY > 0;
    const scrollingUp = ev.deltaY < 0;

    if (atBottom && scrollingDown) {
      const justStarted = overscrollGestureActive !== "bottom";
      overscrollGestureActive = "bottom";
      wheelAccum += ev.deltaY;
      const clientH = (useEl && scrollEl ? scrollEl.clientHeight : window.innerHeight) || 1;
      const raw = (wheelAccum / clientH) * 100;
      const capped = Math.min(WHEEL_CAP, Math.max(0, raw));
      const percent = Math.round((100 + capped) * 10) / 10;
      if (justStarted) callback(percent, "wheel");
    } else if (atTop && scrollingUp) {
      const justStarted = overscrollGestureActive !== "top";
      overscrollGestureActive = "top";
      wheelAccum += ev.deltaY;
      const clientH = (useEl && scrollEl ? scrollEl.clientHeight : window.innerHeight) || 1;
      const raw = (wheelAccum / clientH) * 100;
      const capped = Math.max(-WHEEL_CAP, Math.min(0, raw));
      const percent = Math.round(capped * 10) / 10;
      if (justStarted) callback(percent, "wheel");
    } else {
      overscrollGestureActive = null;
      wheelAccum = 0;
    }
  }

  const target = useEl && scrollEl ? scrollEl : window;
  target.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("wheel", onWheel, { passive: true });

  return function unsubscribe() {
    target.removeEventListener("scroll", onScroll);
    window.removeEventListener("wheel", onWheel);
  };
};

// Scroll utilities
(window as any).scrollToTopOnMobile = function () {
  if (window.innerWidth < 768) {
    console.log("📱 [UX-UTILS] Scrolling to top on mobile device");
    (window as any).scrollTo({ top: 0, behavior: "smooth" });
  }
};

(window as any).scrollToTop = function (behavior = "smooth") {
  console.log("📱 [UX-UTILS] Scrolling to top");
  (window as any).scrollTo({ top: 0, behavior });
};

// Device detection
(window as any).isMobile = function () {
  return window.innerWidth < 768;
};

(window as any).isTablet = function () {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

(window as any).isDesktop = function () {
  return window.innerWidth >= 1024;
};

(window as any).getViewportSize = function () {
  if (window.innerWidth < 768) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
};

// Utility functions
(window as any).debounce = function (func: any, wait: any) {
  let timeout: any;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

(window as any).throttle = function (func: any, limit: any) {
  let inThrottle: any;
  return function executedFunction(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// String utilities
(window as any).truncateString = function (
  str: string,
  maxLength: number = 30,
  suffix: string = "..."
) {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
};

(window as any).validateEmail = function (email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? null : "Invalid email format";
};

(window as any).isSafariBeta = function () {
  const ua = navigator.userAgent;
  // Check if iOS device
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  // Extract Safari version
  const versionMatch = ua.match(/Version\/(\d+)\./);
  const safariVersion = versionMatch ? parseInt(versionMatch[1]) : null;
  // Check if Safari (not Chrome/Firefox/Edge)
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
  // Updated to handle beta 26 and later
  const isBetaVersion = safariVersion && safariVersion >= 18 && safariVersion <= 30;
  const result = isIOS && isSafari && isBetaVersion;

  return result;
};
(window as any).isSafariIOS = function () {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
};
(window as any).isSafari = function () {
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
};
(window as any).isSafari18OrLater = function () {
  const ua = navigator.userAgent;
  const safariMatch = ua.match(/Version\/(\d+)/);
  if (!safariMatch) return false;
  const version = parseInt(safariMatch[1]);
  return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua) && version >= 18;
};
(window as any).fixSafariViewport = function () {
  if ((window as any).isSafariIOS()) {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", vh + "px");
  }
};
(window as any).immediateSafariViewportFix = function () {
  if ((window as any).isSafariIOS()) {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", vh + "px");
    };
    setViewportHeight();
    window.addEventListener("orientationchange", () => setTimeout(setViewportHeight, 100));
    window.addEventListener("resize", setViewportHeight);
  }
};
(window as any).isMobile = function () {
  return window.innerWidth < 768;
};
(window as any).isTablet = function () {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};
(window as any).isDesktop = function () {
  return window.innerWidth >= 1024;
};

(window as any).setupViewportHandling = function () {
  (window as any).immediateSafariViewportFix();
};

(window as any).ensureViewportBounds = function (minHeight = 400, maxHeight = 1200) {
  const currentHeight = window.innerHeight;
  if (currentHeight < minHeight || currentHeight > maxHeight) {
    if ((window as any).showNotice) {
      (window as any).showNotice(
        "warning",
        "Viewport Issue",
        `Viewport height (${currentHeight}px) is outside recommended bounds (${minHeight}-${maxHeight}px)`,
        5000
      );
    }
  }
};

// Body scroll utilities
(window as any).lockBodyScroll = function () {
  document.body.style.overflow = "hidden";
};

(window as any).unlockBodyScroll = function () {
  document.body.style.overflow = "";
};

/**
 * Handles URL parameter notifications (errors and success messages)
 * @param type - Notification type ('error' | 'success')
 * @param param - URL parameter value
 */
(window as any).handleUrlNotification = function (type: "error" | "success", param: string): void {
  const companyName = (window as any).globalCompanyName || "the company";
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
      bad_oauth_state: {
        title: "Sign-in link expired",
        message: "The sign-in link has expired. Please try again from the login page.",
      },
      invalid_request: {
        title: "Request expired",
        message: "The request has expired or is invalid. Please try again.",
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
        // redirect: { url: "/", delay: 3500, showCountdown: true },
      },
      sms_sent_success: {
        title: "Message Sent",
        message: `Your message has been sent to ${companyName} successfully.`,
      },
      // oauth_success: {
      //   title: "OAuth Success",
      //   message: `Your OAuth login has been successful.`,
      // },
      default: { title: "Success!", message: param },
    },
  };

  const notification = (notifications[type] as any)[param] || notifications[type].default;

  if ((window as any).showNotice) {
    // Use global UX utility function for mobile scroll
    (window as any).scrollToTopOnMobile();

    if (type === "error") {
      (window as any).showNotice("error", notification.title, notification.message);
    } else {
      (window as any).showNotice(
        "success",
        notification.title,
        notification.message,
        2500,
        notification.redirect
      );
    }
  } else {
    console.error(`🔔 [${notification.title}] ${notification.message}`);
    console.error("🔔 showNotice is not available - notification system not initialized");
  }
};

// ===== END GLOBAL FUNCTIONS =====

// Setup console interceptor (disables console.log in production)
// setupConsoleInterceptor();

// // Handle URL parameter notifications (errors and success messages)
(window as any).processUrlNotifications = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const errorParam = urlParams.get("error");
  const errorCode = urlParams.get("error_code");
  const successParam = urlParams.get("success");
  const messageParam = urlParams.get("message");

  if (errorParam) {
    // Map OAuth error=invalid_request&error_code=bad_oauth_state to toast
    const errorKey =
      errorParam === "invalid_request" && errorCode === "bad_oauth_state"
        ? "bad_oauth_state"
        : errorParam;
    console.log("🔔 [URL-NOTIFICATION] Processing error parameter:", errorKey);
    (window as any).handleUrlNotification("error", errorKey);

    // Clean up URL by removing error params - DELAYED to allow toast to render
    setTimeout(() => {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      newUrl.searchParams.delete("error_code");
      newUrl.searchParams.delete("error_description");
      window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
    }, 500);
  }

  if (successParam) {
    console.log("🔔 [URL-NOTIFICATION] Processing success parameter:", successParam);
    (window as any).handleUrlNotification("success", successParam);

    // Clean up URL by removing the success parameter - DELAYED to allow modal to render
    setTimeout(() => {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("success");
      window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
    }, 500);
  }

  if (messageParam) {
    console.log("🔔 [URL-NOTIFICATION] Processing message parameter:", messageParam);
    (window as any).handleUrlNotification("success", messageParam);

    // Clean up URL by removing the message parameter - DELAYED to allow modal to render
    setTimeout(() => {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("message");
      window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
    }, 500);
  }
};

// // Process URL notifications on page load with retry mechanism
const processUrlNotificationsWithRetry = (attempts = 0) => {
  if ((window as any).showNotice) {
    // showNotice is available, process notifications
    (window as any).processUrlNotifications();
  } else if (attempts < 10) {
    // showNotice not ready yet, retry after 100ms
    console.log("🔔 [URL-NOTIFICATION] showNotice not ready, retrying... attempt", attempts + 1);
    setTimeout(() => processUrlNotificationsWithRetry(attempts + 1), 100);
  } else {
    console.error("🔔 [URL-NOTIFICATION] showNotice never became available after 10 attempts");
  }
};

document.addEventListener("DOMContentLoaded", () => processUrlNotificationsWithRetry());

// // Also run immediately in case DOM is already loaded
if (document.readyState === "loading") {
  // DOM is still loading, event listener will handle it
} else {
  // DOM is already loaded, run immediately with retry
  processUrlNotificationsWithRetry();
}

document.addEventListener("astro:after-swap", () => {
  if ((window as any).initInputWithIcon) (window as any).initInputWithIcon();
});

// Suppress ResizeObserver loop warnings (they're usually harmless)
window.addEventListener("error", (e: any) => {
  if (e.message === "ResizeObserver loop completed with undelivered notifications.") {
    e.stopImmediatePropagation();
  }
});

// Register service worker for PWA functionality
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration: any) => {
        console.log("✅ Service Worker registered successfully:", registration.scope);
      })
      .catch((error: any) => {
        console.log("❌ Service Worker registration failed:", error);
      });
  });
} else {
  console.log("❌ Service Worker not supported in this browser");
}

// Global text trimming utilities
(window as any).trimText = function (
  text: string,
  maxLength: number = 100,
  suffix: string = "..."
): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

(window as any).trimWords = function (
  text: string,
  wordLimit: number = 50,
  suffix: string = "..."
): string {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(" ") + suffix;
};

/**
 * Initialize Sticky Actions Portal System
 * Teleports all StickyActions buttons to a global portal container in App.astro
 * This solves z-index stacking context issues while maintaining form functionality
 */
(window as any).initializeStickyActionsPortal = function () {
  const portal = document.getElementById("sticky-actions-portal");
  const container = document.getElementById("sticky-actions-container");

  if (!portal || !container) {
    console.warn("🎯 [STICKY-ACTIONS] Portal container not found in App.astro");
    return;
  }

  console.log("🎯 [STICKY-ACTIONS] Initializing portal system...");

  // Find all StickyActions instances
  const stickyActionsInstances = document.querySelectorAll(
    '[class*="sticky-actions"], [data-sticky-actions]'
  );

  if (stickyActionsInstances.length === 0) {
    console.log("🎯 [STICKY-ACTIONS] No instances found on this page");
    return;
  }

  // Track active instance for showing/hiding
  let activeInstance: HTMLElement | null = null;

  stickyActionsInstances.forEach((instance, index) => {
    const instanceEl = instance as HTMLElement;
    const instanceId = instanceEl.id || `sticky-actions-${index}`;
    instanceEl.setAttribute("data-sticky-actions-id", instanceId);

    // Get the columns attribute for grid layout
    const columns = instanceEl.getAttribute("data-columns") || "4";

    // Store original parent for restoration if needed
    const originalParent = instanceEl.parentElement;
    instanceEl.setAttribute("data-original-parent", "true");

    // Get all buttons from this instance
    const buttons = instanceEl.querySelectorAll("button, a[role='button'], [type='submit']");

    if (buttons.length === 0) {
      console.log(`🎯 [STICKY-ACTIONS] Instance ${instanceId} has no buttons to teleport`);
      return;
    }

    console.log(
      `🎯 [STICKY-ACTIONS] Found instance ${instanceId} with ${buttons.length} button(s), columns: ${columns}`
    );

    // Function to show this instance in the portal
    const showInPortal = () => {
      // Hide portal first
      portal.style.display = "none";
      container.innerHTML = "";

      // Set grid columns based on button count
      container.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;

      // Clone buttons and add them to portal
      buttons.forEach((button) => {
        const buttonEl = button as HTMLElement;
        const buttonClone = buttonEl.cloneNode(true) as HTMLElement;

        // If button is in a form, add form attribute to maintain submission
        const form = buttonEl.closest("form");
        if (form && form.id) {
          buttonClone.setAttribute("form", form.id);
          console.log(`🎯 [STICKY-ACTIONS] Linked button to form: ${form.id}`, buttonClone);
        } else if (form && !form.id) {
          // Generate form ID if it doesn't have one
          const formId = `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          form.id = formId;
          buttonClone.setAttribute("form", formId);
          console.log(`🎯 [STICKY-ACTIONS] Generated form ID and linked button: ${formId}`);
        }

        // Copy all event listeners by re-executing inline handlers
        const onclickAttr = buttonEl.getAttribute("onclick");
        if (onclickAttr) {
          buttonClone.setAttribute("onclick", onclickAttr);
        }

        // Copy data attributes
        Array.from(buttonEl.attributes).forEach((attr) => {
          if (attr.name.startsWith("data-")) {
            buttonClone.setAttribute(attr.name, attr.value);
          }
        });

        container.appendChild(buttonClone);
      });

      // Show portal
      portal.style.display = "flex";
      activeInstance = instanceEl;

      console.log(`🎯 [STICKY-ACTIONS] Showing instance ${instanceId} in portal`);
    };

    // Function to hide this instance from portal
    const hideFromPortal = () => {
      if (activeInstance === instanceEl) {
        portal.style.display = "none";
        container.innerHTML = "";
        activeInstance = null;
        console.log(`🎯 [STICKY-ACTIONS] Hiding instance ${instanceId} from portal`);
      }
    };

    // Store functions on the element for external control
    (instanceEl as any).__showInPortal = showInPortal;
    (instanceEl as any).__hideFromPortal = hideFromPortal;

    // Auto-show if instance is visible on page load
    // Use Intersection Observer to detect visibility
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element is visible, show in portal
            showInPortal();
          } else {
            // Element is not visible, hide from portal
            hideFromPortal();
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: "0px 0px -100px 0px", // Don't trigger if too close to bottom
      }
    );

    observer.observe(instanceEl);

    // Hide the original instance (it's now in the portal)
    instanceEl.style.display = "none";
  });

  // Make portal controls globally available
  (window as any).showStickyActions = function (instanceIdOrElement: string | HTMLElement) {
    const instance =
      typeof instanceIdOrElement === "string"
        ? (document.querySelector(
            `[data-sticky-actions-id="${instanceIdOrElement}"]`
          ) as HTMLElement)
        : instanceIdOrElement;

    if (instance && (instance as any).__showInPortal) {
      (instance as any).__showInPortal();
    } else {
      console.warn("🎯 [STICKY-ACTIONS] Instance not found:", instanceIdOrElement);
    }
  };

  (window as any).hideStickyActions = function (instanceIdOrElement?: string | HTMLElement) {
    if (!instanceIdOrElement) {
      // Hide all
      portal.style.display = "none";
      container.innerHTML = "";
      return;
    }

    const instance =
      typeof instanceIdOrElement === "string"
        ? (document.querySelector(
            `[data-sticky-actions-id="${instanceIdOrElement}"]`
          ) as HTMLElement)
        : instanceIdOrElement;

    if (instance && (instance as any).__hideFromPortal) {
      (instance as any).__hideFromPortal();
    }
  };

  console.log(
    `🎯 [STICKY-ACTIONS] Portal initialized with ${stickyActionsInstances.length} instance(s)`
  );
};

document.addEventListener("DOMContentLoaded", () => {
  try {
    // Initialize autofill navigation - COMMENTED OUT
    // (window as any).setupAutofillNavigation();

    // Initialize Sticky Actions Portal System
    (window as any).initializeStickyActionsPortal();

    // Inject icons into .input-with-icon[data-icon] (e.g. MultiStepForm)
    if ((window as any).initInputWithIcon) (window as any).initInputWithIcon();

    // Global theme sync utility - updates theme attribute on elements with data-theme-sync
    (window as any).updateThemeSync = () => {
      const isDark = (window as any).isDarkMode();
      const themeValue = isDark ? "dark" : "light";
      (window as any).currentTheme = themeValue; // Keep currentTheme in sync

      // Find all elements with data-theme-sync attribute
      const elements = document.querySelectorAll("[data-theme-sync]");
      elements.forEach((el) => {
        el.setAttribute("theme", themeValue);
      });

      console.log(`[THEME-SYNC] Updated ${elements.length} element(s) to theme: ${themeValue}`);
      return themeValue;
    };

    // Update theme-synced elements initially
    (window as any).updateThemeSync();

    // Watch for theme changes and auto-sync
    const themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          (window as any).updateThemeSync();
        }
      });
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Call immediately (skip Safari 18 fixes on legacy iPad/Safari to avoid extra JS)
    const isLegacySafari = (window as any).__legacySafari === true;
    const isSafariBeta = !isLegacySafari && (window as any).isSafariBeta();
    console.log("🍎 [APP] isSafari18", isSafariBeta);
    if (isSafariBeta === true) {
      console.log(
        "🍎 [SAFARI-18-BETA] Applying Safari sticky positioning fixes (lightweight mode)"
      );
      // <!-- Mobile debugging console (Eruda) - only load in development or with ?debug=true -->

      const isDevelopment = import.meta.env.DEV;
      const hasDebugParam = new URLSearchParams(window.location.search).get("debug") === "true";

      if (isDevelopment || hasDebugParam) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/eruda";
        script.onload = function () {
          if ((window as any).eruda) {
            (window as any).eruda.init();
            console.log("📱 [ERUDA] Mobile debugging console loaded");
          }
        };
        document.body.appendChild(script);
      }

      // Fix 1: Force GPU compositing on all sticky elements
      const stickyElements = document.querySelectorAll(
        '[class*="sticky"], .sticky, [style*="position: sticky"]'
      );
      stickyElements.forEach((el) => {
        const element = el as HTMLElement;
        element.style.transform = "translateZ(0)"; // Force GPU layer
        element.style.willChange = "transform, top, bottom";
        element.style.webkitBackfaceVisibility = "hidden";
        element.style.backfaceVisibility = "hidden";
      });

      // Fix 2: Force repaint on scroll without breaking fixed positioning (e.g. Flowbite dropdowns).
      // Applying transform to body would create a new containing block and make Popper/fixed
      // elements recalculate on scroll; use a reflow read instead.
      let scrollTimeout: number;
      const forceRepaint = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = window.setTimeout(() => {
          void document.body.offsetHeight; // Force reflow / repaint, no style change
        }, 100);
      };

      window.addEventListener("scroll", forceRepaint, { passive: true });

      // Fix 3: Add body class for CSS-based fixes
      // document.body.classList.add("safari-18-fix");

      // Fix 4: Handle header positioning - target the actual navbar
      const navbar = document.querySelector("nav.fixed");
      if (navbar) {
        const navbarElement = navbar as HTMLElement;
        console.log("🍎 [SAFARI-FIX] Found navbar, applying fixes");

        // Force the positioning
        // navbarElement.style.position = "fixed";
        // navbarElement.style.top = "0";
        // navbarElement.style.left = "0";
        // navbarElement.style.right = "0";
        // navbarElement.style.zIndex = "50";
        // navbarElement.style.transform = "translateZ(0)";
        // navbarElement.style.willChange = "transform";
        // navbarElement.style.webkitBackfaceVisibility = "hidden";
        // navbarElement.style.backfaceVisibility = "hidden";

        // Add a class for additional CSS targeting
        // navbarElement.classList.add("safari-sticky-fix");

        console.log("🍎 [SAFARI-FIX] Applied navbar fixes");
      } else {
        console.log('🍎 [SAFARI-FIX] No navbar found with class "fixed"');
      }

      // Fix 5: Handle SpeedDial positioning
      // const speedDial = document.querySelector("[data-speed-dial], .speed-dial");
      // if (speedDial) {
      //   const speedDialElement = speedDial as HTMLElement;
      //   speedDialElement.style.position = "fixed";
      //   speedDialElement.style.bottom = "20px";
      //   speedDialElement.style.right = "20px";
      //   speedDialElement.style.zIndex = "1000";
      //   speedDialElement.style.transform = "translateZ(0)";
      //   speedDialElement.style.willChange = "transform";
      // }

      const safariFixElement = document.querySelector(".safari-18-fix");
      if (safariFixElement) {
        // (safariFixElement as HTMLElement).style.height = "";
        (safariFixElement as HTMLElement).style.overflow = "scroll";
        (safariFixElement as HTMLElement).style.position = "fixed";
        (safariFixElement as HTMLElement).style.top = "0";
        (safariFixElement as HTMLElement).style.bottom = "0";
        (safariFixElement as HTMLElement).style.left = "0";
        (safariFixElement as HTMLElement).style.right = "0";
        (safariFixElement as HTMLElement).style.zIndex = "49";
        (safariFixElement as HTMLElement).style.transform = "translateZ(0)";
        (safariFixElement as HTMLElement).style.willChange = "transform";
        (safariFixElement as HTMLElement).style.transform = "translateZ(0)";
      }

      // Fix 6: Handle viewport height changes
      const handleViewportChange = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", vh + "px");
        void document.body.offsetHeight; // Force reflow without breaking fixed positioning
      };

      window.addEventListener("resize", handleViewportChange);
      window.addEventListener("orientationchange", () => {
        setTimeout(handleViewportChange, 100);
      });

      console.log(
        `🍎 [SAFARI-18-BETA] Applied fixes to ${stickyElements.length} sticky elements (scroll triggers preserved)`
      );

      // Additional aggressive fix for navbar after a delay
      setTimeout(() => {
        const navbar = document.querySelector("nav.fixed");
        if (navbar) {
          const navbarElement = navbar as HTMLElement;
          console.log("🍎 [SAFARI-FIX] Re-applying navbar fixes after delay");

          // Force all the styles again
          // navbarElement.style.cssText = `
          //   position: fixed !important;
          //   top: 0 !important;
          //   left: 0 !important;
          //   right: 0 !important;
          //   z-index: 50 !important;
          //   transform: translateZ(0) !important;
          //   will-change: transform !important;
          //   -webkit-backface-visibility: hidden !important;
          //   backface-visibility: hidden !important;
          //       `;

          // Force a reflow
          navbarElement.offsetHeight;

          console.log("🍎 [SAFARI-FIX] Re-applied navbar fixes");
        }
      }, 1000);
    }
  } catch (e) {
    console.error("[APP] DOMContentLoaded error (older Safari/iPad?):", e);
  }
});

function applyDynamicHeight() {
  document.querySelectorAll<HTMLElement>("[data-dynamic-height]").forEach((el) => {
    const value = el.getAttribute("data-dynamic-height");
    if (value) el.style.height = `calc(100dvh - ${value})`;
  });
}
document.addEventListener("DOMContentLoaded", applyDynamicHeight);
document.addEventListener("astro:page-load", applyDynamicHeight);
window.addEventListener("resize", applyDynamicHeight);

/** #reveal-test-scroll: margin-top and height from navbar base (same as BannerAlertsLoader baseHeight = navbar.offsetHeight) */
function applyRevealTestScrollFromNavbar() {
  const scrollEl = document.getElementById("reveal-test-scroll");
  const navbar = document.getElementById("main-navbar");
  if (!scrollEl || !navbar) return;
  const baseHeight = navbar.offsetHeight;
  scrollEl.style.marginTop = `${baseHeight}px`;
  scrollEl.style.height = `calc(100dvh - ${baseHeight}px)`;
}
document.addEventListener("DOMContentLoaded", () => {
  applyRevealTestScrollFromNavbar();
  const navbar = document.getElementById("main-navbar");
  if (navbar) {
    const ro = new ResizeObserver(() => applyRevealTestScrollFromNavbar());
    ro.observe(navbar);
  }
});
document.addEventListener("astro:page-load", applyRevealTestScrollFromNavbar);
window.addEventListener("resize", applyRevealTestScrollFromNavbar);
