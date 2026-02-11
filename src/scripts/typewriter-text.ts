/**
 * Typewriter Text Effect using TypeIt
 * https://www.typeitjs.com/
 */

import TypeIt from "typeit";

/**
 * Initialize typewriter effect for elements with typewriter-text class
 */
function initTypewriterTexts(): void {
  console.log("[TYPEWRITER] Initializing typewriter effects...");

  // Find all elements with typewriter-text class
  const typewriterElements = document.querySelectorAll(
    ".typewriter-text"
  ) as NodeListOf<HTMLElement>;

  typewriterElements.forEach((element) => {
    // Skip if already initialized
    if (element.getAttribute("data-typewriter-ready")) {
      console.log("[TYPEWRITER] Already initialized:", element);
      return;
    }

    // Get the text content from data-text attribute
    let text = element.getAttribute("data-text");
    if (!text) {
      console.warn("[TYPEWRITER] No data-text attribute found for element:", element);
      return;
    }

    // Check if this element contains session meta data
    const hasSessionMeta = text.includes("data-form-session-meta");

    // If it has session meta, mark it but DON'T initialize yet
    // It will be initialized when the step becomes active
    if (hasSessionMeta) {
      console.log("[TYPEWRITER] Element has session meta, deferring initialization:", element);
      element.setAttribute("data-typewriter-deferred", "true");
      return;
    }

    // Initialize immediately for elements without session meta
    initializeTypewriterInstance(element, text);
  });

  console.log(`[TYPEWRITER] Initialized ${typewriterElements.length} elements`);
}

/**
 * Initialize a single TypeIt instance for an element
 */
/** Decode HTML entities only (e.g. &amp; → &). Does not parse/strip HTML structure. */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

function initializeTypewriterInstance(element: HTMLElement, text: string): void {
  // Decode HTML entities only - do NOT use textarea.innerHTML/value (it strips tags like <br> and <span>)
  text = decodeHtmlEntities(text);

  // Inject form session meta data into the text before typewriter starts
  text = injectSessionMetaIntoText(text);

  console.log("[TYPEWRITER] Initializing element with text:", text.substring(0, 50) + "...");

  // Clear the element content
  element.innerHTML = "";

  // Mark as initialized
  element.setAttribute("data-typewriter-ready", "true");
  element.removeAttribute("data-typewriter-deferred");

  // Parse text for custom pause spans
  const segments = parseTextWithPauses(text);

  // Create TypeIt instance
  const instance = new TypeIt(element, {
    speed: 10, // 50% faster than previous 20ms
    cursor: true, // Show blinking cursor
    waitUntilVisible: true,
    html: true, // Enable HTML parsing for <br> tags
    lifeLike: true, // Add natural typing variations
    afterStep: () => {
      // Auto-scroll to keep cursor at fixed vertical position
      const scrollWrapper = element.closest(".title-scroll-wrapper");
      const scrollContainer = element.closest(".title-scroll-container");
      if (scrollWrapper) {
        // Check if content overflows
        const hasOverflow = scrollWrapper.scrollHeight > scrollWrapper.clientHeight;

        if (hasOverflow) {
          // Add class to switch to top alignment when overflowing
          scrollWrapper.classList.add("has-overflow");

          // Find the cursor element
          const cursor = element.querySelector(".ti-cursor");
          if (cursor) {
            // Get cursor position relative to the scrollable container
            const cursorRect = cursor.getBoundingClientRect();
            const wrapperRect = scrollWrapper.getBoundingClientRect();

            // Target position: keep cursor at 75% down the visible area (with settling effect)
            const targetPosition = wrapperRect.height * 0.75;
            const currentCursorPosition = cursorRect.top - wrapperRect.top;

            // Calculate how much to scroll to keep cursor at target position
            const scrollAdjustment = currentCursorPosition - targetPosition;

            // Apply scroll with smooth settling (only scroll if needed)
            if (scrollAdjustment > 5) {
              // 5px threshold to avoid jitter
              scrollWrapper.scrollTop += scrollAdjustment;
            }
          } else {
            // Fallback: scroll to bottom if cursor not found
            scrollWrapper.scrollTop = scrollWrapper.scrollHeight;
          }

          // Check if scrolled and add class for fade effect
          if (scrollContainer && scrollWrapper.scrollTop > 10) {
            scrollContainer.classList.add("is-scrolled");
          }
        }
      }
    },
    afterComplete: () => {
      console.log("[TYPEWRITER] Animation complete, triggering content animations");
      // Dispatch custom event when typewriter completes
      element.dispatchEvent(new CustomEvent("typewriter-complete", { bubbles: true }));

      // Remove cursor after 2 seconds
      setTimeout(() => {
        const cursor = element.querySelector(".ti-cursor");
        if (cursor) {
          cursor.remove();
          console.log("[TYPEWRITER] Cursor removed");
        }
      }, 2000);
    },
  });

  // Escape HTML so a single character can be wrapped in a span safely
  const escapeHtml = (c: string): string =>
    c
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  // Build the typing sequence with pauses and natural variations
  segments.forEach((segment, index) => {
    if (segment.type === "text") {
      const text = segment.content!;

      // Add natural pauses at punctuation and line breaks
      const words = text.split(/(<br>|[.,!?;:])/gi);

      words.forEach((word, wordIndex) => {
        if (!word) return;

        // Type each character in a span so we can animate opacity (100% -> 40% over 600ms)
        if (/^<[^>]+>$/i.test(word)) {
          instance.type(word);
        } else {
          for (const char of word) {
            instance.type(`<span class="typewriter-char">${escapeHtml(char)}</span>`);
          }
        }

        // Add natural pauses after punctuation
        if (word.match(/[.,!?;:]/)) {
          instance.pause(+Math.random() * 300); // 200-500ms pause
        } else if (word === "<br>") {
          instance.pause(Math.random() * 400); // 300-700ms pause for line breaks
        } else if (wordIndex < words.length - 1 && words[wordIndex + 1] !== "<br>") {
          // Small pause between words (human hesitation)
          if (Math.random() > 0.5) {
            // 30% chance of slight hesitation
            instance.pause(50 + Math.random() * 100);
          }
        }
      });
    } else if (segment.type === "pause") {
      instance.pause(segment.duration);
    }
  });

  // Store instance on element for later use
  (element as any).__typeItInstance = instance;
}

/** Parse full name string into first and last (matches multi-step-form-config logic) */
function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = (fullName || "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ").trim() };
}

/**
 * Inject form session meta data into text by replacing spans with data-form-session-meta
 * Replaces with plain text (no HTML) since TypeIt will handle it as content
 * Supports firstName/lastName from direct inputs or parsed from fullName
 */
function injectSessionMetaIntoText(text: string): string {
  // Find all spans with data-form-session-meta attribute
  const metaRegex =
    /<span[^>]*data-form-session-meta=['"]([^'"]+)['"][^>]*data-default=['"]([^'"]+)['"][^>]*>([^<]*)<\/span>/gi;

  let replacedText = text;
  let match;

  while ((match = metaRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const fieldName = match[1];
    const defaultValue = match[2];

    const form = document.querySelector("form") as HTMLFormElement;
    if (form) {
      let value = defaultValue;
      if (fieldName === "firstName" || fieldName === "lastName") {
        const fullInput = form.querySelector('[name="fullName"]') as HTMLInputElement;
        const firstInput = form.querySelector('[name="firstName"]') as HTMLInputElement;
        const lastInput = form.querySelector('[name="lastName"]') as HTMLInputElement;
        if (fullInput?.value?.trim()) {
          const { firstName, lastName } = parseFullName(fullInput.value);
          value = fieldName === "firstName" ? firstName : lastName;
        } else if (firstInput?.value?.trim() && fieldName === "firstName") {
          value = firstInput.value.trim();
        } else if (lastInput?.value?.trim() && fieldName === "lastName") {
          value = lastInput.value.trim();
        }
        if (!value) value = defaultValue;
      } else {
        const input = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
        value = input?.value?.trim() || defaultValue;
      }

      replacedText = replacedText.replace(fullMatch, value);
      console.log(`[SESSION-META] Replaced ${fieldName} with: ${value}`);
    }
  }

  return replacedText;
}

/**
 * Parse text for custom pause spans and return sequence of text/pause segments
 */
function parseTextWithPauses(
  text: string
): Array<{ type: "text" | "pause"; content?: string; duration?: number }> {
  const segments: Array<{ type: "text" | "pause"; content?: string; duration?: number }> = [];

  // Regular expression to match pause spans
  const pauseRegex = /<span[^>]*data-typewriter-pause=["'](\d+)["'][^>]*>(.*?)<\/span>/gi;

  let lastIndex = 0;
  let match;

  while ((match = pauseRegex.exec(text)) !== null) {
    // Add text before the pause span
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      if (beforeText) {
        segments.push({ type: "text", content: beforeText });
      }
    }

    // Add the pause
    const pauseDuration = parseInt(match[1], 10);
    segments.push({ type: "pause", duration: pauseDuration });

    // Add the text inside the span (if any)
    const spanContent = match[2];
    if (spanContent) {
      segments.push({ type: "text", content: spanContent });
    }

    lastIndex = pauseRegex.lastIndex;
  }

  // Add remaining text after last pause span
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      segments.push({ type: "text", content: remainingText });
    }
  }

  // If no pause spans found, return the whole text as one segment
  if (segments.length === 0) {
    segments.push({ type: "text", content: text });
  }

  return segments;
}

/**
 * Trigger typewriter animation for active step
 */
function triggerActiveStepTypewriter(): void {
  console.log("[TYPEWRITER] Checking for active step...");

  // Find active step
  const activeStep = document.querySelector(".step-content.active");
  if (!activeStep) {
    console.log("[TYPEWRITER] No active step found");
    return;
  }

  console.log("[TYPEWRITER] Found active step:", activeStep);

  // First, check for any deferred typewriter elements that need initialization
  const deferredElements = activeStep.querySelectorAll(
    ".typewriter-text[data-typewriter-deferred='true']"
  ) as NodeListOf<HTMLElement>;

  if (deferredElements.length > 0) {
    console.log(
      "[TYPEWRITER] Found",
      deferredElements.length,
      "deferred elements, initializing now..."
    );

    deferredElements.forEach((element) => {
      const text = element.getAttribute("data-text");
      if (text) {
        initializeTypewriterInstance(element, text);
      }
    });
  }

  // Find typewriter elements in active step (now initialized)
  const typewriterElements = activeStep.querySelectorAll(
    ".typewriter-text[data-typewriter-ready='true']"
  ) as NodeListOf<HTMLElement>;

  console.log(
    "[TYPEWRITER] Found",
    typewriterElements.length,
    "typewriter elements in active step"
  );

  typewriterElements.forEach((element) => {
    // Skip if already triggered
    if (element.getAttribute("data-typewriter-triggered") === "true") {
      console.log("[TYPEWRITER] Already triggered:", element);
      return;
    }

    // Get the stored TypeIt instance
    const instance = (element as any).__typeItInstance;
    if (instance) {
      console.log("[TYPEWRITER] Starting animation for element");
      // Start the animation
      instance.go();
      element.setAttribute("data-typewriter-triggered", "true");
    } else {
      console.warn("[TYPEWRITER] No TypeIt instance found for element:", element);
    }
  });
}

// Initialize immediately
initTypewriterTexts();

/** Initialize a single typewriter element (used by observer for dynamically added nodes). */
function initOneTypewriterElement(element: HTMLElement): void {
  const text = element.getAttribute("data-text");
  if (!text || element.getAttribute("data-typewriter-ready")) return;
  if (text.includes("data-form-session-meta")) {
    element.setAttribute("data-typewriter-deferred", "true");
    return;
  }
  initializeTypewriterInstance(element, text);
}

// Set up mutation observer for dynamically added elements
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        if (node.classList.contains("typewriter-text")) {
          initOneTypewriterElement(node);
        }
        const children = node.querySelectorAll(".typewriter-text") as NodeListOf<HTMLElement>;
        children.forEach(initOneTypewriterElement);
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Trigger typewriter when step becomes active
document.addEventListener("DOMContentLoaded", () => {
  // Initial trigger for .step-content.active
  triggerActiveStepTypewriter();

  // Only react when the active step changes (no need to observe all step elements)
  document.addEventListener("multistep-step-change", () => {
    triggerActiveStepTypewriter();
  });
});

export { initTypewriterTexts, triggerActiveStepTypewriter };
