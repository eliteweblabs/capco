/**
 * Typewriter Text Effect using TypeIt
 * https://www.typeitjs.com/
 */

import TypeIt from "typeit";

/**
 * Initialize typewriter effect for elements with typewriter-text class
 */
function initTypewriterTexts(): void {
  const typewriterElements = document.querySelectorAll(
    ".typewriter-text"
  ) as NodeListOf<HTMLElement>;

  typewriterElements.forEach((element) => {
    if (element.getAttribute("data-typewriter-ready")) {
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
      element.setAttribute("data-typewriter-deferred", "true");
      return;
    }

    initializeTypewriterInstance(element, text);
  });
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
  text = decodeHtmlEntities(text);
  text = injectSessionMetaIntoText(text, element);

  element.innerHTML = "";

  // Mark as initialized
  element.setAttribute("data-typewriter-ready", "true");
  element.removeAttribute("data-typewriter-deferred");

  // Parse text for custom pause spans
  const segments = parseTextWithPauses(text);

  // If element is in a hidden container, skip waitUntilVisible so .go() works when we reveal it
  const isInHidden = element.closest(".hidden, [hidden], [aria-hidden='true']");
  const waitUntilVisible = !isInHidden;

  // Create TypeIt instance
  const instance = new TypeIt(element, {
    speed: 10, // 50% faster than previous 20ms
    cursor: true, // Show blinking cursor
    waitUntilVisible,
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
      // console.log("[TYPEWRITER] Animation complete, triggering content animations");
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

  // Build the typing sequence with pauses and natural variations
  segments.forEach((segment, index) => {
    if (segment.type === "text") {
      const text = segment.content!;

      // Add natural pauses at punctuation and line breaks
      const tokens = text.split(/(<br>|[.,!?;:])/gi);

      tokens.forEach((token, tokenIndex) => {
        if (!token) return;

        // Type each character in a span so we can animate opacity (100% -> 40% over 600ms)
        // Wrap each word (split by whitespace) in typewriter-word so line breaks happen between words, not mid-word
        // Preserve spaces between words by outputting them outside typewriter-word
        if (/^<[^>]+>$/i.test(token)) {
          instance.type(token);
        } else {
          // Split token into words and spaces: " what is" -> ["", "what", " ", "is"]
          const parts = token.split(/(\s+)/);
          parts.forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              // Spaces: output as &nbsp; without span - wrapping in typewriter-char causes visible blocks/underscores
              for (let i = 0; i < part.length; i++) {
                instance.type("&nbsp;");
              }
            } else {
              // Word: wrap in typewriter-word to prevent mid-word breaks
              instance.type('<span class="typewriter-word">');
              for (const char of part) {
                instance.type(`<span class="typewriter-char">${escapeHtml(char)}</span>`);
              }
              instance.type("</span>");
            }
          });
        }

        // Add natural pauses after punctuation
        if (token.match(/[.,!?;:]/)) {
          instance.pause(+Math.random() * 300); // 200-500ms pause
        } else if (token === "<br>") {
          instance.pause(Math.random() * 400); // 300-700ms pause for line breaks
        } else if (tokenIndex < tokens.length - 1 && tokens[tokenIndex + 1] !== "<br>") {
          // Small pause between words (human hesitation)
          if (Math.random() > 0.5) {
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

const escapeHtml = (c: string): string =>
  c
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Build the full typewriter HTML (same structure as TypeIt would produce at the end).
 * Used when skipping the typewriter via Enter key.
 */
function buildFullTypewriterHtml(text: string, element: HTMLElement): string {
  text = decodeHtmlEntities(text);
  text = injectSessionMetaIntoText(text, element);
  const segments = parseTextWithPauses(text);
  let html = "";

  segments.forEach((segment) => {
    if (segment.type === "text") {
      const segText = segment.content!;
      const tokens = segText.split(/(<br>|[.,!?;:])/gi);
      tokens.forEach((token) => {
        if (!token) return;
        if (/^<[^>]+>$/i.test(token)) {
          html += token;
        } else {
          const parts = token.split(/(\s+)/);
          parts.forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              for (let i = 0; i < part.length; i++) {
                html += "&nbsp;";
              }
            } else {
              html += '<span class="typewriter-word">';
              for (const char of part) {
                html += `<span class="typewriter-char">${escapeHtml(char)}</span>`;
              }
              html += "</span>";
            }
          });
        }
      });
    }
  });
  return html;
}

/**
 * Skip active typewriter(s) to end and show full text. Called on Enter key.
 */
function skipActiveTypewriterToEnd(): boolean {
  const activeStep = document.querySelector(".step-content.active");
  if (!activeStep) return false;

  const typewriterEls = activeStep.querySelectorAll(
    ".typewriter-text[data-typewriter-ready='true']"
  ) as NodeListOf<HTMLElement>;

  let skipped = false;
  typewriterEls.forEach((el) => {
    const instance = (el as any).__typeItInstance;
    if (!instance || (typeof instance.is === "function" && instance.is("complete"))) return;

    const text = el.getAttribute("data-text");
    if (!text) return;

    el.innerHTML = buildFullTypewriterHtml(text, el);
    try {
      instance.destroy(true);
    } catch (_) {}
    (el as any).__typeItInstance = null;
    el.setAttribute("data-typewriter-triggered", "true");

    const cursor = el.querySelector(".ti-cursor");
    if (cursor) cursor.remove();

    el.dispatchEvent(new CustomEvent("typewriter-complete", { bubbles: true }));
    skipped = true;
  });

  return skipped;
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
 * Uses form from element's tree (not document-first-form) so contact form works when login also on page
 */
function injectSessionMetaIntoText(text: string, element?: HTMLElement): string {
  // Find all spans with data-form-session-meta attribute
  const metaRegex =
    /<span[^>]*data-form-session-meta=['"]([^'"]+)['"][^>]*data-default=['"]([^'"]+)['"][^>]*>([^<]*)<\/span>/gi;

  let replacedText = text;
  let match;
  const form = (element?.closest("form") ?? document.querySelector("form")) as HTMLFormElement;

  while ((match = metaRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const fieldName = match[1];
    const defaultValue = match[2];
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
      console.log(
        `[SESSION-META] Replaced ${fieldName} with: "${value}" (form: ${form.id || "unknown"})`
      );
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
 * @param root - Optional: scope search to this element (e.g. form-container when revealing hidden form)
 */
/** Skip step if it's inside a hidden container (dropdown, modal, or .hidden) */
function isStepInHiddenContainer(step: Element): boolean {
  const form = step.closest("form");
  if (!form) return false;
  let el: Element | null = form;
  while (el && el !== document.body) {
    if (
      el.classList.contains("hidden") ||
      el.hasAttribute("hidden") ||
      el.getAttribute("aria-hidden") === "true"
    ) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

function triggerActiveStepTypewriter(root?: Element | null): void {
  const scope = root || document;

  // On CMS contact page there's no form-container; contact form is inline.
  // Prefer contact form over login (dropdown) when both have active steps.
  let activeStep: Element | null = null;
  if (!root) {
    const contactForm = document.getElementById("multi-step-contact-form");
    const contactActive = contactForm?.querySelector(".step-content.active");
    if (contactActive && !isStepInHiddenContainer(contactActive)) {
      activeStep = contactActive;
    }
  }
  if (!activeStep) {
    const allActiveSteps = scope.querySelectorAll(".step-content.active");
    for (const step of allActiveSteps) {
      if (!root && isStepInHiddenContainer(step)) continue;
      activeStep = step;
      break;
    }
  }

  if (!activeStep) return;

  const deferredElements = activeStep.querySelectorAll(
    ".typewriter-text[data-typewriter-deferred='true']"
  ) as NodeListOf<HTMLElement>;

  if (deferredElements.length > 0) {
    deferredElements.forEach((element) => {
      const text = element.getAttribute("data-text");
      if (text) {
        initializeTypewriterInstance(element, text);
      }
    });
  }

  const typewriterElements = activeStep.querySelectorAll(
    ".typewriter-text[data-typewriter-ready='true']"
  ) as NodeListOf<HTMLElement>;

  typewriterElements.forEach((element) => {
    if (element.getAttribute("data-typewriter-triggered") === "true") return;

    const instance = (element as any).__typeItInstance;
    if (instance) {
      instance.go();
      element.setAttribute("data-typewriter-triggered", "true");
    } else {
      console.warn("[TYPEWRITER] No TypeIt instance for element:", element);
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

document.addEventListener("multistep-step-change", () => {
  triggerActiveStepTypewriter();
});

document.addEventListener("DOMContentLoaded", () => {
  initTypewriterTexts();
  triggerActiveStepTypewriter();

  // Enter key: skip typewriter to end and show full text immediately (don't intercept when user is in an input)
  // Use capture phase so we run before form submit; handle both keydown and keypress
  const handleEnterSkip = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;
    const active = document.activeElement as HTMLElement;
    if (
      active &&
      (active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.tagName === "SELECT" ||
        active.isContentEditable)
    )
      return;
    if (skipActiveTypewriterToEnd()) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  document.addEventListener("keydown", handleEnterSkip, true);
  document.addEventListener("keypress", handleEnterSkip, true);

  // When contact form container is revealed (loses .hidden), trigger typewriter
  const formContainer = document.getElementById("form-container");
  if (formContainer) {
    const revealObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "class" && !formContainer.classList.contains("hidden")) {
          initTypewriterTexts();
          const contactForm =
            formContainer.querySelector("form#multi-step-contact-form") ?? formContainer;
          setTimeout(() => triggerActiveStepTypewriter(contactForm), 150);
          break;
        }
      }
    });
    revealObserver.observe(formContainer, { attributes: true, attributeFilter: ["class"] });
  }
});

export { initTypewriterTexts, triggerActiveStepTypewriter, skipActiveTypewriterToEnd };
